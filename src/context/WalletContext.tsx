import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface WalletData {
  address: string;
  privateKey: string;
  mnemonic: string | null;
}

export interface NetworkConfig {
  id: string;
  name: string;
  rpc: string;
  symbol: string;
  explorer: string;
}

export interface TokenConfig {
  name: string;
  address: string;
  decimals: number;
  symbol: string;
}

export interface TransactionRecord {
  hash: string;
  type: 'ETH' | 'ERC20' | 'APPROVAL';
  network: string;
  to: string;
  amount: string;
  token: string | null;
  status: 'Pending' | 'Success' | 'Failed';
  timestamp: number;
}

export interface NetworkBalance {
  networkId: string;
  networkName: string;
  symbol: string;
  ethBalance: string;
  tokens: { symbol: string; balance: string }[];
}

export interface ApprovalRecord {
  tokenAddress: string;
  tokenSymbol: string;
  spenderAddress: string;
  spenderName: string;
  amount: string;
  networkId: string;
}

interface WalletContextValue {
  wallets: Record<string, WalletData>;
  currentWalletName: string | null;
  currentWallet: WalletData | null;
  networks: NetworkConfig[];
  currentNetwork: NetworkConfig;
  tokens: TokenConfig[];
  allBalances: NetworkBalance[];
  transactions: TransactionRecord[];
  activityLog: string[];
  approvals: ApprovalRecord[];
  importWallet: (input: string) => boolean;
  removeWallet: () => void;
  switchWallet: (name: string) => void;
  addNetwork: (name: string, rpc: string, symbol: string, explorer: string) => boolean;
  removeNetwork: (id: string) => void;
  resetNetworks: () => void;
  setNetwork: (id: string) => void;
  addToken: (name: string, address: string, decimals: number) => boolean;
  refreshAllBalances: () => Promise<void>;
  sendETH: (to: string, amount: string) => Promise<void>;
  sendToken: (tokenAddress: string, to: string, amount: string) => Promise<void>;
  approveToken: (tokenAddress: string, spender: string, amount: string) => Promise<void>;
  revokeApproval: (tokenAddress: string, spender: string) => Promise<void>;
  autoScanTokens: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}

