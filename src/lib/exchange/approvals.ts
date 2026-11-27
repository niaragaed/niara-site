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
//
// Time in force (intent v2): only GTC orders rest, so only they count as open. An IOC
// never rests (engine docs/decisions.md): the new order is IOC or GTC, its own need is
// added, and an earlier IOC is never counted, even if the engine still lists it while
// its match settles. An IOC buy needs quantity / lotSize × its LIMIT price, which for a
// market order is the price cap, not the expected price.
//
// Iceberg (intent v3): covered for its WHOLE remainder, hidden part included, like any
// order (engine docs/decisions.md item 15). The engine's public order reads return an
// iceberg's `remaining` as null (it would show the hidden quantity); the caller fills it
// from the total the wallet signed when it knows it. An open order whose remainder is
// still unknown is counted in `unknownCount`, and the caller must refuse: approving
// without it would under-cover that order.

import { CHAINS, type ChainId } from "./chains";

export interface OpenOrderLike {
  chain: string;
  side: "buy" | "sell";
  asset: string;
  paymentAsset: string;
  status: string;
  /** Asset base units still open (decimal string); null for an iceberg whose total is not known here. */
  remaining: string | null;
  lotSize: string;
  limitPrice: string;
  /** Unix seconds. */
  expiresAt: number;
  /** Absent on v1 orders and older engine builds: GTC. */
  timeInForce?: "GTC" | "IOC";
}

const LIVE = new Set(["open", "partially_filled"]);

function same(chain: ChainId, a: string, b: string): boolean {
  return CHAINS[chain].kind === "evm" ? a.toLowerCase() === b.toLowerCase() : a === b;
}

/**
 * What `settle` can still move from this order's wallet, and on which token. The amount
 * is null when the remainder is unknown (an iceberg placed from another device).
 */
export function orderNeed(o: OpenOrderLike): { token: string; amount: bigint | null } {
  const token = o.side === "sell" ? o.asset : o.paymentAsset;
  if (o.remaining === null) return { token, amount: null };
  const remaining = BigInt(o.remaining);
  if (o.side === "sell") return { token, amount: remaining };
  return { token, amount: (remaining / BigInt(o.lotSize)) * BigInt(o.limitPrice) };
}

export interface ApprovalRequirement {
  /** What the open orders on this token already need. */
  openNeed: bigint;
  /** How many open orders draw on this token. */
  openCount: number;
  /**
   * Open orders on this token whose remainder is unknown (icebergs whose signed total is
   * not on this device). Not in `openNeed`: when above 0, `total` would under-cover them,
   * so the caller must not approve it.
   */
  unknownCount: number;
  /** What the new order needs. */
  newNeed: bigint;
  /** openNeed + newNeed: the approval that covers everything. */
  total: bigint;
}

/**
 * The approval `token` needs on `chain` so that the wallet's live GTC orders AND the
 * new one (GTC or IOC) stay covered. Orders past their expiry are left out (they can no longer be
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
  let unknownCount = 0;
  for (const o of args.openOrders) {
    if (o.chain !== args.chain || !LIVE.has(o.status) || o.expiresAt <= args.now) continue;
    if (o.timeInForce === "IOC") continue;
    const need = orderNeed(o);
    if (!same(args.chain, need.token, args.token)) continue;
    if (need.amount === null) {
      unknownCount += 1;
      continue;
    }
    if (need.amount <= BigInt(0)) continue;
    openNeed += need.amount;
    openCount += 1;
  }
  return { openNeed, openCount, unknownCount, newNeed: args.newNeed, total: openNeed + args.newNeed };
}
