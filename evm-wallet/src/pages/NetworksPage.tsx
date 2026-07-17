import React, { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Network, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';

export default function NetworksPage() {
  const { networkConfigs, addNetwork, removeNetwork, resetNetworks } = useWalletContext();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [rpc, setRpc] = useState('');
  const [id, setId] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!name || !rpc || !id) {
      toast({ title: 'Missing fields', variant: 'destructive' });
      return;
    }
    
    setIsTesting(true);
    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      await provider.getNetwork();
      
      addNetwork({ name, rpc, id });
      toast({ title: 'Network added successfully' });
      setIsAddOpen(false);
      setName(''); setRpc(''); setId('');
    } catch (e: any) {
      toast({ title: 'Invalid RPC URL', description: e.message, variant: 'destructive' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Networks</h2>
        <div className="flex gap-3">
          <Button variant="outline" onClick={resetNetworks} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Reset to Defaults
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Add Custom Network</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Network</DialogTitle>
                <DialogDescription>Add an EVM-compatible RPC endpoint.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Network Name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Polygon Mainnet" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">RPC URL</label>
                  <Input value={rpc} onChange={e => setRpc(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Network ID (Slug)</label>
                  <Input value={id} onChange={e => setId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="e.g. polygon-mainnet" />
                </div>
                <Button onClick={handleAdd} className="w-full" disabled={isTesting}>
                  {isTesting ? 'Testing Connection...' : 'Add Network'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow className="border-border">
              <TableHead>Network Name</TableHead>
              <TableHead>RPC URL</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {networkConfigs.map((net) => (
              <TableRow key={net.id} className="border-border">
                <TableCell className="font-medium">{net.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{net.rpc}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removeNetwork(net.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}