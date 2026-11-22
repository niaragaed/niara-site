// Porte de niara-exchange-engine/src/intents/types.ts (commit d5b32d6).
import type { ChainId } from "../chains";

export const INTENT_VERSION = 1;

export type Side = "buy" | "sell";

/**
 * O que a carteira assina para colocar uma ordem (spec §3.6). Unidades do engine:
 * `quantity` e `lotSize` em unidades base do ativo, `limitPrice` em unidades base
 * de USDT por lote.
 *
 * Solana: o texto UTF-8 de `solanaIntentMessage`, assinado com `signMessage`.
 * EVM: o typed data EIP-712 de `evmIntentTypedData`.
 */
export interface OrderIntent {
  version: typeof INTENT_VERSION;
  chain: ChainId;
  /** Solana: program id do `niara_exchange`. EVM: endereço do `NiaraSettlement`. */
  settlement: string;
  /** Quem assina. Chave pública base58 (Solana) ou endereço EVM. */
  wallet: string;
  side: Side;
  /** Mint / endereço do token do ativo. */
  asset: string;
  quantity: bigint;
  lotSize: bigint;
  limitPrice: bigint;
  /** Mint / token USDT da cadeia. */
  paymentAsset: string;
  /** 16 bytes aleatórios, hex minúsculo (32 caracteres). Único por (cadeia, carteira). */
  nonce: string;
  /** Segundos unix. Obrigatório. */
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
