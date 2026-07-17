import { WalletProvider } from '@/context/WalletContext';
import { Header } from '@/components/Header';
import { WalletPanel } from '@/components/WalletPanel';
import { SendPanel } from '@/components/SendPanel';
import { HistoryPanel } from '@/components/HistoryPanel';

export default function App() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <Header />
          <main className="mt-8 space-y-6">
            <WalletPanel />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SendPanel />
              <HistoryPanel />
            </div>
          </main>
          <footer className="mt-12 text-center text-xs text-slate-600">
            <p>Multi-Wallet EVM Manager · Local-only · No backend</p>
          </footer>
        </div>
      </div>
    </WalletProvider>
  );
}