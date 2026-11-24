// Wallet requests that can hang, and what to tell the user when one fails.
//
// Why a timeout: an EIP-1193 / Wallet Standard request has no deadline. A wallet
// that is locked, has a prompt already open, or quietly ignores a request leaves the
// promise pending forever. wagmi's injected `switchChain` also waits for a
// `chainChanged` to the target chain after `wallet_switchEthereumChain` resolves; a
// wallet that resolves the request without switching (seen with wallets that do not
// support the network, such as Phantom outside its Testnet Mode) leaves it pending
// forever too. So every connect and switch is raced against a timer, and every
// failure ends in a visible reason plus what to do.
//
// wagmi rethrows a failed `wallet_addEthereumChain` as a UserRejectedRequestError
// wrapping the wallet's error, so the classifier looks at the innermost code.

import { en } from "@/lib/i18n/en";

export const CONNECT_TIMEOUT_MS = 30_000;
export const SWITCH_TIMEOUT_MS = 30_000;
/** WalletConnect waits for a phone to scan a QR code: a longer deadline. */
export const WALLETCONNECT_TIMEOUT_MS = 180_000;

export class WalletTimeoutError extends Error {
  readonly ms: number;
  constructor(ms: number) {
    super(`no answer from the wallet within ${ms} ms`);
    this.name = "WalletTimeoutError";
    this.ms = ms;
  }
}

/** The wallet connected but shared no account of the needed family. */
export class WalletNoAccountError extends Error {
  constructor() {
    super("the wallet shared no account");
    this.name = "WalletNoAccountError";
  }
}

/**
 * Rejects with `WalletTimeoutError` after `ms`. The wallet request itself cannot be
 * cancelled: if the user approves later, the connection still completes.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new WalletTimeoutError(ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export type WalletErrorKind =
  | "timeout"
  | "rejected"
  | "pending"
  | "unsupportedChain"
  | "locked"
  | "notFound"
  | "noAccount"
  | "other";

type ErrorInfo = { codes: number[]; names: string[]; messages: string[] };

/** Codes, names and messages along the `cause` chain, outermost first. */
function unwrap(error: unknown): ErrorInfo {
  const info: ErrorInfo = { codes: [], names: [], messages: [] };
  let current: unknown = error;
  for (let depth = 0; depth < 8 && current && typeof current === "object"; depth++) {
    const e = current as { code?: unknown; name?: unknown; message?: unknown; shortMessage?: unknown; cause?: unknown };
    if (typeof e.code === "number") info.codes.push(e.code);
    if (typeof e.name === "string") info.names.push(e.name);
    const message = typeof e.shortMessage === "string" ? e.shortMessage : e.message;
    if (typeof message === "string" && message) info.messages.push(message);
    if (e.cause === current) break;
    current = e.cause;
  }
  if (typeof error === "string") info.messages.push(error);
  return info;
}

const UNSUPPORTED_CHAIN = /unsupported|not supported|unrecognized|unknown chain|not available|invalid chain/i;

export function classifyWalletError(error: unknown, phase: "connect" | "switch"): WalletErrorKind {
  if (error instanceof WalletTimeoutError) return "timeout";
  if (error instanceof WalletNoAccountError) return "noAccount";
  const { codes, names, messages } = unwrap(error);
  const inner = codes[codes.length - 1];
  const hasName = (n: string) => names.includes(n);

  if (hasName("ProviderNotFoundError")) return "notFound";
  if (codes.includes(-32002) || hasName("ResourceUnavailableRpcError")) return "pending";
  if (phase === "switch") {
    if (
      inner === 4902 ||
      inner === 4200 ||
      inner === -32601 ||
      hasName("SwitchChainNotSupportedError") ||
      hasName("ChainNotConfiguredError") ||
      messages.some((m) => UNSUPPORTED_CHAIN.test(m))
    ) {
      return "unsupportedChain";
    }
  }
  if (inner === 4001 || hasName("UserRejectedRequestError") || messages.some((m) => /reject|denied|cancel/i.test(m))) {
    return "rejected";
  }
  if (inner === 4100) return "locked";
  return "other";
}

export interface WalletErrorContext {
  /** Wallet name as shown in the dialog. */
  wallet: string;
  /** `brandKey()` of the wallet, for wallet-specific advice. */
  brand: string;
  phase: "connect" | "switch";
  /** Network the page needs (e.g. "Base Sepolia"). */
  network: string;
}

export interface WalletErrorMessage {
  kind: WalletErrorKind;
  /** What happened. */
  reason: string;
  /** What to do about it. */
  action: string;
}

function detailOf(error: unknown): string | null {
  const { messages } = unwrap(error);
  const first = messages[0]?.split("\n")[0]?.trim();
  if (!first) return null;
  return first.length > 140 ? `${first.slice(0, 139)}…` : first;
}

export function describeWalletError(error: unknown, ctx: WalletErrorContext): WalletErrorMessage {
  const t = en.wallets.errors;
  const kind = classifyWalletError(error, ctx.phase);
  const { wallet, network } = ctx;
  const switching = ctx.phase === "switch";
  // Phantom lists EVM testnets only in Testnet Mode, and only some of them.
  const chainAdvice = ctx.brand === "phantom" ? t.phantomTestnets(network) : t.unsupportedChainAction(network);

  switch (kind) {
    case "timeout": {
      const secs = Math.round((error as WalletTimeoutError).ms / 1000);
      return switching
        ? { kind, reason: t.switchTimeout(wallet, network, secs), action: chainAdvice }
        : {
            kind,
            reason: t.timeout(wallet, secs),
            action: ctx.brand === "phantom" ? t.phantomTimeoutAction : t.timeoutAction(wallet),
          };
    }
    case "rejected":
      return switching
        ? { kind, reason: t.switchRejected(wallet, network), action: t.switchRejectedAction(network) }
        : { kind, reason: t.rejected(wallet), action: t.rejectedAction };
    case "pending":
      return { kind, reason: t.pending(wallet), action: t.pendingAction(wallet) };
    case "unsupportedChain":
      return { kind, reason: t.unsupportedChain(wallet, network), action: chainAdvice };
    case "locked":
      return { kind, reason: t.locked(wallet), action: t.lockedAction(wallet) };
    case "notFound":
      return { kind, reason: t.notFound(wallet), action: t.notFoundAction };
    case "noAccount":
      return { kind, reason: t.noAccount(wallet), action: t.noAccountAction(wallet) };
    default:
      return {
        kind,
        reason: switching ? t.switchOther(wallet, network, detailOf(error)) : t.other(wallet, detailOf(error)),
        action: t.otherAction,
      };
  }
}
