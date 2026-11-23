"use client";

// EVM wallet picker: one button per wallet announced through EIP-6963 (wagmi's
// multi-injected provider discovery). Nothing here reads or writes
// `window.ethereum`, so several installed wallets do not fight over it, and the
// user picks which one connects.

import { useSyncExternalStore, type ReactNode } from "react";
import { Loader2, Wallet } from "lucide-react";
import { useConnect, useConnectors, useConnection } from "wagmi";
import type { EvmChainId } from "@/lib/web3/config";

const subscribeNoop = () => () => {};

/** Only image data URIs, as EIP-6963 and Wallet Standard specify for icons. */
export function safeWalletIcon(icon: string | undefined): string | null {
  return icon && /^data:image\/(svg\+xml|png|webp|jpeg|gif)[;,]/i.test(icon) ? icon : null;
}

export function EvmWalletPicker({
  chainId,
  labels,
  noWallet,
}: {
  chainId?: EvmChainId;
  labels: { connectWith: (name: string) => string; connecting: string; rejected: string };
  /** Shown when no wallet announced itself after hydration. */
  noWallet: ReactNode;
}) {
  // Discovery only runs in the browser: until hydration, render nothing instead
  // of a "no wallet" message that would flash.
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const connectors = useConnectors();
  const connection = useConnection();
  const { mutate: connect, isPending, variables, error } = useConnect();

  if (!hydrated) return null;
  if (connectors.length === 0) return <>{noWallet}</>;

  const busy = isPending || connection.isConnecting || connection.isReconnecting;
  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <div className="flex flex-wrap gap-2">
        {connectors.map((c) => {
          const icon = safeWalletIcon(c.icon);
          const pending = isPending && variables?.connector === c;
          return (
            <button
              key={c.uid}
              type="button"
              disabled={busy}
              onClick={() => connect(chainId === undefined ? { connector: c } : { connector: c, chainId })}
              className="flex items-center gap-2 rounded-md border border-border bg-bg-surface px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : icon ? (
                // Icon supplied by the wallet itself (EIP-6963 data URI).
                // eslint-disable-next-line @next/next/no-img-element
                <img src={icon} alt="" width={16} height={16} className="h-4 w-4" />
              ) : (
                <Wallet className="h-4 w-4" aria-hidden="true" />
              )}
              {pending ? labels.connecting : labels.connectWith(c.name)}
            </button>
          );
        })}
      </div>
      {error && <span className="text-xs text-text-muted">{labels.rejected}</span>}
    </div>
  );
}
