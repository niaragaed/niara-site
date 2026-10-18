"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BTC_USDT, USD_BRL, USD_EUR } from "@/lib/rates";

export type Currency = "USDT" | "BTC" | "USD" | "BRL" | "EUR";

const STORAGE_KEY = "niara:currency";
const VALID_CURRENCIES: Currency[] = ["USDT", "BTC", "USD", "BRL", "EUR"];

function isCurrency(value: string | null): value is Currency {
  return value !== null && (VALID_CURRENCIES as string[]).includes(value);
}

// price of 1 USDT (the internal unit) in the selected currency
function rateFor(currency: Currency): number {
  switch (currency) {
    case "USDT":
      return 1;
    case "BTC":
      return 1 / BTC_USDT;
    case "USD":
      return 1; // 1 USDT ≈ 1 USD, simulated reference
    case "BRL":
      return USD_BRL;
    case "EUR":
      return USD_EUR;
  }
}

// fixed decimal places per currency: USDT uses 2 (stablecoin convention) and
// BTC uses 8 (satoshis), so small values are never truncated; fiat currencies
// use Intl's default formatting (2 places).
function decimalsFor(currency: Currency): number {
  return currency === "BTC" ? 8 : 2;
}

type CurrencyState = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  /** converted value (plain number) in the selected currency */
  convert: (valueInUsdt: number) => number;
  /** converts a number already in the selected currency back to USDT */
  toUsdt: (valueInCurrency: number) => number;
  /** formatted number without a currency symbol, for dense tables */
  formatPlain: (valueInUsdt: number) => string;
  /** formatted number with a currency symbol/suffix, for highlights */
  format: (valueInUsdt: number) => string;
};

const CurrencyContext = createContext<CurrencyState | null>(null);

export function useCurrency(): CurrencyState {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used inside <CurrencyProvider>");
  }
  return ctx;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Always starts in USDT, the same on the server and on the client's first
  // render. The saved preference is applied only AFTER mount, in a
  // client-only effect (below), so there is never a hydration mismatch.
  const [currency, setCurrencyState] = useState<Currency>("USDT");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // localStorage is an external system only available on the client: it
    // can't be read during render (that would break SSR) and there is no
    // effect-free alternative here; this is exactly what useEffect is for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isCurrency(stored)) setCurrencyState(stored);
  }, []);

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const convert = useCallback(
    (valueInUsdt: number) => valueInUsdt * rateFor(currency),
    [currency],
  );

  const toUsdt = useCallback(
    (valueInCurrency: number) => valueInCurrency / rateFor(currency),
    [currency],
  );

  const formatPlain = useCallback(
    (valueInUsdt: number) => {
      const converted = convert(valueInUsdt);
      const decimals = decimalsFor(currency);
      return converted.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    },
    [convert, currency],
  );

  const format = useCallback(
    (valueInUsdt: number) => {
      const converted = convert(valueInUsdt);
      switch (currency) {
        case "USDT":
          return `${converted.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} USDT`;
        case "BTC":
          return `${converted.toLocaleString("en-US", {
            minimumFractionDigits: 8,
            maximumFractionDigits: 8,
          })} BTC`;
        case "USD":
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(converted);
        case "BRL":
          return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(converted);
        case "EUR":
          return new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
          }).format(converted);
      }
    },
    [convert, currency],
  );

  const value = useMemo<CurrencyState>(
    () => ({ currency, setCurrency, convert, toUsdt, formatPlain, format }),
    [currency, setCurrency, convert, toUsdt, formatPlain, format],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}
