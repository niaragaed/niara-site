"use client";

import { useExchange } from "./ExchangeContext";
import { useCurrency } from "@/context/CurrencyContext";
import { CurrencySelector } from "./CurrencySelector";
import { ETH_USD, ETH_BRL } from "@/lib/rates";
import { en } from "@/lib/i18n/en";

export function AccountBar() {
  const { balance, buyingPower, marginUsed, pnlToday } = useExchange();
  const { currency, format } = useCurrency();
  const pnlPositive = pnlToday >= 0;

  const referenceLabel =
    currency === "ETH"
      ? null
      : currency === "BRL"
        ? `1 ETH ≈ ${ETH_BRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })} ${en.trade.accountBar.referenceSuffix}`
        : `1 ETH ≈ ${ETH_USD.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} ${en.trade.accountBar.referenceSuffix}`;

  return (
    <div className="w-full border-b border-border bg-bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
        <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-muted">
              {en.trade.accountBar.walletBalance}
            </p>
            <p className="font-mono text-sm tabular-nums text-text-primary">
              {format(balance)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-muted">
              {en.trade.accountBar.buyingPower}{" "}
              <span className="normal-case text-text-muted/80">
                {en.trade.accountBar.buyingPowerHint}
              </span>
            </p>
            <p className="font-mono text-sm tabular-nums text-text-primary">
              {format(buyingPower)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-muted">
              {en.trade.accountBar.marginUsed}
            </p>
            <p className="font-mono text-sm tabular-nums text-text-primary">
              {format(marginUsed)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-muted">
              {en.trade.accountBar.todayPnl}
            </p>
            <p
              className={`font-mono text-sm tabular-nums ${
                pnlPositive ? "text-positive" : "text-negative"
              }`}
            >
              {pnlPositive ? "+" : ""}
              {format(pnlToday)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <CurrencySelector />
          {referenceLabel && (
            <span className="whitespace-nowrap text-[10px] text-text-muted">
              {referenceLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
