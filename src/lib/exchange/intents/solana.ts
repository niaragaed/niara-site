// Porte de niara-exchange-engine/src/intents/solana.ts (commit d5b32d6).
// O verificador do engine reconstrói ESTE texto a partir da intent estruturada
// e confere a assinatura sobre ele — qualquer byte diferente = bad_signature.
import { base58 } from "@scure/base";
import { CHAINS } from "../chains";
import { IntentError, type OrderIntent } from "./types";
import { validateIntent } from "./validate";

/**
 * Texto exato que a carteira Solana assina com `signMessage`: UTF-8, linhas
 * unidas por "\n", sem "\n" final, inteiros em decimal puro.
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
    `Payment asset: ${i.paymentAsset}`,
    `Nonce: ${i.nonce}`,
    `Expires at: ${i.expiresAt} (unix seconds)`,
  ];
  return new TextEncoder().encode(lines.join("\n"));
}

/** Assinatura ed25519 (64 bytes) → base58, como o engine espera. */
export function encodeSolanaSignature(signature: Uint8Array): string {
  if (signature.length !== 64) throw new IntentError("invalid_signature_format", "signature must be 64 bytes");
  return base58.encode(signature);
}

/** Base58 → 64 bytes (mesmas regras de `decodeSolanaSignature` do engine). */
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
