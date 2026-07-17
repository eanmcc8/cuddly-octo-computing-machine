export type ChainType = 'evm' | 'tron';

export type NetworkDef = {
  name: string;
  rpc: string;           // JSON-RPC for EVM, TronGrid base URL for Tron
  id: string;
  chainType?: ChainType; // optional – defaults to 'evm'
  nativeSymbol?: string; // optional – defaults to 'ETH'
  chainId?: number;      // EVM only
  explorerUrl?: string;  // base URL for /tx/{hash} links
};

export type TokenDef = {
  name: string;
  address: string;
  decimals: number;
  chainType?: ChainType; // optional – defaults to 'evm'
};

// ─── Networks ────────────────────────────────────────────────────────────────

const evm = (
  name: string, rpc: string, id: string, nativeSymbol: string,
  chainId?: number, explorerUrl?: string,
): NetworkDef => ({ name, rpc, id, chainType: 'evm', nativeSymbol, chainId, explorerUrl });

const tron = (
  name: string, rpc: string, id: string, explorerUrl?: string,
): NetworkDef => ({ name, rpc, id, chainType: 'tron', nativeSymbol: 'TRX', explorerUrl });

export const DEFAULT_NETWORKS: NetworkDef[] = [
  // ── Ethereum ──────────────────────────────────────────────────────────────
  evm('Ethereum Mainnet',       'https://eth.llamarpc.com',                            'ethereum-mainnet',    'ETH',   1,      'https://etherscan.io/tx/'),
  evm('Ethereum Sepolia',       'https://rpc.sepolia.org',                             'ethereum-sepolia',    'ETH',   11155111,'https://sepolia.etherscan.io/tx/'),
  evm('Ethereum Holesky',       'https://rpc.holesky.ethpandaops.io',                  'ethereum-holesky',    'ETH',   17000),
  // ── BNB / BSC ─────────────────────────────────────────────────────────────
  evm('BNB Smart Chain',        'https://bsc-dataseed.binance.org',                    'bsc-mainnet',         'BNB',   56,     'https://bscscan.com/tx/'),
  evm('BNB Smart Chain Testnet','https://data-seed-prebsc-1-s1.binance.org:8545',      'bsc-testnet',         'tBNB',  97,     'https://testnet.bscscan.com/tx/'),
  evm('opBNB Mainnet',          'https://opbnb-mainnet-rpc.bnbchain.org',              'opbnb-mainnet',       'BNB',   204,    'https://opbnbscan.com/tx/'),
  // ── Polygon ───────────────────────────────────────────────────────────────
  evm('Polygon PoS',            'https://polygon-rpc.com',                             'polygon-mainnet',     'POL',   137,    'https://polygonscan.com/tx/'),
  evm('Polygon Amoy Testnet',   'https://rpc-amoy.polygon.technology',                 'polygon-amoy',        'POL',   80002,  'https://amoy.polygonscan.com/tx/'),
  // ── Arbitrum ──────────────────────────────────────────────────────────────
  evm('Arbitrum One',           'https://arb1.arbitrum.io/rpc',                        'arbitrum-one',        'ETH',   42161,  'https://arbiscan.io/tx/'),
  evm('Arbitrum Nova',          'https://nova.arbitrum.io/rpc',                        'arbitrum-nova',       'ETH',   42170,  'https://nova.arbiscan.io/tx/'),
  evm('Arbitrum Sepolia',       'https://sepolia-rollup.arbitrum.io/rpc',              'arbitrum-sepolia',    'ETH',   421614),
  // ── Optimism ──────────────────────────────────────────────────────────────
  evm('Optimism',               'https://mainnet.optimism.io',                         'optimism-mainnet',    'ETH',   10,     'https://optimistic.etherscan.io/tx/'),
  evm('Optimism Sepolia',       'https://sepolia.optimism.io',                         'optimism-sepolia',    'ETH',   11155420),
  // ── Base ──────────────────────────────────────────────────────────────────
  evm('Base',                   'https://mainnet.base.org',                            'base-mainnet',        'ETH',   8453,   'https://basescan.org/tx/'),
  evm('Base Sepolia',           'https://sepolia.base.org',                            'base-sepolia',        'ETH',   84532),
  // ── zkSync Era ────────────────────────────────────────────────────────────
  evm('zkSync Era',             'https://mainnet.era.zksync.io',                       'zksync-era',          'ETH',   324,    'https://explorer.zksync.io/tx/'),
  evm('zkSync Sepolia',         'https://sepolia.era.zksync.dev',                      'zksync-sepolia',      'ETH',   300),
  // ── Linea ─────────────────────────────────────────────────────────────────
  evm('Linea',                  'https://rpc.linea.build',                             'linea-mainnet',       'ETH',   59144,  'https://lineascan.build/tx/'),
  evm('Linea Sepolia',          'https://rpc.sepolia.linea.build',                     'linea-sepolia',       'ETH',   59141),
  // ── Scroll ────────────────────────────────────────────────────────────────
  evm('Scroll',                 'https://rpc.scroll.io',                               'scroll-mainnet',      'ETH',   534352, 'https://scrollscan.com/tx/'),
  evm('Scroll Sepolia',         'https://sepolia-rpc.scroll.io',                       'scroll-sepolia',      'ETH',   534351),
  // ── Blast ─────────────────────────────────────────────────────────────────
  evm('Blast',                  'https://rpc.blast.io',                                'blast-mainnet',       'ETH',   81457,  'https://blastscan.io/tx/'),
  // ── Mantle ────────────────────────────────────────────────────────────────
  evm('Mantle',                 'https://rpc.mantle.xyz',                              'mantle-mainnet',      'MNT',   5000,   'https://mantlescan.xyz/tx/'),
  // ── Avalanche ─────────────────────────────────────────────────────────────
  evm('Avalanche C-Chain',      'https://api.avax.network/ext/bc/C/rpc',               'avalanche-mainnet',   'AVAX',  43114,  'https://snowtrace.io/tx/'),
  evm('Avalanche Fuji',         'https://api.avax-test.network/ext/bc/C/rpc',          'avalanche-fuji',      'AVAX',  43113),
  // ── Fantom ────────────────────────────────────────────────────────────────
  evm('Fantom Opera',           'https://rpc.ftm.tools',                               'fantom-mainnet',      'FTM',   250,    'https://ftmscan.com/tx/'),
  evm('Fantom Testnet',         'https://rpc.testnet.fantom.network',                  'fantom-testnet',      'FTM',   4002),
  // ── Cronos ────────────────────────────────────────────────────────────────
  evm('Cronos',                 'https://evm.cronos.org',                              'cronos-mainnet',      'CRO',   25,     'https://cronoscan.com/tx/'),
  // ── Celo ──────────────────────────────────────────────────────────────────
  evm('Celo',                   'https://forno.celo.org',                              'celo-mainnet',        'CELO',  42220,  'https://celoscan.io/tx/'),
  evm('Celo Alfajores',         'https://alfajores-forno.celo-testnet.org',            'celo-alfajores',      'CELO',  44787),
  // ── Gnosis ────────────────────────────────────────────────────────────────
  evm('Gnosis Chain',           'https://rpc.gnosischain.com',                         'gnosis-mainnet',      'xDAI',  100,    'https://gnosisscan.io/tx/'),
  // ── Moonbeam / Moonriver ──────────────────────────────────────────────────
  evm('Moonbeam',               'https://rpc.api.moonbeam.network',                    'moonbeam',            'GLMR',  1284,   'https://moonbeam.moonscan.io/tx/'),
  evm('Moonriver',              'https://rpc.moonriver.moonbeam.network',              'moonriver',           'MOVR',  1285,   'https://moonriver.moonscan.io/tx/'),
  // ── Metis ─────────────────────────────────────────────────────────────────
  evm('Metis Andromeda',        'https://andromeda.metis.io/?owner=1088',              'metis-mainnet',       'METIS', 1088,   'https://andromeda-explorer.metis.io/tx/'),
  // ── Kava ──────────────────────────────────────────────────────────────────
  evm('Kava',                   'https://evm.kava.io',                                 'kava-mainnet',        'KAVA',  2222,   'https://kavascan.com/tx/'),
  // ── Aurora ────────────────────────────────────────────────────────────────
  evm('Aurora',                 'https://mainnet.aurora.dev',                          'aurora-mainnet',      'ETH',   1313161554, 'https://explorer.aurora.dev/tx/'),
  // ── Harmony ───────────────────────────────────────────────────────────────
  evm('Harmony Shard 0',        'https://api.harmony.one',                             'harmony-mainnet',     'ONE',   1666600000, 'https://explorer.harmony.one/tx/'),
  // ── OKX / OKT ─────────────────────────────────────────────────────────────
  evm('OKXChain',               'https://exchainrpc.okex.org',                         'okxchain-mainnet',    'OKT',   66),
  // ── Klaytn ────────────────────────────────────────────────────────────────
  evm('Klaytn (Kaia)',          'https://public-node-api.klaytnapi.com/v1/cypress',    'klaytn-mainnet',      'KLAY',  8217),
  // ── Fuse ──────────────────────────────────────────────────────────────────
  evm('Fuse',                   'https://rpc.fuse.io',                                 'fuse-mainnet',        'FUSE',  122,    'https://explorer.fuse.io/tx/'),
  // ── Canto ─────────────────────────────────────────────────────────────────
  evm('Canto',                  'https://canto.slingshot.finance',                     'canto-mainnet',       'CANTO', 7700),
  // ── PulseChain ────────────────────────────────────────────────────────────
  evm('PulseChain',             'https://rpc.pulsechain.com',                          'pulsechain-mainnet',  'PLS',   369,    'https://scan.pulsechain.com/tx/'),
  // ── Boba Network ──────────────────────────────────────────────────────────
  evm('Boba Network',           'https://mainnet.boba.network',                        'boba-mainnet',        'ETH',   288),
  // ── Oasis Emerald ─────────────────────────────────────────────────────────
  evm('Oasis Emerald',          'https://emerald.oasis.dev',                           'oasis-emerald',       'ROSE',  42262),
  // ── Conflux eSpace ────────────────────────────────────────────────────────
  evm('Conflux eSpace',         'https://evm.confluxrpc.com',                          'conflux-espace',      'CFX',   1030),
  // ── KCC ───────────────────────────────────────────────────────────────────
  evm('KCC Mainnet',            'https://rpc-mainnet.kcc.network',                     'kcc-mainnet',         'KCS',   321),
  // ── Wanchain ──────────────────────────────────────────────────────────────
  evm('Wanchain',               'https://gwan-ssl.wandevs.org:56891',                  'wanchain-mainnet',    'WAN',   888),

  // ── Tron ──────────────────────────────────────────────────────────────────
  tron('Tron Mainnet',          'https://api.trongrid.io',                             'tron-mainnet',        'https://tronscan.org/#/transaction/'),
  tron('Tron Shasta Testnet',   'https://api.shasta.trongrid.io',                      'tron-shasta',         'https://shasta.tronscan.org/#/transaction/'),
  tron('Tron Nile Testnet',     'https://nile.trongrid.io',                            'tron-nile',           'https://nile.tronscan.org/#/transaction/'),
];

