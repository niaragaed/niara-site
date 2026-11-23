"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, type State } from "wagmi";
import { SolanaWalletProvider } from "@/components/web3/SolanaWalletProvider";
import { config } from "@/lib/web3/config";

type ProvidersProps = {
  children: ReactNode;
  initialState?: State;
};

export function Providers({ children, initialState }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {/* Site-wide, so the shared connect dialog lists Solana wallets on every page. */}
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
