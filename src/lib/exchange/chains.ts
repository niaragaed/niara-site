// Niara Exchange v1 chains (all testnets). Faithful port of
// niara-exchange-engine/src/chains.ts (commit d5b32d6): `caip2` is what the
// intent signs, so any divergence here invalidates the signature in the
// engine's verifier. Do not edit without editing the engine too.

export const CHAIN_IDS = [
  "solana-devnet",
  "base-sepolia",
  "robinhood-testnet",
  "hyperevm-testnet",
  "tempo-testnet",
] as const;

export type ChainId = (typeof CHAIN_IDS)[number];

export type ChainKind = "solana" | "evm";

export interface ChainInfo {
  id: ChainId;
  kind: ChainKind;
  caip2: string;
  /** EIP-155 chain id; null on Solana. */
  evmChainId: number | null;
  /** Full genesis hash; null on EVM. */
  solanaGenesisHash: string | null;
}

/** Devnet genesis hash (the engine checks the same one). */
export const SOLANA_DEVNET_GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

export const CHAINS: Readonly<Record<ChainId, ChainInfo>> = {
  "solana-devnet": {
    id: "solana-devnet",
    kind: "solana",
    caip2: `solana:${SOLANA_DEVNET_GENESIS.slice(0, 32)}`,
    evmChainId: null,
    solanaGenesisHash: SOLANA_DEVNET_GENESIS,
  },
  "base-sepolia": { id: "base-sepolia", kind: "evm", caip2: "eip155:84532", evmChainId: 84532, solanaGenesisHash: null },
  "robinhood-testnet": {
    id: "robinhood-testnet",
    kind: "evm",
    caip2: "eip155:46630",
    evmChainId: 46630,
    solanaGenesisHash: null,
  },
  "hyperevm-testnet": { id: "hyperevm-testnet", kind: "evm", caip2: "eip155:998", evmChainId: 998, solanaGenesisHash: null },
  "tempo-testnet": { id: "tempo-testnet", kind: "evm", caip2: "eip155:42431", evmChainId: 42431, solanaGenesisHash: null },
};

export function isChainId(value: unknown): value is ChainId {
  return typeof value === "string" && (CHAIN_IDS as readonly string[]).includes(value);
}
