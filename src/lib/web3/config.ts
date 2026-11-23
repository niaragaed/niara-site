// wagmi config for the site (every network is a testnet).
// - Sepolia: the old pilot (/pilot, balances in /profile and /assets).
// - Base Sepolia, Robinhood Chain testnet, Tempo testnet and HyperEVM testnet:
//   Niara Exchange v1 chains used by /trade. RPC URLs come from env
//   (.env.example); when unset, viem's public RPC for the chain is used.
import { cookieStorage, createConfig, createStorage, http, type CreateConnectorFn } from "wagmi";
import { baseSepolia, hyperliquidEvmTestnet, robinhoodTestnet, sepolia, tempoModerato } from "wagmi/chains";

const rpc = (url: string | undefined) => (url && url.trim() !== "" ? url.trim() : undefined);

export const config = createConfig({
  chains: [sepolia, baseSepolia, robinhoodTestnet, tempoModerato, hyperliquidEvmTestnet],
  // EIP-6963 only: every installed wallet announces itself and gets its own
  // connector. No generic injected() connector, which would read the legacy
  // `window.ethereum` global that several wallets overwrite.
  connectors: [] as CreateConnectorFn[],
  multiInjectedProviderDiscovery: true,
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [sepolia.id]: http(rpc(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL)),
    [baseSepolia.id]: http(rpc(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL)),
    [robinhoodTestnet.id]: http(rpc(process.env.NEXT_PUBLIC_ROBINHOOD_TESTNET_RPC_URL)),
    [tempoModerato.id]: http(rpc(process.env.NEXT_PUBLIC_TEMPO_TESTNET_RPC_URL)),
    [hyperliquidEvmTestnet.id]: http(rpc(process.env.NEXT_PUBLIC_HYPEREVM_TESTNET_RPC_URL)),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}

/** Readable name of the connected EVM network (all testnets). */
export function evmNetworkName(chainId: number | undefined): string | null {
  if (chainId === undefined) return null;
  return config.chains.find((c) => c.id === chainId)?.name ?? null;
}

/** Union of the chain ids configured in wagmi (required by the typed actions). */
export type EvmChainId = (typeof config)["chains"][number]["id"];
