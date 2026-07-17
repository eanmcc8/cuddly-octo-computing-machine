import React from 'react';
import { Link, useLocation } from 'wouter';
import { Wallet, Network, Activity, ArrowUpRight, ArrowRightLeft, History, BookOpen, Fingerprint, ShieldCheck } from 'lucide-react';
import { useWalletContext } from '@/contexts/WalletContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { currentWalletId, wallets } = useWalletContext();
  
  const currentWallet = currentWalletId ? wallets[currentWalletId] : null;

  const navItems = [
    { href: '/wallets', label: 'Wallets', icon: Wallet },
    { href: '/networks', label: 'Networks', icon: Network },
    { href: '/balances', label: 'Balances', icon: Activity },
    { href: '/send-eth', label: 'Send Native', icon: ArrowUpRight },
    { href: '/send-token', label: 'Send Token', icon: ArrowRightLeft },
    { href: '/approvals', label: 'Approvals', icon: ShieldCheck },
    { href: '/history', label: 'History', icon: History },
    { href: '/log', label: 'Activity Log', icon: BookOpen },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden font-sans dark">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0 relative z-10">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/10 p-2 rounded-md border border-primary/20">
              <Fingerprint className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">EVM Cockpit</h1>
              <span className="text-xs text-muted-foreground font-mono">v1.0.0</span>
            </div>
          </div>
          
          <div className="bg-background border border-border rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Active Wallet</div>
            {currentWallet ? (
              <>
                <div className="font-medium text-sm truncate">{currentWallet.name}</div>
                <div className="text-xs font-mono text-primary/80 mt-1 truncate">
                  {currentWallet.address.slice(0, 6)}...{currentWallet.address.slice(-4)}
                </div>
              </>
            ) : (
              <div className="text-sm italic text-muted-foreground">No wallet selected</div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive 
                  ? 'bg-primary/10 text-primary font-medium border border-primary/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative z-0">
        {/* Subtle grid background for the cockpit feel */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none -z-10" />
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}