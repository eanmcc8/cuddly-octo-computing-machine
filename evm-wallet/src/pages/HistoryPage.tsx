import React from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, History as HistoryIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function HistoryPage() {
  const { currentWalletId, transactionHistory } = useWalletContext();

  const history = currentWalletId ? (transactionHistory[currentWalletId] || []) : [];

  const getExplorerUrl = (networkName: string, hash: string) => {
    const name = networkName.toLowerCase();
    if (name.includes('ethereum')) return `https://etherscan.io/tx/${hash}`;
    if (name.includes('polygon')) return `https://polygonscan.com/tx/${hash}`;
    if (name.includes('binance') || name.includes('bsc')) return `https://bscscan.com/tx/${hash}`;
    if (name.includes('arbitrum')) return `https://arbiscan.io/tx/${hash}`;
    if (name.includes('optimism')) return `https://optimistic.etherscan.io/tx/${hash}`;
    return null; // fallback
  };

  if (!currentWalletId) {
    return <div className="text-center p-12 text-muted-foreground">No wallet selected</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Transaction History</h2>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {history.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
            <HistoryIcon className="w-12 h-12 mb-4 opacity-30" />
            <p>No transactions found for this wallet in local history.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border">
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Explorer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((tx) => {
                const url = getExplorerUrl(tx.network, tx.hash);
                return (
                  <TableRow key={tx.hash} className="border-border">
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(tx.timestamp), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {tx.type} {tx.token ? `(${tx.token})` : ''}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{tx.network}</TableCell>
                    <TableCell className="font-mono text-xs" title={tx.to}>
                      {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {tx.amount}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={`
                          ${tx.status === 'Success' ? 'bg-success/20 text-success hover:bg-success/30' : ''}
                          ${tx.status === 'Pending' ? 'bg-warning/20 text-warning hover:bg-warning/30' : ''}
                          ${tx.status === 'Failed' ? 'bg-destructive/20 text-destructive hover:bg-destructive/30' : ''}
                        `}
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {url ? (
                        <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground font-mono text-xs truncate max-w-[80px] block" title={tx.hash}>
                          {tx.hash.slice(0, 6)}...
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}