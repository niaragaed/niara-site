"use client";

// State of the real terminal (/trade): selected chain, approved listings,
// on-chain terms and the orders submitted from THIS tab. Market data comes only
// from Supabase/engine and the chain itself — nothing here is illustrative.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAddress } from "viem";
import { useConnection } from "wagmi";
import { CHAINS, type ChainId } from "@/lib/exchange/chains";
import { CHAIN_CONFIG, CHAIN_ORDER, type ChainConfig } from "@/lib/exchange/config";
import { fetchChainRow, fetchEquityListings, type ChainRow, type ListingRow } from "@/lib/exchange/market-data";
import { assertDevnet, readMint, readProgramTerms, solanaConnection } from "@/lib/exchange/solana";
import { assertEvmChain, evmClient, readEvmToken, readSettlementTerms } from "@/lib/exchange/evm";
import type { EngineMatch, EngineOrder } from "@/lib/exchange/engine-api";
import type { OrderIntent } from "@/lib/exchange/intents";
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

export interface SessionOrder {
  intent: OrderIntent;
  order: EngineOrder;
  matches: EngineMatch[];
  approvalTx: string | null;
  /** Unix seconds. */
  placedAt: number;
}

type TradeState = {
  chain: ChainId;
  setChain: (chain: ChainId) => void;
  config: ChainConfig;
  chainRow: ChainRow | null | undefined;
  chainRowError: unknown;
  listings: ListingRow[] | undefined;
  listingsError: unknown;
  listingsLoading: boolean;
  listing: ListingRow | null;
  selectListing: (asset: string) => void;
  assetMeta: TokenMeta | undefined;
  terms: ChainTerms | undefined;
  termsError: unknown;
  /** Address of the wallet for the chain's family (Solana or EVM), if connected. */
  wallet: string | null;
  /** Problems that block orders on this chain (empty = orders allowed). */
  blockers: string[];
  sessionOrders: SessionOrder[];
  addSessionOrder: (o: SessionOrder) => void;
  updateSessionOrder: (orderId: string, order: EngineOrder) => void;
};

const TradeContext = createContext<TradeState | null>(null);

export function useTrade(): TradeState {
  const ctx = useContext(TradeContext);
  if (!ctx) throw new Error("useTrade precisa estar dentro de <TradeProvider>");
  return ctx;
}

const sameAddress = (chain: ChainId, a: string, b: string) =>
  CHAINS[chain].kind === "evm" ? getAddress(a) === getAddress(b) : a === b;

export function TradeProvider({ children, initialAsset }: { children: ReactNode; initialAsset?: string }) {
  const [chain, setChainState] = useState<ChainId>(CHAIN_ORDER[0]);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(initialAsset ?? null);
  const [sessionOrders, setSessionOrders] = useState<SessionOrder[]>([]);
  const config = CHAIN_CONFIG[chain];
  const kind = CHAINS[chain].kind;

  const solana = useSolanaWallet();
  const evm = useConnection();
  const wallet = kind === "solana" ? solana.address : (evm.address ?? null);

  const chainRowQuery = useQuery({
    queryKey: ["exchange", "chain", chain],
    queryFn: () => fetchChainRow(chain),
    staleTime: 60_000,
  });

  const listingsQuery = useQuery({
    queryKey: ["exchange", "listings", chain],
    queryFn: () => fetchEquityListings(chain),
    staleTime: 60_000,
  });

  const listings = listingsQuery.data;
  const listing = useMemo(() => {
    if (!listings || listings.length === 0) return null;
    return (
      listings.find((l) => selectedAsset !== null && sameAddress(chain, l.asset, selectedAsset)) ?? listings[0]
    );
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
        const [usdt, program] = await Promise.all([
          readMint(conn, config.usdt),
          readProgramTerms(conn, config.settlement),
        ]);
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

  const assetMetaQuery = useQuery({
    queryKey: ["exchange", "asset-meta", chain, listing?.asset],
    enabled: config.ready && listing !== null,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<TokenMeta> => {
      if (!config.ready || !listing) throw new Error("not ready");
      if (kind === "solana") {
        const m = await readMint(solanaConnection(config.rpcUrl), listing.asset);
        return { symbol: m.symbol, name: m.name, decimals: m.decimals };
      }
      return readEvmToken(evmClient(config.rpcUrl, config.evmChainId as number), listing.asset);
    },
  });

  const blockers = useMemo(() => {
    const out: string[] = [];
    if (!config.ready) return ["not_configured"];
    const row = chainRowQuery.data;
    if (row) {
      if (!row.settlementProgram || !row.quoteAsset) out.push("chain_not_ready");
      else if (!sameAddress(chain, row.settlementProgram, config.settlement) || !sameAddress(chain, row.quoteAsset, config.usdt)) {
        out.push("config_mismatch");
      }
    }
    const terms = termsQuery.data;
    if (terms?.paused) out.push("paused");
    if (terms && !terms.feeTokenMatches) out.push("config_mismatch");
    return [...new Set(out)];
  }, [config, chain, chainRowQuery.data, termsQuery.data]);

  const setChain = useCallback((next: ChainId) => {
    setChainState(next);
    setSelectedAsset(null);
  }, []);

  const addSessionOrder = useCallback((o: SessionOrder) => setSessionOrders((prev) => [o, ...prev]), []);
  const updateSessionOrder = useCallback(
    (orderId: string, order: EngineOrder) =>
      setSessionOrders((prev) => prev.map((o) => (o.order.id === orderId ? { ...o, order } : o))),
    [],
  );

  const value: TradeState = {
    chain,
    setChain,
    config,
    chainRow: chainRowQuery.data,
    chainRowError: chainRowQuery.error,
    listings,
    listingsError: listingsQuery.error,
    listingsLoading: listingsQuery.isLoading,
    listing,
    selectListing: setSelectedAsset,
    assetMeta: assetMetaQuery.data,
    terms: termsQuery.data,
    termsError: termsQuery.error,
    wallet,
    blockers,
    sessionOrders,
    addSessionOrder,
    updateSessionOrder,
  };

  return <TradeContext.Provider value={value}>{children}</TradeContext.Provider>;
}
