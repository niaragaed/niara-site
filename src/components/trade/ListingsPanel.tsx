"use client";

import { ExternalLink } from "lucide-react";
import { formatUnitsExact } from "@/lib/exchange/units";
import { MarketDataError } from "@/lib/exchange/market-data";
import { engineErrorMessage } from "./OrderTicket";
import { en } from "@/lib/i18n/en";
import { useTrade } from "./TradeContext";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function marketDataMessage(error: unknown): string {
  if (error instanceof MarketDataError && error.kind === "not_configured") return en.trade.errors.marketNotConfigured;
  return en.trade.errors.marketData;
}

/** Approved Equity markets of the order service (`GET /v1/markets`) and the chosen asset's header. */
export function ListingsPanel() {
  const t = en.trade.listings;
  const { listings, marketsError, marketsLoading, listing, selectListing, config } = useTrade();

  return (
    <section aria-labelledby="listings-heading" className="rounded-md border border-border bg-bg-surface">
      <div className="border-b border-border px-3 py-2">
        <h2 id="listings-heading" className="text-sm font-semibold text-text-primary">
          {t.title}
        </h2>
      </div>

      {marketsError ? (
        <p className="px-3 py-4 text-xs text-negative">{engineErrorMessage(marketsError)}</p>
      ) : marketsLoading ? (
        <p className="px-3 py-4 text-xs text-text-muted">{t.loading}</p>
      ) : !listings || listings.length === 0 ? (
        <p className="px-3 py-4 text-xs text-text-muted">{t.empty}</p>
      ) : (
        <>
          <div className="px-3 pt-3">
            <label htmlFor="listing-select" className="mb-1 block text-xs text-text-muted">
              {t.selectAria}
            </label>
            <select
              id="listing-select"
              value={listing?.asset ?? ""}
              onChange={(e) => selectListing(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-base px-3 py-2 font-mono text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
            >
              {listings.map((l) => (
                <option key={l.asset} value={l.asset}>
                  {l.symbol ? `${l.symbol} · ` : ""}
                  {short(l.asset)}
                </option>
              ))}
            </select>
          </div>

          {listing && (
            <dl className="space-y-1.5 px-3 py-3 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-text-muted">{t.asset}</dt>
                <dd className="text-right text-text-primary">
                  {listing.symbol ?? <span className="text-text-muted">{t.unknownSymbol}</span>}
                  {listing.name && <span className="ml-1 text-text-secondary">({listing.name})</span>}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-muted">{t.address}</dt>
                <dd className="break-all text-right font-mono text-text-secondary" title={listing.asset}>
                  {short(listing.asset)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-muted">{t.lotSize}</dt>
                <dd className="font-mono tabular-nums text-text-primary">
                  {formatUnitsExact(listing.lotSize, listing.assetDecimals, true)} {listing.symbol ?? ""}
                </dd>
              </div>
              {listing.issuer && (
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">{t.issuer}</dt>
                  <dd className="font-mono text-text-secondary" title={listing.issuer}>
                    {short(listing.issuer)}
                  </dd>
                </div>
              )}
              {listing.cashbackEligible && <p className="text-accent-cyan">{t.cashbackEligible}</p>}
              {listing.txHash && config.ready && (
                <a
                  href={config.explorerTx.replace("{tx}", encodeURIComponent(listing.txHash))}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-accent-blue underline-offset-2 hover:underline"
                >
                  {t.approvalTx} <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
            </dl>
          )}
        </>
      )}
    </section>
  );
}
