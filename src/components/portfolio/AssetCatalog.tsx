"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Coins, Search } from "lucide-react";
import { MOCK_ASSETS, type Asset, type AssetClass, type Region } from "@/lib/mock-assets";
import { useCurrency } from "@/context/CurrencyContext";
import { Flag } from "@/components/ui/Flag";
import { en } from "@/lib/i18n/en";

const CLASS_FILTERS: AssetClass[] = ["Stocks", "ETFs", "Commodities", "Crypto", "Stablecoins"];
const REGION_FILTERS: Region[] = ["BR", "US", "EU", "Global"];

function AssetFlag({ asset }: { asset: Asset }) {
  if (asset.country) {
    return <Flag country={asset.country} size="sm" />;
  }
  return <Coins className="h-4 w-4 text-text-muted" aria-hidden="true" />;
}

export function AssetCatalog() {
  const { format, formatPlain } = useCurrency();
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<AssetClass | "All">("All");
  const [regionFilter, setRegionFilter] = useState<Region | "All">("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_ASSETS.filter((asset) => {
      const matchesQuery =
        !q || asset.symbol.toLowerCase().includes(q) || asset.name.toLowerCase().includes(q);
      const matchesClass = classFilter === "All" || asset.assetClass === classFilter;
      const matchesRegion = regionFilter === "All" || asset.region === regionFilter;
      return matchesQuery && matchesClass && matchesRegion;
    });
  }, [query, classFilter, regionFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-md border border-border bg-bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <label htmlFor="catalog-search" className="sr-only">
            {en.assets.catalog.searchLabel}
          </label>
          <input
            id="catalog-search"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={en.assets.catalog.searchPlaceholder}
            className="w-full rounded-md border border-border bg-bg-base py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-blue"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="catalog-class" className="sr-only">
            {en.assets.catalog.classFilterLabel}
          </label>
          <select
            id="catalog-class"
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value as AssetClass | "All")}
            className="rounded-md border border-border bg-bg-base px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
          >
            <option value="All">{en.assets.catalog.allClasses}</option>
            {CLASS_FILTERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label htmlFor="catalog-region" className="sr-only">
            {en.assets.catalog.regionFilterLabel}
          </label>
          <select
            id="catalog-region"
            value={regionFilter}
            onChange={(event) => setRegionFilter(event.target.value as Region | "All")}
            className="rounded-md border border-border bg-bg-base px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
          >
            <option value="All">{en.assets.catalog.allRegions}</option>
            {REGION_FILTERS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-md border border-border bg-bg-surface">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-muted">
            {en.assets.catalog.empty}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-text-muted">
                  <th scope="col" className="px-4 py-2 font-normal">
                    {en.assets.catalog.asset}
                  </th>
                  <th scope="col" className="px-4 py-2 font-normal">
                    {en.assets.catalog.assetClass}
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-normal">
                    {en.assets.catalog.price}
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-normal">
                    {en.assets.catalog.change24h}
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-normal">
                    {en.assets.catalog.volume24h}
                  </th>
                  <th scope="col" className="px-4 py-2 font-normal">
                    <span className="sr-only">{en.assets.catalog.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((asset) => {
                  const positive = asset.change24h >= 0;
                  return (
                    <tr
                      key={asset.symbol}
                      className="border-b border-border/60 font-mono tabular-nums"
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2 font-sans">
                          <AssetFlag asset={asset} />
                          <span className="font-medium text-text-primary">{asset.symbol}</span>
                          <span className="hidden text-text-muted sm:inline">{asset.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 font-sans text-text-secondary">
                        {asset.assetClass}
                      </td>
                      <td className="px-4 py-2 text-right text-text-primary">
                        {format(asset.priceEth)}
                      </td>
                      <td
                        className={`px-4 py-2 text-right ${positive ? "text-positive" : "text-negative"}`}
                      >
                        {positive ? "+" : ""}
                        {asset.change24h.toFixed(2)}%
                      </td>
                      <td className="px-4 py-2 text-right text-text-secondary">
                        {formatPlain(asset.volume24hEth)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/trade?asset=${asset.symbol}`}
                          className="rounded border border-border px-2 py-1 font-sans text-[11px] text-text-secondary transition-colors hover:border-accent-blue/40 hover:text-text-primary"
                        >
                          {en.assets.catalog.trade}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
