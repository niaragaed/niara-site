"use client";

import { MOCK_ASSETS } from "@/lib/mock-assets";
import { MOCK_HOLDINGS, MOCK_EVOLUTION } from "@/lib/mock-portfolio";
import { useCurrency } from "@/context/CurrencyContext";
import { en } from "@/lib/i18n/en";

function computeTotals() {
  const priceBySymbol = new Map(MOCK_ASSETS.map((asset) => [asset.symbol, asset.priceEth]));
  let totalValue = 0;
  let investedValue = 0;
  for (const holding of MOCK_HOLDINGS) {
    const currentPrice = priceBySymbol.get(holding.symbol) ?? holding.avgPriceEth;
    totalValue += holding.qty * currentPrice;
    investedValue += holding.qty * holding.avgPriceEth;
  }
  return { totalValue, investedValue };
}

function computePeriodReturnPct() {
  const first = MOCK_EVOLUTION[0];
  const last = MOCK_EVOLUTION[MOCK_EVOLUTION.length - 1];
  const startTotal = first.investedEth + first.gainEth;
  const endTotal = last.investedEth + last.gainEth;
  return startTotal > 0 ? ((endTotal - startTotal) / startTotal) * 100 : 0;
}

export function PortfolioSummary() {
  const { format } = useCurrency();
  const { totalValue, investedValue } = computeTotals();
  const pl = totalValue - investedValue;
  const plPct = investedValue > 0 ? (pl / investedValue) * 100 : 0;
  const periodReturnPct = computePeriodReturnPct();
  const plPositive = pl >= 0;
  const periodPositive = periodReturnPct >= 0;

  const cards: {
    label: string;
    value: string;
    sub: string | null;
    positive: boolean | null;
  }[] = [
    {
      label: en.assets.summary.totalEquity,
      value: format(totalValue),
      sub: `${plPositive ? "+" : ""}${plPct.toFixed(2)}%`,
      positive: plPositive,
    },
    {
      label: en.assets.summary.investedValue,
      value: format(investedValue),
      sub: null,
      positive: null,
    },
    {
      label: en.assets.summary.totalPl,
      value: `${plPositive ? "+" : ""}${format(pl)}`,
      sub: `${plPositive ? "+" : ""}${plPct.toFixed(2)}%`,
      positive: plPositive,
    },
    {
      label: en.assets.summary.periodReturn,
      value: `${periodPositive ? "+" : ""}${periodReturnPct.toFixed(2)}%`,
      sub: en.assets.summary.last12Months,
      positive: periodPositive,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-md border border-border bg-bg-surface p-4"
        >
          <p className="text-[10px] uppercase tracking-wide text-text-muted">
            {card.label}
          </p>
          <p className="mt-1 font-mono text-lg tabular-nums text-text-primary">
            {card.value}
          </p>
          {card.sub && (
            <p
              className={`mt-0.5 font-mono text-xs tabular-nums ${
                card.positive === null
                  ? "text-text-muted"
                  : card.positive
                    ? "text-positive"
                    : "text-negative"
              }`}
            >
              {card.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
