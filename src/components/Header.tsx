import { useWallet } from '@/context/WalletContext';
import { Wallet, Network, Activity } from 'lucide-react';

export function Header() {
  const { currentWallet, currentNetwork, networks, setNetwork } = useWallet();

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">EVM Wallet Manager</h1>
          <p className="text-xs text-slate-500">Multi-chain · Local storage · No backend</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800">
          <Network className="w-4 h-4 text-emerald-400" />
          <select
            value={currentNetwork.id}
            onChange={(e) => setNetwork(e.target.value)}
            className="bg-transparent text-sm text-slate-200 outline-none cursor-pointer"
          >
            {networks.map(n => (
              <option key={n.id} value={n.id} className="bg-slate-900">{n.name}</option>
            ))}
          </select>
        </div>
        {currentWallet && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800">
            <Activity className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-slate-300 font-mono">{currentWallet.address.slice(0, 6)}...{currentWallet.address.slice(-4)}</span>
          </div>
        )}
      </div>
    </header>
  );
}