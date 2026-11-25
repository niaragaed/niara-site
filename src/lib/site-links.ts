// Links to the other Niara products, from env (public values). A link is shown only
// when its variable holds an absolute https URL; anything else is ignored.
import type { ChainId } from "./exchange/chains";

const httpsUrl = (v: string | undefined): string | null => {
  if (!v || v.trim() === "") return null;
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
};

export interface ExternalProduct {
  key: "register" | "smes";
  url: string;
}

// Next.js inlines only literal `process.env.NEXT_PUBLIC_X` reads.
const REGISTER_URL = httpsUrl(process.env.NEXT_PUBLIC_REGISTER_URL);
const SMES_URL = httpsUrl(process.env.NEXT_PUBLIC_SMES_URL);

export const EXTERNAL_PRODUCTS: ExternalProduct[] = [
  ...(REGISTER_URL ? [{ key: "register" as const, url: REGISTER_URL }] : []),
  ...(SMES_URL ? [{ key: "smes" as const, url: SMES_URL }] : []),
];

/**
 * Network slugs in the Register's global registry URLs. They happen to equal the
 * engine's chain ids, but they are the Register's contract: keep them explicit.
 */
export const REGISTER_NETWORK_SLUGS: Readonly<Record<ChainId, string>> = {
  "solana-devnet": "solana-devnet",
  "base-sepolia": "base-sepolia",
  "robinhood-testnet": "robinhood-testnet",
  "tempo-testnet": "tempo-testnet",
  "hyperevm-testnet": "hyperevm-testnet",
};

// An EVM transaction hash, or a base58 Solana signature.
const TX_HASH = /^(0x[0-9a-fA-F]{64}|[1-9A-HJ-NP-Za-km-z]{64,90})$/;

/**
 * `{base}/global-registry/{network}/{txHash}`, or null when `base` is not an https
 * URL or the hash is not a transaction hash.
 */
export function buildRegisterRecordUrl(base: string | undefined, chain: ChainId, txHash: string): string | null {
  const root = httpsUrl(base);
  const network = REGISTER_NETWORK_SLUGS[chain];
  if (!root || !network || !TX_HASH.test(txHash)) return null;
  return `${root.replace(/\/+$/, "")}/global-registry/${network}/${txHash}`;
}

/** The Register's record of a settlement transaction; null (link hidden) when REGISTER_URL is unset. */
export function registerRecordUrl(chain: ChainId, txHash: string): string | null {
  return REGISTER_URL ? buildRegisterRecordUrl(REGISTER_URL, chain, txHash) : null;
}