// ─── Default tokens ──────────────────────────────────────────────────────────

export const DEFAULT_TOKENS: TokenDef[] = [
  // ERC-20 (Ethereum mainnet)
  { name: 'USDT',  address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6,  chainType: 'evm' },
  { name: 'USDC',  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6,  chainType: 'evm' },
  { name: 'DAI',   address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, chainType: 'evm' },
  { name: 'WETH',  address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, chainType: 'evm' },
  { name: 'WBTC',  address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8,  chainType: 'evm' },
  { name: 'LINK',  address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, chainType: 'evm' },
  { name: 'UNI',   address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201f984', decimals: 18, chainType: 'evm' },
  { name: 'AAVE',  address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18, chainType: 'evm' },
  { name: 'SHIB',  address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', decimals: 18, chainType: 'evm' },
  { name: 'PEPE',  address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', decimals: 18, chainType: 'evm' },
  { name: 'MKR',   address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', decimals: 18, chainType: 'evm' },
  { name: 'CRV',   address: '0xD533a949740bb3306d119CC777fa900bA034cd52', decimals: 18, chainType: 'evm' },
  { name: 'SNX',   address: '0xC011A72400E58ecD99Ee497CF89E2831DDBE6b44', decimals: 18, chainType: 'evm' },
  // BSC / BNB chain tokens
  { name: 'CAKE',  address: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', decimals: 18, chainType: 'evm' },
  { name: 'WBNB',  address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18, chainType: 'evm' },
  { name: 'BUSD',  address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18, chainType: 'evm' },

  // TRC-20 (Tron)
  { name: 'USDT (TRC-20)', address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',  decimals: 6,  chainType: 'tron' },
  { name: 'USDC (TRC-20)', address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',  decimals: 6,  chainType: 'tron' },
  { name: 'BTT',           address: 'TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4',  decimals: 18, chainType: 'tron' },
  { name: 'WIN',           address: 'TLvDJcvKJDi3QuHgFbJC6SeTj3UacmtQU4',  decimals: 6,  chainType: 'tron' },
  { name: 'SUN',           address: 'TKkeiboTkxXKJpbmVFbv4a8ov5rAfRDMf9',  decimals: 18, chainType: 'tron' },
  { name: 'JST',           address: 'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9',  decimals: 18, chainType: 'tron' },
];
