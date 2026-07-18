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

// Decide se uma nova ordem cruza o livro (deveria executar na hora contra a
// melhor oferta do outro lado) ou se deve descansar como ordem aberta. Uma
// ordem de compra que cruza preenche ao melhor ask; uma venda que cruza
// preenche ao melhor bid — nunca vira um nível de livro com preço absurdo
// (é isso que causava o spread negativo antes desta correção).
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

// Atualiza qty/preço médio de uma posição a partir de um fill. Preço médio
// só muda quando a posição é aberta ou reforçada na mesma direção; ao
// reduzir, o preço médio da parte remanescente não muda; ao inverter de
// lado (cruzar o zero), o excedente abre uma posição nova no preço do fill.
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
