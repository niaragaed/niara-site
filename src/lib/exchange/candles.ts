// Candles built ONLY from settled trades (`GET /v1/trades`). A bucket without
// trades has no candle: nothing is interpolated or carried forward.

export interface TradeLike {
  /** USDT base units per lot (decimal string). */
  price: string;
  /** Asset base units (decimal string). */
  quantity: string;
  lotSize: string;
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
  trades: number;
}

export const CANDLE_INTERVALS = [
  { id: "1h", seconds: 3600 },
  { id: "4h", seconds: 4 * 3600 },
  { id: "1d", seconds: 86400 },
] as const;

export type CandleInterval = (typeof CANDLE_INTERVALS)[number]["id"];

/**
 * Groups trades into `intervalSecs` buckets, oldest first. Within a bucket trades are
 * ordered by time, then by the engine's match sequence (fills of one order share a
 * timestamp), so open and close are the first and last fills.
 */
export function buildCandles(trades: readonly TradeLike[], intervalSecs: number): Candle[] {
  const sorted = trades
    .map((t) => ({ t, at: Math.floor(Date.parse(t.matchedAt) / 1000) }))
    .filter((x) => Number.isFinite(x.at))
    .sort((a, b) => a.at - b.at || a.t.sequence - b.t.sequence);
  const out: Candle[] = [];
  for (const { t, at } of sorted) {
    const time = at - (at % intervalSecs);
    const price = BigInt(t.price);
    const lots = BigInt(t.quantity) / BigInt(t.lotSize);
    const last = out[out.length - 1];
    if (last && last.time === time) {
      if (price > last.high) last.high = price;
      if (price < last.low) last.low = price;
      last.close = price;
      last.lots += lots;
      last.trades += 1;
    } else {
      out.push({ time, open: price, high: price, low: price, close: price, lots, trades: 1 });
    }
  }
  return out;
}
