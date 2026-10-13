"use client";

import { useSyncExternalStore } from "react";
import { AlertTriangle, Loader2, LogOut, Wallet } from "lucide-react";
import { useConnect, useConnectors, useConnection, useDisconnect, useSwitchChain } from "wagmi";
import { UserRejectedRequestError } from "viem";
import { sepolia } from "wagmi/chains";
import { en } from "@/lib/i18n/en";

function subscribeToProvider() {
  // The presence of window.ethereum doesn't change observably: there is no
  // event to subscribe to, only the post-hydration read via getSnapshot.
  return () => {};
}

function getProviderSnapshot() {
  return Boolean((window as Window & { ethereum?: unknown }).ethereum);
}

function getProviderServerSnapshot() {
  // Assume it's present on the server/first paint so the happy path (wallet
  // installed) isn't penalized with a negative flash.
  return true;
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function isUserRejection(error: unknown) {
  if (error instanceof UserRejectedRequestError) return true;
  if (error && typeof error === "object") {
    const err = error as { code?: number; cause?: { code?: number } };
    return err.code === 4001 || err.cause?.code === 4001;
  }
  return false;
}

export function ConnectWallet() {
  const hasProvider = useSyncExternalStore(
    subscribeToProvider,
    getProviderSnapshot,
    getProviderServerSnapshot,
  );

  const connection = useConnection();
  const connectors = useConnectors();
  const { mutate: connect, isPending: isConnectPending, error: connectError } = useConnect();
  const { mutate: disconnect } = useDisconnect();
  const { mutate: switchChain, isPending: isSwitching } = useSwitchChain();

  const injectedConnector = connectors[0];
  const isWrongNetwork = connection.isConnected && connection.chainId !== sepolia.id;
  const rejected = connectError !== null && isUserRejection(connectError);

  if (!hasProvider && !connection.isConnected) {
    return (
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
    );
  }

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

  const isPending = isConnectPending || connection.isConnecting || connection.isReconnecting;

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={() => injectedConnector && connect({ connector: injectedConnector })}
        disabled={isPending || !injectedConnector}
        className="flex items-center gap-2 rounded-md border border-border bg-bg-surface px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Wallet className="h-4 w-4" aria-hidden="true" />
        )}
        <span>{isPending ? en.pilot.connecting : en.pilot.connect}</span>
      </button>
      {rejected && <span className="text-xs text-text-muted">{en.pilot.rejected}</span>}
    </div>
  );
}
