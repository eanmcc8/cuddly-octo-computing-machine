import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';

import { WalletProvider } from '@/contexts/WalletContext';
import { Layout } from '@/components/Layout';
import WalletsPage from '@/pages/WalletsPage';
import NetworksPage from '@/pages/NetworksPage';
import BalancesPage from '@/pages/BalancesPage';
import SendEthPage from '@/pages/SendEthPage';
import SendTokenPage from '@/pages/SendTokenPage';
import HistoryPage from '@/pages/HistoryPage';
import LogPage from '@/pages/LogPage';
import ApprovalsPage from '@/pages/ApprovalsPage';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/">
          <Redirect to="/wallets" />
        </Route>
        <Route path="/wallets" component={WalletsPage} />
        <Route path="/networks" component={NetworksPage} />
        <Route path="/balances" component={BalancesPage} />
        <Route path="/send-eth" component={SendEthPage} />
        <Route path="/send-token" component={SendTokenPage} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/log" component={LogPage} />
        <Route path="/approvals" component={ApprovalsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WalletProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </WalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;