// What an order actually traded, from the fills (matches) the engine reports for
// it. Never derived from the signed limit price: for a market order that price is
// only a cap, and the fills happen at the makers' prices.

import type { MatchHistory } from "./engine-api";
import { parseBaseUnits } from "./units";

export type Fill = Pick<MatchHistory, "quantity" | "lotSize" | "paymentAmount" | "status" | "settlement">;

export interface FillSummary {
  /** Lots matched, not counting fills whose settlement failed. */
  lots: bigint;
  /** Sum of the engine's `paymentAmount` (USDT base units): what the buyer pays, fee included. */
  total: bigint;
  /** `total / lots` per lot, in USDT base units, rounded half up. */
  averagePrice: bigint;
  /** The average is exact (no rounding). */
  exact: boolean;
  /** Every counted fill settled on-chain, with a transaction hash. */
  settled: boolean;
}

const ZERO = BigInt(0);
const TWO = BigInt(2);

/** Null when nothing filled (or every fill failed to settle). */
export function summarizeFills(fills: readonly Fill[]): FillSummary | null {
  let lots = ZERO;
  let total = ZERO;
  let settled = true;
  for (const f of fills) {
    if (f.status === "failed") continue;
    lots += parseBaseUnits(f.quantity) / parseBaseUnits(f.lotSize);
    total += parseBaseUnits(f.paymentAmount);
    if (!(f.status === "settled" && f.settlement?.txHash)) settled = false;
  }
  if (lots === ZERO) return null;
  return {
    lots,
    total,
    averagePrice: (TWO * total + lots) / (TWO * lots),
    exact: total % lots === ZERO,
    settled,
  };
}

/**
 * Whether `fills` (e.g. the wallet's match list, which is paged and may be cut
 * short) hold every fill of an order whose engine-reported filled quantity is
 * `filledQuantity`. When not, read the order's own matches instead.
 */
export function coversOrderFills(fills: readonly Fill[], filledQuantity: string): boolean {
  const filled = parseBaseUnits(filledQuantity);
  let all = ZERO;
  let live = ZERO;
  for (const f of fills) {
    const q = parseBaseUnits(f.quantity);
    all += q;
    if (f.status !== "failed") live += q;
  }
  return all === filled || live === filled;
}
