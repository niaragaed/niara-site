// Porte de niara-exchange-engine/src/intents/cancel.ts (commit d5b32d6).
// O cancelamento é só off-chain (o engine tira a ordem do livro). A garantia
// on-chain de que uma ordem cancelada nunca liquida é revogar o delegate/allowance.
import { getAddress, hashTypedData, type Hex } from "viem";
import { CHAINS, isChainId } from "../chains";
import { EIP712_DOMAIN_NAME, EIP712_DOMAIN_VERSION } from "./evm";
import { INTENT_VERSION, IntentError } from "./types";
import { NONCE_PATTERN, checkAddress } from "./validate";

export interface CancelIntent {
  version: typeof INTENT_VERSION;
  chain: keyof typeof CHAINS;
  /** O mesmo programa/contrato da intent da ordem. */
  settlement: string;
  /** Carteira da ordem, e quem assina. */
  wallet: string;
  /** Nonce da intent da ordem (32 hex minúsculos). */
  nonce: string;
}

export function validateCancelIntent(cancel: CancelIntent): CancelIntent {
  if (cancel.version !== INTENT_VERSION) {
    throw new IntentError("unsupported_version", `cancel version must be ${INTENT_VERSION}`);
  }
  if (!isChainId(cancel.chain)) throw new IntentError("unknown_chain", `unknown chain: ${String(cancel.chain)}`);
  const kind = CHAINS[cancel.chain].kind;
  const settlement = checkAddress(kind, "settlement", cancel.settlement);
  const wallet = checkAddress(kind, "wallet", cancel.wallet);
  if (typeof cancel.nonce !== "string" || !NONCE_PATTERN.test(cancel.nonce) || /^0+$/.test(cancel.nonce)) {
    throw new IntentError("invalid_nonce", "nonce must be 16 non-zero bytes as 32 lowercase hex chars");
  }
  return { version: cancel.version, chain: cancel.chain, settlement, wallet, nonce: cancel.nonce };
}

/** Corpo de `POST /v1/orders/cancel` (`parseCancelIntent` recusa campos extras). */
export function cancelToJson(cancel: CancelIntent) {
  return validateCancelIntent(cancel);
}

/** Texto exato que a carteira Solana assina para cancelar. */
export function solanaCancelMessage(cancel: CancelIntent): Uint8Array {
  const c = validateCancelIntent(cancel);
  const chain = CHAINS[c.chain];
  if (chain.kind !== "solana") throw new IntentError("unknown_chain", `${c.chain} is not a Solana chain`);
  const lines = [
    `Niara Exchange cancel order v${c.version}`,
    "TESTNET ONLY: no real assets, no real money.",
    "",
    `Chain: ${chain.caip2}`,
    `Program: ${c.settlement}`,
    `Wallet: ${c.wallet}`,
    `Order nonce: ${c.nonce}`,
  ];
  return new TextEncoder().encode(lines.join("\n"));
}

/** Mesmo domínio da `OrderIntent`; tipo primário distinto (digests nunca colidem). */
export const CANCEL_ORDER_TYPES = {
  CancelOrder: [
    { name: "wallet", type: "address" },
    { name: "nonce", type: "bytes16" },
  ],
} as const;

export function evmCancelTypedData(cancel: CancelIntent) {
  const c = validateCancelIntent(cancel);
  const chain = CHAINS[c.chain];
  if (chain.kind !== "evm" || chain.evmChainId === null) {
    throw new IntentError("unknown_chain", `${c.chain} is not an EVM chain`);
  }
  return {
    domain: {
      name: EIP712_DOMAIN_NAME,
      version: EIP712_DOMAIN_VERSION,
      chainId: chain.evmChainId,
      verifyingContract: getAddress(c.settlement),
    },
    types: CANCEL_ORDER_TYPES,
    primaryType: "CancelOrder" as const,
    message: { wallet: getAddress(c.wallet), nonce: `0x${c.nonce}` as Hex },
  };
}

export function evmCancelDigest(cancel: CancelIntent): Hex {
  return hashTypedData(evmCancelTypedData(cancel));
}
