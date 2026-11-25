// Wallet icons. Two sources only, never a redrawn or approximated logo:
// 1. the icon the installed wallet itself announces (EIP-6963 `info.icon`, Wallet
//    Standard `wallet.icon`): an image data URI, by both specs;
// 2. for a wallet in the "Get a wallet" directory, the file from the vendor's own
//    brand kit, shipped unmodified under public/wallets/ (see wallet-directory.ts).

import { brandKey } from "./wallet-brands";
import { WALLET_DIRECTORY } from "./wallet-directory";

const DATA_IMAGE = /^data:image\/(svg\+xml|png|webp|jpeg|gif)[;,]/i;
const BASE64 = /^[A-Za-z0-9+/=\s]*$/;

/**
 * An image data URI the browser can load as given, or null. Base64 payloads pass
 * through (whitespace removed). A non-base64 payload (raw SVG text) is re-encoded:
 * an unescaped "#" in it (e.g. `fill="#AB9FF2"`) would otherwise end the URL as a
 * fragment and leave a broken image.
 */
export function safeWalletIcon(icon: string | undefined): string | null {
  if (typeof icon !== "string") return null;
  const s = icon.trim();
  if (!DATA_IMAGE.test(s)) return null;
  const comma = s.indexOf(",");
  if (comma < 0) return null;
  const header = s.slice(0, comma);
  const body = s.slice(comma + 1);
  if (body === "") return null;
  if (/;base64$/i.test(header)) return BASE64.test(body) ? `${header},${body.replace(/\s/g, "")}` : null;
  let text = body;
  try {
    text = decodeURIComponent(body);
  } catch {
    // raw text with a bare "%": encode it as is
  }
  return `${header},${encodeURIComponent(text)}`;
}

/** Official brand-kit icon shipped for this wallet (public/wallets/), if any. */
export function officialWalletIcon(name: string): string | null {
  const key = brandKey(name);
  return WALLET_DIRECTORY.find((w) => brandKey(w.name) === key)?.icon ?? null;
}

/**
 * Icons to try, in order, for a detected wallet: the ones the wallet announces
 * (EVM provider first, then Solana: the same order for every row of a brand), then
 * the official file as a fallback when none is usable or loads.
 */
export function walletIconCandidates(provided: readonly (string | undefined)[], name: string): string[] {
  const out: string[] = [];
  for (const icon of [...provided.map(safeWalletIcon), officialWalletIcon(name)]) {
    if (icon && !out.includes(icon)) out.push(icon);
  }
  return out;
}
