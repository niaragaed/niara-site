"use client";

import { useState } from "react";
import { MOCK_ASSETS, type Asset } from "@/lib/mock-assets";
import type { BookOrder, OrderSide } from "@/lib/mock-orderbook";
import { TerminalHeader } from "./TerminalHeader";
import { AssetSearch } from "./AssetSearch";
import { OrderForm } from "./OrderForm";
import { OrderBook } from "./OrderBook";

export function ExchangeTerminal() {
  const [selected, setSelected] = useState<Asset>(MOCK_ASSETS[0]);
  const [ordersBySymbol, setOrdersBySymbol] = useState<
    Record<string, BookOrder[]>
  >({});

  const userOrders = ordersBySymbol[selected.symbol] ?? [];

  function handleExecute(order: {
    side: OrderSide;
    qty: number;
    price: number;
  }) {
    const newOrder: BookOrder = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      side: order.side,
      qty: order.qty,
      price: order.price,
      isUser: true,
    };
    setOrdersBySymbol((prev) => ({
      ...prev,
      [selected.symbol]: [newOrder, ...(prev[selected.symbol] ?? [])],
    }));
  }

  return (
    <div className="flex min-h-[70vh] flex-col bg-bg-base">
      <div className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-xs text-text-secondary sm:text-sm">
        <span className="font-semibold text-warning">Demonstração</span> —
        dados simulados. Nenhuma ordem é executada e nenhum ativo real é
        negociado.
      </div>

      <TerminalHeader />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <AssetSearch
          assets={MOCK_ASSETS}
          selected={selected}
          onSelect={setSelected}
        />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <OrderForm
              key={selected.symbol}
              asset={selected}
              onExecute={handleExecute}
            />
          </div>
          <div className="lg:col-span-2">
            <OrderBook asset={selected} userOrders={userOrders} />
          </div>
        </div>
      </div>
    </div>
  );
}
