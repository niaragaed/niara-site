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
// states there is no partnership. Each file's source URL and SHA-256 are in
// public/wallets/SOURCES.md, and a test checks that every file there is listed.

export type WalletFamily = "evm" | "solana";

export interface WalletDirectoryEntry {
  name: string;
  /** Official site (vendor domain), opened in a new tab. */
  url: string;
  families: WalletFamily[];
  kind: "software" | "hardware";
  /** Official brand-kit icon under public/ (site path), if shipped. */
  icon?: string;
  /** The file is dark artwork on a transparent background: show it on a light tile. */
  iconOnLight?: boolean;
}

export const WALLET_DIRECTORY: readonly WalletDirectoryEntry[] = [
  {
    name: "Phantom",
    url: "https://phantom.com/download",
    families: ["solana", "evm"],
    kind: "software",
    icon: "/wallets/phantom.svg",
  },
  {
    name: "MetaMask",
    url: "https://metamask.io/download",
    families: ["evm", "solana"],
    kind: "software",
    icon: "/wallets/metamask.svg",
  },
  { name: "Trust Wallet", url: "https://trustwallet.com/download", families: ["evm", "solana"], kind: "software", icon: "/wallets/trust.png" },
  { name: "Coinbase Wallet", url: "https://www.coinbase.com/wallet", families: ["evm", "solana"], kind: "software", icon: "/wallets/coinbase.png" },
  { name: "Rabby", url: "https://rabby.io", families: ["evm"], kind: "software", icon: "/wallets/rabby.png" },
  { name: "OKX Wallet", url: "https://web3.okx.com/download", families: ["evm", "solana"], kind: "software" },
  { name: "Binance Wallet", url: "https://web3.binance.com/en/about", families: ["evm", "solana"], kind: "software", icon: "/wallets/binance.png" },
  { name: "Kraken Wallet", url: "https://www.kraken.com/wallet", families: ["evm", "solana"], kind: "software", icon: "/wallets/kraken.png" },
  { name: "Solflare", url: "https://solflare.com", families: ["solana"], kind: "software", icon: "/wallets/solflare.svg" },
  { name: "Backpack", url: "https://backpack.app", families: ["solana", "evm"], kind: "software", icon: "/wallets/backpack.svg" },
  {
    name: "Ledger",
    url: "https://www.ledger.com",
    families: ["evm", "solana"],
    kind: "hardware",
    icon: "/wallets/ledger.svg",
    iconOnLight: true,
  },
  { name: "Trezor", url: "https://trezor.io", families: ["evm", "solana"], kind: "hardware", icon: "/wallets/trezor.svg" },
  { name: "Tangem", url: "https://tangem.com", families: ["evm", "solana"], kind: "hardware" },
];
