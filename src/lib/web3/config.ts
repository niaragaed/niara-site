// wagmi config for the real-wallet pilot (/pilot). Isolated from the rest of
// the simulated site; used only by the Providers in src/app/pilot.
import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
