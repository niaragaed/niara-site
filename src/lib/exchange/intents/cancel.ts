// Port of niara-exchange-engine/src/intents/cancel.ts (commit ad3a082; the message is
// unchanged since d5b32d6).
// Cancellation is off-chain only (the engine takes the order out of the book). The
// on-chain guarantee that a cancelled order never settles is revoking the delegate/allowance.
import { getAddress, hashTypedData, type Hex } from "viem";
import { CHAINS, isChainId } from "../chains";
import { EIP712_DOMAIN_NAME, EIP712_DOMAIN_VERSION } from "./evm";
import { IntentError } from "./types";
import { NONCE_PATTERN, checkAddress } from "./validate";

/**
 * The cancellation's own version, independent of the order intent's (engine commit
 * ad3a082, `CANCEL_VERSION`): it names an order by nonce, the same in every intent
 * version, so the v1 cancellation cancels v1 and v2 orders alike. Unchanged by v2.
 */
export const CANCEL_VERSION = 1;

export interface CancelIntent {
  version: typeof CANCEL_VERSION;
  chain: keyof typeof CHAINS;
  /** The same program/contract as the order intent. */
  settlement: string;
  /** The order's wallet, and the signer. */
  wallet: string;
  /** The order intent's nonce (32 lowercase hex chars). */
  nonce: string;
}

export function validateCancelIntent(cancel: CancelIntent): CancelIntent {
  if (cancel.version !== CANCEL_VERSION) {
    throw new IntentError("unsupported_version", `cancel version must be ${CANCEL_VERSION}`);
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

/** Body of `POST /v1/orders/cancel` (`parseCancelIntent` rejects extra fields). */
export function cancelToJson(cancel: CancelIntent) {
  return validateCancelIntent(cancel);
}

/** Exact text a Solana wallet signs to cancel. */
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

/** Same domain as `OrderIntent`; distinct primary type (digests never collide). */
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
