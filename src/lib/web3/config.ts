// Configuração wagmi do site (todas as redes são testnet).
// - Sepolia: piloto antigo (/pilot, saldos em /profile e /assets).
// - Base Sepolia, Robinhood Chain testnet, Tempo testnet e HyperEVM testnet:
//   cadeias v1 do Niara Exchange usadas por /trade. RPCs vêm do env
//   (.env.example); sem valor, cai no RPC público da definição do viem.
import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { baseSepolia, hyperliquidEvmTestnet, robinhoodTestnet, sepolia, tempoModerato } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const rpc = (url: string | undefined) => (url && url.trim() !== "" ? url.trim() : undefined);

export const config = createConfig({
  chains: [sepolia, baseSepolia, robinhoodTestnet, tempoModerato, hyperliquidEvmTestnet],
  connectors: [injected()],
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

/** Nome legível da rede EVM conectada (todas testnet). */
export function evmNetworkName(chainId: number | undefined): string | null {
  if (chainId === undefined) return null;
  return config.chains.find((c) => c.id === chainId)?.name ?? null;
}

/** União dos chain ids configurados no wagmi (exigida pelas actions tipadas). */
export type EvmChainId = (typeof config)["chains"][number]["id"];
