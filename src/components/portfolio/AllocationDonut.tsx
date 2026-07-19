"use client";

import { useMemo, useState } from "react";
import { Globe } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { MOCK_ASSETS, type Asset } from "@/lib/mock-assets";
import { MOCK_HOLDINGS } from "@/lib/mock-portfolio";
import { useCurrency } from "@/context/CurrencyContext";

type ViewMode = "classe" | "ativo" | "regiao";

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "classe", label: "Por classe" },
  { value: "ativo", label: "Por ativo" },
  { value: "regiao", label: "Por país/região" },
];

// paleta derivada dos tokens de acento (variação de luminosidade via
// color-mix, não cores arbitrárias) — mantém a identidade da Niara
const PALETTE = [
  "var(--color-accent-blue)",
  "var(--color-accent-violet)",
  "var(--color-accent-cyan)",
  "var(--color-positive)",
  "color-mix(in srgb, var(--color-accent-blue) 55%, white)",
  "color-mix(in srgb, var(--color-accent-violet) 55%, white)",
  "color-mix(in srgb, var(--color-accent-cyan) 45%, black)",
  "color-mix(in srgb, var(--color-positive) 45%, black)",
];

type AllocationItem = {
  key: string;
  value: number;
  pct: number;
  asset?: Asset;
};

function computeAllocation(mode: ViewMode): AllocationItem[] {
  const assetBySymbol = new Map(MOCK_ASSETS.map((asset) => [asset.symbol, asset]));
  const totals = new Map<string, number>();

  for (const holding of MOCK_HOLDINGS) {
    const asset = assetBySymbol.get(holding.symbol);
    if (!asset) continue;
    const value = holding.qty * asset.priceEth;
    const key =
      mode === "classe" ? asset.assetClass : mode === "regiao" ? asset.region : asset.symbol;
    totals.set(key, (totals.get(key) ?? 0) + value);
  }

  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);

  return [...totals.entries()]
    .map(([key, value]) => ({
      key,
      value,
      pct: total > 0 ? (value / total) * 100 : 0,
      asset: mode === "ativo" ? assetBySymbol.get(key) : undefined,
    }))
    .sort((a, b) => b.value - a.value);
}

function RegionFlag({ region }: { region: string }) {
  const code = region === "BR" ? "br" : region === "US" ? "us" : region === "EU" ? "eu" : undefined;
  if (code) {
    return <span className={`fi fi-${code} rounded-[2px] text-sm`} aria-hidden="true" />;
  }
  return <Globe className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />;
}

// tipo local (em vez do genérico do Recharts) — evita conflito de
// variância entre o `content` inferido pelo <Tooltip> e um genérico
// explícito <number, string>; só precisamos destes campos mesmo.
type DonutTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: AllocationItem }>;
  format: (value: number) => string;
};

function DonutTooltip({ active, payload, format }: DonutTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-text-primary">{item.key}</p>
      <p className="font-mono tabular-nums text-text-secondary">
        {item.pct.toFixed(1)}% · {format(item.value)}
      </p>
    </div>
  );
}

export function AllocationDonut() {
  const { format } = useCurrency();
  const [mode, setMode] = useState<ViewMode>("classe");

  const data = useMemo(() => computeAllocation(mode), [mode]);

  return (
    <div className="rounded-md border border-border bg-bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-text-primary">Alocação</h2>
        <div role="group" aria-label="Ver alocação" className="flex items-center gap-1">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={mode === option.value}
              onClick={() => setMode(option.value)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                mode === option.value
                  ? "bg-bg-elevated text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div aria-hidden="true" className="mx-auto h-56 w-56 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="key"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={2}
                stroke="var(--color-bg-surface)"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.key} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={(props) => <DonutTooltip {...props} format={format} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="min-w-0 flex-1 divide-y divide-border">
          {data.map((item, index) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3 py-1.5 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
                />
                {mode === "regiao" && <RegionFlag region={item.key} />}
                {mode === "ativo" && item.asset?.country && (
                  <span
                    className={`fi fi-${item.asset.country} rounded-[2px] text-sm`}
                    aria-hidden="true"
                  />
                )}
                <span className="truncate text-text-secondary">{item.key}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3 font-mono text-xs tabular-nums">
                <span className="text-text-muted">{item.pct.toFixed(1)}%</span>
                <span className="text-text-primary">{format(item.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
