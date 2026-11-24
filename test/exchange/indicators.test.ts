import { describe, expect, it } from "vitest";
import {
  INDICATOR_GROUP,
  INDICATOR_MIN_CANDLES,
  calcSMA,
  hasEnoughData,
  indicatorSeries,
  type IndicatorCandle,
  type IndicatorId,
} from "@/lib/indicators";

const IDS = Object.keys(INDICATOR_GROUP) as IndicatorId[];

/** Deterministic candles with movement in both directions (no flat ranges). */
function candles(n: number): IndicatorCandle[] {
  return Array.from({ length: n }, (_, i) => {
    const close = 100 + 10 * Math.sin(i / 3) + i * 0.1;
    return { time: 1_800_000_000 + i * 3600, open: close - 0.5, high: close + 1, low: close - 1, close, volume: 1 + (i % 5) };
  });
}

describe("indicators: minimum real candles", () => {
  it("defines a minimum for every indicator", () => {
    expect(Object.keys(INDICATOR_MIN_CANDLES).sort()).toEqual([...IDS].sort());
  });

  it.each(IDS)("%s draws every series (≥2 points) exactly from its minimum", (id) => {
    const min = INDICATOR_MIN_CANDLES[id];
    const enough = indicatorSeries(id, candles(min));
    expect(enough.every((s) => s.length >= 2)).toBe(true);
    const short = indicatorSeries(id, candles(min - 1));
    expect(short.some((s) => s.length < 2)).toBe(true);
  });

  it("gates on the count of real candles", () => {
    expect(hasEnoughData("rsi", 15)).toBe(false);
    expect(hasEnoughData("rsi", 16)).toBe(true);
    expect(hasEnoughData("macd", 34)).toBe(false);
    expect(hasEnoughData("macd", 35)).toBe(true);
  });

  it("computes a simple moving average over the candles given", () => {
    const c = candles(4).map((x, i) => ({ ...x, close: [1, 2, 3, 4][i] }));
    expect(calcSMA(c, 2).map((p) => p.value)).toEqual([1.5, 2.5, 3.5]);
    expect(calcSMA(c, 2)[0].time).toBe(c[1].time);
  });
});
