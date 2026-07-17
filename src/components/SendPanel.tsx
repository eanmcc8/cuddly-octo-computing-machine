import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Send, Coins, Plus, ArrowRight, Network as NetworkIcon, ShieldCheck, X } from 'lucide-react';

export function SendPanel() {
  const { currentWallet, currentNetwork, networks, currentNetworkId, setNetwork, tokens, sendETH, sendToken, addToken, addNetwork, removeNetwork, resetNetworks, approvals, approveToken, revokeApproval } = useWallet();
  const [ethTo, setEthTo] = useState('');
  const [ethAmount, setEthAmount] = useState('');
  const [tokenTo, setTokenTo] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(tokens[0]?.address || '');
  const [showAddToken, setShowAddToken] = useState(false);
  const [showAddNetwork, setShowAddNetwork] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [newTokenDecimals, setNewTokenDecimals] = useState('18');
  const [tokenError, setTokenError] = useState('');
  const [newNetName, setNewNetName] = useState('');
  const [newNetRpc, setNewNetRpc] = useState('');
  const [newNetSymbol, setNewNetSymbol] = useState('');
  const [newNetExplorer, setNewNetExplorer] = useState('');
  const [netError, setNetError] = useState('');
  const [sending, setSending] = useState<'eth' | 'token' | null>(null);
  const [approveSpender, setApproveSpender] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  const [approveTokenAddr, setApproveTokenAddr] = useState(tokens[0]?.address || '');
  const [isApproving, setIsApproving] = useState(false);

  const handleSendETH = async () => {
    if (!ethTo || !ethAmount) return;
    setSending('eth');
    await sendETH(ethTo, ethAmount);
    setEthTo('');
    setEthAmount('');
    setSending(null);
  };

  const handleSendToken = async () => {
    if (!tokenTo || !tokenAmount) return;
    setSending('token');
    await sendToken(selectedToken, tokenTo, tokenAmount);
    setTokenTo('');
    setTokenAmount('');
    setSending(null);
  };

  const handleAddToken = () => {
    const decimals = parseInt(newTokenDecimals, 10);
    const ok = addToken(newTokenName, newTokenAddress, decimals);
    if (ok) {
      setShowAddToken(false);
      setNewTokenName('');
      setNewTokenAddress('');
      setNewTokenDecimals('18');
      setTokenError('');
    } else {
      setTokenError('Invalid token address or already exists.');
    }
  };

  const handleAddNetwork = () => {
    if (!newNetName || !newNetRpc) {
      setNetError('Name and RPC URL are required.');
      return;
    }
    const ok = addNetwork(newNetName, newNetRpc, newNetSymbol, newNetExplorer);
    if (ok) {
      setShowAddNetwork(false);
      setNewNetName('');
      setNewNetRpc('');
      setNewNetSymbol('');
      setNewNetExplorer('');
      setNetError('');
    } else {
      setNetError('Network with this name already exists.');
    }
  };

  const handleApprove = async () => {
    if (!approveSpender || !approveAmount) return;
    setIsApproving(true);
    await approveToken(approveTokenAddr, approveSpender, approveAmount);
    setApproveSpender('');
    setApproveAmount('');
    setIsApproving(false);
    setShowApprove(false);
  };

  const handleRevoke = async (tokenAddress: string, spender: string) => {
    await revokeApproval(tokenAddress, spender);
  };

  const disabled = !currentWallet;

  return (
    <>
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center gap-2 text-base">
            <Send className="w-4 h-4 text-emerald-400" /> Send Assets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <span className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-xs font-bold">Ξ</span>
              Send Native Token
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Network</Label>
              <Select value={currentNetworkId} onValueChange={setNetwork} disabled={disabled}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200 text-sm">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {networks.map(n => (
                    <SelectItem key={n.id} value={n.id} className="text-slate-200">{n.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Recipient Address</Label>
              <Input
                value={ethTo}
                onChange={(e) => setEthTo(e.target.value)}
                placeholder="0x..."
                disabled={disabled}
                className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Amount ({currentNetwork.symbol})</Label>
              <Input
                type="number"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                placeholder="0.0"
                disabled={disabled}
                className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600 font-mono text-sm"
              />
            </div>
            <Button onClick={handleSendETH} disabled={disabled || sending === 'eth'} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              {sending === 'eth' ? 'Sending...' : `Send ${currentNetwork.symbol}`}
              {sending !== 'eth' && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Coins className="w-4 h-4 text-cyan-400" /> Send ERC-20
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAddToken(true)} disabled={disabled} className="h-7 px-2 text-slate-400 hover:text-cyan-400 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Token
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Token</Label>
              <Select value={selectedToken} onValueChange={setSelectedToken} disabled={disabled}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200 text-sm">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {tokens.map(t => (
                    <SelectItem key={t.address} value={t.address} className="text-slate-200">
                      {t.name} ({t.address.slice(0, 6)}...{t.address.slice(-4)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Recipient Address</Label>
              <Input
                value={tokenTo}
                onChange={(e) => setTokenTo(e.target.value)}
                placeholder="0x..."
                disabled={disabled}
                className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Amount</Label>
              <Input
                type="number"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                placeholder="0.0"
                disabled={disabled}
                className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600 font-mono text-sm"
              />
            </div>
            <Button onClick={handleSendToken} disabled={disabled || sending === 'token'} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
              {sending === 'token' ? 'Sending...' : 'Send Token'}
              {sending !== 'token' && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> Approvals
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowApprove(true)} disabled={disabled} className="h-7 px-2 text-slate-400 hover:text-amber-400 text-xs">
                <Plus className="w-3 h-3 mr-1" /> New Approval
              </Button>
            </div>
            {approvals.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {approvals.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-slate-200">{a.tokenSymbol} → {a.spenderAddress.slice(0, 6)}...{a.spenderAddress.slice(-4)}</div>
                      <div className="text-xs text-slate-500">Amount: {a.amount}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRevoke(a.tokenAddress, a.spenderAddress)} className="h-7 px-2 text-slate-500 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-2">No active approvals.</p>
            )}
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <NetworkIcon className="w-4 h-4 text-violet-400" /> Network Management
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddNetwork(true)} className="h-7 px-2 text-slate-400 hover:text-violet-400 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add Network
                </Button>
                <Button variant="ghost" size="sm" onClick={resetNetworks} className="h-7 px-2 text-slate-400 hover:text-violet-400 text-xs">
                  Reset
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {networks.map(n => (
                <div key={n.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-slate-200 truncate">{n.name}</div>
                    <div className="text-xs text-slate-500 truncate font-mono">{n.rpc}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeNetwork(n.id)} className="h-7 px-2 text-slate-500 hover:text-red-400">
                    <Plus className="w-3 h-3 rotate-45" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddToken} onOpenChange={setShowAddToken}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Add Custom Token</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Token Name</Label>
              <Input value={newTokenName} onChange={(e) => setNewTokenName(e.target.value)} placeholder="MyToken" className="bg-slate-800 border-slate-700 text-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Contract Address</Label>
              <Input value={newTokenAddress} onChange={(e) => setNewTokenAddress(e.target.value)} placeholder="0x..." className="bg-slate-800 border-slate-700 text-slate-200 font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Decimals</Label>
              <Input type="number" value={newTokenDecimals} onChange={(e) => setNewTokenDecimals(e.target.value)} placeholder="18" className="bg-slate-800 border-slate-700 text-slate-200" />
            </div>
            {tokenError && <p className="text-sm text-red-400">{tokenError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddToken(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleAddToken} className="bg-cyan-600 hover:bg-cyan-700 text-white">Add Token</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddNetwork} onOpenChange={setShowAddNetwork}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Add Custom Network</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Network Name</Label>
              <Input value={newNetName} onChange={(e) => setNewNetName(e.target.value)} placeholder="My Custom Chain" className="bg-slate-800 border-slate-700 text-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">RPC URL</Label>
              <Input value={newNetRpc} onChange={(e) => setNewNetRpc(e.target.value)} placeholder="https://rpc.my-chain.com" className="bg-slate-800 border-slate-700 text-slate-200 font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Symbol (e.g. ETH)</Label>
              <Input value={newNetSymbol} onChange={(e) => setNewNetSymbol(e.target.value)} placeholder="ETH" className="bg-slate-800 border-slate-700 text-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Explorer URL (optional)</Label>
              <Input value={newNetExplorer} onChange={(e) => setNewNetExplorer(e.target.value)} placeholder="https://explorer.my-chain.com" className="bg-slate-800 border-slate-700 text-slate-200 font-mono text-sm" />
            </div>
            {netError && <p className="text-sm text-red-400">{netError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNetwork(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleAddNetwork} className="bg-violet-600 hover:bg-violet-700 text-white">Add Network</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showApprove} onOpenChange={setShowApprove}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Approve Token Spending</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Token</Label>
              <Select value={approveTokenAddr} onValueChange={setApproveTokenAddr}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200 text-sm">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {tokens.map(t => (
                    <SelectItem key={t.address} value={t.address} className="text-slate-200">{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Spender Address</Label>
              <Input value={approveSpender} onChange={(e) => setApproveSpender(e.target.value)} placeholder="0x..." className="bg-slate-800 border-slate-700 text-slate-200 font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Amount</Label>
              <Input type="number" value={approveAmount} onChange={(e) => setApproveAmount(e.target.value)} placeholder="0.0" className="bg-slate-800 border-slate-700 text-slate-200 font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprove(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleApprove} disabled={isApproving} className="bg-amber-600 hover:bg-amber-700 text-white">
              {isApproving ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}