import { Bitcoin, Coins } from "lucide-react";
import { en } from "@/lib/i18n/en";

type TickerItem = {
  ticker: string;
  value: string;
  change: number;
  flagCode?: string;
  icon?: "bitcoin" | "coins";
};

// TODO: substituir por feed de mercado real — valores meramente ilustrativos
// Não passa pelo CurrencyContext: "value" aqui são pontos de índice (S&P
// 500, Nikkei etc.) ou cotações de ativos em USD já formatadas como string,
// não valores em ETH — não há o que converter de moeda, e "change" é
// percentual, que também não se converte.
const TICKER_ITEMS: TickerItem[] = [
  { ticker: "S&P 500", flagCode: "us", value: "5,634.61", change: 0.42 },
  { ticker: "NASDAQ", flagCode: "us", value: "18,972.42", change: 0.68 },
  { ticker: "DOW JONES", flagCode: "us", value: "41,563.08", change: -0.15 },
  { ticker: "RUSSELL 2000", flagCode: "us", value: "2,214.37", change: -0.31 },
  { ticker: "VIX", flagCode: "us", value: "14.82", change: -2.05 },
  { ticker: "EURO STOXX 50", flagCode: "eu", value: "4,921.15", change: 0.24 },
  { ticker: "DAX", flagCode: "de", value: "18,346.90", change: 0.11 },
  { ticker: "FTSE 100", flagCode: "gb", value: "8,205.32", change: -0.08 },
  { ticker: "CAC 40", flagCode: "fr", value: "7,512.44", change: 0.19 },
  { ticker: "SSE", flagCode: "cn", value: "3,142.67", change: -0.52 },
  { ticker: "NIKKEI 225", flagCode: "jp", value: "39,875.21", change: 0.87 },
  { ticker: "HANG SENG", flagCode: "hk", value: "17,834.02", change: 1.12 },
  { ticker: "NIFTY 50", flagCode: "in", value: "24,613.90", change: 0.33 },
  { ticker: "IBOVESPA", flagCode: "br", value: "129,847.55", change: -0.61 },
  { ticker: "KOSPI", flagCode: "kr", value: "2,678.14", change: 0.29 },
  { ticker: "ASX 200", flagCode: "au", value: "7,988.33", change: 0.05 },
  { ticker: "TSX", flagCode: "ca", value: "23,145.87", change: 0.22 },
  { ticker: "BTC", icon: "bitcoin", value: "67,240.15", change: 2.34 },
  { ticker: "USDC", icon: "coins", value: "1.00", change: 0.0 },
  { ticker: "USDT", icon: "coins", value: "1.00", change: -0.01 },
];

function TickerRow({ item, duplicate }: { item: TickerItem; duplicate: boolean }) {
  const positive = item.change >= 0;
  return (
    <div
      aria-hidden={duplicate || undefined}
      className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md border border-border bg-bg-surface px-4 py-3 text-sm text-text-secondary transition-colors hover:border-accent-blue/40 hover:text-text-primary sm:gap-3 sm:px-5 sm:py-3.5 sm:text-base"
    >
      {item.flagCode ? (
        <span className={`fi fi-${item.flagCode} rounded-[2px] text-base sm:text-lg`} />
      ) : item.icon === "bitcoin" ? (
        <Bitcoin className="h-4 w-4 text-text-muted sm:h-5 sm:w-5" />
      ) : (
        <Coins className="h-4 w-4 text-text-muted sm:h-5 sm:w-5" />
      )}
      <span className="font-medium">{item.ticker}</span>
      <span className="font-mono tabular-nums text-text-primary">
        {item.value}
      </span>
      <span
        className={`font-mono tabular-nums ${
          positive ? "text-positive" : "text-negative"
        }`}
      >
        {positive ? "+" : ""}
        {item.change.toFixed(2)}%
      </span>
    </div>
  );
}

export function IndexTicker() {
  return (
    <div
      role="group"
      aria-label={en.ticker.ariaLabel}
      className="group w-full overflow-hidden border-y border-border/60 bg-bg-surface/20 py-6 backdrop-blur-sm sm:py-8"
    >
      <div className="flex w-max animate-ticker gap-3 group-hover:[animation-play-state:paused] sm:gap-4">
        {TICKER_ITEMS.map((item) => (
          <TickerRow key={item.ticker} item={item} duplicate={false} />
        ))}
        {TICKER_ITEMS.map((item) => (
          <TickerRow key={`${item.ticker}-dup`} item={item} duplicate />
        ))}
      </div>
    </div>
  );
}
