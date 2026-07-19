"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Coins } from "lucide-react";
import { MOCK_ASSETS } from "@/lib/mock-assets";
import { MOCK_HOLDINGS } from "@/lib/mock-portfolio";
import { useCurrency } from "@/context/CurrencyContext";
import { Flag } from "@/components/ui/Flag";

type Row = {
  symbol: string;
  name: string;
  country?: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  pctOfPortfolio: number;
  pl: number;
  plPct: number;
};

type SortKey =
  | "symbol"
  | "qty"
  | "avgPrice"
  | "currentPrice"
  | "totalValue"
  | "pctOfPortfolio"
  | "pl";

function buildRows(): Row[] {
  const assetBySymbol = new Map(MOCK_ASSETS.map((asset) => [asset.symbol, asset]));
  const rows: Row[] = [];

  for (const holding of MOCK_HOLDINGS) {
    const asset = assetBySymbol.get(holding.symbol);
    if (!asset) continue;
    const totalValue = holding.qty * asset.priceEth;
    const investedValue = holding.qty * holding.avgPriceEth;
    const pl = totalValue - investedValue;
    const plPct = investedValue > 0 ? (pl / investedValue) * 100 : 0;
    rows.push({
      symbol: asset.symbol,
      name: asset.name,
      country: asset.country,
      qty: holding.qty,
      avgPrice: holding.avgPriceEth,
      currentPrice: asset.priceEth,
      totalValue,
      pctOfPortfolio: 0,
      pl,
      plPct,
    });
  }

  const grandTotal = rows.reduce((sum, row) => sum + row.totalValue, 0);
  return rows.map((row) => ({
    ...row,
    pctOfPortfolio: grandTotal > 0 ? (row.totalValue / grandTotal) * 100 : 0,
  }));
}

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "symbol", label: "Ativo" },
  { key: "qty", label: "Quantidade", align: "right" },
  { key: "avgPrice", label: "Preço médio", align: "right" },
  { key: "currentPrice", label: "Preço atual", align: "right" },
  { key: "totalValue", label: "Valor total", align: "right" },
  { key: "pctOfPortfolio", label: "% da carteira", align: "right" },
  { key: "pl", label: "P/L", align: "right" },
];

export function HoldingsTable() {
  const { format, formatPlain } = useCurrency();
  const [sortKey, setSortKey] = useState<SortKey>("totalValue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => buildRows(), []);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const diff =
        sortKey === "symbol" ? a.symbol.localeCompare(b.symbol) : a[sortKey] - b[sortKey];
      return sortDir === "asc" ? diff : -diff;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="rounded-md border border-border bg-bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary">Posições</h2>
      </div>

      {sortedRows.length === 0 ? (
        <p className="p-6 text-center text-sm text-text-muted">
          Nenhuma posição na carteira simulada.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-text-muted">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-2 font-normal ${col.align === "right" ? "text-right" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className={`inline-flex items-center gap-1 transition-colors hover:text-text-secondary ${
                        col.align === "right" ? "flex-row-reverse" : ""
                      }`}
                    >
                      {col.label}
                      {sortKey === col.key &&
                        (sortDir === "asc" ? (
                          <ArrowUp className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-3 w-3" aria-hidden="true" />
                        ))}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                const positive = row.pl >= 0;
                return (
                  <tr
                    key={row.symbol}
                    className="border-b border-border/60 font-mono tabular-nums"
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2 font-sans">
                        {row.country ? (
                          <Flag country={row.country} size="sm" />
                        ) : (
                          <Coins className="h-4 w-4 text-text-muted" aria-hidden="true" />
                        )}
                        <span className="font-medium text-text-primary">{row.symbol}</span>
                        <span className="hidden text-text-muted sm:inline">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right text-text-secondary">{row.qty}</td>
                    <td className="px-4 py-2 text-right text-text-secondary">
                      {formatPlain(row.avgPrice, 6)}
                    </td>
                    <td className="px-4 py-2 text-right text-text-secondary">
                      {formatPlain(row.currentPrice, 6)}
                    </td>
                    <td className="px-4 py-2 text-right text-text-primary">
                      {format(row.totalValue)}
                    </td>
                    <td className="px-4 py-2 text-right text-text-secondary">
                      {row.pctOfPortfolio.toFixed(1)}%
                    </td>
                    <td
                      className={`px-4 py-2 text-right ${positive ? "text-positive" : "text-negative"}`}
                    >
                      {positive ? "+" : ""}
                      {format(row.pl)} ({positive ? "+" : ""}
                      {row.plPct.toFixed(2)}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
