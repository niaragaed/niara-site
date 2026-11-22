// fixed reference rates: a simulation. Replace with a real oracle/feed
// (e.g. Chainlink or a market API).
//
// USDT is the site's internal anchor: by definition, 1 USDT ≈ 1 USD (an
// approximation; in practice USDT moves a few cents around the dollar, but
// for demo purposes we treat it as exact parity). USDT was chosen as the
// internal unit because it is stable, which keeps tokenized asset prices
// readable; ETH and BTC move a lot and would distort price reading if they
// were the reference unit.
export const BTC_USDT = 65000;
export const USD_BRL = 5.4;
export const USD_EUR = 0.93;

// ETH is no longer the site's internal unit, but it is still available as a
// display currency in the currency converter (/exchange).
export const ETH_USD = 3000;

export type ExchangeCurrency = "BRL" | "USD" | "EUR" | "ETH" | "BTC" | "USDC" | "USDT";

// price of 1 unit of each currency in USDT. USDT is the anchor currency for
// every conversion, so "from X to Y" is always a single step (X→USDT→Y),
// never a chain of pairs that would accumulate rounding.
export const RATE_TO_USDT: Record<ExchangeCurrency, number> = {
  USDT: 1,
  USD: 1, // 1 USDT ≈ 1 USD, simulated reference
  BRL: 1 / USD_BRL,
  EUR: 1 / USD_EUR,
  ETH: ETH_USD,
  BTC: BTC_USDT,
  USDC: 1, // stablecoin, ~1 USD parity, simulated reference
};

export function convertCurrency(
  amount: number,
  from: ExchangeCurrency,
  to: ExchangeCurrency,
): number {
  const amountInUsdt = amount * RATE_TO_USDT[from];
  return amountInUsdt / RATE_TO_USDT[to];
}
