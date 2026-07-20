"use client";

import { useState } from "react";
import { ChevronDown, Coins } from "lucide-react";
import { useCurrency, type Currency } from "@/context/CurrencyContext";
import { en } from "@/lib/i18n/en";

type CurrencyOption = { value: Currency; label: string; hint: string };

// USDT (unidade base) e BTC (segunda moeda principal) vêm primeiro; USD/BRL/
// EUR são só referência de exibição — o divisor visual marca essa diferença.
const PRIMARY_CURRENCIES: CurrencyOption[] = [
  { value: "USDT", label: "USDT", hint: en.trade.currencySelector.usdt },
  { value: "BTC", label: "BTC", hint: en.trade.currencySelector.btc },
];

const REFERENCE_CURRENCIES: CurrencyOption[] = [
  { value: "USD", label: "US$", hint: en.trade.currencySelector.usd },
  { value: "BRL", label: "R$", hint: en.trade.currencySelector.brl },
  { value: "EUR", label: "€", hint: en.trade.currencySelector.eur },
];

const ALL_CURRENCIES = [...PRIMARY_CURRENCIES, ...REFERENCE_CURRENCIES];

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const current = ALL_CURRENCIES.find((option) => option.value === currency);

  function renderOption(option: CurrencyOption) {
    return (
      <li key={option.value}>
        <button
          type="button"
          role="option"
          aria-selected={option.value === currency}
          onClick={() => {
            setCurrency(option.value);
            setOpen(false);
          }}
          className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-bg-surface ${
            option.value === currency ? "text-text-primary" : "text-text-secondary"
          }`}
        >
          <span className="font-mono">{option.label}</span>
          <span className="text-[10px] text-text-muted">{option.hint}</span>
        </button>
      </li>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={en.trade.currencySelector.ariaLabel}
        className="flex items-center gap-1.5 rounded-md border border-border bg-bg-base px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <Coins className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="font-mono">{current?.label}</span>
        <ChevronDown className="h-3 w-3" aria-hidden="true" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <ul
            role="listbox"
            aria-label={en.trade.currencySelector.chooseLabel}
            className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-border bg-bg-elevated py-1 shadow-lg"
          >
            {PRIMARY_CURRENCIES.map(renderOption)}
            <li role="separator" aria-hidden="true" className="my-1 border-t border-border" />
            {REFERENCE_CURRENCIES.map(renderOption)}
          </ul>
        </>
      )}
    </div>
  );
}
