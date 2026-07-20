"use client";

import { useExchange } from "./ExchangeContext";
import { useCurrency, type Currency } from "@/context/CurrencyContext";
import { CurrencySelector } from "./CurrencySelector";
import { BTC_USDT, USD_BRL, USD_EUR } from "@/lib/rates";
import { en } from "@/lib/i18n/en";

// USDT é a unidade base — sem nota de referência (é o próprio valor). Nas
// demais moedas, mostra quanto 1 USDT (ou, no caso do BTC, quanto 1 BTC)
// vale na moeda selecionada, pra deixar claro que é só uma conversão de
// exibição sobre o saldo real (sempre em USDT).
function buildReferenceLabel(currency: Currency): string | null {
  const suffix = en.trade.accountBar.referenceSuffix;
  switch (currency) {
    case "USDT":
      return null;
    case "BTC":
      return `1 BTC ≈ ${BTC_USDT.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} USDT ${suffix}`;
    case "BRL":
      return `1 USDT ≈ ${USD_BRL.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })} ${suffix}`;
    case "EUR":
      return `1 USDT ≈ ${USD_EUR.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
      })} ${suffix}`;
    case "USD":
      return `1 USDT ≈ ${(1).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      })} ${suffix}`;
  }
}

export function AccountBar() {
  const { balance, buyingPower, marginUsed, pnlToday } = useExchange();
  const { currency, format } = useCurrency();
  const pnlPositive = pnlToday >= 0;
  const referenceLabel = buildReferenceLabel(currency);

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
