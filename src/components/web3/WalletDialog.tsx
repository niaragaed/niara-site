"use client";

// One connect dialog for both wallet families:
// 1. Niara Wallet — shown as "coming soon", not clickable (it does not exist yet);
// 2. the wallets detected in this browser: EVM through EIP-6963 (wagmi's
//    multi-injected discovery) and Solana through Wallet Standard — never through
//    `window.ethereum`;
// 3. WalletConnect (Reown AppKit QR modal) for mobile EVM wallets, when a project id
//    is configured;
// 4. "Get a wallet": official vendor sites only, with the networks each supports, and
//    how hardware wallets connect.

import { useEffect, useRef } from "react";
import { ExternalLink, Loader2, QrCode, Smartphone, Wallet, X } from "lucide-react";
import { useConnect, useConnection, useConnectors } from "wagmi";
import { en } from "@/lib/i18n/en";
import type { EvmChainId } from "@/lib/web3/config";
import { WALLET_DIRECTORY, type WalletFamily } from "@/lib/web3/wallet-directory";
import { useSolanaWallet } from "./SolanaWalletProvider";
import { safeWalletIcon } from "./wallet-icon";

const buttonClass =
  "flex w-full items-center gap-3 rounded-md border border-border bg-bg-elevated px-3 py-2 text-left text-sm text-text-primary transition-colors hover:border-accent-blue/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue disabled:cursor-not-allowed disabled:opacity-60";

function WalletIcon({ icon }: { icon: string | undefined }) {
  const safe = safeWalletIcon(icon);
  return safe ? (
    // Icon supplied by the installed wallet itself (data URI).
    // eslint-disable-next-line @next/next/no-img-element
    <img src={safe} alt="" width={20} height={20} className="h-5 w-5 shrink-0" />
  ) : (
    <Wallet className="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
  );
}

function FamilyBadge({ family }: { family: WalletFamily }) {
  return (
    <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-text-secondary">
      {en.wallets.family[family]}
    </span>
  );
}

const ALL_FAMILIES: WalletFamily[] = ["evm", "solana"];

