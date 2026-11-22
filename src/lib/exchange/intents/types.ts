// Port of niara-exchange-engine/src/intents/types.ts (commit d5b32d6).
import type { ChainId } from "../chains";

export const INTENT_VERSION = 1;

export type Side = "buy" | "sell";

/**
 * What the wallet signs to place an order (spec §3.6). Engine units:
 * `quantity` and `lotSize` in the asset's base units, `limitPrice` in USDT base
 * units per lot.
 *
 * Solana: the UTF-8 text of `solanaIntentMessage`, signed with `signMessage`.
 * EVM: the EIP-712 typed data of `evmIntentTypedData`.
 */
export interface OrderIntent {
  version: typeof INTENT_VERSION;
  chain: ChainId;
  /** Solana: the `niara_exchange` program id. EVM: the `NiaraSettlement` address. */
  settlement: string;
  /** The signer. Base58 public key (Solana) or EVM address. */
  wallet: string;
  side: Side;
  /** Asset mint / token address. */
  asset: string;
  quantity: bigint;
  lotSize: bigint;
  limitPrice: bigint;
  /** The chain's USDT mint / token. */
  paymentAsset: string;
  /** 16 random bytes, lowercase hex (32 chars). Unique per (chain, wallet). */
  nonce: string;
  /** Unix seconds. Required. */
  expiresAt: number;
}

export class IntentError extends Error {
  readonly code: IntentErrorCode;
  constructor(code: IntentErrorCode, message: string) {
    super(message);
    this.name = "IntentError";
    this.code = code;
  }
}

export type IntentErrorCode =
  | "malformed"
  | "unsupported_version"
  | "unknown_chain"
  | "invalid_address"
  | "invalid_side"
  | "invalid_amount"
  | "amount_overflow"
  | "not_whole_lots"
  | "invalid_nonce"
  | "invalid_expiry"
  | "invalid_signature_format";
