import { useState, useEffect } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRScanDialog } from '@/components/QRScanDialog';
import { QrCode, Send, Plus, CheckCircle2, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';
import { isTronAddress, isValidAddress } from '@/lib/tron';
import { sendTRC20, getTRC20Info } from '@/lib/tron-send';

const ERC20_ABI = [
  'function transfer(address,uint256) returns (bool)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function decimals() view returns (uint8)',
];

type TokenMode = 'list' | 'custom';

export default function SendTokenPage() {
  const { currentWalletId, wallets, networkConfigs, providers, tokens, addToken, addTransaction, getNetwork } = useWalletContext();
  const [mode, setMode] = useState<TokenMode>('list');
  const [selectedNetwork, setSelectedNetwork] = useState<string>(networkConfigs[0]?.id ?? '');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { toast } = useToast();

  const [selectedToken, setSelectedToken] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [customToken, setCustomToken] = useState<{ name: string; symbol: string; decimals: number } | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [newTokenDecimals, setNewTokenDecimals] = useState('18');
  const [isAddTokenOpen, setIsAddTokenOpen] = useState(false);

  const currentWallet = currentWalletId ? wallets[currentWalletId] : null;
  const net = getNetwork(selectedNetwork);
  const chainType = net?.chainType ?? 'evm';

  // Filter token list to current chain type
  const filteredTokens = tokens.filter(t => (t.chainType ?? 'evm') === chainType);

  useEffect(() => {
    setCustomToken(null);
    setLookupError(null);
  }, [contractAddress, selectedNetwork]);

  // Reset token selection when network changes chain type
  useEffect(() => {
    setSelectedToken('');
    setTxHash(null);
  }, [chainType]);

  const lookupContract = async () => {
    if (!contractAddress) return;
    setIsLookingUp(true);
    setLookupError(null);
    setCustomToken(null);

    try {
      if (chainType === 'tron') {
        if (!isTronAddress(contractAddress)) throw new Error('Enter a valid Tron T… contract address');
        const info = await getTRC20Info(net!.rpc, contractAddress);
        setCustomToken(info);
      } else {
        if (!ethers.isAddress(contractAddress)) throw new Error('Enter a valid 0x… contract address');
        const provider = providers[selectedNetwork];
        if (!provider) throw new Error('Provider not available');
        const c = new ethers.Contract(contractAddress, ERC20_ABI, provider);
        const [symbol, name, decimals] = await Promise.all([c.symbol(), c.name(), c.decimals()]);
        setCustomToken({ symbol, name, decimals: Number(decimals) });
      }
    } catch (e: any) {
      setLookupError(e.message || 'Could not read token info.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAddToken = () => {
    if (!newTokenName || !newTokenAddress || !newTokenDecimals) return;
    const isValidAddr = chainType === 'tron' ? isTronAddress(newTokenAddress) : ethers.isAddress(newTokenAddress);
    if (!isValidAddr) { toast({ title: 'Invalid contract address', variant: 'destructive' }); return; }
    try {
      addToken({ name: newTokenName.toUpperCase(), address: newTokenAddress, decimals: parseInt(newTokenDecimals, 10), chainType });
      toast({ title: 'Token added' });
      setIsAddTokenOpen(false);
      setNewTokenName(''); setNewTokenAddress(''); setNewTokenDecimals('18');
    } catch (e: any) {
      toast({ title: 'Failed to add token', description: e.message, variant: 'destructive' });
    }
  };

  const handleSend = async () => {
    if (!currentWallet || !recipient || !amount) return;
    if (!isValidAddress(recipient, chainType)) {
      toast({ title: `Invalid ${chainType === 'tron' ? 'Tron T…' : '0x…'} address`, variant: 'destructive' });
      return;
    }

    let tokenAddress: string, tokenDecimals: number, tokenSymbol: string;

    if (mode === 'list') {
      const tc = filteredTokens.find(t => t.address === selectedToken);
      if (!tc) { toast({ title: 'No token selected', variant: 'destructive' }); return; }
      tokenAddress = tc.address; tokenDecimals = tc.decimals; tokenSymbol = tc.name;
    } else {
      if (!customToken) { toast({ title: 'Look up the contract first', variant: 'destructive' }); return; }
      tokenAddress = contractAddress; tokenDecimals = customToken.decimals; tokenSymbol = customToken.symbol;
    }

    setIsSending(true);
    setTxHash(null);

    try {
      let hash: string;

      if (chainType === 'tron') {
        hash = await sendTRC20(net!.rpc, currentWallet.rawPrivateKey, tokenAddress, recipient, amount, tokenDecimals);
      } else {
        const provider = providers[selectedNetwork];
        if (!provider) throw new Error('Provider not available');
        const signer = new ethers.Wallet(currentWallet.rawPrivateKey, provider);
        const c = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        const tx = await c.transfer(recipient, ethers.parseUnits(amount, tokenDecimals));
        hash = tx.hash;
        tx.wait().then(() => toast({ title: `${tokenSymbol} transfer confirmed!` })).catch(() => {});
      }

      addTransaction(currentWallet.address, {
        hash,
        type: 'token',
        network: net?.name ?? selectedNetwork,
        to: recipient,
        amount,
        token: tokenSymbol,
        status: 'Pending',
        timestamp: Date.now(),
      });

      setTxHash(hash);
      toast({ title: 'Transaction sent!' });
      setRecipient(''); setAmount('');
    } catch (e: any) {
      toast({ title: 'Send failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const canSend = mode === 'list' ? !!selectedToken && !!recipient && !!amount : !!customToken && !!recipient && !!amount;

  if (!currentWallet) {
    return <div className="text-center p-12 text-muted-foreground">No wallet selected</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">Send Token</h2>
          <span className="text-xs px-2 py-0.5 rounded border font-mono text-muted-foreground">
            {chainType === 'tron' ? '⚡ TRC-20' : '🔷 ERC-20'}
          </span>
        </div>
        <Dialog open={isAddTokenOpen} onOpenChange={setIsAddTokenOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Token</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Token</DialogTitle>
              <DialogDescription>
                {chainType === 'tron' ? 'TRC-20 contract address (T…)' : 'ERC-20 contract address (0x…)'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Symbol</label>
                <Input value={newTokenName} onChange={e => setNewTokenName(e.target.value)} placeholder="USDT" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contract Address</label>
                <Input value={newTokenAddress} onChange={e => setNewTokenAddress(e.target.value)}
                       placeholder={chainType === 'tron' ? 'T…' : '0x…'} className="font-mono" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Decimals</label>
                <Input type="number" value={newTokenDecimals} onChange={e => setNewTokenDecimals(e.target.value)} />
              </div>
              <Button onClick={handleAddToken} className="w-full">Add Token</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border shadow-lg">
        <CardContent className="p-6 space-y-6">
          {/* Network */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Network</label>
            <Select value={selectedNetwork} onValueChange={v => { setSelectedNetwork(v); setTxHash(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {networkConfigs.map(n => (
                  <SelectItem key={n.id} value={n.id}>
                    <span className="text-xs mr-1">{n.chainType === 'tron' ? '⚡' : '🔷'}</span>{n.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Token */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Token</label>
            <Tabs value={mode} onValueChange={v => { setMode(v as TokenMode); setTxHash(null); }}>
              <TabsList className="w-full">
                <TabsTrigger value="list" className="flex-1">Saved tokens</TabsTrigger>
                <TabsTrigger value="custom" className="flex-1">Custom contract</TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === 'list' ? (
              filteredTokens.length > 0 ? (
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger><SelectValue placeholder="Select token" /></SelectTrigger>
                  <SelectContent>
                    {filteredTokens.map(t => (
                      <SelectItem key={t.address} value={t.address}>
                        <span className="font-semibold">{t.name}</span>
                        <span className="text-muted-foreground ml-2 font-mono text-xs">{t.address.slice(0, 8)}…{t.address.slice(-6)}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  No {chainType === 'tron' ? 'TRC-20' : 'ERC-20'} tokens saved. Add one with the button above.
                </p>
              )
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={contractAddress} onChange={e => setContractAddress(e.target.value)}
                         placeholder={chainType === 'tron' ? 'T… contract address' : '0x… contract address'}
                         className="font-mono" />
                  <Button variant="outline" onClick={lookupContract} disabled={isLookingUp || !contractAddress} className="shrink-0 gap-2">
                    {isLookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Look up
                  </Button>
                </div>
                {lookupError && <p className="text-xs text-destructive">{lookupError}</p>}
                {customToken && (
                  <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border border-border">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{customToken.symbol}</p>
                      <p className="text-xs text-muted-foreground">{customToken.name} · {customToken.decimals} decimals</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recipient */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Recipient Address</label>
            <div className="flex gap-2">
              <Input value={recipient} onChange={e => setRecipient(e.target.value)}
                     placeholder={chainType === 'tron' ? 'T… Tron address' : '0x… EVM address'}
                     className="font-mono" />
              <Button variant="outline" size="icon" onClick={() => setIsScanOpen(true)}>
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
            {recipient && !isValidAddress(recipient, chainType) && (
              <p className="text-xs text-destructive">
                {chainType === 'tron' ? 'Enter a valid T… Tron address' : 'Enter a valid 0x… EVM address'}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <div className="relative">
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                     placeholder="0.0" className="font-mono text-lg py-6 pr-24" step="0.0001" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                {mode === 'list'
                  ? (selectedToken ? filteredTokens.find(t => t.address === selectedToken)?.name : 'TOKEN')
                  : (customToken?.symbol ?? 'TOKEN')}
              </div>
            </div>
          </div>

          <Button className="w-full h-12 text-lg gap-2" onClick={handleSend} disabled={isSending || !canSend}>
            {isSending ? <><Loader2 className="w-5 h-5 animate-spin" />Sending…</> : <><Send className="w-5 h-5" />Send Token</>}
          </Button>

          {txHash && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 flex flex-col gap-2">
              <div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="w-5 h-5" />Transaction Submitted</div>
              <code className="text-xs break-all opacity-90">{txHash}</code>
              {net?.explorerUrl && (
                <a href={`${net.explorerUrl}${txHash}`} target="_blank" rel="noopener noreferrer"
                   className="text-xs underline opacity-70 hover:opacity-100">View on explorer ↗</a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <QRScanDialog open={isScanOpen} onOpenChange={setIsScanOpen} onScan={data => setRecipient(data)} />
    </div>
  );
}