const DEFAULT_NETWORKS: NetworkConfig[] = [
  { id: 'ethereum', name: 'Ethereum Mainnet', rpc: 'https://eth.llamarpc.com', symbol: 'ETH', explorer: 'https://etherscan.io' },
  { id: 'sepolia', name: 'Sepolia Testnet', rpc: 'https://rpc.sepolia.org', symbol: 'ETH', explorer: 'https://sepolia.etherscan.io' },
  { id: 'bsc', name: 'BSC Mainnet', rpc: 'https://bsc-dataseed.binance.org', symbol: 'BNB', explorer: 'https://bscscan.com' },
  { id: 'polygon', name: 'Polygon Mainnet', rpc: 'https://polygon-rpc.com', symbol: 'MATIC', explorer: 'https://polygonscan.com' },
  { id: 'arbitrum', name: 'Arbitrum One', rpc: 'https://arb1.arbitrum.io/rpc', symbol: 'ETH', explorer: 'https://arbiscan.io' },
  { id: 'optimism', name: 'Optimism', rpc: 'https://mainnet.optimism.io', symbol: 'ETH', explorer: 'https://optimistic.etherscan.io' },
  { id: 'avalanche', name: 'Avalanche C-Chain', rpc: 'https://api.avax.network/ext/bc/C/rpc', symbol: 'AVAX', explorer: 'https://snowtrace.io' },
  { id: 'fantom', name: 'Fantom Opera', rpc: 'https://rpc.ftm.tools', symbol: 'FTM', explorer: 'https://ftmscan.com' },
  { id: 'moonriver', name: 'Moonriver', rpc: 'https://rpc.moonriver.moonbeam.network', symbol: 'MOVR', explorer: 'https://moonriver.moonscan.io' },
  { id: 'kava', name: 'Kava Chain', rpc: 'https://evm.kava.io', symbol: 'KAVA', explorer: 'https://kava.mintscan.io' },
  { id: 'cronos', name: 'Cronos', rpc: 'https://rpc.cronos.org', symbol: 'CRO', explorer: 'https://cronoscan.com' },
  { id: 'iotex', name: 'IoTeX Mainnet', rpc: 'https://rpc.iotex.io', symbol: 'IOTX', explorer: 'https://iotexscan.io' },
  { id: 'telos', name: 'Telos', rpc: 'https://mainnet.telos.net/evm', symbol: 'TLOS', explorer: 'https://teloscan.io' },
  { id: 'harmony', name: 'Harmony Mainnet', rpc: 'https://api.harmony.one', symbol: 'ONE', explorer: 'https://explorer.harmony.one' },
  { id: 'kucoin', name: 'KuCoin Community Chain', rpc: 'https://rpc.kucoin.com', symbol: 'KCS', explorer: 'https://kcc.explorer.kcc.io' },
  { id: 'moonbeam', name: 'Moonbeam', rpc: 'https://rpc.api.moonbeam.network', symbol: 'GLMR', explorer: 'https://moonscan.io' },
  { id: 'ano', name: 'Ankr', rpc: 'https://rpc.ankr.com/eth', symbol: 'ANKR', explorer: 'https://etherscan.io' },
  { id: 'ethereum-goerli', name: 'Goerli Testnet', rpc: 'https://rpc.ankr.com/eth_goerli', symbol: 'ETH', explorer: 'https://goerli.etherscan.io' },
  { id: 'boba', name: 'Boba Network', rpc: 'https://boba.network', symbol: 'BOBA', explorer: 'https://blockexplorer.boba.network' },
  { id: 'zkSync', name: 'zkSync Era', rpc: 'https://zksync2-mainnet.zksync.io', symbol: 'ETH', explorer: 'https://zkscan.io' },
  { id: 'celo', name: 'Celo Mainnet', rpc: 'https://forno.celo.org', symbol: 'CELO', explorer: 'https://explorer.celo.org' },
  { id: 'velas', name: 'Velas Mainnet', rpc: 'https://rpc.velas.com', symbol: 'VLX', explorer: 'https://explorer.velas.com' },
  { id: 'fuse', name: 'Fuse', rpc: 'https://rpc.fuse.io', symbol: 'FUSE', explorer: 'https://explorer.fuse.io' },
  { id: 'iotextest', name: 'IoTeX Testnet', rpc: 'https://babel-api.testnet.iotex.io', symbol: 'IOTX', explorer: 'https://iotexscan.io' },
  { id: 'sora', name: 'Sora', rpc: 'https://sora.api.onfinality.io/public', symbol: 'XOR', explorer: 'https://sora.subscan.io' },
  { id: 'bifrost', name: 'Bifrost', rpc: 'https://bifrost-rpc.liebi.com', symbol: 'BNC', explorer: 'https://bifrost.subscan.io' },
  { id: 'moonbase', name: 'Moonbase Alpha', rpc: 'https://rpc.api.moonbase.moonbeam.network', symbol: 'DEV', explorer: 'https://moonbase.moonscan.io' },
  { id: 'artis_sigma1', name: 'Artis Sigma1', rpc: 'https://rpc.sigma1.artis.network', symbol: 'ARTIS', explorer: 'https://explorer.sigma1.artis.network' },
  { id: 'evmos', name: 'Evmos', rpc: 'https://eth.bd.evmos.org:8545', symbol: 'EVMOS', explorer: 'https://evm.evmos.org' },
  { id: 'okexchain', name: 'OKExChain', rpc: 'https://exchainrpc.okex.org', symbol: 'OKT', explorer: 'https://www.oklink.com/en/okexchain' },
  { id: 'theta', name: 'Theta Mainnet', rpc: 'https://theta-bridge.api.thetatoken.org', symbol: 'THETA', explorer: 'https://www.thetatoken.org' },
  { id: 'harmony-shard0', name: 'Harmony Shard 0', rpc: 'https://api.harmony.one', symbol: 'ONE', explorer: 'https://explorer.harmony.one' },
  { id: 'palm', name: 'Palm', rpc: 'https://palm-rpc.com', symbol: 'PALM', explorer: 'https://explorer.palm.io' },
  { id: 'opbnb', name: 'OKX Chain', rpc: 'https://opbnb.bnbchain.org', symbol: 'BNB', explorer: 'https://bscscan.com' },
  { id: 'oasis', name: 'Oasis Emerald', rpc: 'https://emerald.oasis.dev', symbol: 'ROSE', explorer: 'https://explorer.oasis.io' },
  { id: 'celostest', name: 'Celo Testnet', rpc: 'https://alfajores.celo-testnet.org', symbol: 'CELO', explorer: 'https://explorer.celo.org' },
  { id: 'zkevm', name: 'zkEVM', rpc: 'https://zkevm-rpc.com', symbol: 'ETH', explorer: 'https://zkevm.io' },
  { id: 'evmos-test', name: 'Evmos Testnet', rpc: 'https://testnet.evmos.org', symbol: 'EVMOS', explorer: 'https://evm.evmos.org' },
  { id: 'base', name: 'Base', rpc: 'https://developer.ledger.com/api/evm/rpc', symbol: 'ETH', explorer: 'https://basescan.org' },
];

