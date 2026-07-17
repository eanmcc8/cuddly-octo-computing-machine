import React, { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Plus, Trash2, Eye, ShieldAlert, Wallet, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WalletsPage() {
  const { wallets, currentWalletId, setCurrentWalletId, addWallet, removeWallet } = useWalletContext();
  const [importInput, setImportInput] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { toast } = useToast();

  const handleImport = () => {
    try {
      addWallet(importInput);
      toast({ title: 'Wallet imported — EVM & Tron addresses derived' });
      setImportInput('');
      setIsImportOpen(false);
    } catch (e: any) {
      toast({ title: 'Failed to import wallet', description: e.message, variant: 'destructive' });
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied` });
  };

  const currentWallet = currentWalletId ? wallets[currentWalletId] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Wallets</h2>
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Import Wallet</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Wallet</DialogTitle>
              <DialogDescription>
                Paste your private key (hex) or 12/24-word mnemonic phrase. Both an EVM and a Tron address will be derived automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex gap-3 text-sm text-destructive-foreground">
              <ShieldAlert className="w-5 h-5 shrink-0 text-destructive" />
              <p>Never enter your private key on a site you don't trust. Keys are stored locally in your browser only.</p>
            </div>
            <div className="space-y-4 pt-2">
              <Textarea
                placeholder="0x1234… or word1 word2 word3 …"
                value={importInput}
                onChange={e => setImportInput(e.target.value)}
                className="font-mono min-h-[100px]"
              />
              <Button onClick={handleImport} className="w-full">Import</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(wallets).length > 0 ? (
        <Card className="border-border">
          <CardHeader className="bg-secondary/50 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Active Wallet</CardTitle>
              <Select value={currentWalletId || ''} onValueChange={setCurrentWalletId}>
                <SelectTrigger className="w-[280px] bg-background">
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(wallets).map(w => (
                    <SelectItem key={w.address} value={w.address}>
                      <span className="font-sans font-medium mr-2">{w.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{w.address.slice(0, 6)}…{w.address.slice(-4)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          {currentWallet && (
            <CardContent className="pt-6 space-y-5">
              {/* EVM address */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">EVM Address</label>
                  <Badge variant="outline" className="text-xs font-mono">🔷 Ethereum / BSC / Polygon…</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-secondary px-3 py-2 rounded text-sm font-mono flex-1 truncate">{currentWallet.address}</code>
                  <Button variant="outline" size="icon" onClick={() => copy(currentWallet.address, 'EVM address')}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tron address */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tron Address</label>
                  <Badge variant="outline" className="text-xs font-mono">⚡ TRX / TRC-20</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-secondary px-3 py-2 rounded text-sm font-mono flex-1 truncate">
                    {currentWallet.tronAddress || '—'}
                  </code>
                  {currentWallet.tronAddress && (
                    <Button variant="outline" size="icon" onClick={() => copy(currentWallet.tronAddress, 'Tron address')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Same key pair — the same private key controls both addresses.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="w-full gap-2"><Eye className="w-4 h-4" /> View Secrets</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Wallet Secrets</DialogTitle>
                      <DialogDescription>Never share these with anyone.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Private Key</label>
                        <div className="flex gap-2">
                          <Input readOnly value={currentWallet.rawPrivateKey} type="password" />
                          <Button variant="outline" size="icon" onClick={() => copy(currentWallet.rawPrivateKey, 'Private key')}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {currentWallet.mnemonic && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Mnemonic Phrase</label>
                          <div className="flex gap-2">
                            <Textarea readOnly value={currentWallet.mnemonic} className="font-mono text-sm min-h-[80px]" />
                            <Button variant="outline" size="icon" onClick={() => copy(currentWallet.mnemonic!, 'Mnemonic')}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full gap-2"><Trash2 className="w-4 h-4" /> Remove Wallet</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Remove Wallet</DialogTitle>
                      <DialogDescription>
                        This removes the wallet from your browser. If you haven't saved your private key elsewhere, you will permanently lose access.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                      <Button variant="destructive" onClick={() => removeWallet(currentWallet.address)}>Yes, Remove</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          )}
        </Card>
      ) : (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Wallet className="w-12 h-12 mb-4 opacity-50" />
            <p>No wallets imported.</p>
            <p className="text-sm mt-1">Import a private key or mnemonic to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
