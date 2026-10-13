export type OrderSide = "buy" | "sell";

export type OpenOrder = {
  id: string;
  createdAt: number;
  symbol: string;
  side: OrderSide;
  qty: number;
  price: number;
};

export type Position = {
  symbol: string;
  // sinalizado: positivo = comprado, negativo = vendido
  qty: number;
  avgPrice: number;
};

export function getBestPrices(
  asks: { price: number }[],
  bids: { price: number }[],
): { bestAsk?: number; bestBid?: number } {
  const bestAsk = asks.length
    ? Math.min(...asks.map((order) => order.price))
    : undefined;
  const bestBid = bids.length
    ? Math.max(...bids.map((order) => order.price))
    : undefined;
  return { bestAsk, bestBid };
}

// Decides whether a new order crosses the book (and should execute
// immediately against the best order on the other side) or rest as an open
// order. A crossing buy fills at the best ask; a crossing sell fills at the
// best bid. It never becomes a book level with an absurd price (that is what
// caused the negative spread before this fix).
export function resolveOrder(
  side: OrderSide,
  price: number,
  bestAsk: number | undefined,
  bestBid: number | undefined,
): { crossed: boolean; fillPrice: number } {
  if (side === "buy" && bestAsk !== undefined && price >= bestAsk) {
    return { crossed: true, fillPrice: bestAsk };
  }
  if (side === "sell" && bestBid !== undefined && price <= bestBid) {
    return { crossed: true, fillPrice: bestBid };
  }
  return { crossed: false, fillPrice: price };
}

// Updates a position's qty/average price from a fill. The average price only
// changes when the position is opened or increased in the same direction;
// when reducing, the remaining part's average price doesn't change; when
// flipping sides (crossing zero), the excess opens a new position at the
// fill price.
export function applyFillToPosition(
  position: { qty: number; avgPrice: number } | undefined,
  side: OrderSide,
  qty: number,
  price: number,
): { qty: number; avgPrice: number } {
  const current = position ?? { qty: 0, avgPrice: 0 };
  const delta = side === "buy" ? qty : -qty;
  const newQty = current.qty + delta;

  if (current.qty === 0 || Math.sign(current.qty) === Math.sign(delta)) {
    const avgPrice =
      (Math.abs(current.qty) * current.avgPrice + qty * price) /
      (Math.abs(current.qty) + qty);
    return { qty: newQty, avgPrice };
  }

  if (newQty === 0 || Math.sign(newQty) === Math.sign(current.qty)) {
    return { qty: newQty, avgPrice: current.avgPrice };
  }

  return { qty: newQty, avgPrice: price };
}
