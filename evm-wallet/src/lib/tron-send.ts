/**
 * Tron write operations (send TRX, send TRC-20, approve TRC-20).
 * Uses a dynamic import of tronweb so Vite can tree-shake it.
 */

async function getTronWeb(fullHost: string, privateKey?: string) {
  // @ts-ignore
  const mod = await import('tronweb');
  // Handle CJS default export wrapped by Vite
  const TW = (mod as any).TronWeb ?? (mod as any).default?.TronWeb ?? (mod as any).default ?? mod;
  const cfg: any = { fullHost };
  if (privateKey) cfg.privateKey = privateKey.replace(/^0x/, '');
  return new TW(cfg);
}

/** Send TRX to a T… address.  amount is in TRX (not SUN). */
export async function sendTRX(
  fullHost: string,
  privateKey: string,
  fromTronAddress: string,
  toTronAddress: string,
  amountTrx: string,
): Promise<string> {
  const tronWeb = await getTronWeb(fullHost, privateKey);
  const amountSun = Math.round(parseFloat(amountTrx) * 1_000_000);
  const pk = privateKey.replace(/^0x/, '');
  const tx = await tronWeb.transactionBuilder.sendTrx(toTronAddress, amountSun, fromTronAddress);
  const signed = await tronWeb.trx.sign(tx, pk);
  const result = await tronWeb.trx.sendRawTransaction(signed);
  if (result.code) throw new Error(`Broadcast failed: ${result.code}`);
  return result.txid as string;
}

/** Send a TRC-20 token.  amount is in human units (not smallest unit). */
export async function sendTRC20(
  fullHost: string,
  privateKey: string,
  contractAddress: string,
  toTronAddress: string,
  amount: string,
  decimals: number,
): Promise<string> {
  const tronWeb = await getTronWeb(fullHost, privateKey);
  const amountRaw = BigInt(Math.round(parseFloat(amount) * 10 ** decimals)).toString();
  const contract = await tronWeb.contract().at(contractAddress);
  const txId = await contract.transfer(toTronAddress, amountRaw).send({ feeLimit: 100_000_000 });
  return txId as string;
}

/** Set TRC-20 allowance (approve). Pass '0' to revoke. amount is human units. */
export async function approveTRC20(
  fullHost: string,
  privateKey: string,
  contractAddress: string,
  spenderAddress: string,
  amount: string,   // '0' to revoke, or human-unit amount
  decimals: number,
  unlimited: boolean,
): Promise<string> {
  const tronWeb = await getTronWeb(fullHost, privateKey);
  const MAX = (2n ** 256n - 1n).toString();
  const amountRaw = unlimited ? MAX : BigInt(Math.round(parseFloat(amount) * 10 ** decimals)).toString();
  const contract = await tronWeb.contract().at(contractAddress);
  return await contract.approve(spenderAddress, amountRaw).send({ feeLimit: 100_000_000 }) as string;
}

/** Check TRC-20 allowance. Returns raw BigInt. */
export async function allowanceTRC20(
  fullHost: string,
  ownerTronAddress: string,
  contractAddress: string,
  spenderAddress: string,
): Promise<bigint> {
  const tronWeb = await getTronWeb(fullHost);
  const contract = await tronWeb.contract().at(contractAddress);
  const raw = await contract.allowance(ownerTronAddress, spenderAddress).call();
  return BigInt(raw.toString());
}

/** Fetch TRC-20 token info (symbol, name, decimals) via tronweb. */
export async function getTRC20Info(
  fullHost: string,
  contractAddress: string,
): Promise<{ symbol: string; name: string; decimals: number }> {
  const tronWeb = await getTronWeb(fullHost);
  const contract = await tronWeb.contract().at(contractAddress);
  const [symbol, name, decimals] = await Promise.all([
    contract.symbol().call(),
    contract.name().call(),
    contract.decimals().call(),
  ]);
  return { symbol: symbol as string, name: name as string, decimals: Number(decimals) };
}
