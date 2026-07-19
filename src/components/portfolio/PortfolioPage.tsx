"use client";

import { useState } from "react";
import { PortfolioSummary } from "./PortfolioSummary";
import { PortfolioEvolution } from "./PortfolioEvolution";
import { AllocationDonut } from "./AllocationDonut";
import { HoldingsTable } from "./HoldingsTable";
import { AssetCatalog } from "./AssetCatalog";

type Tab = "carteira" | "disponiveis";

export function PortfolioPage() {
  const [tab, setTab] = useState<Tab>("carteira");

  return (
    <div className="flex min-h-[70vh] flex-col bg-bg-base">
      <div className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-xs text-text-secondary sm:text-sm">
        <span className="font-semibold text-warning">Demonstração</span> —
        carteira simulada. Não reflete posições ou valores reais.
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl text-text-primary sm:text-3xl">
          Ativos
        </h1>

        <div
          role="tablist"
          aria-label="Seções de ativos"
          className="mt-6 flex items-center gap-1 border-b border-border"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "carteira"}
            onClick={() => setTab("carteira")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === "carteira"
                ? "border-accent-blue text-text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            Minha carteira
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "disponiveis"}
            onClick={() => setTab("disponiveis")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === "disponiveis"
                ? "border-accent-blue text-text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            Ativos disponíveis
          </button>
        </div>

        <div className="mt-6">
          {tab === "carteira" ? (
            <div className="flex flex-col gap-6">
              <PortfolioSummary />
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <PortfolioEvolution />
                </div>
                <div>
                  <AllocationDonut />
                </div>
              </div>
              <HoldingsTable />
            </div>
          ) : (
            <AssetCatalog />
          )}
        </div>
      </div>
    </div>
  );
}
