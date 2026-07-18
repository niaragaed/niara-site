"use client";

import { useExchange } from "./ExchangeContext";
import { getBestPrices } from "@/lib/trading";
import type { BookOrder } from "@/lib/mock-orderbook";

function DepthBar({
  qty,
  maxQty,
  side,
}: {
  qty: number;
  maxQty: number;
  side: "buy" | "sell";
}) {
  // normalizado pela maior quantidade do lado e sempre travado em 100% —
  // uma ordem gigante nunca estoura a escala, só vira a barra "cheia".
  const pct = maxQty > 0 ? Math.min(100, (qty / maxQty) * 100) : 0;
  const colorVar =
    side === "buy" ? "var(--color-positive)" : "var(--color-negative)";
  return (
    <span
      aria-hidden="true"
      className="absolute inset-y-0 right-0"
      style={{
        width: `${pct}%`,
        background: `color-mix(in srgb, ${colorVar} 15%, transparent)`,
      }}
    />
  );
}

function OrderRow({
  order,
  maxQty,
  symbol,
}: {
  order: BookOrder;
  maxQty: number;
  symbol: string;
}) {
  const isBuy = order.side === "buy";
  return (
    <div
      className={`relative grid grid-cols-3 items-center gap-2 overflow-hidden px-3 py-1 font-mono text-xs tabular-nums ${
        order.isUser ? "ring-1 ring-inset ring-accent-cyan/40" : ""
      }`}
    >
      <DepthBar qty={order.qty} maxQty={maxQty} side={order.side} />
      <span className="relative z-10 text-text-secondary">
        {order.qty.toFixed(0)}
      </span>
      <span className="relative z-10 text-text-muted">{symbol}</span>
      <span
        className={`relative z-10 text-right ${isBuy ? "text-positive" : "text-negative"}`}
      >
        {order.price.toFixed(4)}
      </span>
    </div>
  );
}

export function OrderBook() {
  const { selectedAsset, bookForSelected } = useExchange();
  const { asks, bids } = bookForSelected;

  const maxAskQty = Math.max(...asks.map((order) => order.qty), 1);
  const maxBidQty = Math.max(...bids.map((order) => order.qty), 1);

  const { bestAsk, bestBid } = getBestPrices(asks, bids);
  // por construção (ordens que cruzam o livro executam na hora, ver
  // trading.ts) bestAsk nunca fica abaixo de bestBid — o clamp aqui é só
  // uma rede de segurança para nunca exibir spread negativo.
  const spread =
    bestAsk !== undefined && bestBid !== undefined
      ? Math.max(bestAsk - bestBid, 0)
      : 0;
  const spreadPct = bestAsk ? (spread / bestAsk) * 100 : 0;

  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-bg-surface">
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold text-text-primary">
          Livro de ofertas
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wide text-text-muted">
        <span>Qtd.</span>
        <span>Ativo</span>
        <span className="text-right">Preço (ETH)</span>
      </div>

      <div className="flex-1 overflow-auto">
        <div>
          {asks.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              maxQty={maxAskQty}
              symbol={selectedAsset.symbol}
            />
          ))}
        </div>

        <div className="flex items-center justify-between border-y border-border bg-bg-elevated px-3 py-2 font-mono text-xs tabular-nums text-text-muted">
          <span>Spread</span>
          <span>
            {spread.toFixed(6)} ETH ({spreadPct.toFixed(2)}%)
          </span>
        </div>

        <div>
          {bids.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              maxQty={maxBidQty}
              symbol={selectedAsset.symbol}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
