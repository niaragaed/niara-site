// "Get a wallet" directory shown in the connect dialog. Each link goes only to the
// vendor's own official domain: no app-store mirrors, affiliate or third-party links.
// URLs and chain support were checked against the vendors' official sites on
// 2026-11-23 (Coinbase's site refused automated fetches; its URL and chains come from
// Coinbase's download page and the September 2026 rename back to "Coinbase Wallet").
//
// `families` is limited to what this site uses (EVM networks and Solana) and to what
// the vendor states.
//
// Icons: only the vendor's own file, from its official brand kit, shipped unmodified
// under public/wallets/ (never redrawn or approximated), with its source noted here.
// An entry without one shows the generic wallet glyph. The disclaimer under the list
// states there is no partnership.
// - phantom.svg: the icon Phantom recommends for dApp integrations, from
//   https://docs.phantom.com/resources/assets (fetched 2026-11-25, SHA-256
//   2f238875a4b52e80eac9acfdd7e30bd9d81e7f8d13a3faff80cacd6cf413cddd).

export type WalletFamily = "evm" | "solana";

export interface WalletDirectoryEntry {
  name: string;
  /** Official site (vendor domain), opened in a new tab. */
  url: string;
  families: WalletFamily[];
  kind: "software" | "hardware";
  /** Official brand-kit icon under public/ (site path), if shipped. */
  icon?: string;
}

export const WALLET_DIRECTORY: readonly WalletDirectoryEntry[] = [
  {
    name: "Phantom",
    url: "https://phantom.com/download",
    families: ["solana", "evm"],
    kind: "software",
    icon: "/wallets/phantom.svg",
  },
  { name: "MetaMask", url: "https://metamask.io/download", families: ["evm", "solana"], kind: "software" },
  { name: "Trust Wallet", url: "https://trustwallet.com/download", families: ["evm", "solana"], kind: "software" },
  { name: "Coinbase Wallet", url: "https://www.coinbase.com/wallet", families: ["evm", "solana"], kind: "software" },
  { name: "Rabby", url: "https://rabby.io", families: ["evm"], kind: "software" },
  { name: "OKX Wallet", url: "https://web3.okx.com/download", families: ["evm", "solana"], kind: "software" },
  { name: "Binance Wallet", url: "https://web3.binance.com/en/about", families: ["evm", "solana"], kind: "software" },
  { name: "Kraken Wallet", url: "https://www.kraken.com/wallet", families: ["evm", "solana"], kind: "software" },
  { name: "Solflare", url: "https://solflare.com", families: ["solana"], kind: "software" },
  { name: "Backpack", url: "https://backpack.app", families: ["solana", "evm"], kind: "software" },
  { name: "Ledger", url: "https://www.ledger.com", families: ["evm", "solana"], kind: "hardware" },
  { name: "Trezor", url: "https://trezor.io", families: ["evm", "solana"], kind: "hardware" },
  { name: "Tangem", url: "https://tangem.com", families: ["evm", "solana"], kind: "hardware" },
];
