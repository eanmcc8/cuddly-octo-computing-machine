/**
 * Tron utilities:
 *  - Address conversion  (EVM 0x  →  Tron T…)
 *  - Address validation
 *  - Balance reading via TronGrid REST API  (no tronweb needed for reads)
 */

import { ethers } from 'ethers';

// ─── Base58 (Tron uses the same alphabet as Bitcoin) ────────────────────────

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(buf: Uint8Array): string {
  let n = BigInt('0x' + Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join(''));
  let result = '';
  while (n > 0n) {
    result = B58[Number(n % 58n)] + result;
    n /= 58n;
  }
  for (let i = 0; i < buf.length && buf[i] === 0; i++) result = '1' + result;
  return result;
}

// ─── Address conversion ──────────────────────────────────────────────────────

/**
 * Convert an EVM 0x… address to the Tron T… equivalent.
 * Both chains use secp256k1; the address bytes are identical —
 * only the prefix (0x41) and encoding (base58check) differ.
 */
export function evmToTronAddress(evmAddress: string): string {
  const hex = evmAddress.startsWith('0x') ? evmAddress.slice(2).toLowerCase() : evmAddress.toLowerCase();
  const withPrefix = '41' + hex;                          // Tron mainnet prefix
  const bytes = ethers.getBytes('0x' + withPrefix);
  const h1 = ethers.sha256(bytes);                        // synchronous in ethers v6
  const h2 = ethers.sha256(ethers.getBytes(h1));
  const checksum = h2.slice(2, 10);                       // first 4 bytes
  return base58Encode(ethers.getBytes('0x' + withPrefix + checksum));
}

/** True if the string looks like a Tron T… address. */
export function isTronAddress(addr: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr);
}

/** Address validation that's aware of chain type. */
export function isValidAddress(addr: string, chainType: 'evm' | 'tron'): boolean {
  if (chainType === 'tron') return isTronAddress(addr);
  return ethers.isAddress(addr);
}

// ─── TronGrid REST helpers ───────────────────────────────────────────────────

/** Fetch TRX balance for a T… address using TronGrid. Returns formatted TRX string. */
export async function getTRXBalance(tronAddress: string, tronGridBase: string): Promise<string> {
  const res = await fetch(`${tronGridBase}/v1/accounts/${tronAddress}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`TronGrid ${res.status}`);
  const json = await res.json();
  if (!json.data || json.data.length === 0) return '0.000000';
  const sun: number = json.data[0].balance ?? 0;
  return (sun / 1_000_000).toFixed(6);
}

type TRC20BalanceMap = Record<string, string>; // contractAddress → formatted balance

/** Fetch all TRC-20 token balances for a given address in one call. */
export async function getTRC20Balances(
  tronAddress: string,
  tokens: { address: string; decimals: number }[],
  tronGridBase: string,
): Promise<TRC20BalanceMap> {
  const res = await fetch(`${tronGridBase}/v1/accounts/${tronAddress}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return {};
  const json = await res.json();
  if (!json.data || json.data.length === 0) return {};

  const trc20List: Record<string, string>[] = json.data[0].trc20 ?? [];
  const balMap: Record<string, string> = {};
  for (const item of trc20List) {
    for (const [addr, raw] of Object.entries(item)) {
      balMap[addr] = raw;
    }
  }

  const result: TRC20BalanceMap = {};
  for (const token of tokens) {
    const raw = balMap[token.address];
    if (raw !== undefined) {
      try {
        const big = BigInt(raw);
        const div = BigInt(10 ** token.decimals);
        const whole = big / div;
        const frac = (big % div).toString().padStart(token.decimals, '0').slice(0, 6);
        result[token.address] = `${whole}.${frac}`;
      } catch {
        result[token.address] = '0.000000';
      }
    } else {
      result[token.address] = '0.000000';
    }
  }
  return result;
}
