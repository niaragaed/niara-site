"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, Loader2, LogOut } from "lucide-react";
import { useConnection, useDisconnect, useSwitchChain } from "wagmi";
import { CHAINS } from "@/lib/exchange/chains";
import { CHAIN_CONFIG, CHAIN_LABEL, CHAIN_ORDER } from "@/lib/exchange/config";
import { ConnectWalletButton, WalletDialog } from "@/components/web3/WalletDialog";
import { useSolanaWallet } from "@/components/web3/SolanaWalletProvider";
import { en } from "@/lib/i18n/en";
import type { EvmChainId } from "@/lib/web3/config";
import { useTrade } from "./TradeContext";

const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;

function ConnectedChip({ address, onDisconnect }: { address: string; onDisconnect: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-md border border-border bg-bg-surface px-3 py-1.5 text-sm">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-positive" />
        <span className="font-mono tabular-nums text-text-primary" title={address}>
          {short(address)}
        </span>
      </div>
      <button
        type="button"
        onClick={onDisconnect}
        aria-label={en.trade.wallet.disconnect}
        title={en.trade.wallet.disconnect}
        className="rounded-md border border-border bg-bg-surface p-1.5 text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Opens the shared connect dialog (both wallet families). */
function ConnectControl({ evmChainId }: { evmChainId?: EvmChainId }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <ConnectWalletButton onClick={() => setOpen(true)} />
      <WalletDialog open={open} onClose={close} evmChainId={evmChainId} />
    </>
  );
}

function SolanaWalletControl() {
  const sol = useSolanaWallet();
  if (sol.address) return <ConnectedChip address={sol.address} onDisconnect={() => void sol.disconnect()} />;
  return <ConnectControl />;
}

function EvmWalletControl() {
  const t = en.trade.wallet;
  const { chain } = useTrade();
  const target = CHAINS[chain].evmChainId as EvmChainId;
  const connection = useConnection();
  const { mutate: disconnect } = useDisconnect();
  const { mutate: switchChain, isPending: switching } = useSwitchChain();

  if (connection.isConnected && connection.address) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {connection.chainId !== target && (
          <button
            type="button"
            onClick={() => switchChain({ chainId: target })}
            disabled={switching}
            className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-1.5 text-sm text-warning hover:bg-warning/20 disabled:opacity-60"
          >
            {switching ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            )}
            {switching ? t.switching : t.switchTo(CHAIN_LABEL[chain])}
          </button>
        )}
        <ConnectedChip address={connection.address} onDisconnect={() => disconnect()} />
      </div>
    );
  }

  return <ConnectControl evmChainId={target} />;
}

export function NetworkWalletBar() {
  const { chain, setChain } = useTrade();
  const t = en.trade;
  const config = CHAIN_CONFIG[chain];

  return (
    <div className="border-b border-border">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="font-display text-sm tracking-wide text-text-primary">{t.terminalLabel}</span>
          <div role="tablist" aria-label={t.chainSelector.ariaLabel} className="flex flex-wrap gap-1.5">
            {CHAIN_ORDER.map((id) => {
              const c = CHAIN_CONFIG[id];
              const selected = id === chain;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setChain(id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue ${
                    selected
                      ? "border-accent-blue/60 bg-accent-blue/15 text-text-primary"
                      : "border-border text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {CHAIN_LABEL[id]}
                  {!c.ready && <span className="ml-1 text-text-muted">({t.chainSelector.notConfigured})</span>}
                </button>
              );
            })}
          </div>
          {!config.ready && (
            <p className="text-xs text-warning">{t.chainSelector.notConfiguredDetail(config.problems.join(", "))}</p>
          )}
          {CHAINS[chain].kind === "solana" && <p className="text-xs text-text-muted">{t.wallet.solanaNetworkNote}</p>}
        </div>

        <div className="shrink-0">{CHAINS[chain].kind === "solana" ? <SolanaWalletControl /> : <EvmWalletControl />}</div>
      </div>
    </div>
  );
}
