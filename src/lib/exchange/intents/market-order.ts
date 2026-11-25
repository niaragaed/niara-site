// Port of niara-exchange-engine/src/intents/market-order.ts (commit ad3a082). TESTNET ONLY.
//
// A market order is not a separate order type: it is an IOC order (intent v2,
// `timeInForce: "IOC"`) whose signed limit price is a PRICE CAP computed here from the
// best opposite price and a slippage tolerance:
//
//   buy:  limit = floor(best ask × (10_000 + slippage bps) / 10_000)
//   sell: limit = ceil(best bid  × (10_000 − slippage bps) / 10_000), at least 1
//
// The engine knows nothing of slippage: it matches the IOC at once at the makers'
// prices, never beyond the signed limit, and cancels whatever is left (`ioc_unfilled`).
// The wallet sees and signs the cap: the most it can pay (buy) or the least it can
// receive (sell). Slippage: 1% by default, at most 5%; the engine would accept any
// signed limit, so the 5% cap is the client's to keep, and this helper refuses more.
import type { Side } from "./types";

export const MARKET_ORDER_DEFAULT_SLIPPAGE_BPS = 100; // 1%
export const MARKET_ORDER_MAX_SLIPPAGE_BPS = 500; // 5%

const BPS = BigInt(10_000);

export class MarketOrderError extends Error {
  readonly code: "invalid_slippage" | "empty_side" | "invalid_price";
  constructor(code: MarketOrderError["code"], message: string) {
    super(message);
    this.name = "MarketOrderError";
    this.code = code;
  }
}

/**
 * The limit price (payment base units per lot) of a market order of `side`, from the
 * best opposite price of the book (best ask for a buy, best bid for a sell). Rounded so
 * the cap never exceeds the slippage: down for a buy, up for a sell.
 */
export function marketOrderLimitPrice(
  side: Side,
  bestOppositePrice: bigint | null | undefined,
  slippageBps: number = MARKET_ORDER_DEFAULT_SLIPPAGE_BPS,
): bigint {
  if (!Number.isInteger(slippageBps) || slippageBps < 0 || slippageBps > MARKET_ORDER_MAX_SLIPPAGE_BPS) {
    throw new MarketOrderError(
      "invalid_slippage",
      `slippage must be a whole number of basis points from 0 to ${MARKET_ORDER_MAX_SLIPPAGE_BPS} (5%)`,
    );
  }
  if (bestOppositePrice === null || bestOppositePrice === undefined) {
    throw new MarketOrderError("empty_side", `no ${side === "buy" ? "ask" : "bid"} in the book: a market order would have nothing to match`);
  }
  if (bestOppositePrice <= BigInt(0)) throw new MarketOrderError("invalid_price", "the best price must be positive");
  const bps = BigInt(slippageBps);
  if (side === "buy") return (bestOppositePrice * (BPS + bps)) / BPS;
  const floor = (bestOppositePrice * (BPS - bps) + BPS - BigInt(1)) / BPS;
  return floor < BigInt(1) ? BigInt(1) : floor;
}
