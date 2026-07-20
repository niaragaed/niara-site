"use client";

import { useState } from "react";
import { PortfolioSummary } from "./PortfolioSummary";
import { PortfolioEvolution } from "./PortfolioEvolution";
import { AllocationDonut } from "./AllocationDonut";
import { HoldingsTable } from "./HoldingsTable";
import { AssetCatalog } from "./AssetCatalog";
import { en } from "@/lib/i18n/en";

type Tab = "portfolio" | "available";

export function PortfolioPage() {
  const [tab, setTab] = useState<Tab>("portfolio");

  return (
    <div className="flex min-h-[70vh] flex-col bg-bg-base">
      <div className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-xs text-text-secondary sm:text-sm">
        <span className="font-semibold text-warning">{en.common.demoLabel}</span> —{" "}
        {en.assets.demoBanner}
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl text-text-primary sm:text-3xl">
          {en.assets.heading}
        </h1>

        <div
          role="tablist"
          aria-label={en.assets.sectionsAriaLabel}
          className="mt-6 flex items-center gap-1 border-b border-border"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "portfolio"}
            onClick={() => setTab("portfolio")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === "portfolio"
                ? "border-accent-blue text-text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {en.assets.myPortfolioTab}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "available"}
            onClick={() => setTab("available")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === "available"
                ? "border-accent-blue text-text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {en.assets.availableAssetsTab}
          </button>
        </div>

        <div className="mt-6">
          {tab === "portfolio" ? (
            <div className="flex flex-col gap-6">
              <PortfolioSummary />
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <PortfolioEvolution />
                </div>
                <div className="lg:col-span-5">
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
