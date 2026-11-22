"use client";

// State of the real terminal (/trade): selected chain, its markets and flags from
// the order service (`GET /v1/markets`), on-chain terms, and the connected wallet's
// orders and matches across sessions (`GET /v1/orders`, `GET /v1/matches`).
// Market data comes only from the engine, Supabase and the chain itself — nothing
// here is illustrative.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAddress } from "viem";
import { useConnection } from "wagmi";
import { CHAINS, type ChainId } from "@/lib/exchange/chains";
import { CHAIN_CONFIG, CHAIN_ORDER, ENGINE_URL, type ChainConfig } from "@/lib/exchange/config";
import { fetchEquityListings } from "@/lib/exchange/market-data";
import { assertDevnet, readMint, readProgramTerms, solanaConnection } from "@/lib/exchange/solana";
import { assertEvmChain, evmClient, readEvmToken, readSettlementTerms } from "@/lib/exchange/evm";
import {
  fetchAllPages,
  fetchMarkets,
  fetchWalletMatches,
  fetchWalletOrders,
  type StoredOrder,
  type WalletMatch,
} from "@/lib/exchange/engine-api";
import { useSolanaWallet } from "@/components/web3/SolanaWalletProvider";

export interface TokenMeta {
  symbol: string | null;
  name: string | null;
  decimals: number;
}

export interface ChainTerms {
  usdt: TokenMeta;
  feeBps: number;
  /** Solana only (Config.cashback_bps); on EVM it lives in the CashbackDistributor. */
  cashbackBps: number | null;
  paused: boolean;
  /** The on-chain fee is charged in the same USDT configured here. */
  feeTokenMatches: boolean;
}

/** The selected chain as the order service reports it (`GET /v1/markets`). */
export interface ChainInfo {
  settlementProgram: string | null;
  quoteAsset: string | null;
  minOrderNotional: bigint;
  maxIntentValiditySecs: number;
  ordersAccepted: boolean;
  settlementEnabled: boolean;
}

/** An approved Equity market of the order service, enriched from Supabase `listings`. */
export interface Market {
  asset: string;
  symbol: string | null;
  name: string | null;
  assetDecimals: number;
  lotSize: bigint;
  /** From Supabase `listings`; null when that read is unavailable. */
  issuer: string | null;
  cashbackEligible: boolean | null;
  txHash: string | null;
}

/** Wallet lists are paged by 100; the approval sum needs them complete. */
const ORDER_PAGES = 20;
const MATCH_PAGES = 5;
const LIVE = new Set(["open", "partially_filled"]);
const UNSETTLED = new Set(["pending", "settling"]);

type TradeState = {
  chain: ChainId;
  setChain: (chain: ChainId) => void;
  config: ChainConfig;
  chainInfo: ChainInfo | null;
  marketsError: unknown;
  marketsLoading: boolean;
  listings: Market[] | undefined;
  listing: Market | null;
  selectListing: (asset: string) => void;
  terms: ChainTerms | undefined;
  termsError: unknown;
  /** Address of the wallet for the chain's family (Solana or EVM), if connected. */
  wallet: string | null;
  /** Problems that block orders on this chain (empty = orders allowed). */
  blockers: string[];
  /** All of the wallet's orders on this chain, newest first. */
  orders: StoredOrder[] | undefined;
  /** False when the engine had more pages than we read (approval sums are then refused). */
  ordersComplete: boolean;
  ordersError: unknown;
  matches: WalletMatch[] | undefined;
  matchesError: unknown;
  /** Re-reads the wallet's orders and matches (after placing or cancelling). */
  refreshWallet: () => Promise<void>;
};

const TradeContext = createContext<TradeState | null>(null);

export function useTrade(): TradeState {
  const ctx = useContext(TradeContext);
  if (!ctx) throw new Error("useTrade must be used inside <TradeProvider>");
  return ctx;
}

export const sameAddress = (chain: ChainId, a: string, b: string) =>
  CHAINS[chain].kind === "evm" ? getAddress(a) === getAddress(b) : a === b;

