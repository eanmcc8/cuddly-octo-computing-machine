import { useWallet } from '@/context/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, ExternalLink, Terminal } from 'lucide-react';

export function HistoryPanel() {
  const { transactions, activityLog, currentNetwork } = useWallet();

  const getExplorerUrl = (hash: string) => {
    if (currentNetwork.explorer) return `${currentNetwork.explorer}/tx/${hash}`;
    return '#';
  };

  return (
    <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-slate-200 flex items-center gap-2 text-base">
          <History className="w-4 h-4 text-emerald-400" /> Activity & History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Transactions</span>
          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No transactions yet.</p>
            ) : (
              transactions.map(tx => (
                <div key={tx.hash + tx.timestamp} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-200">{tx.type === 'ETH' ? 'ETH Transfer' : `${tx.token} Transfer`}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.status === 'Success' ? 'bg-emerald-500/15 text-emerald-400' :
                      tx.status === 'Pending' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-red-500/15 text-red-400'
                    }`}>{tx.status}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono truncate">To: {tx.to}</div>
                  <div className="text-xs text-slate-400">Amount: {tx.amount} {tx.token || 'ETH'}</div>
                  <div className="text-xs text-slate-500">Network: {tx.network}</div>
                  <a href={getExplorerUrl(tx.hash)} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-1">
                    View on explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Terminal className="w-3 h-3" /> Activity Log
          </span>
          <div className="mt-2 p-3 rounded-lg bg-slate-950/50 border border-slate-800 max-h-40 overflow-y-auto font-mono text-xs space-y-1">
            {activityLog.length === 0 ? (
              <p className="text-slate-600">No activity logged.</p>
            ) : (
              activityLog.map((entry, i) => (
                <div key={i} className="text-slate-400">{entry}</div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}