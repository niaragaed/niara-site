"use client";

import { useMemo, useState } from "react";
import { Coins, Search } from "lucide-react";
import type { Asset } from "@/lib/mock-assets";
import { useExchange } from "./ExchangeContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Flag } from "@/components/ui/Flag";

function AssetIcon({ asset, size }: { asset: Asset; size: "sm" | "lg" }) {
  if (asset.country) {
    return <Flag country={asset.country} size={size} />;
  }
  const boxSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return <Coins className={`${boxSize} text-text-muted`} aria-hidden="true" />;
}

export function AssetSearch() {
  const { assets, selectedAsset: selected, selectAsset: onSelect } = useExchange();
  const { format } = useCurrency();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter(
      (asset) =>
        asset.symbol.toLowerCase().includes(q) ||
        asset.name.toLowerCase().includes(q),
    );
  }, [assets, query]);

  const positive = selected.change24h >= 0;

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
        <label htmlFor="asset-search" className="sr-only">
          Buscar ativo
        </label>
        <input
          id="asset-search"
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar ativo (ex.: PETR4)"
          className="w-full rounded-md border border-border bg-bg-base py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-blue"
        />
        {open && filtered.length > 0 && (
          <ul
            role="listbox"
            aria-label="Resultados da busca de ativos"
            className="absolute right-0 z-30 mt-1 max-h-80 w-max min-w-[280px] overflow-y-auto overflow-x-hidden rounded-md border border-border bg-bg-elevated py-1 shadow-lg [scrollbar-color:var(--color-border)_transparent] [scrollbar-width:thin]"
          >
            {filtered.map((asset) => (
              <li key={asset.symbol}>
                <button
                  type="button"
                  role="option"
                  aria-selected={asset.symbol === selected.symbol}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelect(asset);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary focus-visible:bg-bg-surface focus-visible:text-text-primary focus-visible:outline-none"
                >
                  <AssetIcon asset={asset} size="sm" />
                  <span className="font-medium text-text-primary">{asset.symbol}</span>
                  <span className="truncate text-text-muted">{asset.name}</span>
                  <span className="ml-auto shrink-0 whitespace-nowrap font-mono text-xs tabular-nums text-text-secondary">
                    {format(asset.priceEth)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-3">
        <AssetIcon asset={selected} size="lg" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-text-primary">
              {selected.symbol}
            </span>
            <span className="text-sm text-text-muted">{selected.name}</span>
          </div>
        </div>
        <div className="ml-2 text-right font-mono tabular-nums">
          <div className="text-base text-text-primary">
            {format(selected.priceEth)}
          </div>
          <div className={`text-sm ${positive ? "text-positive" : "text-negative"}`}>
            {positive ? "+" : ""}
            {selected.change24h.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}
