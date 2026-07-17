import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ethers } from 'ethers';
import { DEFAULT_NETWORKS, DEFAULT_TOKENS } from '../data/defaults';
import type { NetworkDef, TokenDef, ChainType } from '../data/defaults';
import { evmToTronAddress } from '../lib/tron';

// ─── Re-exported types (used across all pages) ───────────────────────────────

export type { ChainType };

export type Network = NetworkDef & {
  // Resolved (never undefined at runtime)
  chainType: ChainType;
  nativeSymbol: string;
};

export type Token = TokenDef & {
  chainType: ChainType;
};

export type Wallet = {
  name: string;
  address: string;      // EVM  0x…
  tronAddress: string;  // Tron T…
  rawPrivateKey: string;
  mnemonic: string | null;
};

export type Transaction = {
  hash: string;
  type: 'native' | 'token';
  network: string;
  to: string;
  amount: string;
  token: string | null;
  status: 'Pending' | 'Success' | 'Failed';
  timestamp: number;
};

// ─── Context shape ────────────────────────────────────────────────────────────

type WalletContextType = {
  wallets: Record<string, Wallet>;
  currentWalletId: string | null;
  networkConfigs: Network[];
  tokens: Token[];
  transactionHistory: Record<string, Transaction[]>;
  activityLog: string[];
  providers: Record<string, ethers.JsonRpcProvider>; // EVM only

  addWallet: (input: string) => void;
  removeWallet: (address: string) => void;
  setCurrentWalletId: (address: string) => void;

  addNetwork: (network: Partial<Network> & Pick<Network, 'name' | 'rpc' | 'id'>) => void;
  removeNetwork: (id: string) => void;
  resetNetworks: () => void;

  addToken: (token: Partial<Token> & Pick<Token, 'name' | 'address' | 'decimals'>) => void;
  removeToken: (address: string) => void;

  addTransaction: (address: string, tx: Transaction) => void;
  updateTransactionStatus: (address: string, hash: string, status: Transaction['status']) => void;

  logEvent: (message: string) => void;
  clearLog: () => void;

  getNetwork: (id: string) => Network | undefined;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWalletContext = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be used within WalletProvider');
  return ctx;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveNetwork(n: NetworkDef): Network {
  return {
    ...n,
    chainType: n.chainType ?? 'evm',
    nativeSymbol: n.nativeSymbol ?? 'ETH',
  };
}

function resolveToken(t: TokenDef): Token {
  return { ...t, chainType: t.chainType ?? 'evm' };
}

function migrateWallets(raw: Record<string, any>): Record<string, Wallet> {
  const out: Record<string, Wallet> = {};
  for (const [addr, w] of Object.entries(raw)) {
    out[addr] = {
      name: w.name,
      address: w.address,
      tronAddress: w.tronAddress ?? evmToTronAddress(w.address),
      rawPrivateKey: w.rawPrivateKey,
      mnemonic: w.mnemonic ?? null,
    };
  }
  return out;
}

function migrateNetworks(raw: any[]): Network[] {
  // If saved networks are in old format (no chainType), reset to defaults
  if (raw.length > 0 && raw[0].chainType === undefined) return DEFAULT_NETWORKS.map(resolveNetwork);
  return raw.map(resolveNetwork);
}

function migrateTokens(raw: any[]): Token[] {
  if (raw.length > 0 && raw[0].chainType === undefined) return DEFAULT_TOKENS.map(resolveToken);
  return raw.map(resolveToken);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallets, setWallets] = useState<Record<string, Wallet>>(() => {
    const saved = localStorage.getItem('evm-manager-wallets');
    return saved ? migrateWallets(JSON.parse(saved)) : {};
  });

  const [currentWalletId, setCurrentWalletId] = useState<string | null>(() => {
    return localStorage.getItem('evm-manager-current-wallet') ?? null;
  });

  const [networkConfigs, setNetworkConfigs] = useState<Network[]>(() => {
    const saved = localStorage.getItem('evm-manager-networks');
    return saved ? migrateNetworks(JSON.parse(saved)) : DEFAULT_NETWORKS.map(resolveNetwork);
  });

  const [tokens, setTokens] = useState<Token[]>(() => {
    const saved = localStorage.getItem('evm-manager-tokens');
    return saved ? migrateTokens(JSON.parse(saved)) : DEFAULT_TOKENS.map(resolveToken);
  });

  const [transactionHistory, setTransactionHistory] = useState<Record<string, Transaction[]>>(() => {
    const saved = localStorage.getItem('evm-manager-history');
    return saved ? JSON.parse(saved) : {};
  });

  const [activityLog, setActivityLog] = useState<string[]>(() => {
    const saved = localStorage.getItem('evm-manager-log');
    return saved ? JSON.parse(saved) : [];
  });

  // EVM providers only (Tron uses HTTP API or tronweb directly in pages)
  const providers = useMemo(() => {
    const p: Record<string, ethers.JsonRpcProvider> = {};
    networkConfigs.forEach(net => {
      if ((net.chainType ?? 'evm') === 'evm') {
        try { p[net.id] = new ethers.JsonRpcProvider(net.rpc); } catch {}
      }
    });
    return p;
  }, [networkConfigs]);

  // Persistence
  useEffect(() => localStorage.setItem('evm-manager-wallets', JSON.stringify(wallets)), [wallets]);
  useEffect(() => localStorage.setItem('evm-manager-networks', JSON.stringify(networkConfigs)), [networkConfigs]);
  useEffect(() => localStorage.setItem('evm-manager-tokens', JSON.stringify(tokens)), [tokens]);
  useEffect(() => localStorage.setItem('evm-manager-history', JSON.stringify(transactionHistory)), [transactionHistory]);
  useEffect(() => localStorage.setItem('evm-manager-log', JSON.stringify(activityLog)), [activityLog]);
  useEffect(() => {
    if (currentWalletId) localStorage.setItem('evm-manager-current-wallet', currentWalletId);
    else localStorage.removeItem('evm-manager-current-wallet');
  }, [currentWalletId]);

  const logEvent = (msg: string) => {
    setActivityLog(prev => [...prev, `[${new Date().toISOString()}] ${msg}`]);
  };

  const clearLog = () => setActivityLog([]);

  const addWallet = (input: string) => {
    try {
      const clean = input.trim();
      let walletObj: ethers.Wallet | ethers.HDNodeWallet;
      let isMnemonic = false;

      if (clean.split(' ').length > 1) {
        walletObj = ethers.Wallet.fromPhrase(clean);
        isMnemonic = true;
      } else {
        walletObj = new ethers.Wallet(clean);
      }

      const address = walletObj.address;
      if (wallets[address]) throw new Error('Wallet already exists');

      const tronAddress = evmToTronAddress(address);
      const nextId = Object.keys(wallets).length + 1;

      const newWallet: Wallet = {
        name: `Wallet_${nextId}`,
        address,
        tronAddress,
        rawPrivateKey: walletObj.privateKey,
        mnemonic: isMnemonic ? clean : null,
      };

      setWallets(prev => ({ ...prev, [address]: newWallet }));
      if (!currentWalletId) setCurrentWalletId(address);
      logEvent(`Imported wallet ${newWallet.name} — EVM: ${address} | Tron: ${tronAddress}`);
    } catch (err: any) {
      throw new Error('Failed to import wallet: ' + err.message);
    }
  };

  const removeWallet = (address: string) => {
    setWallets(prev => { const n = { ...prev }; delete n[address]; return n; });
    if (currentWalletId === address) {
      const remaining = Object.keys(wallets).filter(k => k !== address);
      setCurrentWalletId(remaining[0] ?? null);
    }
    logEvent(`Removed wallet ${address}`);
  };

  const addNetwork = (network: Partial<Network> & Pick<Network, 'name' | 'rpc' | 'id'>) => {
    if (networkConfigs.some(n => n.id === network.id || n.name === network.name)) {
      throw new Error('Network with the same name or ID already exists');
    }
    const full = resolveNetwork(network);
    setNetworkConfigs(prev => [...prev, full]);
    logEvent(`Added network ${full.name} (${full.chainType})`);
  };

  const removeNetwork = (id: string) => {
    setNetworkConfigs(prev => prev.filter(n => n.id !== id));
    logEvent(`Removed network ${id}`);
  };

  const resetNetworks = () => {
    setNetworkConfigs(DEFAULT_NETWORKS.map(resolveNetwork));
    logEvent('Reset networks to defaults');
  };

  const addToken = (token: Partial<Token> & Pick<Token, 'name' | 'address' | 'decimals'>) => {
    if (tokens.some(t => t.address.toLowerCase() === token.address.toLowerCase())) {
      throw new Error('Token already exists');
    }
    const full = resolveToken(token);
    setTokens(prev => [...prev, full]);
    logEvent(`Added token ${full.name} (${full.address}) [${full.chainType}]`);
  };

  const removeToken = (address: string) => {
    setTokens(prev => prev.filter(t => t.address.toLowerCase() !== address.toLowerCase()));
    logEvent(`Removed token ${address}`);
  };

  const addTransaction = (address: string, tx: Transaction) => {
    setTransactionHistory(prev => ({
      ...prev,
      [address]: [tx, ...(prev[address] ?? [])],
    }));
    logEvent(`Tx ${tx.status}: ${tx.type} → ${tx.to} (${tx.hash})`);
  };

  const updateTransactionStatus = (address: string, hash: string, status: Transaction['status']) => {
    setTransactionHistory(prev => {
      const hist = (prev[address] ?? []).map(tx => tx.hash === hash ? { ...tx, status } : tx);
      return { ...prev, [address]: hist };
    });
  };

  const getNetwork = (id: string) => networkConfigs.find(n => n.id === id);

  return (
    <WalletContext.Provider value={{
      wallets, currentWalletId, networkConfigs, tokens,
      transactionHistory, activityLog, providers,
      addWallet, removeWallet, setCurrentWalletId,
      addNetwork, removeNetwork, resetNetworks,
      addToken, removeToken,
      addTransaction, updateTransactionStatus,
      logEvent, clearLog, getNetwork,
    }}>
      {children}
    </WalletContext.Provider>
  );
};
