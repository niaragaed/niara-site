"use client";

// One connect dialog for both wallet families:
// 1. Niara Wallet — shown as "coming soon", not clickable (it does not exist yet);
// 2. the wallets detected in this browser, ONE ROW PER BRAND: EVM providers through
//    EIP-6963 (wagmi's multi-injected discovery) and Solana ones through Wallet
//    Standard — never through `window.ethereum` — grouped by name. Clicking a row
//    connects the provider of the family the page is on (`target`); a brand without
//    it is disabled with the reason; a brand with both families also gets two small
//    "EVM" / "Solana" buttons;
// 3. WalletConnect (Reown AppKit QR modal) for mobile EVM wallets, when a project id
//    is configured;
// 4. "Get a wallet": official vendor sites only, with the networks each supports, and
//    how hardware wallets connect.
//
// Every connect and network switch has a timeout and ends in a visible result: the
// wallet connected, or a reason and what to do (lib/web3/wallet-errors.ts).

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ExternalLink, Loader2, QrCode, Smartphone, Wallet, X } from "lucide-react";
import { useConnect, useConnection, useConnectors, useSwitchChain } from "wagmi";
import { en } from "@/lib/i18n/en";
import type { EvmChainId } from "@/lib/web3/config";
import { WALLET_DIRECTORY, type WalletFamily } from "@/lib/web3/wallet-directory";
import { groupWalletBrands, type WalletBrand } from "@/lib/web3/wallet-brands";
import {
  CONNECT_TIMEOUT_MS,
  SWITCH_TIMEOUT_MS,
  WALLETCONNECT_TIMEOUT_MS,
  describeWalletError,
  withTimeout,
  type WalletErrorMessage,
} from "@/lib/web3/wallet-errors";
import { useSolanaWallet } from "./SolanaWalletProvider";
import { WalletErrorNotice } from "./WalletErrorNotice";
import { walletIconCandidates } from "@/lib/web3/wallet-icon";

type EvmConnector = ReturnType<typeof useConnectors>[number];
type SolWallet = ReturnType<typeof useSolanaWallet>["wallets"][number];
type Brand = WalletBrand<EvmConnector, SolWallet>;
type Pending = { key: string; stage: "connect" | "switch" };

const FAMILIES: WalletFamily[] = ["evm", "solana"];
const familyLabel = (f: WalletFamily) => en.wallets.family[f];

/**
 * Every wallet icon: the same size, inside the same rounded container. `icons` are
 * tried in order (an image that fails to load moves to the next one); with none
 * left, the generic wallet glyph, never a drawn logo.
 */
