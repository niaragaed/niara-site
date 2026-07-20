import { convertCurrency, type ExchangeCurrency } from "@/lib/rates";
import { en } from "@/lib/i18n/en";

type Pair = { base: ExchangeCurrency; quote: ExchangeCurrency };

const PAIRS: Pair[] = [
  { base: "BRL", quote: "USD" },
  { base: "EUR", quote: "USD" },
  { base: "ETH", quote: "USD" },
  { base: "ETH", quote: "BRL" },
  { base: "BTC", quote: "USD" },
  { base: "BTC", quote: "BRL" },
  { base: "USDC", quote: "BRL" },
  { base: "USDT", quote: "USD" },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// TODO: substituir por feed real — variação 24h meramente ilustrativa,
// gerada de forma determinística (sem Math.random) a partir do par.
function mockChange(pairKey: string): number {
  const seed = hashString(pairKey);
  return ((seed % 400) - 200) / 100; // entre -2.00% e +2.00%
}

function formatRate(value: number): string {
  const decimals = value >= 100 ? 2 : value >= 1 ? 4 : 6;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function RateGrid() {
  return (
    <div className="rounded-lg border border-border bg-bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary">
          {en.exchange.rateGrid.title}
        </h2>
        <p className="mt-0.5 text-[11px] text-text-muted">
          {en.exchange.rateGrid.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x">
        {PAIRS.map((pair) => {
          const key = `${pair.base}${pair.quote}`;
          const rate = convertCurrency(1, pair.base, pair.quote);
          const change = mockChange(key);
          const positive = change >= 0;
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <span className="font-mono text-sm text-text-secondary">
                {pair.base}/{pair.quote}
              </span>
              <div className="text-right font-mono text-sm tabular-nums">
                <div className="text-text-primary">{formatRate(rate)}</div>
                <div
                  className={`text-xs ${positive ? "text-positive" : "text-negative"}`}
                >
                  {positive ? "+" : ""}
                  {change.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
