import { afterEach, describe, expect, it, vi } from "vitest";
import { brandFamilies, brandKey, groupWalletBrands } from "@/lib/web3/wallet-brands";
import {
  WalletNoAccountError,
  WalletTimeoutError,
  classifyWalletError,
  describeWalletError,
  withTimeout,
} from "@/lib/web3/wallet-errors";

describe("wallet brands", () => {
  it("normalizes names to one key per brand", () => {
    expect(brandKey("Coinbase Wallet")).toBe("coinbase");
    expect(brandKey("Coinbase")).toBe("coinbase");
    expect(brandKey("OKX Wallet")).toBe("okx");
    expect(brandKey("MetaMask")).toBe("metamask");
    expect(brandKey("Trust Wallet")).toBe("trust");
    expect(brandKey("Wallet")).toBe("wallet");
  });

  it("puts the EVM and Solana providers of one brand in one row", () => {
    const w = (name: string, ref: string) => ({ name, icon: undefined, ref });
    const brands = groupWalletBrands(
      [w("Phantom", "evm-phantom"), w("MetaMask", "evm-mm"), w("Coinbase Wallet", "evm-cb")],
      [w("Phantom", "sol-phantom"), w("Solflare", "sol-sf"), w("Coinbase Wallet", "sol-cb")],
    );
    expect(brands.map((b) => [b.name, brandFamilies(b)])).toEqual([
      ["Phantom", ["evm", "solana"]],
      ["MetaMask", ["evm"]],
      ["Coinbase Wallet", ["evm", "solana"]],
      ["Solflare", ["solana"]],
    ]);
    expect(brands[0].evm?.ref).toBe("evm-phantom");
    expect(brands[0].solana?.ref).toBe("sol-phantom");
  });

  it("keeps the first provider when a brand announces two of one family", () => {
    const brands = groupWalletBrands(
      [
        { name: "Rabby", icon: "a", ref: 1 },
        { name: "Rabby Wallet", icon: "b", ref: 2 },
      ],
      [],
    );
    expect(brands).toHaveLength(1);
    expect(brands[0].evm?.ref).toBe(1);
  });
});

describe("wallet request timeout", () => {
  afterEach(() => vi.useRealTimers());

  it("rejects a request that never settles", async () => {
    vi.useFakeTimers();
    const p = withTimeout(new Promise(() => {}), 30_000);
    vi.advanceTimersByTime(30_000);
    await expect(p).rejects.toBeInstanceOf(WalletTimeoutError);
  });

  it("passes the result and the error through", async () => {
    await expect(withTimeout(Promise.resolve(7), 1000)).resolves.toBe(7);
    await expect(withTimeout(Promise.reject(new Error("x")), 1000)).rejects.toThrow("x");
  });
});

// Error shapes as viem/wagmi and wallets throw them.
const rpc = (code: number, message: string, cause?: unknown) => Object.assign(new Error(message), { code, cause });
const named = (name: string, code: number | undefined, shortMessage: string, cause?: unknown) =>
  Object.assign(new Error(shortMessage), { name, code, shortMessage, cause });

describe("wallet error classification", () => {
  it("timeouts and missing accounts", () => {
    expect(classifyWalletError(new WalletTimeoutError(30_000), "connect")).toBe("timeout");
    expect(classifyWalletError(new WalletNoAccountError(), "connect")).toBe("noAccount");
  });

  it("user rejection (EIP-1193 4001)", () => {
    expect(classifyWalletError(rpc(4001, "User rejected the request."), "connect")).toBe("rejected");
    expect(classifyWalletError(named("UserRejectedRequestError", 4001, "User rejected the request."), "switch")).toBe("rejected");
  });

  it("a request already pending in the wallet (-32002)", () => {
    expect(classifyWalletError(named("ResourceUnavailableRpcError", -32002, "Requested resource not available."), "connect")).toBe(
      "pending",
    );
  });

  it("a failed add-chain that wagmi rethrows as a rejection is an unsupported network", () => {
    const inner = rpc(4200, "The requested method is not supported");
    const wrapped = named("UserRejectedRequestError", 4001, "User rejected the request.", inner);
    expect(classifyWalletError(wrapped, "switch")).toBe("unsupportedChain");
  });

  it("unknown chain (4902) and wagmi's switch errors are an unsupported network", () => {
    expect(classifyWalletError(rpc(4902, "Unrecognized chain ID"), "switch")).toBe("unsupportedChain");
    expect(classifyWalletError(named("SwitchChainError", 4902, "An error occurred when attempting to switch chain.", rpc(-32603, "Unsupported chainId")), "switch")).toBe(
      "unsupportedChain",
    );
  });

  it("locked wallet (4100), missing provider, anything else", () => {
    expect(classifyWalletError(rpc(4100, "Unauthorized"), "connect")).toBe("locked");
    expect(classifyWalletError(named("ProviderNotFoundError", undefined, "Provider not found."), "connect")).toBe("notFound");
    expect(classifyWalletError(new Error("boom"), "connect")).toBe("other");
  });
});

describe("wallet error messages", () => {
  const ctx = { wallet: "Phantom", brand: "phantom", network: "Robinhood Chain Testnet" };

  it("always says what happened and what to do", () => {
    const errors = [
      new WalletTimeoutError(30_000),
      rpc(4001, "User rejected the request."),
      rpc(-32002, "pending"),
      rpc(4902, "Unrecognized chain"),
      rpc(4100, "Unauthorized"),
      new WalletNoAccountError(),
      new Error("boom"),
    ];
    for (const phase of ["connect", "switch"] as const) {
      for (const e of errors) {
        const m = describeWalletError(e, { ...ctx, phase });
        expect(m.reason.length).toBeGreaterThan(0);
        expect(m.action.length).toBeGreaterThan(0);
      }
    }
  });

  it("a Phantom switch that never answers points to Testnet Mode", () => {
    const m = describeWalletError(new WalletTimeoutError(30_000), { ...ctx, phase: "switch" });
    expect(m.kind).toBe("timeout");
    expect(m.reason).toContain("30 seconds");
    expect(m.reason).toContain("Robinhood Chain Testnet");
    expect(m.action).toContain("Testnet Mode");
  });

  it("other wallets get generic network advice", () => {
    const m = describeWalletError(rpc(4902, "Unrecognized chain"), { ...ctx, wallet: "Rabby", brand: "rabby", phase: "switch" });
    expect(m.kind).toBe("unsupportedChain");
    expect(m.action).not.toContain("Testnet Mode");
    expect(m.action).toContain("Robinhood Chain Testnet");
  });

  it("includes the wallet's own message for unknown failures", () => {
    const m = describeWalletError(new Error("Something odd happened"), { ...ctx, phase: "connect" });
    expect(m.reason).toContain("Something odd happened");
  });
});