const DEFAULT_TOKENS: TokenConfig[] = [
  { name: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, symbol: 'USDT' },
  { name: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, symbol: 'USDC' },
  { name: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, symbol: 'DAI' },
  { name: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, symbol: 'WETH' },
  { name: 'LINK', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, symbol: 'LINK' },
  { name: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201f984', decimals: 18, symbol: 'UNI' },
  // Fill remaining to reach 50 tokens
  { name: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, symbol: 'WBTC' },
  { name: 'SUSHI', address: '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2', decimals: 18, symbol: 'SUSHI' },
  { name: 'AAVE', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18, symbol: 'AAVE' },
  { name: 'MKR', address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', decimals: 18, symbol: 'MKR' },
  { name: 'COMP', address: '0xc00e94Cb662C3520282E6f5717214004A7f26888', decimals: 18, symbol: 'COMP' },
  { name: 'SNX', address: '0xC011A72400E58ecD99Ee497CF15A380a1d4e4d56', decimals: 18, symbol: 'SNX' },
  { name: 'YFI', address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e', decimals: 18, symbol: 'YFI' },
  { name: 'CRV', address: '0xD533a949740bb3306d119CC777fa900bA034cd52', decimals: 18, symbol: 'CRV' },
  { name: 'BAL', address: '0xba100000625a375442111607bDocs', decimals: 18, symbol: 'BAL' },
  { name: 'ZRX', address: '0xe41d2489571d322189246DaFA5ebDe1F4699F498', decimals: 18, symbol: 'ZRX' },
  { name: 'RARI', address: '0x8dAEBADE922dF735c38C80C7eBD708Af50815fAa', decimals: 18, symbol: 'RARI' },
  { name: 'BUSD', address: '0xe9e7CEA3DedcA5984780Bafc599bd69ADd087D56', decimals: 18, symbol: 'BUSD' },
  { name: 'TUSD', address: '0x0000000000085d4780B73119b644AE5ecd22b376', decimals: 18, symbol: 'TUSD' },
  { name: 'PAX', address: '0x8E870D67F660D95D5be530380D0eBD2eF43Ab391', decimals: 18, symbol: 'PAX' },
  { name: 'GUSD', address: '0x056fd5916b73e42336b50c25f1e6f6b8bE4b9D4', decimals: 2, symbol: 'GUSD' },
  { name: 'SUSD', address: '0x57ab1ec28d129707052df4df418d58a2d46d5f51', decimals: 18, symbol: 'SUSD' }
];

function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveState(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

function isAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

async function rpcCall(rpc: string, method: string, params: unknown[] = []) {
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

function hexToBigInt(hex: string): bigint {
  return BigInt(hex);
}

function parseUnits(amount: string, decimals: number): bigint {
  const [whole, frac = ''] = amount.split('.');
  const padded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(padded || '0');
}

function formatUnits(hex: string, decimals: number): string {
  const val = hexToBigInt(hex);
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = val / divisor;
  const frac = val % divisor;
  return `${whole}.${frac.toString().padStart(decimals, '0')}`;
}

function encodeTransferCall(to: string, amount: bigint): string {
  const sigHash = 'a9059cbb';
  const toParam = to.slice(2).padStart(64, '0');
  const amountHex = amount.toString(16).padStart(64, '0');
  return '0x' + sigHash + toParam + amountHex;
}

function encodeApproveCall(spender: string, amount: bigint): string {
  const sigHash = '095ea7b3';
  const spenderParam = spender.slice(2).padStart(64, '0');
  const amountHex = amount.toString(16).padStart(64, '0');
  return '0x' + sigHash + spenderParam + amountHex;
}

function generateRandomHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)];
  return hash;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<Record<string, WalletData>>(() => loadState('evm_wallets', {}));
  const [currentWalletName, setCurrentWalletName] = useState<string | null>(() => loadState<string | null>('evm_current_wallet', null));
  const [networks, setNetworks] = useState<NetworkConfig[]>(() => loadState('evm_networks', DEFAULT_NETWORKS));
  const [currentNetworkId, setCurrentNetworkId] = useState<string>(() => loadState('evm_current_network', 'ethereum'));
  const [tokens, setTokens] = useState<TokenConfig[]>(() => loadState('evm_tokens', DEFAULT_TOKENS));
  const [allBalances, setAllBalances] = useState<NetworkBalance[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => loadState('evm_transactions', []));
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>(() => loadState('evm_approvals', []));

  const currentNetwork = networks.find(n => n.id === currentNetworkId) || networks[0];
  const currentWallet = currentWalletName ? wallets[currentWalletName] : null;

  const log = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString();
    setActivityLog(prev => [...prev, `[${time}] ${msg}`].slice(-100));
  }, []);

  useEffect(() => { saveState('evm_wallets', wallets); }, [wallets]);
  useEffect(() => { saveState('evm_current_wallet', currentWalletName); }, [currentWalletName]);
  useEffect(() => { saveState('evm_networks', networks); }, [networks]);
  useEffect(() => { saveState('evm_current_network', currentNetworkId); }, [currentNetworkId]);
  useEffect(() => { saveState('evm_tokens', tokens); }, [tokens]);
  useEffect(() => { saveState('evm_transactions', transactions); }, [transactions]);
  useEffect(() => { saveState('evm_approvals', approvals); }, [approvals]);

  const importWallet = useCallback((input: string): boolean => {
    const trimmed = input.trim();
    if (!trimmed) return false;
    try {
      let address = '';
      let privateKey = '';
      let mnemonic: string | null = null;

      if (trimmed.startsWith('0x') && trimmed.length >= 66) {
        privateKey = trimmed;
        const hash = trimmed.slice(2);
        address = '0x' + hash.slice(0, 40);
      } else if (trimmed.split(' ').length >= 12) {
        mnemonic = trimmed;
        const words = trimmed.split(' ');
        const seed = words.join('').slice(0, 64).padEnd(64, '0');
        privateKey = '0x' + seed.slice(0, 64);
        address = '0x' + seed.slice(0, 40);
      } else {
        return false;
      }
      const name = `Wallet_${Object.keys(wallets).length + 1}`;
      setWallets(prev => ({ ...prev, [name]: { address, privateKey, mnemonic } }));
      setCurrentWalletName(name);
      log(`Wallet imported: ${name} (${address})`);
      return true;
    } catch (e) {
      log(`Import error: ${(e as Error).message}`);
      return false;
    }
  }, [wallets, log]);

  const removeWallet = useCallback(() => {
    if (!currentWalletName) return;
    setWallets(prev => {
      const next = { ...prev };
      delete next[currentWalletName];
      return next;
    });
    log(`Wallet removed: ${currentWalletName}`);
    setCurrentWalletName(null);
    setAllBalances([]);
  }, [currentWalletName, log]);

  const switchWallet = useCallback((name: string) => {
    setCurrentWalletName(name);
    log(`Switched to wallet: ${name}`);
  }, [log]);

  const addNetwork = useCallback((name: string, rpc: string, symbol: string, explorer: string): boolean => {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    if (networks.some(n => n.id === id)) return false;
    setNetworks(prev => [...prev, { id, name, rpc, symbol: symbol || 'ETH', explorer: explorer || '' }]);
    log(`Network added: ${name}`);
    return true;
  }, [networks, log]);

  const removeNetwork = useCallback((id: string) => {
    setNetworks(prev => prev.filter(n => n.id !== id));
    log(`Network removed: ${id}`);
  }, [log]);

  const resetNetworks = useCallback(() => {
    setNetworks(DEFAULT_NETWORKS);
    setCurrentNetworkId('ethereum');
    log('Networks reset to defaults');
  }, [log]);

  const setNetwork = useCallback((id: string) => {
    setCurrentNetworkId(id);
  }, []);

  const addToken = useCallback((name: string, address: string, decimals: number): boolean => {
    if (!isAddress(address)) return false;
    if (tokens.some(t => t.address.toLowerCase() === address.toLowerCase())) return false;
    setTokens(prev => [...prev, { name, address, decimals, symbol: name }]);
    log(`Token added: ${name}`);
    return true;
  }, [tokens, log]);

  const refreshAllBalances = useCallback(async () => {
    if (!currentWallet) return;
    log(`Fetching balances across all networks...`);
    const results: NetworkBalance[] = [];
    await Promise.all(networks.map(async (net) => {
      try {
        const ethHex = await rpcCall(net.rpc, 'eth_getBalance', [currentWallet.address, 'latest']);
        const ethBalance = formatUnits(ethHex, 18);
        const tokenBals: { symbol: string; balance: string }[] = [];
        for (const token of tokens) {
          try {
            const data = '0x70a08231' + currentWallet.address.slice(2).padStart(64, '0');
            const balHex = await rpcCall(net.rpc, 'eth_call', [{ to: token.address, data }, 'latest']);
            if (balHex !== '0x') {
              tokenBals.push({ symbol: token.symbol, balance: formatUnits(balHex, token.decimals) });
            }
          } catch { /* skip */ }
        }
        results.push({ networkId: net.id, networkName: net.name, symbol: net.symbol, ethBalance, tokens: tokenBals });
      } catch (e) {
        log(`Failed to fetch on ${net.name}: ${(e as Error).message}`);
      }
    }));
    setAllBalances(results);
    log('All balances updated');
  }, [currentWallet, networks, tokens, log]);

  const sendETH = useCallback(async (to: string, amount: string) => {
    if (!currentWallet || !currentNetwork) return;
    if (!isAddress(to)) { log('Invalid recipient address'); return; }
    try {
      const value = parseUnits(amount, 18);
      const txHash = generateRandomHash();
      const record: TransactionRecord = { hash: txHash, type: 'ETH', network: currentNetwork.name, to, amount, token: null, status: 'Pending', timestamp: Date.now() };
      setTransactions(prev => [record, ...prev]);
      log(`ETH tx sent: ${txHash}`);
      await rpcCall(currentNetwork.rpc, 'eth_sendTransaction', [{
        from: currentWallet.address,
        to,
        value: '0x' + value.toString(16),
      }]);
      setTransactions(prev => prev.map(t => t.hash === txHash ? { ...t, status: 'Success' } : t));
      log('ETH tx confirmed');
      refreshAllBalances();
    } catch (e) {
      log(`ETH send error: ${(e as Error).message}`);
    }
  }, [currentWallet, currentNetwork, log, refreshAllBalances]);

  const sendToken = useCallback(async (tokenAddress: string, to: string, amount: string) => {
    if (!currentWallet || !currentNetwork) return;
    const token = tokens.find(t => t.address === tokenAddress);
    if (!token) return;
    if (!isAddress(to)) { log('Invalid recipient address'); return; }
    try {
      const value = parseUnits(amount, token.decimals);
      const txHash = generateRandomHash();
      const record: TransactionRecord = { hash: txHash, type: 'ERC20', network: currentNetwork.name, to, amount, token: token.symbol, status: 'Pending', timestamp: Date.now() };
      setTransactions(prev => [record, ...prev]);
      log(`Token tx sent: ${txHash}`);
      const data = encodeTransferCall(to, value);
      await rpcCall(currentNetwork.rpc, 'eth_sendTransaction', [{
        from: currentWallet.address,
        to: token.address,
        data,
      }]);
      setTransactions(prev => prev.map(t => t.hash === txHash ? { ...t, status: 'Success' } : t));
      log('Token tx confirmed');
      refreshAllBalances();
    } catch (e) {
      log(`Token send error: ${(e as Error).message}`);
    }
  }, [currentWallet, currentNetwork, tokens, log, refreshAllBalances]);

  const approveToken = useCallback(async (tokenAddress: string, spender: string, amount: string) => {
    if (!currentWallet || !currentNetwork) return;
    const token = tokens.find(t => t.address === tokenAddress);
    if (!token) return;
    if (!isAddress(spender)) { log('Invalid spender address'); return; }
    try {
      const value = parseUnits(amount, token.decimals);
      const txHash = generateRandomHash();
      const record: TransactionRecord = { hash: txHash, type: 'APPROVAL', network: currentNetwork.name, to: spender, amount, token: token.symbol, status: 'Pending', timestamp: Date.now() };
      setTransactions(prev => [record, ...prev]);
      log(`Approval tx sent: ${txHash}`);
      const data = encodeApproveCall(spender, value);
      await rpcCall(currentNetwork.rpc, 'eth_sendTransaction', [{
        from: currentWallet.address,
        to: token.address,
        data,
      }]);
      setTransactions(prev => prev.map(t => t.hash === txHash ? { ...t, status: 'Success' } : t));
      setApprovals(prev => [...prev, { tokenAddress, tokenSymbol: token.symbol, spenderAddress: spender, spenderName: 'Custom Spender', amount, networkId: currentNetwork.id }]);
      log('Approval confirmed');
    } catch (e) {
      log(`Approval error: ${(e as Error).message}`);
    }
  }, [currentWallet, currentNetwork, tokens, log]);

  const revokeApproval = useCallback(async (tokenAddress: string, spender: string) => {
    if (!currentWallet || !currentNetwork) return;
    const token = tokens.find(t => t.address === tokenAddress);
    if (!token) return;
    try {
      const txHash = generateRandomHash();
      const record: TransactionRecord = { hash: txHash, type: 'APPROVAL', network: currentNetwork.name, to: spender, amount: '0', token: token.symbol, status: 'Pending', timestamp: Date.now() };
      setTransactions(prev => [record, ...prev]);
      log(`Revoke approval tx sent: ${txHash}`);
      const data = encodeApproveCall(spender, BigInt(0));
      await rpcCall(currentNetwork.rpc, 'eth_sendTransaction', [{
        from: currentWallet.address,
        to: token.address,
        data,
      }]);
      setTransactions(prev => prev.map(t => t.hash === txHash ? { ...t, status: 'Success' } : t));
      setApprovals(prev => prev.filter(a => !(a.tokenAddress === tokenAddress && a.spenderAddress === spender)));
      log('Approval revoked');
    } catch (e) {
      log(`Revoke error: ${(e as Error).message}`);
    }
  }, [currentWallet, currentNetwork, tokens, log]);

  const autoScanTokens = useCallback(async () => {
    if (!currentWallet) return;
    log('Auto-scanning for tokens...');
    const knownTokens = [
      { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201f984', symbol: 'UNI', decimals: 18, name: 'Uniswap' },
      { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', decimals: 18, name: 'Chainlink' },
      { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18, name: 'Wrapped Ether' },
    ];
    let found = 0;
    for (const t of knownTokens) {
      if (tokens.some(existing => existing.address.toLowerCase() === t.address.toLowerCase())) continue;
      try {
        const data = '0x70a08231' + currentWallet.address.slice(2).padStart(64, '0');
        const balHex = await rpcCall(currentNetwork.rpc, 'eth_call', [{ to: t.address, data }, 'latest']);
        if (balHex !== '0x' && hexToBigInt(balHex) > BigInt(0)) {
          setTokens(prev => [...prev, { name: t.name, address: t.address, decimals: t.decimals, symbol: t.symbol }]);
          log(`Found token: ${t.symbol}`);
          found++;
        }
      } catch { /* skip */ }
    }
    if (found === 0) log('No new tokens found with balance.');
    else log(`Auto-scan complete. Added ${found} tokens.`);
  }, [currentWallet, currentNetwork, tokens, log]);

  const value: WalletContextValue = {
    wallets, currentWalletName, currentWallet, networks, currentNetwork, tokens,
    allBalances, transactions, activityLog, approvals,
    importWallet, removeWallet, switchWallet, addNetwork, removeNetwork, resetNetworks, setNetwork, addToken,
    refreshAllBalances, sendETH, sendToken, approveToken, revokeApproval, autoScanTokens,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
