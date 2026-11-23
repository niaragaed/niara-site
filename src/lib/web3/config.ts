// wagmi config for the site (every network is a testnet).
// - Sepolia: the old pilot (/pilot, balances in /profile and /assets).
// - Base Sepolia, Robinhood Chain testnet, Tempo testnet and HyperEVM testnet:
//   Niara Exchange v1 chains used by /trade. RPC URLs come from env
//   (.env.example); when unset, viem's public RPC for the chain is used.
import { cookieStorage, createConfig, createStorage, http, type CreateConnectorFn } from "wagmi";
import { baseSepolia, hyperliquidEvmTestnet, robinhoodTestnet, sepolia, tempoModerato } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";

const rpc = (url: string | undefined) => (url && url.trim() !== "" ? url.trim() : undefined);

// WalletConnect project id (Reown dashboard): public by design, it only identifies
// the app to the relay. Without it, WalletConnect is not offered.
const WALLETCONNECT_PROJECT_ID = rpc(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);

/**
 * WalletConnect (Reown AppKit QR modal), started lazily. wagmi's connector would
 * start the WalletConnect client on every page load (in `setup`, and through
 * `isAuthorized` during reconnect), contacting WalletConnect's servers for every
 * visitor. Here it starts only when the user picks WalletConnect, or on reconnect
 * when WalletConnect was the last connector used.
 */
function lazyWalletConnect(projectId: string): CreateConnectorFn {
  const create = walletConnect({
    projectId,
    showQrModal: true,
    qrModalOptions: { themeMode: "dark" },
    metadata: {
      name: "Niara (testnet)",
      description: "Niara testnet exchange. Test tokens only, no real value.",
      url: typeof window !== "undefined" ? window.location.origin : "https://niaraglobal.com",
      icons: [],
    },
  });
  return (cfg) => {
    const inner = create(cfg);
    let started = false;
    return {
      ...inner,
      async setup() {
        // deferred to the first connect
      },
      async connect(params) {
        if (!started) {
          started = true;
          await inner.setup?.call(this);
        }
        return inner.connect.call(this, params);
      },
      async isAuthorized() {
        const recent = await cfg.storage?.getItem("recentConnectorId");
        if (recent !== inner.id) return false;
        return inner.isAuthorized.call(this);
      },
    } as typeof inner;
  };
}

export const config = createConfig({
  chains: [sepolia, baseSepolia, robinhoodTestnet, tempoModerato, hyperliquidEvmTestnet],
  // Browser wallets through EIP-6963 only: every installed wallet announces itself
  // and gets its own connector. No generic injected() connector, which would read
  // the legacy `window.ethereum` global that several wallets overwrite.
  // Mobile wallets through WalletConnect, when a project id is configured.
  connectors: (WALLETCONNECT_PROJECT_ID ? [lazyWalletConnect(WALLETCONNECT_PROJECT_ID)] : []) as CreateConnectorFn[],
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
