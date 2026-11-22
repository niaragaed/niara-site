// Port of niara-exchange-engine/src/intents/validate.ts (commit d5b32d6).
// Same validation as the server: an intent that passes here passes there (except the
// market rules and validity window, which belong to the engine).
import { base58 } from "@scure/base";
import { getAddress, isAddress } from "viem";
import { CHAINS, isChainId, type ChainKind } from "../chains";
import { INTENT_VERSION, IntentError, type OrderIntent } from "./types";

export const U64_MAX = (BigInt(1) << BigInt(64)) - BigInt(1);
export const U256_MAX = (BigInt(1) << BigInt(256)) - BigInt(1);

/** 16 bytes as 32 lowercase hex chars (order and cancel nonce). */
export const NONCE_PATTERN = /^[0-9a-f]{32}$/;

/** Canonical Solana public key: decodes to 32 bytes and re-encodes identically. */
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

/** Validates the intent and returns its canonical form (checksummed EVM addresses). */
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
  // On-chain widths: Solana's `settle` takes u64; EVM takes uint256.
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
 * JSON body the engine expects at `POST /v1/orders` (`parseOrderIntent`):
 * amounts as decimal strings (never JSON numbers), integer `expiresAt`.
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

/** Fresh nonce: 16 bytes from `crypto.getRandomValues`, never all zero. */
export function randomNonce(): string {
  for (;;) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    if (!/^0+$/.test(hex)) return hex;
  }
}
