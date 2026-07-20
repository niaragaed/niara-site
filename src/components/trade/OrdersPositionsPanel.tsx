"use client";

import { useState } from "react";
import { useExchange } from "./ExchangeContext";
import { useCurrency } from "@/context/CurrencyContext";
import { en } from "@/lib/i18n/en";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
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
        <div role="tablist" aria-label={en.trade.ordersPositions.tabsAriaLabel} className="flex">
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
            {en.trade.ordersPositions.ordersTab}
            {openOrders.length > 0 ? ` (${openOrders.length})` : ""}
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
            {en.trade.ordersPositions.positionsTab}
            {positions.length > 0 ? ` (${positions.length})` : ""}
          </button>
        </div>
        <span className="ml-auto px-3 text-[10px] text-text-muted">
          {en.trade.ordersPositions.memoryHint}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "orders" ? (
          openOrders.length === 0 ? (
            <p className="p-6 text-center text-sm text-text-muted">
              {en.trade.ordersPositions.noOpenOrders}
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-text-muted">
                  <th className="px-3 py-2 font-normal">{en.trade.ordersPositions.time}</th>
                  <th className="px-3 py-2 font-normal">{en.trade.ordersPositions.asset}</th>
                  <th className="px-3 py-2 font-normal">{en.trade.ordersPositions.side}</th>
                  <th className="px-3 py-2 text-right font-normal">{en.trade.ordersPositions.qty}</th>
                  <th className="px-3 py-2 text-right font-normal">
                    {en.trade.ordersPositions.price} ({currency})
                  </th>
                  <th className="px-3 py-2 text-right font-normal">
                    {en.trade.ordersPositions.total} ({currency})
                  </th>
                  <th className="px-3 py-2 font-normal">{en.trade.ordersPositions.status}</th>
                  <th className="px-3 py-2 font-normal">
                    <span className="sr-only">{en.trade.ordersPositions.actions}</span>
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
                      {order.side === "buy"
                        ? en.trade.ordersPositions.buy
                        : en.trade.ordersPositions.sell}
                    </td>
                    <td className="px-3 py-2 text-right text-text-secondary">{order.qty}</td>
                    <td className="px-3 py-2 text-right text-text-secondary">
                      {formatPlain(order.price, 6)}
                    </td>
                    <td className="px-3 py-2 text-right text-text-secondary">
                      {formatPlain(order.qty * order.price, 6)}
                    </td>
                    <td className="px-3 py-2 text-text-muted">{en.trade.ordersPositions.open}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => cancelOrder(order.id)}
                        className="rounded border border-border px-2 py-1 font-sans text-[11px] text-text-secondary transition-colors hover:border-negative/40 hover:text-negative"
                      >
                        {en.trade.ordersPositions.cancel}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : positions.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-muted">
            {en.trade.ordersPositions.noPositions}
          </p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-text-muted">
                <th className="px-3 py-2 font-normal">{en.trade.ordersPositions.asset}</th>
                <th className="px-3 py-2 text-right font-normal">{en.trade.ordersPositions.qty}</th>
                <th className="px-3 py-2 text-right font-normal">
                  {en.trade.ordersPositions.avgPrice} ({currency})
                </th>
                <th className="px-3 py-2 text-right font-normal">
                  {en.trade.ordersPositions.currentPrice} ({currency})
                </th>
                <th className="px-3 py-2 text-right font-normal">
                  {en.trade.ordersPositions.pnl} ({currency})
                </th>
                <th className="px-3 py-2 font-normal">
                  <span className="sr-only">{en.trade.ordersPositions.actions}</span>
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
                        {en.trade.ordersPositions.closePosition}
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
