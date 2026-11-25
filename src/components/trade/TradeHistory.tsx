"use client";

// Most recent settled trades of the selected market (`GET /v1/trades/:chain/:asset`:
// matches confirmed on-chain, no wallets). A matched but unsettled match is not a
// trade and is not shown. This table is also the accessible form of the price chart
// (the chart itself is aria-hidden). With no trades: the empty state.

import { ExternalLink } from "lucide-react";
import { explorerTxUrl } from "@/lib/exchange/config";
import { formatUnitsExact } from "@/lib/exchange/units";
import { en } from "@/lib/i18n/en";
import { registerRecordUrl } from "@/lib/site-links";
import { engineErrorMessage } from "./OrderTicket";
import { RegisterRecordLink } from "./RegisterRecordLink";
import { useTrade } from "./TradeContext";
import { useMarketTrades } from "./useMarketTrades";

const RECENT_ROWS = 20;

export function TradeHistory() {
  const t = en.trade.chart;
  const { listing, terms, config } = useTrade();
  const trades = useMarketTrades();
  const items = trades.data?.items ?? [];
  const usdtDecimals = terms?.usdt.decimals;

  return (
    <section aria-labelledby="history-heading" className="flex h-full min-h-[160px] flex-col rounded-md border border-border bg-bg-surface">
      <div className="border-b border-border px-3 py-2">
        <h2 id="history-heading" className="text-sm font-semibold text-text-primary">
          {t.title}
        </h2>
      </div>

      {!listing ? null : trades.error ? (
        <p className="px-3 py-4 text-xs text-negative">{engineErrorMessage(trades.error)}</p>
      ) : trades.isLoading || usdtDecimals === undefined ? (
        <p className="px-3 py-4 text-xs text-text-muted">{t.loading}</p>
      ) : items.length === 0 ? (
        <p className="px-3 py-4 text-xs text-text-muted">{t.empty}</p>
      ) : (
        <div className="overflow-x-auto p-3">
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
                // Every row here is a confirmed settlement.
                const record = registerRecordUrl(config.chain, tr.txHash);
                return (
                  <tr key={tr.matchId} className="border-t border-border">
                    <td className="py-1 text-text-secondary">{new Date(tr.matchedAt).toLocaleString("en-US")}</td>
                    <td className={`py-1 text-right ${tr.takerSide === "buy" ? "text-positive" : "text-negative"}`}>
                      {formatUnitsExact(BigInt(tr.price), usdtDecimals, true)}
                    </td>
                    <td className="py-1 text-right text-text-secondary">{(BigInt(tr.quantity) / BigInt(tr.lotSize)).toString()}</td>
                    <td className="py-1 text-right text-text-muted">
                      {tr.takerSide === "buy" ? en.trade.ticket.buy : en.trade.ticket.sell}
                    </td>
                    <td className="py-1 text-right">
                      <span className="inline-flex flex-wrap items-center justify-end gap-x-2">
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
                        {record && <RegisterRecordLink href={record} />}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
