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
import { ETH_USD, ETH_BRL } from "@/lib/rates";

export type Currency = "ETH" | "USD" | "BRL" | "USDC";

const STORAGE_KEY = "niara:currency";
const VALID_CURRENCIES: Currency[] = ["ETH", "USD", "BRL", "USDC"];

function isCurrency(value: string | null): value is Currency {
  return value !== null && (VALID_CURRENCIES as string[]).includes(value);
}

function rateFor(currency: Currency): number {
  switch (currency) {
    case "ETH":
      return 1;
    case "USD":
    case "USDC": // stablecoin tratada como paridade ~1 USD
      return ETH_USD;
    case "BRL":
      return ETH_BRL;
  }
}

type CurrencyState = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  /** valor convertido (número puro) para a moeda selecionada */
  convert: (valueInEth: number) => number;
  /** converte um número já expresso na moeda selecionada de volta para ETH */
  toEth: (valueInCurrency: number) => number;
  /** número formatado, sem símbolo de moeda — para tabelas densas */
  formatPlain: (valueInEth: number, ethDecimals?: number) => string;
  /** número formatado com símbolo/sufixo de moeda — para destaques */
  format: (valueInEth: number, ethDecimals?: number) => string;
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
  // Sempre nasce em ETH — igual no servidor e no primeiro render do
  // cliente. A preferência salva só é aplicada DEPOIS do mount, num efeito
  // client-only (abaixo), pra nunca dar mismatch de hidratação.
  const [currency, setCurrencyState] = useState<Currency>("ETH");

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
    (valueInEth: number) => valueInEth * rateFor(currency),
    [currency],
  );

  const toEth = useCallback(
    (valueInCurrency: number) => valueInCurrency / rateFor(currency),
    [currency],
  );

  const formatPlain = useCallback(
    (valueInEth: number, ethDecimals = 4) => {
      const converted = convert(valueInEth);
      const decimals = currency === "ETH" ? ethDecimals : 2;
      return converted.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    },
    [convert, currency],
  );

  const format = useCallback(
    (valueInEth: number, ethDecimals = 4) => {
      const converted = convert(valueInEth);
      switch (currency) {
        case "ETH":
          return `${converted.toLocaleString("en-US", {
            minimumFractionDigits: ethDecimals,
            maximumFractionDigits: ethDecimals,
          })} ETH`;
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
        case "USDC":
          return `${converted.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} USDC`;
      }
    },
    [convert, currency],
  );

  const value = useMemo<CurrencyState>(
    () => ({ currency, setCurrency, convert, toEth, formatPlain, format }),
    [currency, setCurrency, convert, toEth, formatPlain, format],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}
