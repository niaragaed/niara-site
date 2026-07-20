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

// preço de 1 USDT (a unidade interna) na moeda selecionada
function rateFor(currency: Currency): number {
  switch (currency) {
    case "USDT":
      return 1;
    case "BTC":
      return 1 / BTC_USDT;
    case "USD":
      return 1; // 1 USDT ≈ 1 USD, referência simulada
    case "BRL":
      return USD_BRL;
    case "EUR":
      return USD_EUR;
  }
}

// casas decimais fixas por moeda — USDT usa 2 (padrão de stablecoin) e BTC
// usa 8 (satoshis), para nunca truncar valores pequenos; moedas fiat usam a
// formatação padrão do Intl (2 casas).
function decimalsFor(currency: Currency): number {
  return currency === "BTC" ? 8 : 2;
}

type CurrencyState = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  /** valor convertido (número puro) para a moeda selecionada */
  convert: (valueInUsdt: number) => number;
  /** converte um número já expresso na moeda selecionada de volta para USDT */
  toUsdt: (valueInCurrency: number) => number;
  /** número formatado, sem símbolo de moeda — para tabelas densas */
  formatPlain: (valueInUsdt: number) => string;
  /** número formatado com símbolo/sufixo de moeda — para destaques */
  format: (valueInUsdt: number) => string;
};

const CurrencyContext = createContext<CurrencyState | null>(null);

export function useCurrency(): CurrencyState {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency precisa estar dentro de <CurrencyProvider>");
  }
  return ctx;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Sempre nasce em USDT — igual no servidor e no primeiro render do
  // cliente. A preferência salva só é aplicada DEPOIS do mount, num efeito
  // client-only (abaixo), pra nunca dar mismatch de hidratação.
  const [currency, setCurrencyState] = useState<Currency>("USDT");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // localStorage é um sistema externo só disponível no cliente — não dá
    // pra ler durante o render (quebraria o SSR) nem existe alternativa
    // sem efeito aqui; é exatamente o caso de uso que useEffect resolve.
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
