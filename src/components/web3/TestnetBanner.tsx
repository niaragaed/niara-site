"use client";

// Permanent (non-dismissible) notice on every page that touches a wallet: everything
// runs on testnet, with no real value. It also shows the network and the wallet.
// With no props, it reads the EVM connection from wagmi (Sepolia pilot pages); /trade
// passes the selected network and the wallet of the chosen chain.

import { FlaskConical } from "lucide-react";
import { useConnection } from "wagmi";
import { evmNetworkName } from "@/lib/web3/config";
import { en } from "@/lib/i18n/en";

function short(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function TestnetBanner({ network, wallet }: { network?: string; wallet?: string | null }) {
  const connection = useConnection();
  const t = en.testnet;

  let networkText = network;
  let walletText = wallet;
  if (network === undefined) {
    if (connection.isConnected && connection.chainId !== undefined) {
      networkText = evmNetworkName(connection.chainId) ?? t.unknownNetwork(connection.chainId);
    } else {
      networkText = "—";
    }
    walletText = connection.address ?? null;
  }

  return (
    <div role="status" className="border-b border-warning/40 bg-warning/10 px-4 py-2 text-xs sm:text-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="flex items-center gap-2 text-text-secondary">
          <FlaskConical className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          <span className="font-semibold tracking-wide text-warning">{t.label}</span>
          <span className="hidden sm:inline">— {t.text}</span>
        </p>
        <p className="flex flex-wrap items-center gap-x-3 text-text-secondary">
          <span>
            {t.networkLabel}: <span className="text-text-primary">{networkText}</span>
          </span>
          <span>
            {t.walletLabel}:{" "}
            <span className="font-mono tabular-nums text-text-primary">
              {walletText ? short(walletText) : t.notConnected}
            </span>
          </span>
        </p>
      </div>
      <p className="mx-auto mt-1 max-w-7xl text-text-secondary sm:hidden">{t.text}</p>
    </div>
  );
}
