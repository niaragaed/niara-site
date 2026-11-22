"use client";

// Trade history and candles of the selected market, built ONLY from settled trades
// (`GET /v1/trades/:chain/:asset`: matches confirmed on-chain, no wallets). A matched
// but unsettled match is not a trade and is not shown. With no trades: the empty state.

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { CandlestickSeries, ColorType, HistogramSeries, createChart, type UTCTimestamp } from "lightweight-charts";
import { ENGINE_URL, explorerTxUrl } from "@/lib/exchange/config";
import { fetchAllPages, fetchTrades, type Trade } from "@/lib/exchange/engine-api";
import { CANDLE_INTERVALS, buildCandles, type Candle, type CandleInterval } from "@/lib/exchange/candles";
import { formatUnitsExact } from "@/lib/exchange/units";
import { en } from "@/lib/i18n/en";
import { engineErrorMessage } from "./OrderTicket";
import { useTrade } from "./TradeContext";

/** Up to 2,000 trades (4 pages of 500): enough history for the candles shown. */
const TRADE_PAGES = 4;
const RECENT_ROWS = 20;

function CandleChart({ candles, usdtDecimals }: { candles: Candle[]; usdtDecimals: number }) {
  const ref = useRef<HTMLDivElement>(null);

  // `chart.remove()` disposes every series; the cleanup also runs between the
  // two effect runs of React StrictMode in dev.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const styles = getComputedStyle(document.documentElement);
    const v = (name: string) => styles.getPropertyValue(name).trim();
    const colors = {
      border: v("--color-border"),
      muted: v("--color-text-muted"),
      positive: v("--color-positive"),
      negative: v("--color-negative"),
      cyan: v("--color-accent-cyan"),
    };
    const chart = createChart(el, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: colors.muted },
      grid: { vertLines: { color: colors.border }, horzLines: { color: colors.border } },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { borderColor: colors.border, timeVisible: true },
      autoSize: true,
    });
    // Display only: exact bigint prices become numbers for the chart axis.
    const num = (x: bigint) => Number(formatUnitsExact(x, usdtDecimals));
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: colors.positive,
      downColor: colors.negative,
      wickUpColor: colors.positive,
      wickDownColor: colors.negative,
      borderVisible: false,
    });
    candleSeries.setData(
      candles.map((c) => ({ time: c.time as UTCTimestamp, open: num(c.open), high: num(c.high), low: num(c.low), close: num(c.close) })),
    );
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "", color: colors.cyan });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volume.setData(candles.map((c) => ({ time: c.time as UTCTimestamp, value: Number(c.lots) })));
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [candles, usdtDecimals]);

  return <div ref={ref} aria-hidden="true" className="h-64 w-full lg:h-full lg:min-h-[260px]" />;
}

export function TradeHistory() {
  const t = en.trade.chart;
  const { chain, listing, terms, config } = useTrade();
  const [interval, setInterval] = useState<CandleInterval>("1h");

  const trades = useQuery({
    queryKey: ["exchange", "trades", chain, listing?.asset],
    enabled: Boolean(ENGINE_URL && listing),
    queryFn: () => fetchAllPages((before) => fetchTrades(chain, listing!.asset, before), TRADE_PAGES),
    refetchInterval: 30_000,
  });

  const items: Trade[] = useMemo(() => trades.data?.items ?? [], [trades.data]);
  const seconds = CANDLE_INTERVALS.find((i) => i.id === interval)!.seconds;
  const candles = useMemo(() => buildCandles(items, seconds), [items, seconds]);
  const usdtDecimals = terms?.usdt.decimals;

  return (
    <section aria-labelledby="history-heading" className="flex h-full min-h-[200px] flex-col rounded-md border border-border bg-bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h2 id="history-heading" className="text-sm font-semibold text-text-primary">
          {t.title}
        </h2>
        {items.length > 0 && (
          <div role="group" aria-label={t.intervalAria} className="flex gap-1">
            {CANDLE_INTERVALS.map((i) => (
              <button
                key={i.id}
                type="button"
                aria-pressed={interval === i.id}
                onClick={() => setInterval(i.id)}
                className={`rounded px-2 py-0.5 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue ${
                  interval === i.id ? "bg-accent-blue/20 text-text-primary" : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {i.id}
              </button>
            ))}
          </div>
        )}
      </div>

      {!listing ? null : trades.error ? (
        <p className="px-3 py-4 text-xs text-negative">{engineErrorMessage(trades.error)}</p>
      ) : trades.isLoading || usdtDecimals === undefined ? (
        <p className="px-3 py-4 text-xs text-text-muted">{t.loading}</p>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-6 py-8 text-center">
          <p className="text-sm text-text-secondary">{t.empty}</p>
          <p className="max-w-md text-xs text-text-muted">{t.emptyDetail}</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3 p-3">
          <p className="text-[11px] text-text-muted">{t.source(items.length, trades.data?.complete === false)}</p>
          <div className="flex-1">
            <CandleChart candles={candles} usdtDecimals={usdtDecimals} />
          </div>
          {/* The same data as the chart, as a table (the chart is aria-hidden). */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <caption className="sr-only">{t.tableCaption}</caption>
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-text-muted">
                  <th className="py-1 font-normal">{t.time}</th>
                  <th className="py-1 text-right font-normal">{t.price}</th>
                  <th className="py-1 text-right font-normal">{t.lots}</th>
                  <th className="py-1 text-right font-normal">{t.taker}</th>
                  <th className="py-1 text-right font-normal">{t.tx}</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {items.slice(0, RECENT_ROWS).map((tr) => {
                  const url = explorerTxUrl(config, tr.txHash);
                  return (
                    <tr key={tr.matchId} className="border-t border-border">
                      <td className="py-1 text-text-secondary">{new Date(tr.matchedAt).toLocaleString("en-US")}</td>
                      <td className={`py-1 text-right ${tr.takerSide === "buy" ? "text-positive" : "text-negative"}`}>
                        {formatUnitsExact(BigInt(tr.price), usdtDecimals, true)}
                      </td>
                      <td className="py-1 text-right text-text-secondary">
                        {(BigInt(tr.quantity) / BigInt(tr.lotSize)).toString()}
                      </td>
                      <td className="py-1 text-right text-text-muted">{tr.takerSide === "buy" ? en.trade.ticket.buy : en.trade.ticket.sell}</td>
                      <td className="py-1 text-right">
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={t.viewTx}
                            className="inline-flex items-center gap-1 text-accent-blue hover:underline"
                          >
                            {tr.txHash.slice(0, 6)}… <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
