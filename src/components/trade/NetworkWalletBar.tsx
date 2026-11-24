"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, Loader2, LogOut } from "lucide-react";
import { useConnection, useDisconnect } from "wagmi";
import { CHAINS } from "@/lib/exchange/chains";
import { CHAIN_CONFIG, CHAIN_LABEL, CHAIN_ORDER } from "@/lib/exchange/config";
import { ConnectWalletButton, WalletDialog } from "@/components/web3/WalletDialog";
import { WalletErrorNotice } from "@/components/web3/WalletErrorNotice";
import { useGuardedSwitchChain } from "@/components/web3/useGuardedSwitchChain";
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

function SolanaWalletControl({ onConnect }: { onConnect: () => void }) {
  const sol = useSolanaWallet();
  if (sol.address) return <ConnectedChip address={sol.address} onDisconnect={() => void sol.disconnect()} />;
  return <ConnectWalletButton onClick={onConnect} />;
}

function EvmWalletControl({ onConnect }: { onConnect: () => void }) {
  const t = en.trade.wallet;
  const { chain } = useTrade();
  const target = CHAINS[chain].evmChainId as EvmChainId;
  const connection = useConnection();
  const { mutate: disconnect } = useDisconnect();
  const { switchTo, pending: switching, error: switchError } = useGuardedSwitchChain();

  if (connection.isConnected && connection.address) {
    const wrongChain = connection.chainId !== target;
    return (
      <div className="flex flex-col items-start gap-2 lg:items-end">
        <div className="flex flex-wrap items-center gap-2">
          {wrongChain && (
            <button
              type="button"
              onClick={() => void switchTo(target, CHAIN_LABEL[chain])}
              disabled={switching}
              className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-1.5 text-sm text-warning hover:bg-warning/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue disabled:opacity-60"
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
        {wrongChain && switchError && (
          <WalletErrorNotice heading={en.wallets.switchErrorHeading} error={switchError} className="max-w-md" />
        )}
      </div>
    );
  }

  return <ConnectWalletButton onClick={onConnect} />;
}

export function NetworkWalletBar() {
  const { chain, setChain } = useTrade();
  const t = en.trade;
  const config = CHAIN_CONFIG[chain];
  const kind = CHAINS[chain].kind;
  // The dialog stays mounted while a wallet connects: if the connection succeeds but
  // the network switch fails, its error is still shown.
  const [dialogOpen, setDialogOpen] = useState(false);
  const closeDialog = useCallback(() => setDialogOpen(false), []);
  const openDialog = useCallback(() => setDialogOpen(true), []);

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

        <div className="shrink-0">
          {kind === "solana" ? <SolanaWalletControl onConnect={openDialog} /> : <EvmWalletControl onConnect={openDialog} />}
        </div>
      </div>
      <WalletDialog
        open={dialogOpen}
        onClose={closeDialog}
        target={kind}
        network={CHAIN_LABEL[chain]}
        evmChainId={kind === "evm" ? (CHAINS[chain].evmChainId as EvmChainId) : undefined}
      />
    </div>
  );
}
