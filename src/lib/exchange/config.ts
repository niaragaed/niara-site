// Configuration of the real testnet flow. Env ONLY (.env.example): engine URL,
// Supabase (the anon key is public by design, RLS), RPCs, chain ids and
// addresses. Nothing here is secret — and nothing secret may go in NEXT_PUBLIC_*.
//
// Next.js only inlines `process.env.NEXT_PUBLIC_X` written literally, so
// each variable is read in full, with no dynamic lookup.
import { getAddress, isAddress, type Address } from "viem";
import { CHAINS, type ChainId } from "./chains";
import { isSolanaAddress } from "./intents/validate";

const env = (v: string | undefined) => (v && v.trim() !== "" ? v.trim() : null);

export const ENGINE_URL = env(process.env.NEXT_PUBLIC_ENGINE_URL)?.replace(/\/+$/, "") ?? null;
export const SUPABASE_URL = env(process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/+$/, "") ?? null;
export const SUPABASE_ANON_KEY = env(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

type RawChain = {
  rpcUrl: string | null;
  chainId: string | null;
  settlement: string | null;
  usdt: string | null;
  explorerTx: string | null;
};

const RAW: Record<ChainId, RawChain> = {
  "solana-devnet": {
    rpcUrl: env(process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL),
    chainId: null,
    settlement: env(process.env.NEXT_PUBLIC_SOLANA_DEVNET_PROGRAM_ID),
    usdt: env(process.env.NEXT_PUBLIC_SOLANA_DEVNET_USDT_MINT),
    explorerTx: env(process.env.NEXT_PUBLIC_SOLANA_DEVNET_EXPLORER_TX),
  },
  "base-sepolia": {
    rpcUrl: env(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL),
    chainId: env(process.env.NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID),
    settlement: env(process.env.NEXT_PUBLIC_BASE_SEPOLIA_SETTLEMENT),
    usdt: env(process.env.NEXT_PUBLIC_BASE_SEPOLIA_USDT),
    explorerTx: env(process.env.NEXT_PUBLIC_BASE_SEPOLIA_EXPLORER_TX),
  },
  "robinhood-testnet": {
    rpcUrl: env(process.env.NEXT_PUBLIC_ROBINHOOD_TESTNET_RPC_URL),
    chainId: env(process.env.NEXT_PUBLIC_ROBINHOOD_TESTNET_CHAIN_ID),
    settlement: env(process.env.NEXT_PUBLIC_ROBINHOOD_TESTNET_SETTLEMENT),
    usdt: env(process.env.NEXT_PUBLIC_ROBINHOOD_TESTNET_USDT),
    explorerTx: env(process.env.NEXT_PUBLIC_ROBINHOOD_TESTNET_EXPLORER_TX),
  },
  "hyperevm-testnet": {
    rpcUrl: env(process.env.NEXT_PUBLIC_HYPEREVM_TESTNET_RPC_URL),
    chainId: env(process.env.NEXT_PUBLIC_HYPEREVM_TESTNET_CHAIN_ID),
    settlement: env(process.env.NEXT_PUBLIC_HYPEREVM_TESTNET_SETTLEMENT),
    usdt: env(process.env.NEXT_PUBLIC_HYPEREVM_TESTNET_USDT),
    explorerTx: env(process.env.NEXT_PUBLIC_HYPEREVM_TESTNET_EXPLORER_TX),
  },
  "tempo-testnet": {
    rpcUrl: env(process.env.NEXT_PUBLIC_TEMPO_TESTNET_RPC_URL),
    chainId: env(process.env.NEXT_PUBLIC_TEMPO_TESTNET_CHAIN_ID),
    settlement: env(process.env.NEXT_PUBLIC_TEMPO_TESTNET_SETTLEMENT),
    usdt: env(process.env.NEXT_PUBLIC_TEMPO_TESTNET_USDT),
    explorerTx: env(process.env.NEXT_PUBLIC_TEMPO_TESTNET_EXPLORER_TX),
  },
};

export type ChainConfig =
  | {
      chain: ChainId;
      ready: true;
      rpcUrl: string;
      /** Solana: program id. EVM: NiaraSettlement (checksummed). */
      settlement: string;
      /** Mint / token USDT. */
      usdt: string;
      evmChainId: number | null;
      /** Template with `{tx}`. */
      explorerTx: string;
    }
  | { chain: ChainId; ready: false; problems: string[] };

function validAddress(chain: ChainId, value: string): string | null {
  if (CHAINS[chain].kind === "solana") return isSolanaAddress(value) ? value : null;
  return isAddress(value, { strict: false }) ? getAddress(value) : null;
}

function load(chain: ChainId): ChainConfig {
  const raw = RAW[chain];
  const info = CHAINS[chain];
  const problems: string[] = [];
  if (!raw.rpcUrl) problems.push("RPC URL not set");
  const settlement = raw.settlement ? validAddress(chain, raw.settlement) : null;
  if (!settlement) problems.push("settlement program/contract not set or invalid");
  const usdt = raw.usdt ? validAddress(chain, raw.usdt) : null;
  if (!usdt) problems.push("USDT address not set or invalid");
  if (!raw.explorerTx || !raw.explorerTx.includes("{tx}")) problems.push("explorer URL template ({tx}) not set");
  let evmChainId: number | null = null;
  if (info.kind === "evm") {
    evmChainId = raw.chainId ? Number(raw.chainId) : null;
    // The chain id is signed in the EIP-712 domain: it must be the engine's.
    if (evmChainId !== info.evmChainId) problems.push(`chain id must be ${info.evmChainId}`);
  }
  if (problems.length > 0 || !raw.rpcUrl || !settlement || !usdt || !raw.explorerTx) {
    return { chain, ready: false, problems };
  }
  return { chain, ready: true, rpcUrl: raw.rpcUrl, settlement, usdt, evmChainId, explorerTx: raw.explorerTx };
}

export const CHAIN_CONFIG: Readonly<Record<ChainId, ChainConfig>> = {
  "solana-devnet": load("solana-devnet"),
  "base-sepolia": load("base-sepolia"),
  "robinhood-testnet": load("robinhood-testnet"),
  "hyperevm-testnet": load("hyperevm-testnet"),
  "tempo-testnet": load("tempo-testnet"),
};

/** Selector order: Solana devnet first (the spec's priority), then EVM. */
export const CHAIN_ORDER: readonly ChainId[] = [
  "solana-devnet",
  "base-sepolia",
  "robinhood-testnet",
  "tempo-testnet",
  "hyperevm-testnet",
];

export const CHAIN_LABEL: Readonly<Record<ChainId, string>> = {
  "solana-devnet": "Solana devnet",
  "base-sepolia": "Base Sepolia",
  "robinhood-testnet": "Robinhood Chain testnet",
  "hyperevm-testnet": "HyperEVM testnet",
  "tempo-testnet": "Tempo testnet",
};

export function explorerTxUrl(config: ChainConfig, tx: string): string | null {
  if (!config.ready) return null;
  return config.explorerTx.replace("{tx}", encodeURIComponent(tx));
}

export function evmAddress(value: string): Address {
  return getAddress(value);
}
