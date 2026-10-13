import type { Position } from "./trading";

// simulated: starting balance and position only so the demo doesn't start
// empty. Buying power, used margin and day P/L are DERIVED from this (see
// ExchangeContext), not separate fixed values. Amounts in USDT (the site's
// internal unit; see CLAUDE.md).
export const INITIAL_BALANCE_USDT = 37446;

export const SEED_POSITIONS: Position[] = [{ symbol: "AAPL", qty: 45, avgPrice: 207 }];