export function WalletDialog({
  open,
  onClose,
  families = ALL_FAMILIES,
  evmChainId,
}: {
  open: boolean;
  onClose: () => void;
  families?: WalletFamily[];
  evmChainId?: EvmChainId;
}) {
  const t = en.wallets;
  const ref = useRef<HTMLDialogElement>(null);
  const connectors = useConnectors();
  const connection = useConnection();
  const { mutate: connect, isPending, variables, error: evmError } = useConnect();
  const sol = useSolanaWallet();

  // Native <dialog>: focus trap, Escape and inert background come from the browser.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Close once a wallet of a requested family connects.
  const evmConnected = connection.isConnected;
  const solConnected = sol.address !== null;
  const initial = useRef<{ evm: boolean; sol: boolean } | null>(null);
  useEffect(() => {
    if (!open) {
      initial.current = null;
      return;
    }
    if (initial.current === null) {
      initial.current = { evm: evmConnected, sol: solConnected };
      return;
    }
    if ((families.includes("evm") && evmConnected && !initial.current.evm) || (families.includes("solana") && solConnected && !initial.current.sol)) {
      onClose();
    }
  }, [open, evmConnected, solConnected, families, onClose]);

  const injected = connectors.filter((c) => c.type !== "walletConnect");
  const walletConnect = connectors.find((c) => c.type === "walletConnect");
  const showEvm = families.includes("evm");
  const showSol = families.includes("solana");
  const directory = WALLET_DIRECTORY.filter((w) => w.families.some((f) => families.includes(f)));
  const software = directory.filter((w) => w.kind === "software");
  const hardware = directory.filter((w) => w.kind === "hardware");

  const connectEvm = (c: (typeof connectors)[number]) =>
    connect(evmChainId === undefined ? { connector: c } : { connector: c, chainId: evmChainId });

  return (
    <dialog
      ref={ref}
      aria-labelledby="wallet-dialog-title"
      onClose={onClose}
      onClick={(e) => {
        // Click on the backdrop (outside the panel) closes.
        if (e.target === ref.current) onClose();
      }}
      className="m-auto max-h-[90vh] w-[min(560px,calc(100vw-32px))] overflow-y-auto rounded-lg border border-border bg-bg-surface p-0 text-text-primary backdrop:bg-bg-base/80"
    >
      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 id="wallet-dialog-title" className="font-display text-lg text-text-primary">
            {t.heading}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="rounded-md p-1 text-text-muted hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Niara Wallet does not exist yet: visible, labelled, not clickable. */}
        <div aria-disabled="true" className="flex items-center gap-3 rounded-md border border-dashed border-border px-3 py-2 opacity-70">
          <Wallet className="h-5 w-5 shrink-0 text-accent-violet" aria-hidden="true" />
          <span className="flex-1 text-sm text-text-secondary">{t.niaraWallet}</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-text-muted">{t.comingSoon}</span>
        </div>

        <section aria-labelledby="wallet-detected">
          <h3 id="wallet-detected" className="mb-2 text-xs uppercase tracking-wide text-text-muted">
            {t.detected}
          </h3>
          <ul className="flex flex-col gap-2">
            {showEvm &&
              injected.map((c) => (
                <li key={c.uid}>
                  <button type="button" className={buttonClass} disabled={isPending} onClick={() => connectEvm(c)}>
                    {isPending && variables?.connector === c ? (
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
                    ) : (
                      <WalletIcon icon={c.icon} />
                    )}
                    <span className="flex-1">{c.name}</span>
                    <FamilyBadge family="evm" />
                  </button>
                </li>
              ))}
            {showSol &&
              sol.wallets.map((w) => (
                <li key={`sol-${w.name}`}>
                  <button type="button" className={buttonClass} disabled={sol.connecting} onClick={() => void sol.connect(w.name)}>
                    <WalletIcon icon={w.icon} />
                    <span className="flex-1">{w.name}</span>
                    <FamilyBadge family="solana" />
                  </button>
                </li>
              ))}
          </ul>
          {(showEvm ? injected.length : 0) + (showSol ? sol.wallets.length : 0) === 0 && (
            <p className="text-sm text-text-secondary">{t.noneDetected}</p>
          )}
          {evmError && <p className="mt-2 text-xs text-text-muted">{t.rejected}</p>}
          {sol.error === "rejected" && <p className="mt-2 text-xs text-text-muted">{t.rejected}</p>}
          {sol.error === "no-account" && <p className="mt-2 text-xs text-text-muted">{en.trade.wallet.noAccount}</p>}
        </section>

        {showEvm && (
          <section aria-labelledby="wallet-mobile">
            <h3 id="wallet-mobile" className="mb-2 text-xs uppercase tracking-wide text-text-muted">
              {t.mobile}
            </h3>
            {walletConnect ? (
              <button
                type="button"
                className={buttonClass}
                disabled={isPending}
                onClick={() => {
                  // AppKit shows its own QR modal on top; ours steps aside.
                  onClose();
                  connectEvm(walletConnect);
                }}
              >
                <QrCode className="h-5 w-5 shrink-0 text-accent-cyan" aria-hidden="true" />
                <span className="flex-1">{t.walletConnect}</span>
                <FamilyBadge family="evm" />
              </button>
            ) : (
              <p className="text-sm text-text-secondary">{t.walletConnectOff}</p>
            )}
            {showSol && (
              <p className="mt-2 flex items-start gap-2 text-xs text-text-muted">
                <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t.solanaMobile}
              </p>
            )}
          </section>
        )}

        <section aria-labelledby="wallet-get">
          <h3 id="wallet-get" className="mb-2 text-xs uppercase tracking-wide text-text-muted">
            {t.getWallet}
          </h3>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {software.map((w) => (
              <li key={w.name}>
                <a
                  href={w.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-accent-blue/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
                >
                  <span className="flex-1 text-text-primary">{w.name}</span>
                  {w.families.map((f) => (
                    <FamilyBadge key={f} family={f} />
                  ))}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
                  <span className="sr-only">{t.officialSite}</span>
                </a>
              </li>
            ))}
          </ul>

          <h4 className="mb-1 mt-4 text-xs font-semibold text-text-secondary">{t.hardware}</h4>
          <p className="mb-2 text-xs text-text-muted">{t.hardwareNote}</p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {hardware.map((w) => (
              <li key={w.name}>
                <a
                  href={w.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-accent-blue/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
                >
                  <span className="flex-1 text-text-primary">{w.name}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
                  <span className="sr-only">{t.officialSite}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-text-muted">{t.disclaimer}</p>
        </section>
      </div>
    </dialog>
  );
}

/** The button that opens the dialog. */
export function ConnectWalletButton({ onClick, busy = false }: { onClick: () => void; busy?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex items-center gap-2 rounded-md border border-border bg-bg-surface px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Wallet className="h-4 w-4" aria-hidden="true" />}
      {busy ? en.wallets.connecting : en.wallets.connect}
    </button>
  );
}
