"use client";

// Settled trades of the selected market (`GET /v1/trades/:chain/:asset`: matches
// confirmed on-chain, no wallets). Shared by the price chart and the trade history:
// React Query runs one request for both.

import { useQuery } from "@tanstack/react-query";
import { ENGINE_URL } from "@/lib/exchange/config";
import { fetchAllPages, fetchTrades } from "@/lib/exchange/engine-api";
import { useTrade } from "./TradeContext";

/** Up to 2,000 trades (4 pages of 500): enough history for the candles shown. */
const TRADE_PAGES = 4;

export function useMarketTrades() {
  const { chain, listing } = useTrade();
  return useQuery({
    queryKey: ["exchange", "trades", chain, listing?.asset],
    enabled: Boolean(ENGINE_URL && listing),
    queryFn: () => fetchAllPages((before) => fetchTrades(chain, listing!.asset, before), TRADE_PAGES),
    refetchInterval: 30_000,
  });
}
