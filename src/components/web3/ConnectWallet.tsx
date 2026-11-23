"use client";

import { AlertTriangle, Loader2, LogOut, Wallet } from "lucide-react";
import { useConnection, useDisconnect, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { en } from "@/lib/i18n/en";
import { EvmWalletPicker } from "./EvmWalletPicker";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ConnectWallet() {
  const connection = useConnection();
  const { mutate: disconnect } = useDisconnect();
  const { mutate: switchChain, isPending: isSwitching } = useSwitchChain();

  const isWrongNetwork = connection.isConnected && connection.chainId !== sepolia.id;

  if (connection.isConnected && isWrongNetwork) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => switchChain({ chainId: sepolia.id })}
          disabled={isSwitching}
          className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-1.5 text-sm text-warning transition-colors hover:bg-warning/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSwitching ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{isSwitching ? en.pilot.switching : en.pilot.switchNetwork}</span>
        </button>
        <button
          type="button"
          onClick={() => disconnect()}
          aria-label={en.pilot.disconnect}
          title={en.pilot.disconnect}
          className="rounded-md border border-border bg-bg-surface p-1.5 text-text-secondary transition-colors hover:text-text-primary"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  if (connection.isConnected && connection.address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-md border border-border bg-bg-surface px-3 py-1.5 text-sm">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-positive" />
          <span className="font-mono tabular-nums text-text-primary">
            {truncateAddress(connection.address)}
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-text-muted">
            Sepolia
          </span>
        </div>
        <button
          type="button"
          onClick={() => disconnect()}
          aria-label={en.pilot.disconnect}
          title={en.pilot.disconnect}
          className="rounded-md border border-border bg-bg-surface p-1.5 text-text-secondary transition-colors hover:text-text-primary"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <EvmWalletPicker
      chainId={sepolia.id}
      labels={{ connectWith: en.pilot.connectWith, connecting: en.pilot.connecting, rejected: en.pilot.rejected }}
      noWallet={
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-bg-surface px-3 py-1.5 text-sm text-text-secondary">
          <Wallet className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{en.pilot.noWallet}</span>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noreferrer"
            className="text-accent-blue underline underline-offset-2 hover:text-accent-cyan"
          >
            {en.pilot.installMetaMask}
          </a>
        </div>
      }
    />
  );
}
