import { useState, useEffect, useRef, useCallback } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Wallet, Coins, Eye } from 'lucide-react';
import { ethers } from 'ethers';
import { getTRXBalance, getTRC20Balances, isValidAddress } from '@/lib/tron';

const ERC20_BALANCE_ABI = ['function balanceOf(address) view returns (uint256)'];

type TokenBalance = {
  address: string;
  symbol: string;
  decimals: number;
  balance: string;
  raw: bigint;
  changed: boolean;
};

function useSecondsAgo(ts: number | null) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!ts) return;
    const tick = () => setSecs(Math.floor((Date.now() - ts) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [ts]);
  return secs;
}

export default function BalancesPage() {
  const { currentWalletId, wallets, networkConfigs, providers, tokens } = useWalletContext();

  const [selectedNetwork, setSelectedNetwork] = useState<string>(networkConfigs[0]?.id ?? '');
  const [watchedAddress, setWatchedAddress] = useState('');
  const [addressInput, setAddressInput] = useState('');

  const [nativeBalance, setNativeBalance] = useState<string | null>(null);
  const [prevNative, setPrevNative] = useState<string | null>(null);
  const [nativeChanged, setNativeChanged] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);
  const tronTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const secsAgo = useSecondsAgo(lastUpdated);
  const currentWallet = currentWalletId ? wallets[currentWalletId] : null;

  const selectedNet = networkConfigs.find(n => n.id === selectedNetwork);
  const chainType = selectedNet?.chainType ?? 'evm';
  const nativeSymbol = selectedNet?.nativeSymbol ?? 'ETH';

  // Effective address: Tron or EVM address depending on chain
  const evmAddress = watchedAddress && ethers.isAddress(watchedAddress) ? watchedAddress : currentWallet?.address ?? '';
  const tronWatchAddress = watchedAddress && /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(watchedAddress) ? watchedAddress : currentWallet?.tronAddress ?? '';
  const effectiveAddress = chainType === 'tron' ? tronWatchAddress : evmAddress;

  const netTokens = tokens.filter(t => (t.chainType ?? 'evm') === chainType);

  const flashChanged = (setter: (v: boolean) => void) => {
    setter(true); setTimeout(() => setter(false), 1200);
  };

  // ── EVM fetch ─────────────────────────────────────────────────────────────

  const fetchEVMBalances = useCallback(async (address: string, networkId: string) => {
    const provider = providers[networkId];
    if (!provider || !address || !ethers.isAddress(address)) return;
    setIsRefreshing(true);
    try {
      const balWei = await provider.getBalance(address);
      const display = parseFloat(ethers.formatEther(balWei)).toFixed(6);
      setNativeBalance(prev => {
        if (prev !== null && prev !== display) { flashChanged(setNativeChanged); setPrevNative(prev); }
        return display;
      });

      const results = await Promise.allSettled(
        netTokens.map(async token => {
          const c = new ethers.Contract(token.address, ERC20_BALANCE_ABI, provider);
          const raw: bigint = await c.balanceOf(address);
          return { address: token.address, symbol: token.name, decimals: token.decimals, balance: parseFloat(ethers.formatUnits(raw, token.decimals)).toFixed(6), raw, changed: false } as TokenBalance;
        })
      );
      setTokenBalances(prev => {
        const prevMap = Object.fromEntries(prev.map(t => [t.address, t.balance]));
        return results.filter((r): r is PromiseFulfilledResult<TokenBalance> => r.status === 'fulfilled')
          .map(r => ({ ...r.value, changed: prevMap[r.value.address] !== undefined && prevMap[r.value.address] !== r.value.balance }));
      });
      setLastUpdated(Date.now());
    } catch {}
    finally { setIsRefreshing(false); }
  }, [providers, netTokens]);

  // ── Tron fetch ────────────────────────────────────────────────────────────

  const fetchTronBalances = useCallback(async (tronAddress: string, networkId: string) => {
    if (!tronAddress || !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(tronAddress)) return;
    const net = networkConfigs.find(n => n.id === networkId);
    if (!net) return;
    setIsRefreshing(true);
    try {
      const trxBal = await getTRXBalance(tronAddress, net.rpc);
      setNativeBalance(prev => {
        if (prev !== null && prev !== trxBal) { flashChanged(setNativeChanged); setPrevNative(prev); }
        return trxBal;
      });

      const tronTkns = netTokens.map(t => ({ address: t.address, decimals: t.decimals }));
      const balMap = await getTRC20Balances(tronAddress, tronTkns, net.rpc);
      setTokenBalances(netTokens.map(t => ({
        address: t.address,
        symbol: t.name,
        decimals: t.decimals,
        balance: balMap[t.address] ?? '0.000000',
        raw: 0n,
        changed: false,
      })));
      setLastUpdated(Date.now());
    } catch {}
    finally { setIsRefreshing(false); }
  }, [networkConfigs, netTokens]);

  // ── Subscribe / poll ──────────────────────────────────────────────────────

  useEffect(() => {
    setNativeBalance(null);
    setTokenBalances([]);
    setBlockNumber(null);
    setIsLive(false);
    if (tronTimerRef.current) clearInterval(tronTimerRef.current);

    if (!effectiveAddress) return;

    if (chainType === 'evm') {
      const provider = providers[selectedNetwork];
      if (!provider) return;
      fetchEVMBalances(effectiveAddress, selectedNetwork);
      const onBlock = (num: number) => { setBlockNumber(num); setIsLive(true); fetchEVMBalances(effectiveAddress, selectedNetwork); };
      provider.on('block', onBlock);
      return () => { provider.off('block', onBlock); setIsLive(false); };
    } else {
      // Tron: poll every 15 s
      fetchTronBalances(effectiveAddress, selectedNetwork);
      setIsLive(true);
      tronTimerRef.current = setInterval(() => fetchTronBalances(effectiveAddress, selectedNetwork), 15_000);
      return () => { if (tronTimerRef.current) clearInterval(tronTimerRef.current); setIsLive(false); };
    }
  }, [selectedNetwork, effectiveAddress, chainType]);

  useEffect(() => {
    const changed = tokenBalances.filter(t => t.changed);
    if (!changed.length) return;
    const id = setTimeout(() => setTokenBalances(prev => prev.map(t => ({ ...t, changed: false }))), 1200);
    return () => clearTimeout(id);
  }, [tokenBalances]);

  const handleWatchAddress = () => {
    if (addressInput && isValidAddress(addressInput, chainType)) setWatchedAddress(addressInput);
    else if (!addressInput) setWatchedAddress('');
  };

  if (!currentWallet && !watchedAddress) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Wallet className="w-16 h-16 mb-4 opacity-30" />
        <h2 className="text-xl font-semibold mb-2 text-foreground">No Wallet Selected</h2>
        <p className="text-sm">Import a wallet or enter an address below to watch any address.</p>
      </div>
    );
  }

  const nonZero = tokenBalances.filter(t => t.balance !== '0.000000');
  const zero = tokenBalances.filter(t => t.balance === '0.000000');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">Balances</h2>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium transition-colors ${isLive ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-muted bg-muted/30 text-muted-foreground'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'}`} />
            {isLive ? 'Live' : 'Connecting…'}
          </div>
          {blockNumber && <span className="text-xs text-muted-foreground font-mono">block #{blockNumber.toLocaleString()}</span>}
          <Badge variant="outline" className="text-xs font-mono">{chainType === 'tron' ? '⚡ Tron' : '🔷 EVM'}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedNetwork} onValueChange={v => { setSelectedNetwork(v); setNativeBalance(null); setTokenBalances([]); setBlockNumber(null); setIsLive(false); }}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {networkConfigs.map(n => (
                <SelectItem key={n.id} value={n.id}>
                  <span className="text-xs text-muted-foreground mr-1">{n.chainType === 'tron' ? '⚡' : '🔷'}</span>{n.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => chainType === 'tron' ? fetchTronBalances(effectiveAddress, selectedNetwork) : fetchEVMBalances(effectiveAddress, selectedNetwork)} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Watch any address */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              value={addressInput}
              onChange={e => setAddressInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleWatchAddress()}
              placeholder={chainType === 'tron'
                ? (currentWallet ? `Watching: ${currentWallet.tronAddress}` : 'T… watch any Tron address')
                : (currentWallet ? `Watching: ${currentWallet.address.slice(0, 12)}…` : '0x… watch any EVM address')}
              className="font-mono text-sm border-0 bg-transparent focus-visible:ring-0 p-0 h-auto"
            />
            <Button variant="secondary" size="sm" onClick={handleWatchAddress} className="shrink-0">
              {addressInput ? 'Watch' : 'Reset'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {lastUpdated && (
        <p className="text-xs text-muted-foreground text-right -mt-3">
          Updated {secsAgo === 0 ? 'just now' : `${secsAgo}s ago`}
          {chainType === 'evm' ? ' · refreshes on every block' : ' · refreshes every 15 s'}
        </p>
      )}

      {/* Native balance */}
      <Card className={`border-primary/20 bg-primary/5 transition-all duration-300 ${nativeChanged ? 'ring-2 ring-primary/40 bg-primary/15' : ''}`}>
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Native Balance</p>
          <div className="text-5xl font-mono font-bold tracking-tighter text-foreground flex items-baseline gap-3">
            <span className={`transition-colors duration-500 ${nativeChanged ? 'text-primary' : ''}`}>
              {nativeBalance ?? '—'}
            </span>
            <span className="text-2xl text-primary font-sans font-medium">{nativeSymbol}</span>
          </div>
          {prevNative && prevNative !== nativeBalance && (
            <p className="text-xs text-muted-foreground mt-2 font-mono">prev: {prevNative}</p>
          )}
          <p className="text-xs text-muted-foreground mt-3 font-mono break-all">{effectiveAddress}</p>
        </CardContent>
      </Card>

      {/* Token balances */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <h3 className="text-base font-semibold">{chainType === 'tron' ? 'TRC-20 Tokens' : 'ERC-20 Tokens'}</h3>
          {nonZero.length > 0 && <Badge variant="secondary" className="text-xs">{nonZero.length} with balance</Badge>}
        </div>

        {tokenBalances.length === 0 && effectiveAddress && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Coins className="w-8 h-8 mx-auto mb-2 opacity-30" />Fetching token balances…
          </div>
        )}

        {nonZero.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nonZero.map(t => <TokenRow key={t.address} token={t} />)}
          </div>
        )}

        {zero.length > 0 && (
          <details className="group">
            <summary className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground py-1">
              {zero.length} token{zero.length !== 1 ? 's' : ''} with zero balance
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {zero.map(t => <TokenRow key={t.address} token={t} dim />)}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

function TokenRow({ token, dim }: { token: TokenBalance; dim?: boolean }) {
  return (
    <Card className={`border-border transition-all duration-300 ${token.changed ? 'ring-2 ring-primary/40 bg-primary/5' : dim ? 'opacity-40' : ''}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center border border-border shrink-0">
          <Coins className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">{token.symbol}</div>
          <div className="text-xs text-muted-foreground font-mono truncate">{token.address.slice(0, 10)}…{token.address.slice(-8)}</div>
        </div>
        <div className={`font-mono font-bold text-sm text-right transition-colors duration-500 ${token.changed ? 'text-primary' : ''}`}>
          {token.balance}
        </div>
      </CardContent>
    </Card>
  );
}