function IconBox({
  icons = [],
  small = false,
  light = false,
  children,
}: {
  icons?: readonly string[];
  small?: boolean;
  /** Dark artwork on a transparent background (the vendor's file, unmodified): light tile. */
  light?: boolean;
  children?: ReactNode;
}) {
  const list = icons.join("\n");
  const [failed, setFailed] = useState({ list, count: 0 });
  const count = failed.list === list ? failed.count : 0;
  const src = icons[count];
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border ${light ? "bg-text-primary" : "bg-bg-base"} ${small ? "h-6 w-6" : "h-8 w-8"}`}
    >
      {children ??
        (src ? (
          // The wallet's own icon (data URI) or the vendor's brand-kit file (public/wallets).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            width={20}
            height={20}
            onError={() => setFailed({ list, count: count + 1 })}
            className={`object-contain ${small ? "h-4 w-4" : "h-5 w-5"}`}
          />
        ) : (
          <Wallet className={`text-text-muted ${small ? "h-3.5 w-3.5" : "h-4 w-4"}`} aria-hidden="true" />
        ))}
    </span>
  );
}

const tagClass = "inline-flex h-6 w-full items-center justify-center rounded-full border border-border text-[10px] text-text-secondary";

/** Fixed EVM / Solana slots, so tags line up across rows whatever a brand supports. */
function FamilySlots({ has, renderSlot }: { has: WalletFamily[]; renderSlot?: (f: WalletFamily) => ReactNode }) {
  return (
    <div className="grid w-[104px] shrink-0 grid-cols-2 gap-1">
      {FAMILIES.map((f) =>
        has.includes(f) ? (
          <span key={f} className="flex">
            {renderSlot ? renderSlot(f) : <span className={tagClass}>{familyLabel(f)}</span>}
          </span>
        ) : (
          <span key={f} aria-hidden="true" />
        ),
      )}
    </div>
  );
}

const rowClass = "relative h-14 rounded-md border border-border bg-bg-elevated";

function BrandRow({
  brand,
  icon,
  hint,
  target,
  families,
  network,
  pending,
  busy,
  onConnect,
}: {
  brand: Brand;
  icon?: ReactNode;
  /** Second line when the row can connect (defaults to "Connects on <network>"). */
  hint?: string;
  target: WalletFamily;
  families: WalletFamily[];
  network: string;
  pending: Pending | null;
  busy: boolean;
  onConnect: (family: WalletFamily) => void;
}) {
  const t = en.wallets;
  const sublineId = useId();
  const has = FAMILIES.filter((f) => brand[f] !== null);
  const usable = has.filter((f) => families.includes(f));
  const canTarget = usable.includes(target);
  const dual = usable.length === 2;
  const here = pending?.key === brand.key;
  const missingDetail = t.missingFamilyDetail(brand.name, familyLabel(target), network);
  const subline = here
    ? pending?.stage === "switch"
      ? t.switchingTo(network)
      : t.waiting(brand.name)
    : canTarget
      ? (hint ?? t.connectsOn(network))
      : t.missingFamily(familyLabel(target));

  return (
    <li className={`${rowClass} ${canTarget ? "" : "opacity-60"}`} title={canTarget ? undefined : missingDetail}>
      {/* The whole row connects the page's family; the content above lets clicks through. */}
      <button
        type="button"
        disabled={!canTarget || busy}
        onClick={() => onConnect(target)}
        aria-label={canTarget ? t.connectOn(brand.name, network) : `${brand.name}: ${missingDetail}`}
        aria-describedby={sublineId}
        className="absolute inset-0 rounded-md transition-colors enabled:hover:bg-accent-blue/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue disabled:cursor-not-allowed"
      />
      <div className="pointer-events-none relative flex h-full items-center gap-3 px-3">
        <IconBox icons={walletIconCandidates([brand.evm?.icon, brand.solana?.icon], brand.name)}>{here ?<Loader2 className="h-4 w-4 animate-spin text-text-secondary" aria-hidden="true" /> : icon}</IconBox>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-5 text-text-primary" title={brand.name}>
            {brand.name}
          </p>
          <p id={sublineId} className={`truncate text-[11px] leading-4 ${canTarget ? "text-text-muted" : "text-warning"}`}>
            {subline}
          </p>
        </div>
        <FamilySlots
          has={has}
          renderSlot={
            dual
              ? (f) => (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onConnect(f)}
                    aria-label={t.connectFamily(brand.name, familyLabel(f))}
                    className={`pointer-events-auto h-6 w-full rounded-md border text-[10px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue disabled:cursor-not-allowed disabled:opacity-60 ${
                      f === target
                        ? "border-accent-blue/60 bg-accent-blue/15 text-text-primary hover:bg-accent-blue/25"
                        : "border-border text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {familyLabel(f)}
                  </button>
                )
              : undefined
          }
        />
      </div>
    </li>
  );
}

