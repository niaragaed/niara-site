export type Candle = {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Timeframe = "5m" | "15m" | "1h" | "4h" | "1D" | "1S";

export const TIMEFRAMES: Timeframe[] = ["5m", "15m", "1h", "4h", "1D", "1S"];

const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  "5m": 5 * 60,
  "15m": 15 * 60,
  "1h": 60 * 60,
  "4h": 4 * 60 * 60,
  "1D": 24 * 60 * 60,
  "1S": 7 * 24 * 60 * 60,
};

const CANDLE_COUNT = 200;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// PRNG determinístico (mulberry32) — mesma seed sempre gera a mesma série,
// sem depender de Math.random().
function mulberry32(seed: number) {
  let state = seed;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// série sintética — substituir por feed real. Random walk determinístico
// (seed a partir de símbolo + timeframe) que termina no preço de
// referência do ativo, para casar com o cabeçalho e o livro de ofertas.
export function generateMockCandles(
  symbol: string,
  referencePrice: number,
  timeframe: Timeframe,
): Candle[] {
  const rand = mulberry32(hashString(`${symbol}:${timeframe}`));
  const stepSeconds = TIMEFRAME_SECONDS[timeframe];
  const lastTime =
    Math.floor(Date.now() / 1000 / stepSeconds) * stepSeconds;
  const floor = referencePrice * 0.02;
  const volatility = Math.max(referencePrice * 0.012, floor * 0.5);

  const candles: Candle[] = [];
  let close = referencePrice;

  for (let i = 0; i < CANDLE_COUNT; i++) {
    const time = lastTime - i * stepSeconds;
    const change = (rand() - 0.5) * 2 * volatility;
    const open = Math.max(close - change, floor);
    const high = Math.max(open, close) + rand() * volatility * 0.6;
    const low = Math.max(
      Math.min(open, close) - rand() * volatility * 0.6,
      floor,
    );
    const volume = Math.round(50 + rand() * 950);

    candles.push({ time, open, high, low, close, volume });
    close = open; // o open deste candle vira o close do candle anterior (mais antigo)
  }

  candles.reverse(); // ordem ascendente de tempo, como a lib exige
  return candles;
}
