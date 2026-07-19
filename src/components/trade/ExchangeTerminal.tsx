"use client";

import { ExchangeProvider, useExchange } from "./ExchangeContext";
import { TerminalHeader } from "./TerminalHeader";
import { AccountBar } from "./AccountBar";
import { AssetSearch } from "./AssetSearch";
import { PriceChart } from "./PriceChart";
import { OrderBook } from "./OrderBook";
import { OrderForm } from "./OrderForm";
import { OrdersPositionsPanel } from "./OrdersPositionsPanel";

// Ordem no DOM = ordem no mobile (empilhado, uma coluna). No desktop, cada
// item é reposicionado por linha/coluna explícitas (col-start/row-start),
// que independem da ordem no DOM — é o que permite o cabeçalho do ativo e o
// livro compartilharem a coluna estreita da direita (linhas 1 e 2) enquanto
// o gráfico ocupa as duas linhas de uma vez na coluna larga, sem quebrar a
// sequência pedida para o mobile (cabeçalho, gráfico, boleta, livro,
// ordens/posições).
function ExchangeLayout() {
  const { selectedAsset } = useExchange();

  return (
    <div className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,2fr)_360px] lg:grid-rows-[auto_minmax(420px,1fr)_auto]">
      <div className="lg:col-start-2 lg:row-start-1">
        <AssetSearch />
      </div>

      <div className="h-64 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:h-auto lg:min-h-[420px]">
        <PriceChart />
      </div>

      <div className="lg:col-start-2 lg:row-start-3">
        <OrderForm key={selectedAsset.symbol} />
      </div>

      <div className="min-h-[240px] lg:col-start-2 lg:row-start-2">
        <OrderBook />
      </div>

      <div className="h-80 lg:col-start-1 lg:row-start-3 lg:h-auto">
        <OrdersPositionsPanel />
      </div>
    </div>
  );
}

export function ExchangeTerminal({ initialSymbol }: { initialSymbol?: string }) {
  return (
    <ExchangeProvider initialSymbol={initialSymbol}>
      <div className="flex min-h-[70vh] flex-col bg-bg-base">
        <div className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-xs text-text-secondary sm:text-sm">
          <span className="font-semibold text-warning">Demonstração</span> —
          dados simulados. Nenhuma ordem é executada e nenhum ativo real é
          negociado.
        </div>

        <TerminalHeader />
        <AccountBar />

        <ExchangeLayout />
      </div>
    </ExchangeProvider>
  );
}
