// Iceberg orders (intent v3, engine docs/decisions.md "Iceberg orders"): only a visible
// slice of a GTC order rests in the book at a time. The slice size is signed
// (`displayQuantity`), so the operator can never show more than the wallet allowed.

/** Why a visible quantity cannot be signed; null when it can. */
export type VisibleLotsProblem = "invalid" | "not_below" | "below_min";

/**
 * The ticket's checks, the same the engine makes at admission: a whole number of lots,
 * at least one, less than the order's lots (an order shown whole is a plain v2 order),
 * and each full slice worth at least the chain's minimum order value at the limit price
 * (`display_below_min_notional`). `visibleLots` is null when the text is not a positive
 * whole number.
 */
export function checkVisibleLots(args: {
  visibleLots: bigint | null;
  lots: bigint;
  /** USDT base units per lot. */
  limitPrice: bigint;
  /** USDT base units. */
  minOrderNotional: bigint;
}): VisibleLotsProblem | null {
  const { visibleLots, lots, limitPrice, minOrderNotional } = args;
  if (visibleLots === null || visibleLots < BigInt(1)) return "invalid";
  if (visibleLots >= lots) return "not_below";
  if (visibleLots * limitPrice < minOrderNotional) return "below_min";
  return null;
}
