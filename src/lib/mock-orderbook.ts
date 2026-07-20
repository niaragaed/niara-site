import type { OrderSide } from "./trading";

export type { OrderSide };

export type BookOrder = {
  id: string;
  side: OrderSide;
  qty: number;
  price: number;
  isUser?: boolean;
};

const DEPTH = 8;
const STEP = 0.0015; // 0.15% por nível

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Livro simulado gerado em torno do preço do ativo — determinístico (sem
// Math.random) para não gerar mismatch entre render no servidor e no
// cliente. Dados ilustrativos, não refletem oferta/demanda real.
export function generateMockOrderBook(
  symbol: string,
  priceUsdt: number,
): { bids: BookOrder[]; asks: BookOrder[] } {
  const seed = hashString(symbol);

  const asks: BookOrder[] = [];
  const bids: BookOrder[] = [];

  for (let i = 0; i < DEPTH; i++) {
    const offset = (i + 1) * STEP;
    const askQty = 5 + ((seed + i * 17) % 60);
    const bidQty = 5 + ((seed + i * 23) % 60);

    asks.push({
      id: `ask-${symbol}-${i}`,
      side: "sell",
      qty: askQty,
      price: priceUsdt * (1 + offset),
    });
    bids.push({
      id: `bid-${symbol}-${i}`,
      side: "buy",
      qty: bidQty,
      price: priceUsdt * (1 - offset),
    });
  }

  asks.sort((a, b) => b.price - a.price);
  bids.sort((a, b) => b.price - a.price);

  return { bids, asks };
}
