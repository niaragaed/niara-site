// Groups the wallets detected in the browser by brand: one wallet extension usually
// announces an EVM provider (EIP-6963) and a Solana one (Wallet Standard) under the
// same name ("Phantom", "Coinbase Wallet"…). The connect dialog shows one row per brand.

import type { WalletFamily } from "./wallet-directory";

/** "Coinbase Wallet", "coinbase-wallet" and "Coinbase" → "coinbase". */
export function brandKey(name: string): string {
  const flat = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const stripped = flat.replace(/wallet$/, "");
  return stripped || flat;
}

export interface DetectedWallet<T> {
  name: string;
  icon: string | undefined;
  /** The underlying connector (EVM) or Wallet Standard wallet (Solana). */
  ref: T;
}

export interface WalletBrand<E, S> {
  key: string;
  /** Name as the wallet announces it (the EVM one when both exist). */
  name: string;
  /** Each provider keeps its own icon; `walletIconCandidates` (wallet-icon.ts) picks the row's. */
  evm: DetectedWallet<E> | null;
  solana: DetectedWallet<S> | null;
}

export function brandFamilies(brand: WalletBrand<unknown, unknown>): WalletFamily[] {
  const out: WalletFamily[] = [];
  if (brand.evm) out.push("evm");
  if (brand.solana) out.push("solana");
  return out;
}

/**
 * One entry per brand, in discovery order (EVM wallets first). If a brand announces
 * two providers of the same family, the first one is kept.
 */
export function groupWalletBrands<E, S>(
  evm: readonly DetectedWallet<E>[],
  solana: readonly DetectedWallet<S>[],
): WalletBrand<E, S>[] {
  const brands = new Map<string, WalletBrand<E, S>>();
  for (const w of evm) {
    const key = brandKey(w.name);
    const b = brands.get(key);
    if (!b) brands.set(key, { key, name: w.name, evm: w, solana: null });
    else if (!b.evm) {
      b.evm = w;
      b.name = w.name;
    }
  }
  for (const w of solana) {
    const key = brandKey(w.name);
    const b = brands.get(key);
    if (!b) brands.set(key, { key, name: w.name, evm: null, solana: w });
    else if (!b.solana) b.solana = w;
  }
  return [...brands.values()];
}
