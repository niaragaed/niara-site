// Port of niara-exchange-engine/src/intents/solana.ts (commit 057b979).
// The engine's verifier rebuilds THIS text from the structured intent
// and checks the signature over it — any different byte = bad_signature.
// v2 adds one line, `Time in force`, after the limit price; v1 texts are unchanged.
// v3 (iceberg) adds one more, `Display quantity`, after it; v2 texts are unchanged.
import { base58 } from "@scure/base";
import { CHAINS } from "../chains";
import { ICEBERG_INTENT_VERSION, IntentError, type OrderIntent, type TimeInForce } from "./types";
import { validateIntent } from "./validate";

/**
 * Exact text a Solana wallet signs with `signMessage`: UTF-8, lines
 * joined by "\n", no trailing "\n", integers in plain decimal.
 */
export function solanaIntentMessage(intent: OrderIntent): Uint8Array {
  const i = validateIntent(intent);
  const chain = CHAINS[i.chain];
  if (chain.kind !== "solana") throw new IntentError("unknown_chain", `${i.chain} is not a Solana chain`);
  const lines = [
    `Niara Exchange order intent v${i.version}`,
    "TESTNET ONLY: no real assets, no real money.",
    "",
    `Chain: ${chain.caip2}`,
    `Program: ${i.settlement}`,
    `Wallet: ${i.wallet}`,
    `Side: ${i.side}`,
    `Asset: ${i.asset}`,
    `Quantity: ${i.quantity} (asset base units)`,
    `Lot size: ${i.lotSize} (asset base units)`,
    `Limit price: ${i.limitPrice} (payment base units per lot)`,
    ...(i.version === 1 ? [] : [`Time in force: ${TIF_TEXT[i.timeInForce!]}`]),
    ...(i.version === ICEBERG_INTENT_VERSION ? [`Display quantity: ${i.displayQuantity} (asset base units shown in the book at a time)`] : []),
    `Payment asset: ${i.paymentAsset}`,
    `Nonce: ${i.nonce}`,
    `Expires at: ${i.expiresAt} (unix seconds)`,
  ];
  return new TextEncoder().encode(lines.join("\n"));
}

const TIF_TEXT: Record<TimeInForce, string> = {
  GTC: "GTC (rests in the book until filled, cancelled or expired)",
  IOC: "IOC (fills now up to the limit price; the rest is cancelled)",
};

/** ed25519 signature (64 bytes) → base58, as the engine expects. */
export function encodeSolanaSignature(signature: Uint8Array): string {
  if (signature.length !== 64) throw new IntentError("invalid_signature_format", "signature must be 64 bytes");
  return base58.encode(signature);
}

/** Base58 → 64 bytes (same rules as the engine's `decodeSolanaSignature`). */
export function decodeSolanaSignature(signature: string): Uint8Array {
  let bytes: Uint8Array;
  try {
    bytes = base58.decode(signature);
  } catch {
    throw new IntentError("invalid_signature_format", "signature is not base58");
  }
  if (bytes.length !== 64) throw new IntentError("invalid_signature_format", "signature must be 64 bytes");
  return bytes;
}
