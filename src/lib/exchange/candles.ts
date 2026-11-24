// Candles built ONLY from settled trades (`GET /v1/trades`). A bucket without
// trades has no candle: nothing is interpolated or carried forward. For the chart,
// empty buckets become whitespace (a time slot with no bar) so bars keep a uniform
// width; whitespace carries no price.

export interface TradeLike {
  /** USDT base units per lot (decimal string). */
  price: string;
  /** Asset base units (decimal string). */
  quantity: string;
  lotSize: string;
  takerSide: "buy" | "sell";
  /** ISO 8601. */
  matchedAt: string;
  sequence: number;
}

export interface Candle {
  /** Bucket start, unix seconds (UTC). */
  time: number;
  open: bigint;
  high: bigint;
  low: bigint;
  close: bigint;
  /** Lots traded in the bucket. */
  lots: bigint;
  /** Lots of trades whose taker bought. */
  buyLots: bigint;
  /** Lots of trades whose taker sold. */
  sellLots: bigint;
  trades: number;
}

const DAY = 86400;

/**
 * Chart timeframes. `offset` aligns the bucket start: the unix epoch was a Thursday,
 * so weekly buckets are shifted by 4 days to start on Monday 00:00 UTC.
 */
export const CANDLE_INTERVALS = [
  { id: "5m", seconds: 5 * 60, offset: 0 },
  { id: "15m", seconds: 15 * 60, offset: 0 },
  { id: "1h", seconds: 3600, offset: 0 },
  { id: "4h", seconds: 4 * 3600, offset: 0 },
  { id: "1D", seconds: DAY, offset: 0 },
  { id: "1W", seconds: 7 * DAY, offset: 4 * DAY },
] as const;

export type CandleInterval = (typeof CANDLE_INTERVALS)[number]["id"];

/** Start of the bucket that contains `at` (unix seconds). */
export function bucketStart(at: number, seconds: number, offset = 0): number {
  const rem = (((at - offset) % seconds) + seconds) % seconds;
  return at - rem;
}

/**
 * Groups trades into `intervalSecs` buckets, oldest first. Within a bucket trades are
 * ordered by time, then by the engine's match sequence (fills of one order share a
 * timestamp), so open and close are the first and last fills.
 */
export function buildCandles(trades: readonly TradeLike[], intervalSecs: number, offsetSecs = 0): Candle[] {
  const sorted = trades
    .map((t) => ({ t, at: Math.floor(Date.parse(t.matchedAt) / 1000) }))
    .filter((x) => Number.isFinite(x.at))
    .sort((a, b) => a.at - b.at || a.t.sequence - b.t.sequence);
  const out: Candle[] = [];
  const zero = BigInt(0);
  for (const { t, at } of sorted) {
    const time = bucketStart(at, intervalSecs, offsetSecs);
    const price = BigInt(t.price);
    const lots = BigInt(t.quantity) / BigInt(t.lotSize);
    const buy = t.takerSide === "buy" ? lots : zero;
    const sell = t.takerSide === "sell" ? lots : zero;
    const last = out[out.length - 1];
    if (last && last.time === time) {
      if (price > last.high) last.high = price;
      if (price < last.low) last.low = price;
      last.close = price;
      last.lots += lots;
      last.buyLots += buy;
      last.sellLots += sell;
      last.trades += 1;
    } else {
      out.push({ time, open: price, high: price, low: price, close: price, lots, buyLots: buy, sellLots: sell, trades: 1 });
    }
  }
  return out;
}

/** One time slot of the chart: a candle, or whitespace (no trade in that interval). */
export type ChartSlot = { time: number; candle: Candle | null };

/** Slots drawn at most; older history is left out (and the caller says so). */
export const MAX_CHART_SLOTS = 5000;

/**
 * Every interval from the first to the last candle, in order. Intervals without
 * trades are whitespace slots (`candle: null`), never a synthetic bar. When the span
 * exceeds `maxSlots`, only the most recent `maxSlots` intervals are kept.
 */
export function fillGaps(
  candles: readonly Candle[],
  intervalSecs: number,
  maxSlots = MAX_CHART_SLOTS,
): { slots: ChartSlot[]; truncated: boolean } {
  if (candles.length === 0) return { slots: [], truncated: false };
  const last = candles[candles.length - 1].time;
  const span = Math.floor((last - candles[0].time) / intervalSecs) + 1;
  const truncated = span > maxSlots;
  const first = truncated ? last - (maxSlots - 1) * intervalSecs : candles[0].time;
  const byTime = new Map(candles.map((c) => [c.time, c]));
  const slots: ChartSlot[] = [];
  for (let time = first; time <= last; time += intervalSecs) {
    slots.push({ time, candle: byTime.get(time) ?? null });
  }
  return { slots, truncated };
}

/**
 * Decimals needed to show every price exactly: at least 2, at most `decimals`
 * (the quote token's), so a tiny test price is never rounded to 0.00.
 */
export function pricePrecision(candles: readonly Candle[], decimals: number): number {
  const min = Math.min(2, decimals);
  for (let d = min; d < decimals; d++) {
    const step = BigInt(10) ** BigInt(decimals - d);
    const exact = candles.every((c) =>
      [c.open, c.high, c.low, c.close].every((p) => p % step === BigInt(0)),
    );
    if (exact) return d;
  }
  return decimals;
}
