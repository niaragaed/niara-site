"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MOCK_EVOLUTION } from "@/lib/mock-portfolio";
import { useCurrency } from "@/context/CurrencyContext";

const PERIODS = [
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "12M", months: 12 },
  { label: "Máx", months: MOCK_EVOLUTION.length },
] as const;

type PeriodLabel = (typeof PERIODS)[number]["label"];

// tipo local (em vez do genérico do Recharts) — evita conflito de
// variância entre o `content` inferido pelo <Tooltip> e um genérico
// explícito <number, string>; só precisamos destes campos mesmo.
type TooltipEntryValue = number | string | readonly (number | string)[] | undefined;

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{
    value?: TooltipEntryValue;
    name?: string | number;
    color?: string;
    dataKey?: string | number | ((obj: unknown) => unknown);
  }>;
  format: (value: number) => string;
};

function toNumber(value: TooltipEntryValue): number {
  const raw = Array.isArray(value) ? value[0] : value;
  return Number(raw ?? 0);
}

function CustomTooltip({ active, payload, label, format }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-text-primary">{label}</p>
      {payload.map((entry) => (
        <p
          key={String(entry.dataKey)}
          className="font-mono tabular-nums"
          style={{ color: entry.color }}
        >
          {entry.name}: {format(toNumber(entry.value))}
        </p>
      ))}
    </div>
  );
}

export function PortfolioEvolution() {
  const { format } = useCurrency();
  const [period, setPeriod] = useState<PeriodLabel>("12M");

  const months = PERIODS.find((p) => p.label === period)?.months ?? 12;
  const data = MOCK_EVOLUTION.slice(-months);

  return (
    <div className="rounded-md border border-border bg-bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-text-primary">
          Evolução do patrimônio
        </h2>
        <div role="group" aria-label="Período" className="flex items-center gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              type="button"
              aria-pressed={period === p.label}
              onClick={() => setPeriod(p.label)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                period === p.label
                  ? "bg-bg-elevated text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              cursor={{ fill: "var(--color-bg-elevated)" }}
              content={(props) => <CustomTooltip {...props} format={format} />}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "var(--color-text-secondary)" }}
            />
            <Bar
              dataKey="investedEth"
              name="Valor aplicado"
              stackId="a"
              fill="var(--color-accent-blue)"
            />
            <Bar
              dataKey="gainEth"
              name="Ganho de capital"
              stackId="a"
              fill="var(--color-positive)"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-[11px] text-text-muted">
        Descrição textual do gráfico: valor aplicado e ganho de capital
        acumulados, mês a mês, nos últimos {data.length} meses — os mesmos
        dados aparecem na tabela de posições abaixo.
      </p>
    </div>
  );
}
