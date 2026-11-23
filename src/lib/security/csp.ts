// Content-Security-Policy for the site. Built per request by `src/proxy.ts` with a
// fresh nonce: Next.js attaches the nonce to its own scripts, and 'strict-dynamic'
// lets those load the page chunks. No 'unsafe-inline' for scripts and, in
// production, no 'unsafe-eval'.
//
// connect-src lists only what the site actually calls: the order service, Supabase
// and the RPCs of the configured networks (HTTPS, plus WebSocket for Solana, which
// confirms transactions over a subscription). Wallet extensions talk to the page
// through window events (EIP-6963, Wallet Standard), not through the network, so
// they need nothing here.
import { baseSepolia, hyperliquidEvmTestnet, robinhoodTestnet, sepolia, tempoModerato } from "viem/chains";

/** The origin of a URL, or null when it is missing or not http(s)/ws(s). */
export function originOf(url: string | undefined | null): string | null {
  if (!url || url.trim() === "") return null;
  try {
    const u = new URL(url.trim());
    return ["https:", "http:", "wss:", "ws:"].includes(u.protocol) ? u.origin : null;
  } catch {
    return null;
  }
}

/**
 * The WebSocket origin @solana/web3.js derives from an HTTP(S) RPC URL
 * (`makeWebsocketUrl`): same host, ws(s), and port + 1 when a port is explicit.
 */
export function wsOriginOf(url: string | undefined | null): string | null {
  if (!originOf(url)) return null;
  const u = new URL((url as string).trim());
  if (u.protocol === "ws:" || u.protocol === "wss:") return u.origin;
  const scheme = u.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${u.hostname}${u.port ? `:${Number(u.port) + 1}` : ""}`;
}

const env = (v: string | undefined) => (v && v.trim() !== "" ? v.trim() : undefined);

/**
 * Every origin the browser may fetch from. `NEXT_PUBLIC_*` values are inlined at
 * build time; an unset EVM RPC falls back to viem's default for that chain, as in
 * `src/lib/web3/config.ts`.
 */
export function connectOrigins(): string[] {
  const solanaRpc = env(process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL) ?? "https://api.devnet.solana.com";
  const urls = [
    env(process.env.NEXT_PUBLIC_ENGINE_URL),
    env(process.env.NEXT_PUBLIC_SUPABASE_URL),
    solanaRpc,
    env(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL) ?? sepolia.rpcUrls.default.http[0],
    env(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL) ?? baseSepolia.rpcUrls.default.http[0],
    env(process.env.NEXT_PUBLIC_ROBINHOOD_TESTNET_RPC_URL) ?? robinhoodTestnet.rpcUrls.default.http[0],
    env(process.env.NEXT_PUBLIC_TEMPO_TESTNET_RPC_URL) ?? tempoModerato.rpcUrls.default.http[0],
    env(process.env.NEXT_PUBLIC_HYPEREVM_TESTNET_RPC_URL) ?? hyperliquidEvmTestnet.rpcUrls.default.http[0],
  ];
  const origins = urls.map(originOf);
  origins.push(wsOriginOf(solanaRpc));
  return [...new Set(origins.filter((o): o is string => o !== null))];
}

/**
 * Hosts WalletConnect / Reown AppKit (the QR modal) needs, from Reown's CSP guide
 * (docs.reown.com/advanced/security/content-security-policy), limited to what this
 * site uses: no social login, on-ramp, swaps or token images. Allowed only when a
 * WalletConnect project id is configured.
 */
export const WALLETCONNECT_SOURCES = {
  connect: [
    "https://rpc.walletconnect.com",
    "https://rpc.walletconnect.org",
    "https://relay.walletconnect.com",
    "https://relay.walletconnect.org",
    "wss://relay.walletconnect.com",
    "wss://relay.walletconnect.org",
    "https://pulse.walletconnect.com",
    "https://pulse.walletconnect.org",
    "https://api.web3modal.com",
    "https://api.web3modal.org",
    "https://keys.walletconnect.com",
    "https://keys.walletconnect.org",
    "https://notify.walletconnect.com",
    "https://notify.walletconnect.org",
    "https://echo.walletconnect.com",
    "https://echo.walletconnect.org",
    "https://push.walletconnect.com",
    "https://push.walletconnect.org",
  ],
  img: ["https://api.web3modal.com", "https://api.web3modal.org", "https://*.walletconnect.com", "https://*.walletconnect.org"],
  font: ["https://fonts.reown.com"],
  frame: ["https://verify.walletconnect.com", "https://verify.walletconnect.org"],
} as const;

export const WALLETCONNECT_ENABLED = Boolean(env(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID));

export function buildCsp({
  nonce,
  dev,
  connect,
  walletConnect = false,
}: {
  nonce: string;
  dev: boolean;
  connect: readonly string[];
  walletConnect?: boolean;
}): string {
  const wc = walletConnect ? WALLETCONNECT_SOURCES : { connect: [], img: [], font: [], frame: [] };
  const directives: [string, ...string[]][] = [
    ["default-src", "'self'"],
    // React needs eval only in development (debug stack reconstruction).
    ["script-src", "'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(dev ? ["'unsafe-eval'"] : [])],
    // Inline style attributes (charts, globe, layout) need 'unsafe-inline' for styles;
    // styles cannot run code.
    ["style-src", "'self'", "'unsafe-inline'"],
    // Wallet icons are data URIs (EIP-6963, Wallet Standard).
    ["img-src", "'self'", "data:", "blob:", ...wc.img],
    ["font-src", "'self'", ...wc.font],
    ["connect-src", "'self'", ...connect, ...wc.connect],
    ["worker-src", "'self'", "blob:"],
    ["manifest-src", "'self'"],
    // WalletConnect's Verify API runs in an iframe; nothing else is framed.
    wc.frame.length > 0 ? ["frame-src", ...wc.frame] : ["frame-src", "'none'"],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    // Clickjacking is the classic wallet attack: never framed, by anyone.
    ["frame-ancestors", "'none'"],
  ];
  const parts = directives.map((d) => d.join(" "));
  if (!dev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}
