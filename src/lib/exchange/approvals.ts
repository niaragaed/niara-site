// How much the delegate (Solana) / allowance (EVM) must cover before a new order.
//
// A token account has ONE delegate (and an ERC-20 one allowance per spender), and a
// new approval REPLACES the previous amount, it does not add to it. `settle` moves
// each leg through that single approval, so it must cover every open order of the
// wallet that draws on the same token, plus the new one (spec §3.5):
//
//   sell order  token = the asset   need = remaining quantity
//   buy order   token = USDT        need = remaining / lotSize × limitPrice
//
// USDT is shared by every buy order of the chain, whatever the asset, so a buy
// on one market counts against the approval a buy on another market relies on.

import { CHAINS, type ChainId } from "./chains";

export interface OpenOrderLike {
  chain: string;
  side: "buy" | "sell";
  asset: string;
  paymentAsset: string;
  status: string;
  /** Asset base units still open (decimal string). */
  remaining: string;
  lotSize: string;
  limitPrice: string;
  /** Unix seconds. */
  expiresAt: number;
}

const LIVE = new Set(["open", "partially_filled"]);

function same(chain: ChainId, a: string, b: string): boolean {
  return CHAINS[chain].kind === "evm" ? a.toLowerCase() === b.toLowerCase() : a === b;
}

/** What `settle` can still move from this order's wallet, and on which token. */
export function orderNeed(o: OpenOrderLike): { token: string; amount: bigint } {
  const remaining = BigInt(o.remaining);
  if (o.side === "sell") return { token: o.asset, amount: remaining };
  return { token: o.paymentAsset, amount: (remaining / BigInt(o.lotSize)) * BigInt(o.limitPrice) };
}

export interface ApprovalRequirement {
  /** What the open orders on this token already need. */
  openNeed: bigint;
  /** How many open orders draw on this token. */
  openCount: number;
  /** What the new order needs. */
  newNeed: bigint;
  /** openNeed + newNeed: the approval that covers everything. */
  total: bigint;
}

/**
 * The approval `token` needs on `chain` so that the wallet's live orders AND the new
 * one stay covered. Orders past their expiry are left out (they can no longer be
 * matched or settled); so are other chains and other tokens.
 */
export function requiredApproval(args: {
  chain: ChainId;
  token: string;
  openOrders: readonly OpenOrderLike[];
  newNeed: bigint;
  /** Unix seconds. */
  now: number;
}): ApprovalRequirement {
  let openNeed = BigInt(0);
  let openCount = 0;
  for (const o of args.openOrders) {
    if (o.chain !== args.chain || !LIVE.has(o.status) || o.expiresAt <= args.now) continue;
    const need = orderNeed(o);
    if (need.amount <= BigInt(0) || !same(args.chain, need.token, args.token)) continue;
    openNeed += need.amount;
    openCount += 1;
  }
  return { openNeed, openCount, newNeed: args.newNeed, total: openNeed + args.newNeed };
}
