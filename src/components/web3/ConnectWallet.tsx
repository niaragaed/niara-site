"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, Loader2, LogOut } from "lucide-react";
import { useConnection, useDisconnect, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { en } from "@/lib/i18n/en";
import type { WalletFamily } from "@/lib/web3/wallet-directory";
import { ConnectWalletButton, WalletDialog } from "./WalletDialog";

const EVM_ONLY: WalletFamily[] = ["evm"];

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ConnectWallet() {
  const connection = useConnection();
  const { mutate: disconnect } = useDisconnect();
  const { mutate: switchChain, isPending: isSwitching } = useSwitchChain();

  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
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

  // The pilot is EVM only (Sepolia).
  return (
    <>
      <ConnectWalletButton onClick={() => setOpen(true)} />
      <WalletDialog open={open} onClose={close} families={EVM_ONLY} evmChainId={sepolia.id} />
    </>
  );
}
