import type { Candle } from "./mock-candles";

export type IndicatorPoint = { time: number; value: number };

function sma(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    result.push(i >= period - 1 ? sum / period : null);
  }
  return result;
}

function ema(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    if (prev === null) {
      let seedSum = 0;
      for (let j = i - period + 1; j <= i; j++) seedSum += values[j];
      prev = seedSum / period;
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    result.push(prev);
  }
  return result;
}

function zip(candles: Candle[], values: (number | null)[]): IndicatorPoint[] {
  const out: IndicatorPoint[] = [];
  for (let i = 0; i < candles.length; i++) {
    const v = values[i];
    if (v !== null && v !== undefined && Number.isFinite(v)) {
      out.push({ time: candles[i].time, value: v });
    }
  }
  return out;
}

// --- overlays (sobre o preço) ---

export function calcSMA(candles: Candle[], period: number): IndicatorPoint[] {
  return zip(candles, sma(candles.map((c) => c.close), period));
}

export function calcEMA(candles: Candle[], period: number): IndicatorPoint[] {
  return zip(candles, ema(candles.map((c) => c.close), period));
}

export function calcBollingerBands(
  candles: Candle[],
  period = 20,
  mult = 2,
): { upper: IndicatorPoint[]; middle: IndicatorPoint[]; lower: IndicatorPoint[] } {
  const closes = candles.map((c) => c.close);
  const middleRaw = sma(closes, period);
  const upper: IndicatorPoint[] = [];
  const lower: IndicatorPoint[] = [];
  const middle: IndicatorPoint[] = [];

  for (let i = 0; i < candles.length; i++) {
    const mean = middleRaw[i];
    if (mean === null) continue;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) variance += (closes[j] - mean) ** 2;
    variance /= period;
    const sd = Math.sqrt(variance);
    middle.push({ time: candles[i].time, value: mean });
    upper.push({ time: candles[i].time, value: mean + mult * sd });
    lower.push({ time: candles[i].time, value: mean - mult * sd });
  }

  return { upper, middle, lower };
}

export function calcVWAP(candles: Candle[]): IndicatorPoint[] {
  let cumulativePV = 0;
  let cumulativeVolume = 0;
  return candles.map((c) => {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumulativePV += typicalPrice * c.volume;
    cumulativeVolume += c.volume;
    return {
      time: c.time,
      value: cumulativeVolume > 0 ? cumulativePV / cumulativeVolume : typicalPrice,
    };
  });
}

export function calcDonchianChannel(
  candles: Candle[],
  period = 20,
): { upper: IndicatorPoint[]; middle: IndicatorPoint[]; lower: IndicatorPoint[] } {
  const upper: IndicatorPoint[] = [];
  const lower: IndicatorPoint[] = [];
  const middle: IndicatorPoint[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      hi = Math.max(hi, candles[j].high);
      lo = Math.min(lo, candles[j].low);
    }
    upper.push({ time: candles[i].time, value: hi });
    lower.push({ time: candles[i].time, value: lo });
    middle.push({ time: candles[i].time, value: (hi + lo) / 2 });
  }

  return { upper, middle, lower };
}

// --- painéis separados ---

export function calcRSI(candles: Candle[], period = 14): IndicatorPoint[] {
  const closes = candles.map((c) => c.close);
  const result: IndicatorPoint[] = [];
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);

    if (i < period) {
      avgGain += gain;
      avgLoss += loss;
      continue;
    }
    if (i === period) {
      avgGain = (avgGain + gain) / period;
      avgLoss = (avgLoss + loss) / period;
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    result.push({ time: candles[i].time, value: rsi });
  }

  return result;
}

export function calcMACD(
  candles: Candle[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): { macd: IndicatorPoint[]; signal: IndicatorPoint[]; histogram: IndicatorPoint[] } {
  const closes = candles.map((c) => c.close);
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);

  const macdCompact: number[] = [];
  const compactToOriginal: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    const f = emaFast[i];
    const s = emaSlow[i];
    if (f !== null && s !== null) {
      macdCompact.push(f - s);
      compactToOriginal.push(i);
    }
  }
  const signalCompact = ema(macdCompact, signalPeriod);

  const macd: IndicatorPoint[] = [];
  const signal: IndicatorPoint[] = [];
  const histogram: IndicatorPoint[] = [];

  compactToOriginal.forEach((originalIdx, i) => {
    const time = candles[originalIdx].time;
    const macdValue = macdCompact[i];
    macd.push({ time, value: macdValue });

    const signalValue = signalCompact[i];
    if (signalValue !== null) {
      signal.push({ time, value: signalValue });
      histogram.push({ time, value: macdValue - signalValue });
    }
  });

  return { macd, signal, histogram };
}

export function calcStochastic(
  candles: Candle[],
  kPeriod = 14,
  kSmooth = 3,
  dSmooth = 3,
): { k: IndicatorPoint[]; d: IndicatorPoint[] } {
  const rawK: (number | null)[] = candles.map((c, i) => {
    if (i < kPeriod - 1) return null;
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      hi = Math.max(hi, candles[j].high);
      lo = Math.min(lo, candles[j].low);
    }
    const range = hi - lo;
    return range === 0 ? 50 : ((c.close - lo) / range) * 100;
  });

  const compact: number[] = [];
  const compactToOriginal: number[] = [];
  rawK.forEach((v, i) => {
    if (v !== null) {
      compact.push(v);
      compactToOriginal.push(i);
    }
  });

  const kSmoothCompact = sma(compact, kSmooth);
  const kValid: number[] = [];
  const kValidToOriginal: number[] = [];
  kSmoothCompact.forEach((v, i) => {
    if (v !== null) {
      kValid.push(v);
      kValidToOriginal.push(compactToOriginal[i]);
    }
  });
  const dCompact = sma(kValid, dSmooth);

  const k: IndicatorPoint[] = kValidToOriginal.map((originalIdx, i) => ({
    time: candles[originalIdx].time,
    value: kValid[i],
  }));
  const d: IndicatorPoint[] = [];
  dCompact.forEach((v, i) => {
    if (v !== null) d.push({ time: candles[kValidToOriginal[i]].time, value: v });
  });

  return { k, d };
}

export function calcATR(candles: Candle[], period = 14): IndicatorPoint[] {
  const trueRanges = candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const prevClose = candles[i - 1].close;
    return Math.max(
      c.high - c.low,
      Math.abs(c.high - prevClose),
      Math.abs(c.low - prevClose),
    );
  });
  return zip(candles, ema(trueRanges, period));
}

export function calcOBV(candles: Candle[]): IndicatorPoint[] {
  let obv = 0;
  return candles.map((c, i) => {
    if (i > 0) {
      if (c.close > candles[i - 1].close) obv += c.volume;
      else if (c.close < candles[i - 1].close) obv -= c.volume;
    }
    return { time: c.time, value: obv };
  });
}
