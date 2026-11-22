"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBook, type BookLevel } from "@/lib/exchange/market-data";
import { formatUnitsExact } from "@/lib/exchange/units";
import { en } from "@/lib/i18n/en";
import { marketDataMessage } from "./ListingsPanel";
import { useTrade } from "./TradeContext";

// Periodic re-read of the aggregated book. It is not "real time": we show the
// time of the last read.
const REFRESH_MS = 10_000;

function Levels({
  levels,
  side,
  lotSize,
  usdtDecimals,
}: {
  levels: BookLevel[];
  side: "buy" | "sell";
  lotSize: bigint;
  usdtDecimals: number;
}) {
  const t = en.trade.book;
  if (levels.length === 0) {
    return <p className="px-3 py-2 text-xs text-text-muted">{t.emptySide}</p>;
  }
  const max = levels.reduce((m, l) => (l.quantity > m ? l.quantity : m), BigInt(1));
  return (
    <ul>
      {levels.map((l) => {
        // width relative to the side's largest level (visual only, aria-hidden)
        const pct = Number((l.quantity * BigInt(100)) / max);
        return (
          <li
            key={l.price.toString()}
            className="relative grid grid-cols-[1fr_1fr_auto] items-center gap-2 overflow-hidden px-3 py-1 font-mono text-xs tabular-nums"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 right-0"
              style={{
                width: `${pct}%`,
                background: `color-mix(in srgb, var(--color-${side === "buy" ? "positive" : "negative"}) 15%, transparent)`,
              }}
            />
            <span className={`relative text-left ${side === "buy" ? "text-positive" : "text-negative"}`}>
              {formatUnitsExact(l.price, usdtDecimals, true)}
            </span>
            <span className="relative text-right text-text-secondary">{(l.quantity / lotSize).toString()}</span>
            <span className="relative w-10 text-right text-text-muted">{l.orders}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function OrderBookPanel() {
  const t = en.trade.book;
  const { chain, listing, terms } = useTrade();

  const book = useQuery({
    queryKey: ["exchange", "book", chain, listing?.asset],
    enabled: listing !== null,
    queryFn: () => fetchBook(chain, listing!.asset),
    refetchInterval: REFRESH_MS,
  });

  const usdtDecimals = terms?.usdt.decimals;
  const data = book.data;
  const spread =
    data && data.asks[0] && data.bids[0] && data.asks[0].price >= data.bids[0].price
      ? data.asks[0].price - data.bids[0].price
      : null;

  return (
    <section aria-labelledby="book-heading" className="flex h-full flex-col rounded-md border border-border bg-bg-surface">
      <div className="flex items-baseline justify-between gap-2 border-b border-border px-3 py-2">
        <h2 id="book-heading" className="text-sm font-semibold text-text-primary">
          {t.title}
        </h2>
        {book.dataUpdatedAt > 0 && (
          <span className="text-[10px] text-text-muted">
            {t.updatedAt(new Date(book.dataUpdatedAt).toLocaleTimeString("en-US"))}
          </span>
        )}
      </div>
      <p className="px-3 pt-2 text-[11px] text-text-muted">{t.source}</p>

      {!listing ? null : book.error ? (
        <p className="px-3 py-4 text-xs text-negative">{marketDataMessage(book.error)}</p>
      ) : !data || usdtDecimals === undefined ? (
        <p className="px-3 py-4 text-xs text-text-muted">{t.loading}</p>
      ) : (
        <div className="flex-1 overflow-auto py-2">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-3 pb-1 text-[10px] uppercase tracking-wide text-text-muted">
            <span>{t.price}</span>
            <span className="text-right">{t.lots}</span>
            <span className="w-10 text-right">{t.orders}</span>
          </div>
          <h3 className="px-3 pt-1 text-[10px] uppercase tracking-wide text-negative">{t.asks}</h3>
          {/* asks shown from highest to lowest, next to the spread */}
          <Levels levels={[...data.asks].reverse()} side="sell" lotSize={listing.lotSize} usdtDecimals={usdtDecimals} />
          <div className="my-1 flex items-center justify-between border-y border-border bg-bg-elevated px-3 py-1.5 font-mono text-xs tabular-nums text-text-muted">
            <span>{t.spread}</span>
            <span>{spread === null ? "—" : `${formatUnitsExact(spread, usdtDecimals, true)} USDT`}</span>
          </div>
          <h3 className="px-3 pt-1 text-[10px] uppercase tracking-wide text-positive">{t.bids}</h3>
          <Levels levels={data.bids} side="buy" lotSize={listing.lotSize} usdtDecimals={usdtDecimals} />
        </div>
      )}
    </section>
  );
}
