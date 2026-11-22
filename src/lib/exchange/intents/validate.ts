// Porte de niara-exchange-engine/src/intents/validate.ts (commit d5b32d6).
// Mesma validação do servidor: uma intent que passa aqui passa lá (exceto as
// regras de mercado e janela de validade, que são do engine).
import { base58 } from "@scure/base";
import { getAddress, isAddress } from "viem";
import { CHAINS, isChainId, type ChainKind } from "../chains";
import { INTENT_VERSION, IntentError, type OrderIntent } from "./types";

export const U64_MAX = (BigInt(1) << BigInt(64)) - BigInt(1);
export const U256_MAX = (BigInt(1) << BigInt(256)) - BigInt(1);

/** 16 bytes como 32 caracteres hex minúsculos (nonce de ordem e de cancelamento). */
export const NONCE_PATTERN = /^[0-9a-f]{32}$/;

/** Chave pública Solana canônica: decodifica em 32 bytes e reencoda igual. */
export function isSolanaAddress(value: string): boolean {
  try {
    return base58.decode(value).length === 32 && base58.encode(base58.decode(value)) === value;
  } catch {
    return false;
  }
}

export function checkAddress(kind: ChainKind, field: string, value: unknown): string {
  if (typeof value !== "string") throw new IntentError("invalid_address", `${field} must be a string`);
  if (kind === "solana") {
    if (!isSolanaAddress(value)) throw new IntentError("invalid_address", `${field} is not a base58 public key`);
    return value;
  }
  if (!isAddress(value, { strict: false })) throw new IntentError("invalid_address", `${field} is not an address`);
  const checksummed = getAddress(value);
  if (BigInt(checksummed) === BigInt(0)) throw new IntentError("invalid_address", `${field} is the zero address`);
  return checksummed;
}

/** Valida a intent e devolve a forma canônica (endereços EVM com checksum). */
export function validateIntent(intent: OrderIntent): OrderIntent {
  if (intent.version !== INTENT_VERSION) {
    throw new IntentError("unsupported_version", `intent version must be ${INTENT_VERSION}`);
  }
  if (!isChainId(intent.chain)) throw new IntentError("unknown_chain", `unknown chain: ${String(intent.chain)}`);
  const kind = CHAINS[intent.chain].kind;
  const settlement = checkAddress(kind, "settlement", intent.settlement);
  const wallet = checkAddress(kind, "wallet", intent.wallet);
  const asset = checkAddress(kind, "asset", intent.asset);
  const paymentAsset = checkAddress(kind, "paymentAsset", intent.paymentAsset);
  if (asset === paymentAsset) throw new IntentError("invalid_address", "asset and paymentAsset must differ");
  if (intent.side !== "buy" && intent.side !== "sell") throw new IntentError("invalid_side", "side must be buy or sell");

  for (const field of ["quantity", "lotSize", "limitPrice"] as const) {
    const v = intent[field];
    if (typeof v !== "bigint" || v <= BigInt(0)) throw new IntentError("invalid_amount", `${field} must be a positive integer`);
  }
  if (intent.quantity % intent.lotSize !== BigInt(0)) {
    throw new IntentError("not_whole_lots", "quantity must be a multiple of lotSize");
  }
  // Larguras on-chain: `settle` da Solana recebe u64; EVM, uint256.
  const max = kind === "solana" ? U64_MAX : U256_MAX;
  const notional = (intent.quantity / intent.lotSize) * intent.limitPrice;
  if (intent.quantity > max || intent.lotSize > max || intent.limitPrice > max || notional > max) {
    throw new IntentError("amount_overflow", `amounts must fit in ${kind === "solana" ? "u64" : "uint256"}`);
  }

  if (typeof intent.nonce !== "string" || !NONCE_PATTERN.test(intent.nonce) || /^0+$/.test(intent.nonce)) {
    throw new IntentError("invalid_nonce", "nonce must be 16 non-zero bytes as 32 lowercase hex chars");
  }
  if (typeof intent.expiresAt !== "number" || !Number.isSafeInteger(intent.expiresAt) || intent.expiresAt <= 0) {
    throw new IntentError("invalid_expiry", "expiresAt is required, in positive integer unix seconds");
  }
  return { ...intent, settlement, wallet, asset, paymentAsset };
}

/**
 * Corpo JSON que o engine espera em `POST /v1/orders` (`parseOrderIntent`):
 * valores em string decimal (nunca number JSON), `expiresAt` inteiro.
 */
export function intentToJson(intent: OrderIntent) {
  const i = validateIntent(intent);
  return {
    version: i.version,
    chain: i.chain,
    settlement: i.settlement,
    wallet: i.wallet,
    side: i.side,
    asset: i.asset,
    quantity: i.quantity.toString(),
    lotSize: i.lotSize.toString(),
    limitPrice: i.limitPrice.toString(),
    paymentAsset: i.paymentAsset,
    nonce: i.nonce,
    expiresAt: i.expiresAt,
  };
}

/** Nonce novo: 16 bytes de `crypto.getRandomValues`, nunca todo zero. */
export function randomNonce(): string {
  for (;;) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    if (!/^0+$/.test(hex)) return hex;
  }
}
