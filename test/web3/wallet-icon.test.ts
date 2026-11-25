import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCsp } from "@/lib/security/csp";
import { groupWalletBrands } from "@/lib/web3/wallet-brands";
import { WALLET_DIRECTORY } from "@/lib/web3/wallet-directory";
import { officialWalletIcon, safeWalletIcon, walletIconCandidates } from "@/lib/web3/wallet-icon";

const SVG_B64 = "data:image/svg+xml;base64,PHN2Zy8+";

describe("wallet icons", () => {
  it("accepts image data URIs only", () => {
    expect(safeWalletIcon(SVG_B64)).toBe(SVG_B64);
    expect(safeWalletIcon("data:image/png;base64,iVBO\nRw0K")).toBe("data:image/png;base64,iVBORw0K");
    expect(safeWalletIcon("https://example.com/icon.svg")).toBeNull();
    expect(safeWalletIcon("data:text/html;base64,PHNjcmlwdD4=")).toBeNull();
    expect(safeWalletIcon("javascript:alert(1)")).toBeNull();
    expect(safeWalletIcon("data:image/svg+xml;base64,<svg/>")).toBeNull();
    expect(safeWalletIcon(undefined)).toBeNull();
  });

  it("re-encodes raw SVG text so a '#' color cannot break the image URL", () => {
    const raw = 'data:image/svg+xml,<svg fill="#AB9FF2" width="100%"/>';
    const out = safeWalletIcon(raw)!;
    expect(out).not.toContain("#");
    expect(decodeURIComponent(out.slice(out.indexOf(",") + 1))).toBe('<svg fill="#AB9FF2" width="100%"/>');
    // Already percent-encoded text is not double-encoded.
    expect(safeWalletIcon(out)).toBe(out);
  });

  it("detected wallet: its own icons first, then the official file, deduplicated", () => {
    expect(walletIconCandidates([SVG_B64, SVG_B64], "Phantom")).toEqual([SVG_B64, "/wallets/phantom.svg"]);
    // An unusable announced icon falls back to the official file.
    expect(walletIconCandidates(["https://x/icon.png", undefined], "Phantom")).toEqual(["/wallets/phantom.svg"]);
    expect(walletIconCandidates([undefined, undefined], "Unknown Wallet")).toEqual([]);
  });

  it("Phantom's EVM and Solana providers get the same row icon on every page", () => {
    const evm = "data:image/svg+xml;base64,RVZN";
    const sol = "data:image/svg+xml;base64,U09M";
    const [brand] = groupWalletBrands([{ name: "Phantom", icon: evm, ref: "e" }], [{ name: "Phantom", icon: sol, ref: "s" }]);
    const first = walletIconCandidates([brand.evm?.icon, brand.solana?.icon], brand.name)[0];
    expect(first).toBe(evm);
    // Only one provider usable: the official file, not a different drawing.
    expect(walletIconCandidates([undefined, undefined], "Phantom")[0]).toBe(officialWalletIcon("Phantom"));
  });

  it("ships every directory icon as an unmodified local file, with no script", () => {
    const withIcon = WALLET_DIRECTORY.filter((w) => w.icon);
    expect(withIcon.map((w) => w.name)).toContain("Phantom");
    for (const w of withIcon) {
      expect(w.icon, w.name).toMatch(/^\/wallets\/[a-z0-9-]+\.(svg|png)$/);
      const file = readFileSync(join(process.cwd(), "public", w.icon!), "utf8");
      expect(file, w.name).not.toMatch(/<script|foreignObject|\bon[a-z]+=|href=/i);
    }
  });

  it("SOURCES.md lists every file in public/wallets with its SHA-256, and every directory icon exists", () => {
    const dir = join(process.cwd(), "public", "wallets");
    const sources = readFileSync(join(dir, "SOURCES.md"), "utf8");
    const files = readdirSync(dir).filter((f) => /\.(svg|png)$/.test(f));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      // LF-normalized, as git stores it.
      const bytes = readFileSync(join(dir, f));
      const hash = createHash("sha256").update(bytes.toString("latin1").replace(/\r\n/g, "\n"), "latin1").digest("hex");
      expect(sources, f).toContain(`\`${f}\``);
      expect(sources, f).toContain(hash);
    }
    const used = WALLET_DIRECTORY.filter((w) => w.icon).map((w) => w.icon!.replace("/wallets/", ""));
    expect([...used].sort()).toEqual([...files].sort());
  });

  it("the CSP lets the page load both icon sources", () => {
    const csp = buildCsp({ nonce: "n", dev: false, connect: [] });
    const img = csp.split("; ").find((d) => d.startsWith("img-src "))!.split(" ");
    expect(img).toContain("'self'");
    expect(img).toContain("data:");
  });
});
