import { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QRScanDialog } from '@/components/QRScanDialog';
import { QrCode, Send, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';
import { isTronAddress, isValidAddress } from '@/lib/tron';
import { sendTRX } from '@/lib/tron-send';

export default function SendEthPage() {
  const { currentWalletId, wallets, networkConfigs, providers, addTransaction, getNetwork } = useWalletContext();
  const [selectedNetwork, setSelectedNetwork] = useState<string>(networkConfigs[0]?.id ?? '');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { toast } = useToast();

  const currentWallet = currentWalletId ? wallets[currentWalletId] : null;
  const net = getNetwork(selectedNetwork);
  const chainType = net?.chainType ?? 'evm';
  const nativeSymbol = net?.nativeSymbol ?? 'ETH';
  const explorerUrl = net?.explorerUrl;

  const handleSend = async () => {
    if (!currentWallet || !selectedNetwork || !recipient || !amount) return;

    if (!isValidAddress(recipient, chainType)) {
      toast({ title: `Invalid ${chainType === 'tron' ? 'Tron T…' : '0x…'} address`, variant: 'destructive' });
      return;
    }

    setIsSending(true);
    setTxHash(null);

    try {
      let hash: string;

      if (chainType === 'tron') {
        if (!currentWallet.tronAddress) throw new Error('Wallet has no Tron address');
        hash = await sendTRX(
          net!.rpc,
          currentWallet.rawPrivateKey,
          currentWallet.tronAddress,
          recipient,
          amount,
        );
      } else {
        const provider = providers[selectedNetwork];
        if (!provider) throw new Error('Provider not available');
        const signer = new ethers.Wallet(currentWallet.rawPrivateKey, provider);
        const tx = await signer.sendTransaction({ to: recipient, value: ethers.parseEther(amount) });
        hash = tx.hash;
        tx.wait().then(() => toast({ title: `${nativeSymbol} transfer confirmed!` })).catch(() => {});
      }

      addTransaction(currentWallet.address, {
        hash,
        type: 'native',
        network: net?.name ?? selectedNetwork,
        to: recipient,
        amount,
        token: null,
        status: 'Pending',
        timestamp: Date.now(),
      });

      setTxHash(hash);
      toast({ title: 'Transaction sent!', description: 'Waiting for confirmation…' });
      setRecipient('');
      setAmount('');
    } catch (e: any) {
      toast({ title: 'Send failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  if (!currentWallet) {
    return <div className="text-center p-12 text-muted-foreground">No wallet selected</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold tracking-tight">Send Native Coin</h2>
        <span className="text-sm font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{nativeSymbol}</span>
      </div>

      <Card className="border-border shadow-lg">
        <CardContent className="p-6 space-y-6">
          {/* Network */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Network</label>
            <Select value={selectedNetwork} onValueChange={v => { setSelectedNetwork(v); setTxHash(null); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {networkConfigs.map(n => (
                  <SelectItem key={n.id} value={n.id}>
                    <span className="text-xs text-muted-foreground mr-1">{n.chainType === 'tron' ? '⚡' : '🔷'}</span>
                    {n.name}
                    <span className="ml-2 text-muted-foreground text-xs font-mono">({n.nativeSymbol ?? 'ETH'})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From */}
          <div className="p-3 rounded-md bg-muted/50 border border-border text-sm">
            <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold block mb-1">From</span>
            <span className="font-mono text-xs break-all">
              {chainType === 'tron' ? currentWallet.tronAddress : currentWallet.address}
            </span>
          </div>

          {/* Recipient */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Recipient Address</label>
            <div className="flex gap-2">
              <Input
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder={chainType === 'tron' ? 'T… Tron address' : `0x… EVM address`}
                className="font-mono"
              />
              <Button variant="outline" size="icon" onClick={() => setIsScanOpen(true)}>
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
            {recipient && !isValidAddress(recipient, chainType) && (
              <p className="text-xs text-destructive">
                {chainType === 'tron' ? 'Enter a valid Tron T… address' : 'Enter a valid 0x… EVM address'}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <div className="relative">
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.0"
                className="font-mono text-lg py-6 pr-20"
                step="0.0001"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                {nativeSymbol}
              </div>
            </div>
          </div>

          <Button
            className="w-full h-12 text-lg gap-2"
            onClick={handleSend}
            disabled={isSending || !recipient || !amount || !isValidAddress(recipient, chainType)}
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                Sending…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-5 h-5" /> Send {nativeSymbol}
              </span>
            )}
          </Button>

          {txHash && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 flex flex-col gap-2">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-5 h-5" /> Transaction Submitted
              </div>
              <code className="text-xs break-all opacity-90">{txHash}</code>
              {explorerUrl && (
                <a href={`${explorerUrl}${txHash}`} target="_blank" rel="noopener noreferrer"
                   className="text-xs underline opacity-70 hover:opacity-100">View on explorer ↗</a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <QRScanDialog
        open={isScanOpen}
        onOpenChange={setIsScanOpen}
        onScan={data => {
          let addr = data;
          if (data.startsWith('ethereum:')) addr = data.replace('ethereum:', '').split('?')[0];
          if (data.startsWith('tron:')) addr = data.replace('tron:', '').split('?')[0];
          setRecipient(addr);
        }}
      />
    </div>
  );
}
