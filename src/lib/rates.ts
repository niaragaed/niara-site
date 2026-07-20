// cotações fixas de referência — simulação. Substituir por oráculo/feed
// real (ex.: Chainlink ou API de mercado).
//
// USDT é a âncora interna do site: por definição, 1 USDT ≈ 1 USD
// (aproximação — na prática o USDT oscila alguns centavos em torno do
// dólar, mas para efeitos de demonstração tratamos como paridade exata).
// USDT foi escolhido como unidade interna por ser estável — isso torna a
// precificação dos ativos tokenizados legível; ETH e BTC oscilam bastante
// e distorceriam a leitura de preço se fossem a unidade de referência.
export const BTC_USDT = 65000;
export const USD_BRL = 5.4;
export const USD_EUR = 0.93;

// ETH não é mais a unidade interna do site, mas continua disponível como
// moeda de exibição no conversor de câmbio (/exchange).
export const ETH_USD = 3000;

export type ExchangeCurrency = "BRL" | "USD" | "EUR" | "ETH" | "BTC" | "USDC" | "USDT";

// preço de 1 unidade de cada moeda em USDT — USDT funciona como moeda-âncora
// para toda conversão do câmbio, então "de X para Y" é sempre um único
// passo (X→USDT→Y), nunca uma cadeia de pares que acumularia arredondamento.
export const RATE_TO_USDT: Record<ExchangeCurrency, number> = {
  USDT: 1,
  USD: 1, // 1 USDT ≈ 1 USD, referência simulada
  BRL: 1 / USD_BRL,
  EUR: 1 / USD_EUR,
  ETH: ETH_USD,
  BTC: BTC_USDT,
  USDC: 1, // stablecoin — paridade ~1 USD, referência simulada
};

export function convertCurrency(
  amount: number,
  from: ExchangeCurrency,
  to: ExchangeCurrency,
): number {
  const amountInUsdt = amount * RATE_TO_USDT[from];
  return amountInUsdt / RATE_TO_USDT[to];
}
