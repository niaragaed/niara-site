import { describe, expect, it } from "vitest";
import { WALLET_DIRECTORY } from "@/lib/web3/wallet-directory";

// The vendors' own domains, checked on 2026-11-23. A new entry or a changed URL must
// be verified against the vendor's official site and added here deliberately.
const OFFICIAL_HOSTS: Record<string, string> = {
  Phantom: "phantom.com",
  MetaMask: "metamask.io",
  "Trust Wallet": "trustwallet.com",
  "Coinbase Wallet": "www.coinbase.com",
  Rabby: "rabby.io",
  "OKX Wallet": "web3.okx.com",
  "Binance Wallet": "web3.binance.com",
  "Kraken Wallet": "www.kraken.com",
  Solflare: "solflare.com",
  Backpack: "backpack.app",
  Ledger: "www.ledger.com",
  Trezor: "trezor.io",
  Tangem: "tangem.com",
};

describe("wallet directory", () => {
  it("lists exactly the requested wallets", () => {
    expect(WALLET_DIRECTORY.map((w) => w.name).sort()).toEqual(Object.keys(OFFICIAL_HOSTS).sort());
  });

  it("links only to each vendor's official https domain, with no query or tracking", () => {
    for (const w of WALLET_DIRECTORY) {
      const u = new URL(w.url);
      expect(u.protocol, w.name).toBe("https:");
      expect(u.host, w.name).toBe(OFFICIAL_HOSTS[w.name]);
      expect(u.search, w.name).toBe("");
      expect(u.hash, w.name).toBe("");
    }
  });

  it("marks Ledger, Trezor and Tangem as hardware, the rest as software", () => {
    const hardware = WALLET_DIRECTORY.filter((w) => w.kind === "hardware").map((w) => w.name).sort();
    expect(hardware).toEqual(["Ledger", "Tangem", "Trezor"]);
  });

  it("every wallet supports at least one family this site uses", () => {
    for (const w of WALLET_DIRECTORY) expect(w.families.length, w.name).toBeGreaterThan(0);
  });
});
