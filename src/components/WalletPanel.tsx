import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Wallet, Plus, Trash2, Eye, Copy, RefreshCw, ChevronDown, ChevronRight, Loader2, ScanLine } from 'lucide-react';

export function WalletPanel() {
  const { wallets, currentWalletName, currentWallet, importWallet, removeWallet, switchWallet, refreshAllBalances, allBalances, autoScanTokens } = useWallet();
  const [showImport, setShowImport] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedNetworks, setExpandedNetworks] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const walletNames = Object.keys(wallets);

  useEffect(() => {
    if (currentWallet) {
      setIsRefreshing(true);
      refreshAllBalances().finally(() => setIsRefreshing(false));
    }
  }, [currentWallet, refreshAllBalances]);

  const handleImport = () => {
    const ok = importWallet(importInput);
    if (ok) {
      setShowImport(false);
      setImportInput('');
      setError('');
    } else {
      setError('Invalid private key or mnemonic phrase.');
    }
  };

  const handleCopy = () => {
    if (currentWallet) {
      navigator.clipboard.writeText(currentWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleNetwork = (id: string) => {
    setExpandedNetworks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshAllBalances().finally(() => setIsRefreshing(false));
  };

  const handleScan = () => {
    setIsScanning(true);
    autoScanTokens().finally(() => setIsScanning(false));
  };

  return (
    <>
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center gap-2 text-base">
            <Wallet className="w-4 h-4 text-emerald-400" /> Wallet Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {walletNames.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={currentWalletName || ''}
                onChange={(e) => switchWallet(e.target.value)}
                className="flex-1 min-w-40 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500 cursor-pointer"
              >
                {walletNames.map(name => (
                  <option key={name} value={name} className="bg-slate-800">{name}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={() => setShowDetails(true)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                <Eye className="w-3.5 h-3.5 mr-1" /> Details
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
              <Button variant="outline" size="sm" onClick={removeWallet} className="border-red-900/50 text-red-400 hover:bg-red-950/30">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Wallet className="w-10 h-10 text-slate-600 mb-3" />
              <p className="text-sm text-slate-500 mb-4">No wallet loaded. Import one to get started.</p>
              <Button onClick={() => setShowImport(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-1.5" /> Import Wallet
              </Button>
            </div>
          )}

          {currentWallet && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-800/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-emerald-300">{currentWalletName}</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-slate-300 font-mono truncate">{currentWallet.address}</code>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-slate-400 hover:text-emerald-400">
                  <Copy className="w-3.5 h-3.5" />
                  {copied && <span className="text-xs ml-1 text-emerald-400">Copied!</span>}
                </Button>
              </div>
            </div>
          )}

          {currentWallet && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live Balances</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleScan} disabled={isScanning} className="h-6 px-2 text-xs text-slate-400 hover:text-cyan-400">
                    {isScanning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ScanLine className="w-3 h-3 mr-1" />} Auto-Scan
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-6 px-2 text-xs text-slate-400 hover:text-emerald-400">
                    {isRefreshing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />} Refresh
                  </Button>
                </div>
              </div>
              {isRefreshing && allBalances.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                </div>
              ) : allBalances.length > 0 ? (
                <div className="space-y-2">
                  {allBalances.map((net) => {
                    const expanded = expandedNetworks[net.networkId];
                    const hasTokens = net.tokens.length > 0;
                    return (
                      <div key={net.networkId} className="rounded-lg bg-slate-800/50 border border-slate-700/50 overflow-hidden">
                        <div 
                          className={`flex items-center justify-between p-2.5 ${hasTokens ? 'cursor-pointer hover:bg-slate-800' : ''}`}
                          onClick={() => hasTokens && toggleNetwork(net.networkId)}
                        >
                          <div className="flex items-center gap-2">
                            {hasTokens && (
                              expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="text-sm font-medium text-slate-300">{net.networkName}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-mono text-slate-200">{parseFloat(net.ethBalance).toFixed(4)}</span>
                            <span className="text-xs text-slate-500 ml-1">{net.symbol}</span>
                          </div>
                        </div>
                        {expanded && hasTokens && (
                          <div className="px-2.5 pb-2.5 pt-1 space-y-1.5 border-t border-slate-700/50">
                            {net.tokens.map(t => (
                              <div key={t.symbol} className="flex items-center justify-between pl-6">
                                <span className="text-xs text-slate-400">{t.symbol}</span>
                                <span className="text-xs font-mono text-slate-400">{parseFloat(t.balance).toFixed(4)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 py-4 text-center">No balances loaded.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Import Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Private Key or Mnemonic</Label>
              <Textarea
                value={importInput}
                onChange={(e) => setImportInput(e.target.value)}
                placeholder="Enter 0x private key or 12/24 word mnemonic..."
                className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600 font-mono text-sm"
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImport(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleImport} className="bg-emerald-600 hover:bg-emerald-700 text-white">Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Wallet Details</DialogTitle>
          </DialogHeader>
          {currentWallet && (
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-slate-500 text-xs uppercase tracking-wider">Address</Label>
                <p className="text-sm text-slate-300 font-mono break-all mt-1">{currentWallet.address}</p>
              </div>
              <div>
                <Label className="text-slate-500 text-xs uppercase tracking-wider">Private Key</Label>
                <p className="text-sm text-slate-300 font-mono break-all mt-1">{currentWallet.privateKey}</p>
              </div>
              {currentWallet.mnemonic && (
                <div>
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">Mnemonic</Label>
                  <p className="text-sm text-slate-300 font-mono break-all mt-1">{currentWallet.mnemonic}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}