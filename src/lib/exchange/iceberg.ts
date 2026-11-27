// Iceberg orders (intent v3, engine docs/decisions.md "Iceberg orders"): only a visible
// slice of a GTC order rests in the book at a time. The slice size is signed
// (`displayQuantity`), so the operator can never show more than the wallet allowed.
//
// The engine's public order reads (`GET /v1/orders`, `GET /v1/orders/:id`) return an
// iceberg's `quantity` and `remaining` as null: they would show the hidden quantity. Only
// the signed placement answer carries the total, so the site keeps it in this browser's
// localStorage, keyed by order id (order data only: no wallet, no personal data), and
// computes remaining = total - (filled - released - voided), as the engine counts it.
// Another device or browser does not have it: the order shows "total hidden".

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

/** localStorage key of the iceberg totals: { [orderId]: total quantity, asset base units }. */
export const ICEBERG_TOTALS_KEY = "niara.exchange.icebergTotals.v1";
/** Oldest entries are dropped beyond this (a total is only useful while its order lives). */
export const ICEBERG_TOTALS_MAX = 500;

export type IcebergTotals = Readonly<Record<string, string>>;

const DECIMAL = /^[1-9][0-9]*$/;
const ORDER_ID = /^[0-9A-Za-z-]{1,64}$/;

/** Parses the stored map; anything malformed is dropped, never trusted. */
export function parseIcebergTotals(raw: string | null): IcebergTotals {
  if (!raw) return {};
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof json !== "object" || json === null || Array.isArray(json)) return {};
  const out: Record<string, string> = {};
  for (const [id, total] of Object.entries(json)) {
    if (ORDER_ID.test(id) && typeof total === "string" && DECIMAL.test(total)) out[id] = total;
  }
  return out;
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** The totals kept in `storage`; empty when storage is unavailable (private mode, blocked). */
export function loadIcebergTotals(storage: StorageLike): IcebergTotals {
  try {
    return parseIcebergTotals(storage.getItem(ICEBERG_TOTALS_KEY));
  } catch {
    return {};
  }
}

/**
 * Adds an order's signed total (asset base units) and returns the new map. Re-reads
 * storage first, so another tab's entries are kept. A storage failure leaves the
 * returned map in memory only.
 */
export function saveIcebergTotal(storage: StorageLike, orderId: string, total: bigint): IcebergTotals {
  if (!ORDER_ID.test(orderId) || total <= BigInt(0)) return loadIcebergTotals(storage);
  const entries = Object.entries(loadIcebergTotals(storage)).filter(([id]) => id !== orderId);
  entries.push([orderId, total.toString()]);
  const next = Object.fromEntries(entries.slice(-ICEBERG_TOTALS_MAX));
  try {
    storage.setItem(ICEBERG_TOTALS_KEY, JSON.stringify(next));
  } catch {
    // Quota or blocked storage: the total stays known for this page only.
  }
  return next;
}

/** The fields of an engine order that the iceberg arithmetic reads. */
export interface IcebergOrderLike {
  id: string;
  quantity: string | null;
  remaining: string | null;
  filledQuantity: string;
  releasedQuantity?: string;
  voidedQuantity?: string;
  /** Engine 057b979+: the signed display quantity of an iceberg; null otherwise. */
  displayQuantity?: string | null;
}

export const isIcebergOrder = (o: Pick<IcebergOrderLike, "displayQuantity">) => o.displayQuantity != null;

/**
 * What is still open of an iceberg, from its signed total, as the engine counts it:
 * total - (filled - released - voided). Null when inconsistent (a total that does not
 * match the order's fills is not trusted).
 */
export function icebergRemaining(total: bigint, o: IcebergOrderLike): bigint | null {
  const used = BigInt(o.filledQuantity) - BigInt(o.releasedQuantity ?? "0") - BigInt(o.voidedQuantity ?? "0");
  const remaining = total - used;
  return remaining < BigInt(0) || remaining > total ? null : remaining;
}

/**
 * The orders with each iceberg's `quantity` and `remaining` filled in from the totals
 * kept here. An iceberg without a local total keeps them null ("total hidden"); plain
 * orders are returned as they are.
 */
export function withLocalTotals<T extends IcebergOrderLike>(orders: readonly T[], totals: IcebergTotals): T[] {
  return orders.map((o) => {
    if (!isIcebergOrder(o) || o.quantity !== null) return o;
    const stored = totals[o.id];
    if (!stored) return o;
    const total = BigInt(stored);
    const remaining = icebergRemaining(total, o);
    return remaining === null ? o : { ...o, quantity: total.toString(), remaining: remaining.toString() };
  });
}
