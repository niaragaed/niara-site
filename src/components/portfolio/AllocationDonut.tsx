"use client";

import { useMemo, useState } from "react";
import { Globe } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { MOCK_ASSETS, type Asset } from "@/lib/mock-assets";
import { MOCK_HOLDINGS } from "@/lib/mock-portfolio";
import { useCurrency } from "@/context/CurrencyContext";
import { Flag } from "@/components/ui/Flag";
import { en } from "@/lib/i18n/en";

type ViewMode = "classe" | "ativo" | "regiao";

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "classe", label: en.assets.allocation.byClass },
  { value: "ativo", label: en.assets.allocation.byAsset },
  { value: "regiao", label: en.assets.allocation.byRegion },
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
    return <Flag country={code} size="sm" />;
  }
  return <Globe className="h-4 w-4 text-text-muted" aria-hidden="true" />;
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
    <div className="@container rounded-md border border-border bg-bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-text-primary">{en.assets.allocation.title}</h2>
        <div role="group" aria-label={en.assets.allocation.viewAriaLabel} className="flex items-center gap-1">
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

      {/* flex-col por padrão (empilha quando o CARD fica estreito, não só o
          viewport — daí @container/@md em vez de sm:) */}
      <div className="mt-4 flex flex-col gap-6 @md:flex-row @md:items-center">
        <div aria-hidden="true" className="mx-auto h-44 w-44 shrink-0 @md:h-48 @md:w-48">
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
            <div key={item.key} className="flex items-center gap-2 py-2 text-sm">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
              />
              {mode === "regiao" && <RegionFlag region={item.key} />}
              {mode === "ativo" && item.asset?.country && (
                <Flag country={item.asset.country} size="sm" />
              )}
              <span className="min-w-0 flex-1 truncate text-text-secondary">{item.key}</span>
              <span className="shrink-0 whitespace-nowrap font-mono text-xs tabular-nums">
                <span className="text-text-muted">{item.pct.toFixed(1)}%</span>
                <span className="mx-1.5 text-text-muted">—</span>
                <span className="text-text-primary">{format(item.value)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