export function TradeProvider({ children, initialAsset }: { children: ReactNode; initialAsset?: string }) {
  const [chain, setChainState] = useState<ChainId>(CHAIN_ORDER[0]);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(initialAsset ?? null);
  const config = CHAIN_CONFIG[chain];
  const kind = CHAINS[chain].kind;
  const queryClient = useQueryClient();

  const solana = useSolanaWallet();
  const evm = useConnection();
  const wallet = kind === "solana" ? solana.address : (evm.address ?? null);

  const marketsQuery = useQuery({
    queryKey: ["exchange", "markets"],
    enabled: Boolean(ENGINE_URL),
    queryFn: fetchMarkets,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const engineChain = marketsQuery.data?.chains.find((c) => c.id === chain) ?? null;

  const chainInfo = useMemo<ChainInfo | null>(
    () =>
      engineChain && {
        settlementProgram: engineChain.settlementProgram,
        quoteAsset: engineChain.quoteAsset?.asset ?? null,
        minOrderNotional: BigInt(engineChain.minOrderNotional),
        maxIntentValiditySecs: engineChain.maxIntentValiditySecs ?? 0,
        ordersAccepted: engineChain.ordersAccepted,
        settlementEnabled: engineChain.settlementEnabled,
      },
    [engineChain],
  );

  // Issuer, cashback eligibility and the approval tx are not in /v1/markets: read
  // from the public `listings` table when Supabase is configured. Optional.
  const listingExtras = useQuery({
    queryKey: ["exchange", "listings", chain],
    queryFn: () => fetchEquityListings(chain),
    staleTime: 60_000,
    retry: false,
  });

  const listings = useMemo<Market[] | undefined>(() => {
    if (!engineChain) return marketsQuery.data ? [] : undefined;
    return engineChain.markets
      .filter((m) => m.status === "approved")
      .map((m) => {
        const extra = listingExtras.data?.find((l) => sameAddress(chain, l.asset, m.asset));
        return {
          asset: m.asset,
          symbol: m.symbol,
          name: m.name,
          assetDecimals: m.assetDecimals,
          lotSize: BigInt(m.lotSize),
          issuer: extra?.issuer ?? null,
          cashbackEligible: extra ? extra.cashbackEligible : null,
          txHash: extra?.txHash ?? null,
        };
      });
  }, [engineChain, marketsQuery.data, listingExtras.data, chain]);

  const listing = useMemo(() => {
    if (!listings || listings.length === 0) return null;
    return listings.find((l) => selectedAsset !== null && sameAddress(chain, l.asset, selectedAsset)) ?? listings[0];
  }, [listings, selectedAsset, chain]);

  // The chain's on-chain terms (USDT and fee), read through the env RPC.
  const termsQuery = useQuery({
    queryKey: ["exchange", "terms", chain],
    enabled: config.ready,
    staleTime: 60_000,
    queryFn: async (): Promise<ChainTerms> => {
      if (!config.ready) throw new Error("not configured");
      if (kind === "solana") {
        const conn = solanaConnection(config.rpcUrl);
        await assertDevnet(conn);
        const [usdt, program] = await Promise.all([readMint(conn, config.usdt), readProgramTerms(conn, config.settlement)]);
        return {
          usdt: { symbol: usdt.symbol, name: usdt.name, decimals: usdt.decimals },
          feeBps: program.feeBps,
          cashbackBps: program.cashbackBps,
          paused: program.paused,
          feeTokenMatches: program.feeMint === config.usdt,
        };
      }
      const client = evmClient(config.rpcUrl, config.evmChainId as number);
      await assertEvmChain(client, config.evmChainId as number);
      const [usdt, settlement] = await Promise.all([
        readEvmToken(client, config.usdt),
        readSettlementTerms(client, config.settlement),
      ]);
      return {
        usdt,
        feeBps: settlement.feeBps,
        cashbackBps: null,
        paused: settlement.paused,
        feeTokenMatches: getAddress(settlement.feeToken) === getAddress(config.usdt),
      };
    },
  });

  const ordersQuery = useQuery({
    queryKey: ["exchange", "wallet-orders", chain, wallet],
    enabled: Boolean(ENGINE_URL && wallet),
    queryFn: () => fetchAllPages((before) => fetchWalletOrders(chain, wallet as string, before, 100), ORDER_PAGES),
    // Re-read while something can still change: a live order can fill, expire or go stale.
    refetchInterval: (q) => (q.state.data?.items.some((o) => LIVE.has(o.status)) ? 10_000 : false),
  });

  const matchesQuery = useQuery({
    queryKey: ["exchange", "wallet-matches", chain, wallet],
    enabled: Boolean(ENGINE_URL && wallet),
    queryFn: () => fetchAllPages((before) => fetchWalletMatches(chain, wallet as string, before, 100), MATCH_PAGES),
    refetchInterval: (q) => (q.state.data?.items.some((m) => UNSETTLED.has(m.status)) ? 5_000 : false),
  });

  const refreshWallet = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["exchange", "wallet-orders", chain, wallet] }),
      queryClient.invalidateQueries({ queryKey: ["exchange", "wallet-matches", chain, wallet] }),
      queryClient.invalidateQueries({ queryKey: ["exchange", "book", chain] }),
    ]);
  }, [queryClient, chain, wallet]);

  const blockers = useMemo(() => {
    if (!config.ready) return ["not_configured"];
    if (!ENGINE_URL) return ["engine_not_configured"];
    if (marketsQuery.error) return ["engine_unreachable"];
    const out: string[] = [];
    if (chainInfo) {
      if (!chainInfo.ordersAccepted || !chainInfo.settlementProgram || !chainInfo.quoteAsset) out.push("orders_not_accepted");
      else if (
        !sameAddress(chain, chainInfo.settlementProgram, config.settlement) ||
        !sameAddress(chain, chainInfo.quoteAsset, config.usdt)
      ) {
        out.push("config_mismatch");
      }
      if (!chainInfo.settlementEnabled) out.push("settlement_disabled");
    } else if (marketsQuery.data) {
      out.push("orders_not_accepted");
    }
    const terms = termsQuery.data;
    if (terms?.paused) out.push("paused");
    if (terms && !terms.feeTokenMatches) out.push("config_mismatch");
    return [...new Set(out)];
  }, [config, chain, chainInfo, marketsQuery.error, marketsQuery.data, termsQuery.data]);

  const setChain = useCallback((next: ChainId) => {
    setChainState(next);
    setSelectedAsset(null);
  }, []);

  const value: TradeState = {
    chain,
    setChain,
    config,
    chainInfo,
    marketsError: marketsQuery.error,
    marketsLoading: marketsQuery.isLoading,
    listings,
    listing,
    selectListing: setSelectedAsset,
    terms: termsQuery.data,
    termsError: termsQuery.error,
    wallet,
    blockers,
    orders: ordersQuery.data?.items,
    ordersComplete: ordersQuery.data?.complete ?? true,
    ordersError: ordersQuery.error,
    matches: matchesQuery.data?.items,
    matchesError: matchesQuery.error,
    refreshWallet,
  };

  return <TradeContext.Provider value={value}>{children}</TradeContext.Provider>;
}
