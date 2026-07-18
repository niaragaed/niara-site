"use client";

import { useState } from "react";
import { ArrowUpDown, Bitcoin, CircleDollarSign, Coins, Gem } from "lucide-react";
import { convertCurrency, type ExchangeCurrency } from "@/lib/rates";
import { useCurrency } from "@/context/CurrencyContext";

const FEE_RATE = 0.001; // 0,1% — taxa estimada da Niara

type CurrencyMeta = {
  value: ExchangeCurrency;
  label: string;
  flagCode?: string;
};

const CURRENCIES: CurrencyMeta[] = [
  { value: "BRL", label: "Real (BRL)", flagCode: "br" },
  { value: "USD", label: "Dólar (USD)", flagCode: "us" },
  { value: "EUR", label: "Euro (EUR)", flagCode: "eu" },
  { value: "ETH", label: "Ether (ETH)" },
  { value: "BTC", label: "Bitcoin (BTC)" },
  { value: "USDC", label: "USD Coin (USDC)" },
  { value: "USDT", label: "Tether (USDT)" },
];

const QUICK_AMOUNTS = [100, 500, 1000, 10000];

function CurrencyIcon({ currency }: { currency: ExchangeCurrency }) {
  const meta = CURRENCIES.find((c) => c.value === currency);
  if (meta?.flagCode) {
    return (
      <span
        className={`fi fi-${meta.flagCode} rounded-[2px] text-lg`}
        aria-hidden="true"
      />
    );
  }
  switch (currency) {
    case "BTC":
      return <Bitcoin className="h-5 w-5 text-text-muted" aria-hidden="true" />;
    case "ETH":
      return <Gem className="h-5 w-5 text-text-muted" aria-hidden="true" />;
    case "USDC":
      return <Coins className="h-5 w-5 text-text-muted" aria-hidden="true" />;
    default:
      return (
        <CircleDollarSign className="h-5 w-5 text-text-muted" aria-hidden="true" />
      );
  }
}

function formatAmount(value: number, currency: ExchangeCurrency): string {
  if (!Number.isFinite(value)) return "0";
  const decimals = currency === "BTC" || currency === "ETH" ? 6 : 2;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const SUPPORTED: ExchangeCurrency[] = ["BRL", "USD", "EUR", "ETH", "BTC", "USDC", "USDT"];

export function CurrencyConverter() {
  const { currency: globalCurrency } = useCurrency();
  const initialTo: ExchangeCurrency = (SUPPORTED as string[]).includes(
    globalCurrency,
  )
    ? (globalCurrency as ExchangeCurrency)
    : "BRL";

  const [from, setFrom] = useState<ExchangeCurrency>(
    initialTo === "USD" ? "BRL" : "USD",
  );
  const [to, setTo] = useState<ExchangeCurrency>(initialTo);
  const [amountInput, setAmountInput] = useState("1000");

  const amount = Number(amountInput);
  const hasAmount =
    amountInput.trim() !== "" && Number.isFinite(amount) && amount > 0;
  const convertedGross = hasAmount ? convertCurrency(amount, from, to) : 0;
  const fee = convertedGross * FEE_RATE;
  const convertedNet = convertedGross - fee;
  const unitRate = convertCurrency(1, from, to);

  function handleInvert() {
    const nextAmount = hasAmount
      ? formatAmount(convertedGross, to).replace(/,/g, "")
      : amountInput;
    setFrom(to);
    setTo(from);
    setAmountInput(nextAmount);
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-lg border border-border bg-bg-surface p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="converter-from-amount"
            className="mb-1 block text-xs text-text-muted"
          >
            De
          </label>
          <div className="flex items-center gap-2 rounded-md border border-border bg-bg-base px-3 py-2 focus-within:ring-1 focus-within:ring-accent-blue">
            <CurrencyIcon currency={from} />
            <input
              id="converter-from-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              className="w-full bg-transparent font-mono text-base tabular-nums text-text-primary focus:outline-none"
            />
            <label htmlFor="converter-from-currency" className="sr-only">
              Moeda de origem
            </label>
            <select
              id="converter-from-currency"
              value={from}
              onChange={(event) => setFrom(event.target.value as ExchangeCurrency)}
              className="rounded border border-border bg-bg-surface px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInvert}
          aria-label="Inverter moedas de origem e destino"
          className="mx-auto flex h-9 w-9 shrink-0 rotate-0 items-center justify-center rounded-full border border-border bg-bg-base text-text-secondary transition-colors hover:text-text-primary sm:rotate-90"
        >
          <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex-1">
          <label
            htmlFor="converter-to-amount"
            className="mb-1 block text-xs text-text-muted"
          >
            Para
          </label>
          <div className="flex items-center gap-2 rounded-md border border-border bg-bg-elevated px-3 py-2">
            <CurrencyIcon currency={to} />
            <output
              id="converter-to-amount"
              className="w-full font-mono text-base font-semibold tabular-nums text-text-primary"
            >
              {hasAmount ? formatAmount(convertedGross, to) : "0"}
            </output>
            <label htmlFor="converter-to-currency" className="sr-only">
              Moeda de destino
            </label>
            <select
              id="converter-to-currency"
              value={to}
              onChange={(event) => setTo(event.target.value as ExchangeCurrency)}
              className="rounded border border-border bg-bg-surface px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.value}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAmountInput(String(value))}
            className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-accent-blue/40 hover:text-text-primary"
          >
            {value.toLocaleString("pt-BR")}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-1 border-t border-border pt-4 font-mono text-xs tabular-nums text-text-secondary">
        <div className="flex justify-between">
          <span className="font-sans">
            1 {from} ≈
          </span>
          <span className="text-text-primary">
            {formatAmount(unitRate, to)} {to} (referência simulada)
          </span>
        </div>
        <div className="flex justify-between text-text-muted">
          <span className="font-sans">Taxa estimada da Niara (0,1%)</span>
          <span>
            -{formatAmount(fee, to)} {to}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-sans">Valor líquido estimado</span>
          <span className="text-text-primary">
            {formatAmount(convertedNet, to)} {to}
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled
        className="mt-5 w-full cursor-not-allowed rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-text-primary opacity-50"
      >
        Converter
      </button>
      <p className="mt-2 text-center text-[11px] text-text-muted">
        Demonstração — nenhuma conversão real é realizada.
      </p>
    </div>
  );
}
