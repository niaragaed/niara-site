// cotações fixas de referência — simulação. Substituir por oráculo/feed
// real (ex.: Chainlink ou API de mercado).
export const ETH_USD = 3000;
export const USD_BRL = 5.4;
export const ETH_BRL = ETH_USD * USD_BRL;
export const EUR_USD = 1.08;
export const BTC_USD = 65000;

export type ExchangeCurrency = "BRL" | "USD" | "EUR" | "ETH" | "BTC" | "USDC" | "USDT";

// preço de 1 unidade de cada moeda em USD — USD funciona como moeda-âncora
// para toda conversão do câmbio, então "de X para Y" é sempre um único
// passo (X→USD→Y), nunca uma cadeia de pares que acumularia arredondamento.
export const RATE_TO_USD: Record<ExchangeCurrency, number> = {
  USD: 1,
  BRL: 1 / USD_BRL,
  EUR: EUR_USD,
  ETH: ETH_USD,
  BTC: BTC_USD,
  USDC: 1, // stablecoin — paridade ~1 USD, referência simulada
  USDT: 1, // stablecoin — paridade ~1 USD, referência simulada
};

export function convertCurrency(
  amount: number,
  from: ExchangeCurrency,
  to: ExchangeCurrency,
): number {
  const amountInUsd = amount * RATE_TO_USD[from];
  return amountInUsd / RATE_TO_USD[to];
}