export function WalletDialog({
  open,
  onClose,
  families = FAMILIES,
  target,
  network,
  evmChainId,
}: {
  open: boolean;
  onClose: () => void;
  /** Families this page can use. */
  families?: WalletFamily[];
  /** Family of the network selected on the page: what a row click connects. */
  target: WalletFamily;
  /** Readable name of that network (e.g. "Base Sepolia"). */
  network: string;
  /** EVM network to switch to after connecting (when `target` is EVM). */
  evmChainId?: EvmChainId;
}) {
  const t = en.wallets;
  const ref = useRef<HTMLDialogElement>(null);
  const connectors = useConnectors();
  const connection = useConnection();
  const { mutateAsync: connectAsync } = useConnect();
  const { mutateAsync: switchChainAsync } = useSwitchChain();
  const sol = useSolanaWallet();

  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<{ heading: string; message: WalletErrorMessage } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // While the WalletConnect QR modal is up, our modal steps aside (both would be in
  // the top layer); it comes back with the result if the connection fails.
  const [suspended, setSuspended] = useState(false);
  const suspendedRef = useRef(false);

  // Each opening starts clean (state adjusted during render, as React recommends for
  // resetting state when a prop changes).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setError(null);
      setNotice(null);
    }
  }

  const close = () => {
    setError(null);
    setNotice(null);
    onClose();
  };

  // Native <dialog>: focus trap, Escape and inert background come from the browser.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const show = open && !suspended;
    if (show && !d.open) d.showModal();
    if (!show && d.open) d.close();
  }, [open, suspended]);

  // The page's wallet is ready: target family connected (and, for EVM, on the
  // network). Close when that becomes true while open, including when the user
  // approves in the wallet after our timeout already fired.
  const ready =
    target === "evm"
      ? connection.isConnected && (evmChainId === undefined || connection.chainId === evmChainId)
      : sol.address !== null;
  const readyAtOpen = useRef<boolean | null>(null);
  useEffect(() => {
    if (!open) {
      readyAtOpen.current = null;
      return;
    }
    if (readyAtOpen.current === null) {
      readyAtOpen.current = ready;
      return;
    }
    if (ready && !readyAtOpen.current) onClose();
  }, [open, ready, onClose]);

  const injected = useMemo(() => connectors.filter((c) => c.type !== "walletConnect"), [connectors]);
  const walletConnect = connectors.find((c) => c.type === "walletConnect");
  const brands = useMemo(() => {
    const all = groupWalletBrands<EvmConnector, SolWallet>(
      injected.map((c) => ({ name: c.name, icon: c.icon, ref: c })),
      sol.wallets.map((w) => ({ name: w.name, icon: w.icon, ref: w })),
    );
    // Brands that can connect on this page's network first.
    return [...all.filter((b) => b[target] !== null), ...all.filter((b) => b[target] === null)];
  }, [injected, sol.wallets, target]);

  const directory = WALLET_DIRECTORY.filter((w) => w.families.some((f) => families.includes(f)));
  const software = directory.filter((w) => w.kind === "software");
  const hardware = directory.filter((w) => w.kind === "hardware");

  const finish = (family: WalletFamily, wallet: string) => {
    if (family === target) close();
    else setNotice(t.connectedOther(wallet, familyLabel(family), network));
  };

  async function connectEvm(key: string, wallet: string, connector: EvmConnector, timeoutMs: number) {
    setPending({ key, stage: "connect" });
    setError(null);
    setNotice(null);
    let phase: "connect" | "switch" = "connect";
    try {
      let chainId: number | undefined;
      if (connection.isConnected && connection.connector?.uid === connector.uid) {
        chainId = connection.chainId;
      } else {
        // No `chainId` here: wagmi would switch inside connect and can wait forever
        // for a chain change that never comes. The switch is done below, bounded.
        chainId = (await withTimeout(connectAsync({ connector }), timeoutMs)).chainId;
      }
      if (target === "evm" && evmChainId !== undefined && chainId !== evmChainId) {
        phase = "switch";
        setPending({ key, stage: "switch" });
        await withTimeout(switchChainAsync({ chainId: evmChainId, connector }), SWITCH_TIMEOUT_MS);
      }
      finish("evm", wallet);
    } catch (e) {
      setError({
        heading: phase === "switch" ? t.switchErrorHeading : t.errorHeading,
        message: describeWalletError(e, { wallet, brand: key, phase, network }),
      });
    } finally {
      setPending(null);
    }
  }

  async function connectSolana(key: string, wallet: string, w: SolWallet) {
    setPending({ key, stage: "connect" });
    setError(null);
    setNotice(null);
    try {
      await withTimeout(sol.connect(w.name), CONNECT_TIMEOUT_MS);
      finish("solana", wallet);
    } catch (e) {
      setError({ heading: t.errorHeading, message: describeWalletError(e, { wallet, brand: key, phase: "connect", network }) });
    } finally {
      setPending(null);
    }
  }

  const connectBrand = (brand: Brand, family: WalletFamily) => {
    if (family === "evm" && brand.evm) void connectEvm(brand.key, brand.name, brand.evm.ref, CONNECT_TIMEOUT_MS);
    if (family === "solana" && brand.solana) void connectSolana(brand.key, brand.name, brand.solana.ref);
  };

  const wcBrand: Brand | null = walletConnect
    ? { key: "walletconnect", name: t.walletConnectName, evm:{ name: t.walletConnectName, icon: undefined, ref: walletConnect }, solana: null }
    : null;

  async function connectWalletConnect(connector: EvmConnector) {
    suspendedRef.current = true;
    setSuspended(true);
    await connectEvm("walletconnect", t.walletConnectName, connector, WALLETCONNECT_TIMEOUT_MS);
    suspendedRef.current = false;
    setSuspended(false);
  }

  const busy = pending !== null;
  const showEvm = families.includes("evm");
  const showSol = families.includes("solana");

  return (
    <dialog
      ref={ref}
      aria-labelledby="wallet-dialog-title"
      onClose={() => {
        // Closing to make room for the WalletConnect modal is not a user close.
        if (!suspendedRef.current) close();
      }}
      onClick={(e) => {
        // Click on the backdrop (outside the panel) closes.
        if (e.target === ref.current) close();
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
            onClick={close}
            aria-label={t.close}
            className="rounded-md p-1 text-text-muted hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {error && <WalletErrorNotice heading={error.heading} error={error.message} />}
        {notice && (
          <p role="status" className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-xs text-text-secondary">
            {notice}
          </p>
        )}

        {/* Niara Wallet does not exist yet: visible, labelled, not clickable. */}
        <div aria-disabled="true" className={`${rowClass} flex items-center gap-3 border-dashed px-3 opacity-70`}>
          <IconBox>
            <Wallet className="h-4 w-4 text-accent-violet" aria-hidden="true" />
          </IconBox>
          <span className="min-w-0 flex-1 truncate text-sm text-text-secondary">{t.niaraWallet}</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-text-muted">{t.comingSoon}</span>
        </div>

        <section aria-labelledby="wallet-detected">
          <h3 id="wallet-detected" className="mb-2 text-xs uppercase tracking-wide text-text-muted">
            {t.detected}
          </h3>
          {brands.length === 0 ? (
            <p className="text-sm text-text-secondary">{t.noneDetected}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {brands.map((b) => (
                <BrandRow
                  key={b.key}
                  brand={b}
                  target={target}
                  families={families}
                  network={network}
                  pending={pending}
                  busy={busy}
                  onConnect={(f) => connectBrand(b, f)}
                />
              ))}
            </ul>
          )}
        </section>

        {showEvm && (
          <section aria-labelledby="wallet-mobile">
            <h3 id="wallet-mobile" className="mb-2 text-xs uppercase tracking-wide text-text-muted">
              {t.mobile}
            </h3>
            {wcBrand && walletConnect ? (
              <ul>
                <BrandRow
                  brand={wcBrand}
                  icon={<QrCode className="h-4 w-4 text-accent-cyan" aria-hidden="true" />}
                  hint={t.walletConnectHint}
                  target={target}
                  families={families}
                  network={network}
                  pending={pending}
                  busy={busy}
                  onConnect={() => void connectWalletConnect(walletConnect)}
                />
              </ul>
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
                  className="flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm hover:border-accent-blue/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
                >
                  <IconBox small light={w.iconOnLight} icons={w.icon ? [w.icon] : []} />
                  <span className="min-w-0 flex-1 truncate text-text-primary" title={w.name}>
                    {w.name}
                  </span>
                  <FamilySlots has={w.families} />
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
                  className="flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm hover:border-accent-blue/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
                >
                  <IconBox small light={w.iconOnLight} icons={w.icon ? [w.icon] : []} />
                  <span className="min-w-0 flex-1 truncate text-text-primary" title={w.name}>
                    {w.name}
                  </span>
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
