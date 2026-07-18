"use client";

import { useState } from "react";
import { useExchange } from "./ExchangeContext";
import { useCurrency } from "@/context/CurrencyContext";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function OrdersPositionsPanel() {
  const [tab, setTab] = useState<"orders" | "positions">("orders");
  const { openOrders, positions, cancelOrder, closePosition, assets } = useExchange();
  const { currency, formatPlain } = useCurrency();

  const priceBySymbol = new Map(assets.map((asset) => [asset.symbol, asset.priceEth]));

  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-bg-surface">
      <div className="flex items-center border-b border-border">
        <div role="tablist" aria-label="Ordens e posições" className="flex">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "orders"}
            onClick={() => setTab("orders")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === "orders"
                ? "border-accent-blue text-text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            Ordens{openOrders.length > 0 ? ` (${openOrders.length})` : ""}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "positions"}
            onClick={() => setTab("positions")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === "positions"
                ? "border-accent-blue text-text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            Posições{positions.length > 0 ? ` (${positions.length})` : ""}
          </button>
        </div>
        <span className="ml-auto px-3 text-[10px] text-text-muted">
          Em memória — some ao recarregar a página
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "orders" ? (
          openOrders.length === 0 ? (
            <p className="p-6 text-center text-sm text-text-muted">
              Nenhuma ordem em aberto.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-text-muted">
                  <th className="px-3 py-2 font-normal">Hora</th>
                  <th className="px-3 py-2 font-normal">Ativo</th>
                  <th className="px-3 py-2 font-normal">Lado</th>
                  <th className="px-3 py-2 text-right font-normal">Qtd</th>
                  <th className="px-3 py-2 text-right font-normal">Preço ({currency})</th>
                  <th className="px-3 py-2 text-right font-normal">Total ({currency})</th>
                  <th className="px-3 py-2 font-normal">Status</th>
                  <th className="px-3 py-2 font-normal">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {openOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/60 font-mono tabular-nums">
                    <td className="px-3 py-2 text-text-muted">{formatTime(order.createdAt)}</td>
                    <td className="px-3 py-2 text-text-primary">{order.symbol}</td>
                    <td
                      className={`px-3 py-2 ${
                        order.side === "buy" ? "text-positive" : "text-negative"
                      }`}
                    >
                      {order.side === "buy" ? "Compra" : "Venda"}
                    </td>
                    <td className="px-3 py-2 text-right text-text-secondary">{order.qty}</td>
                    <td className="px-3 py-2 text-right text-text-secondary">
                      {formatPlain(order.price, 6)}
                    </td>
                    <td className="px-3 py-2 text-right text-text-secondary">
                      {formatPlain(order.qty * order.price, 6)}
                    </td>
                    <td className="px-3 py-2 text-text-muted">Aberta</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => cancelOrder(order.id)}
                        className="rounded border border-border px-2 py-1 font-sans text-[11px] text-text-secondary transition-colors hover:border-negative/40 hover:text-negative"
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : positions.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-muted">Nenhuma posição.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-text-muted">
                <th className="px-3 py-2 font-normal">Ativo</th>
                <th className="px-3 py-2 text-right font-normal">Qtd</th>
                <th className="px-3 py-2 text-right font-normal">Preço médio ({currency})</th>
                <th className="px-3 py-2 text-right font-normal">Preço atual ({currency})</th>
                <th className="px-3 py-2 text-right font-normal">P/L ({currency})</th>
                <th className="px-3 py-2 font-normal">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => {
                const currentPrice =
                  priceBySymbol.get(position.symbol) ?? position.avgPrice;
                const pnl = (currentPrice - position.avgPrice) * position.qty;
                const notional = Math.abs(position.qty) * position.avgPrice;
                const pnlPct = notional > 0 ? (pnl / notional) * 100 : 0;
                const positive = pnl >= 0;
                return (
                  <tr
                    key={position.symbol}
                    className="border-b border-border/60 font-mono tabular-nums"
                  >
                    <td className="px-3 py-2 text-text-primary">{position.symbol}</td>
                    <td className="px-3 py-2 text-right text-text-secondary">
                      {position.qty > 0 ? "+" : ""}
                      {position.qty}
                    </td>
                    <td className="px-3 py-2 text-right text-text-secondary">
                      {formatPlain(position.avgPrice, 6)}
                    </td>
                    <td className="px-3 py-2 text-right text-text-secondary">
                      {formatPlain(currentPrice, 6)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right ${
                        positive ? "text-positive" : "text-negative"
                      }`}
                    >
                      {positive ? "+" : ""}
                      {formatPlain(pnl, 6)} ({positive ? "+" : ""}
                      {pnlPct.toFixed(2)}%)
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => closePosition(position.symbol)}
                        className="rounded border border-border px-2 py-1 font-sans text-[11px] text-text-secondary transition-colors hover:border-accent-blue/40 hover:text-text-primary"
                      >
                        Zerar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
