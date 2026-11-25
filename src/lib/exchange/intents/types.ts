// Port of niara-exchange-engine/src/intents/types.ts (commit ad3a082).
import type { ChainId } from "../chains";

/**
 * The current order intent version. v2 adds `timeInForce` to the signed fields; v1 is
 * still accepted by the engine and means GTC. Cancellations have their own version
 * (`CANCEL_VERSION`, cancel.ts), unchanged.
 */
export const INTENT_VERSION = 2;
export const SUPPORTED_INTENT_VERSIONS = [1, 2] as const;
export type IntentVersion = (typeof SUPPORTED_INTENT_VERSIONS)[number];

export type Side = "buy" | "sell";

/**
 * - GTC (good till cancelled): what is not matched at once rests in the book until
 *   filled, cancelled or expired.
 * - IOC (immediate or cancel): matched at once up to the signed limit price; whatever is
 *   not matched is cancelled (`ioc_unfilled`) and never rests. A market order is an IOC
 *   whose limit price is a price cap (market-order.ts).
 */
export type TimeInForce = "GTC" | "IOC";
export const TIME_IN_FORCE: readonly TimeInForce[] = ["GTC", "IOC"];

/**
 * What the wallet signs to place an order (spec §3.6). Engine units:
 * `quantity` and `lotSize` in the asset's base units, `limitPrice` in USDT base
 * units per lot.
 *
 * Solana: the UTF-8 text of `solanaIntentMessage`, signed with `signMessage`.
 * EVM: the EIP-712 typed data of `evmIntentTypedData`.
 */
export interface OrderIntent {
  version: IntentVersion;
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
  /** v2: required and signed. v1: absent (a v1 intent is GTC). */
  timeInForce?: TimeInForce;
}

/** The time in force an intent was signed with: a v1 intent is GTC. */
export function timeInForceOf(intent: Pick<OrderIntent, "version" | "timeInForce">): TimeInForce {
  return intent.version === 1 ? "GTC" : intent.timeInForce!;
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
  | "invalid_time_in_force"
  | "invalid_signature_format";
