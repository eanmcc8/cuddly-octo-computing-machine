import { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search, ShieldCheck, ShieldOff, Loader2, CheckCircle2, AlertTriangle, Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';

const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function decimals() view returns (uint8)',
];

type TokenSource = 'list' | 'custom';
type AllowanceInfo = {
  raw: bigint;
  formatted: string;
  symbol: string;
  decimals: number;
  isUnlimited: boolean;
};

const UNLIMITED = ethers.MaxUint256;

export default function ApprovalsPage() {
  const { currentWalletId, wallets, networkConfigs, providers, tokens } = useWalletContext();
  const { toast } = useToast();

  const [selectedNetwork, setSelectedNetwork] = useState<string>(networkConfigs[0]?.id ?? '');
  const [tokenSource, setTokenSource] = useState<TokenSource>('list');
  const [selectedToken, setSelectedToken] = useState<string>(''); // address from list
  const [customContract, setCustomContract] = useState('');
  const [spender, setSpender] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [grantUnlimited, setGrantUnlimited] = useState(false);

  // Resolved token metadata (after lookup for custom, or derived from list)
  const [resolvedToken, setResolvedToken] = useState<{ address: string; symbol: string; decimals: number } | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Allowance check result
  const [allowanceInfo, setAllowanceInfo] = useState<AllowanceInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Tx state
  const [isApproving, setIsApproving] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txAction, setTxAction] = useState<'approve' | 'revoke' | null>(null);

  const currentWallet = currentWalletId ? wallets[currentWalletId] : null;

  // ── helpers ──────────────────────────────────────────────────────────

  const getProvider = () => {
    const p = providers[selectedNetwork];
    if (!p) throw new Error('Provider not available for selected network');
    return p;
  };

  const getTokenAddress = () => {
    if (tokenSource === 'list') return selectedToken;
    return customContract;
  };

  const resetResults = () => {
    setAllowanceInfo(null);
    setTxHash(null);
    setTxAction(null);
  };

  // ── lookup custom contract ────────────────────────────────────────────

  const lookupCustomContract = async () => {
    if (!ethers.isAddress(customContract)) {
      setLookupError('Invalid contract address');
      return;
    }
    setIsLookingUp(true);
    setLookupError(null);
    setResolvedToken(null);
    resetResults();
    try {
      const provider = getProvider();
      const c = new ethers.Contract(customContract, ERC20_ABI, provider);
      const [symbol, , decimals] = await Promise.all([c.symbol(), c.name(), c.decimals()]);
      setResolvedToken({ address: customContract, symbol, decimals: Number(decimals) });
    } catch {
      setLookupError('Could not read token info. Make sure this is an ERC-20 contract on the selected network.');
    } finally {
      setIsLookingUp(false);
    }
  };

  // When user picks from list, synthesise resolvedToken from the list entry
  const handleListTokenChange = (address: string) => {
    setSelectedToken(address);
    resetResults();
    const t = tokens.find(tok => tok.address === address);
    if (t) setResolvedToken({ address: t.address, symbol: t.name, decimals: t.decimals });
    else setResolvedToken(null);
  };

  // ── check allowance ───────────────────────────────────────────────────

  const checkAllowance = async () => {
    if (!currentWallet) { toast({ title: 'No wallet selected', variant: 'destructive' }); return; }
    if (!resolvedToken) { toast({ title: 'Resolve token first', variant: 'destructive' }); return; }
    if (!ethers.isAddress(spender)) { toast({ title: 'Invalid spender address', variant: 'destructive' }); return; }

    setIsChecking(true);
    setAllowanceInfo(null);
    try {
      const provider = getProvider();
      const c = new ethers.Contract(resolvedToken.address, ERC20_ABI, provider);
      const raw: bigint = await c.allowance(currentWallet.address, spender);
      const isUnlimited = raw >= UNLIMITED / 2n; // treat as unlimited if >= half of MaxUint256
      const formatted = isUnlimited
        ? 'Unlimited'
        : ethers.formatUnits(raw, resolvedToken.decimals);
      setAllowanceInfo({ raw, formatted, symbol: resolvedToken.symbol, decimals: resolvedToken.decimals, isUnlimited });
    } catch (e: any) {
      toast({ title: 'Failed to check allowance', description: e.message, variant: 'destructive' });
    } finally {
      setIsChecking(false);
    }
  };

  // ── send approval tx ─────────────────────────────────────────────────

  const sendApproval = async (amountWei: bigint, action: 'approve' | 'revoke') => {
    if (!currentWallet || !resolvedToken) return;
    if (!ethers.isAddress(spender)) { toast({ title: 'Invalid spender address', variant: 'destructive' }); return; }

    const setter = action === 'approve' ? setIsApproving : setIsRevoking;
    setter(true);
    setTxHash(null);
    setTxAction(null);

    try {
      const provider = getProvider();
      const signer = new ethers.Wallet(currentWallet.rawPrivateKey, provider);
      const c = new ethers.Contract(resolvedToken.address, ERC20_ABI, signer);
      const tx = await c.approve(spender, amountWei);
      setTxHash(tx.hash);
      setTxAction(action);
      toast({ title: action === 'approve' ? 'Approval sent!' : 'Revoke sent!', description: 'Waiting for confirmation...' });
      tx.wait()
        .then(() => {
          toast({ title: action === 'approve' ? 'Approval confirmed!' : 'Permission revoked!' });
          // Refresh allowance after confirmation
          checkAllowance();
        })
        .catch((e: any) => toast({ title: 'Transaction failed', description: e.message, variant: 'destructive' }));
    } catch (e: any) {
      toast({ title: 'Transaction failed', description: e.message, variant: 'destructive' });
    } finally {
      setter(false);
    }
  };

  const handleApprove = async () => {
    if (!resolvedToken) return;
    let amountWei: bigint;
    if (grantUnlimited) {
      amountWei = UNLIMITED;
    } else {
      if (!customAmount || isNaN(Number(customAmount))) {
        toast({ title: 'Enter a valid amount', variant: 'destructive' });
        return;
      }
      amountWei = ethers.parseUnits(customAmount, resolvedToken.decimals);
    }
    await sendApproval(amountWei, 'approve');
  };

  const handleRevoke = () => sendApproval(0n, 'revoke');

  // ── derived ───────────────────────────────────────────────────────────

  const tokenReady = tokenSource === 'list' ? !!resolvedToken : !!resolvedToken;
  const spenderReady = ethers.isAddress(spender);
  const canCheck = tokenReady && spenderReady && !!currentWallet;

  if (!currentWallet) {
    return <div className="text-center p-12 text-muted-foreground">No wallet selected. Import a wallet first.</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Token Approvals</h2>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage ERC-20 spending permissions granted by your wallet.
        </p>
      </div>

      {/* Security notice */}
      <div className="flex gap-3 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-400 text-sm">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          Unlimited approvals let dApps spend tokens without limit. Revoke permissions you no longer use to reduce risk.
        </span>
      </div>

      {/* Step 1 – Token + Network */}
      <Card className="border-border shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">1. Select Token &amp; Network</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Network</label>
            <Select value={selectedNetwork} onValueChange={v => { setSelectedNetwork(v); resetResults(); setResolvedToken(null); }}>
              <SelectTrigger data-testid="select-network">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                {networkConfigs.map(n => (
                  <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Token Source</label>
            <div className="flex rounded-md border border-border overflow-hidden">
              {(['list', 'custom'] as TokenSource[]).map(src => (
                <button
                  key={src}
                  onClick={() => { setTokenSource(src); setResolvedToken(null); resetResults(); setLookupError(null); }}
                  className={`flex-1 py-2 text-sm transition-colors ${tokenSource === src ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                >
                  {src === 'list' ? 'Saved tokens' : 'Custom address'}
                </button>
              ))}
            </div>
          </div>

          {tokenSource === 'list' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Token</label>
              <Select value={selectedToken} onValueChange={handleListTokenChange}>
                <SelectTrigger data-testid="select-token">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map(t => (
                    <SelectItem key={t.address} value={t.address}>
                      <span className="font-semibold">{t.name}</span>
                      <span className="text-muted-foreground ml-2 font-mono text-xs">
                        {t.address.slice(0, 8)}…{t.address.slice(-6)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Contract Address</label>
              <div className="flex gap-2">
                <Input
                  value={customContract}
                  onChange={e => { setCustomContract(e.target.value); setResolvedToken(null); resetResults(); setLookupError(null); }}
                  placeholder="0x..."
                  className="font-mono"
                  data-testid="input-custom-contract"
                />
                <Button
                  variant="outline"
                  onClick={lookupCustomContract}
                  disabled={isLookingUp || !customContract}
                  className="shrink-0 gap-2"
                  data-testid="button-lookup"
                >
                  {isLookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Look up
                </Button>
              </div>
              {lookupError && <p className="text-xs text-destructive">{lookupError}</p>}
            </div>
          )}

          {resolvedToken && (
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border border-border">
              <div className="flex-1">
                <p className="font-semibold text-sm">{resolvedToken.symbol}</p>
                <p className="text-xs text-muted-foreground font-mono">{resolvedToken.address}</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2 – Spender + Check */}
      <Card className="border-border shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">2. Enter Spender &amp; Check Allowance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Spender Address</label>
            <p className="text-xs text-muted-foreground">The contract or address that has (or will have) permission to spend your tokens.</p>
            <Input
              value={spender}
              onChange={e => { setSpender(e.target.value); setAllowanceInfo(null); }}
              placeholder="0x contract or address..."
              className="font-mono"
              data-testid="input-spender"
            />
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={checkAllowance}
            disabled={isChecking || !canCheck}
            data-testid="button-check-allowance"
          >
            {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Check Current Allowance
          </Button>

          {allowanceInfo && (
            <div className={`flex items-start gap-3 p-4 rounded-lg border ${allowanceInfo.isUnlimited ? 'border-red-500/30 bg-red-500/5' : allowanceInfo.raw === 0n ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
              <Info className={`w-4 h-4 mt-0.5 shrink-0 ${allowanceInfo.isUnlimited ? 'text-red-400' : allowanceInfo.raw === 0n ? 'text-green-400' : 'text-amber-400'}`} />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Current allowance:</span>
                  <Badge variant={allowanceInfo.isUnlimited ? 'destructive' : 'secondary'} className="font-mono text-xs">
                    {allowanceInfo.isUnlimited ? 'Unlimited' : `${Number(allowanceInfo.formatted).toLocaleString()} ${allowanceInfo.symbol}`}
                  </Badge>
                </div>
                {allowanceInfo.raw === 0n && (
                  <p className="text-xs text-green-400">No permission granted to this spender.</p>
                )}
                {allowanceInfo.isUnlimited && (
                  <p className="text-xs text-red-400">This spender can spend unlimited tokens. Consider revoking if you no longer use this service.</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3 – Edit Permission */}
      <Card className="border-border shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">3. Edit Permission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Revoke */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">Revoke</p>
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={handleRevoke}
              disabled={isRevoking || isApproving || !canCheck}
              data-testid="button-revoke"
            >
              {isRevoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
              Revoke Permission (set to 0)
            </Button>
          </div>

          <Separator />

          {/* Approve */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">Approve</p>

            {/* Unlimited toggle */}
            <button
              onClick={() => setGrantUnlimited(v => !v)}
              className={`w-full flex items-center justify-between p-3 rounded-md border transition-colors ${grantUnlimited ? 'border-primary/40 bg-primary/5' : 'border-border bg-secondary/50 hover:bg-secondary'}`}
              data-testid="toggle-unlimited"
            >
              <span className="text-sm font-medium">Unlimited approval</span>
              <div className={`w-10 h-5 rounded-full transition-colors relative ${grantUnlimited ? 'bg-primary' : 'bg-muted'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${grantUnlimited ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>

            {!grantUnlimited && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Custom Amount {resolvedToken ? `(${resolvedToken.symbol})` : ''}
                </label>
                <Input
                  type="number"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  placeholder="0.0"
                  className="font-mono"
                  step="0.0001"
                  data-testid="input-approve-amount"
                />
              </div>
            )}

            <Button
              className="w-full gap-2"
              onClick={handleApprove}
              disabled={isApproving || isRevoking || !canCheck}
              data-testid="button-approve"
            >
              {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {grantUnlimited ? 'Approve Unlimited' : 'Approve Amount'}
            </Button>
          </div>

          {txHash && txAction && (
            <div className={`p-4 rounded-lg border flex flex-col gap-2 ${txAction === 'revoke' ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-primary/20 bg-primary/5 text-primary'}`}>
              <div className="flex items-center gap-2 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                {txAction === 'revoke' ? 'Revoke submitted' : 'Approval submitted'} — awaiting confirmation
              </div>
              <span className="font-mono text-xs break-all opacity-80">{txHash}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
