// Port of niara-exchange-engine/src/intents/evm.ts (commit d5b32d6).
import { getAddress, hashTypedData, isHex, keccak256, toHex, type Hex } from "viem";
import { CHAINS } from "../chains";
import { IntentError, type OrderIntent } from "./types";
import { validateIntent } from "./validate";

export const EIP712_DOMAIN_NAME = "Niara Exchange";
export const EIP712_DOMAIN_VERSION = "1";

/** Field order is part of the type hash: never reorder. `side`: 0 = buy, 1 = sell. */
export const ORDER_INTENT_TYPES = {
  OrderIntent: [
    { name: "wallet", type: "address" },
    { name: "side", type: "uint8" },
    { name: "asset", type: "address" },
    { name: "quantity", type: "uint256" },
    { name: "lotSize", type: "uint256" },
    { name: "limitPrice", type: "uint256" },
    { name: "paymentAsset", type: "address" },
    { name: "nonce", type: "bytes16" },
    { name: "expiresAt", type: "uint64" },
  ],
} as const;

export const ORDER_INTENT_TYPE =
  "OrderIntent(address wallet,uint8 side,address asset,uint256 quantity,uint256 lotSize," +
  "uint256 limitPrice,address paymentAsset,bytes16 nonce,uint64 expiresAt)";

export const ORDER_INTENT_TYPEHASH = keccak256(toHex(ORDER_INTENT_TYPE));

// secp256k1 group order and its half: the engine (like OpenZeppelin's ECDSA)
// rejects a high s, so each intent has a single valid encoding.
const SECP256K1_N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
const SECP256K1_HALF_N = BigInt("0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0");

/**
 * EIP-712 typed data of the intent. Domain: "Niara Exchange", version "1", the
 * chain's EIP-155 id and `verifyingContract` = NiaraSettlement.
 */
export function evmIntentTypedData(intent: OrderIntent) {
  const i = validateIntent(intent);
  const chain = CHAINS[i.chain];
  if (chain.kind !== "evm" || chain.evmChainId === null) {
    throw new IntentError("unknown_chain", `${i.chain} is not an EVM chain`);
  }
  return {
    domain: {
      name: EIP712_DOMAIN_NAME,
      version: EIP712_DOMAIN_VERSION,
      chainId: chain.evmChainId,
      verifyingContract: getAddress(i.settlement),
    },
    types: ORDER_INTENT_TYPES,
    primaryType: "OrderIntent" as const,
    message: {
      wallet: getAddress(i.wallet),
      side: i.side === "buy" ? 0 : 1,
      asset: getAddress(i.asset),
      quantity: i.quantity,
      lotSize: i.lotSize,
      limitPrice: i.limitPrice,
      paymentAsset: getAddress(i.paymentAsset),
      nonce: `0x${i.nonce}` as Hex,
      expiresAt: BigInt(i.expiresAt),
    },
  };
}

export function evmIntentDigest(intent: OrderIntent): Hex {
  return hashTypedData(evmIntentTypedData(intent));
}

/**
 * Turns the signature the wallet returned into the form the engine accepts
 * (`checkEvmSignatureFormat`): 65 bytes r‖s‖v, v ∈ {27, 28}, low s.
 * - v 0/1 (some wallets and hardware wallets) → 27/28;
 * - high s → (n − s) with v flipped: it is the SAME signature by the same signer,
 *   only in canonical encoding.
 * Anything else is rejected.
 */
export function normalizeEvmSignature(signature: string): Hex {
  if (!isHex(signature, { strict: true }) || signature.length !== 2 + 65 * 2) {
    throw new IntentError("invalid_signature_format", "signature must be 65 bytes of 0x hex (r, s, v)");
  }
  const r = signature.slice(2, 66);
  let s = BigInt(`0x${signature.slice(66, 130)}`);
  let v = Number.parseInt(signature.slice(130, 132), 16);
  if (v === 0 || v === 1) v += 27;
  if (v !== 27 && v !== 28) throw new IntentError("invalid_signature_format", "v must be 27 or 28");
  if (s === BigInt(0) || s >= SECP256K1_N) throw new IntentError("invalid_signature_format", "s out of range");
  if (s > SECP256K1_HALF_N) {
    s = SECP256K1_N - s;
    v = v === 27 ? 28 : 27;
  }
  return `0x${r}${s.toString(16).padStart(64, "0")}${v.toString(16)}` as Hex;
}
