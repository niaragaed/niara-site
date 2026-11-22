import { describe, expect, it } from "vitest";
import { orderNeed, requiredApproval, type OpenOrderLike } from "@/lib/exchange/approvals";
import { buildCandles } from "@/lib/exchange/candles";

const NOW = 1_800_000_000;
const ASSET = "8LjQkS1rTJGpzz9wbyAmqJk7oZgDsZS6vhPBv2BhzsTo";
const OTHER = "4EBRQ9NRwpriv1YP6Y8a5WnByMxj2WjGveEnHZUk7Jnf";
const USDT = "8iWQ7VxYrkUv471vEoZ664eLwDzWinPiCJpRvcTUA24y";

function order(o: Partial<OpenOrderLike>): OpenOrderLike {
  return {
    chain: "solana-devnet",
    side: "sell",
    asset: ASSET,
    paymentAsset: USDT,
    status: "open",
    remaining: "10",
    lotSize: "1",
    limitPrice: "25000000",
    expiresAt: NOW + 3600,
    ...o,
  };
}

describe("approval sum", () => {
  it("needs what each order can still move", () => {
    expect(orderNeed(order({ side: "sell", remaining: "7" }))).toEqual({ token: ASSET, amount: BigInt(7) });
    expect(orderNeed(order({ side: "buy", remaining: "4", lotSize: "2", limitPrice: "30" }))).toEqual({
      token: USDT,
      amount: BigInt(60),
    });
  });

  it("adds the live sell orders of the same asset to the new order", () => {
    const r = requiredApproval({
      chain: "solana-devnet",
      token: ASSET,
      openOrders: [order({ remaining: "10" }), order({ status: "partially_filled", remaining: "3" })],
      newNeed: BigInt(5),
      now: NOW,
    });
    expect(r).toEqual({ openNeed: BigInt(13), openCount: 2, newNeed: BigInt(5), total: BigInt(18) });
  });

  it("counts every buy order of the chain against USDT, whatever the asset", () => {
    const r = requiredApproval({
      chain: "solana-devnet",
      token: USDT,
      openOrders: [
        order({ side: "buy", asset: ASSET, remaining: "2", limitPrice: "100" }),
        order({ side: "buy", asset: OTHER, remaining: "3", limitPrice: "10" }),
        order({ side: "sell", asset: ASSET, remaining: "50" }),
      ],
      newNeed: BigInt(1),
      now: NOW,
    });
    expect(r.openNeed).toBe(BigInt(230));
    expect(r.openCount).toBe(2);
    expect(r.total).toBe(BigInt(231));
  });

  it("leaves out terminal, expired, other-chain and other-token orders", () => {
    const r = requiredApproval({
      chain: "solana-devnet",
      token: ASSET,
      openOrders: [
        order({ status: "filled" }),
        order({ status: "cancelled" }),
        order({ status: "stale" }),
        order({ expiresAt: NOW }),
        order({ chain: "base-sepolia" }),
        order({ asset: OTHER }),
        order({ remaining: "0" }),
      ],
      newNeed: BigInt(5),
      now: NOW,
    });
    expect(r).toEqual({ openNeed: BigInt(0), openCount: 0, newNeed: BigInt(5), total: BigInt(5) });
  });

  it("compares EVM addresses case-insensitively", () => {
    const token = "0x0f1c771c8943cD7EC2b4c654CEea49B41336bDD7";
    const r = requiredApproval({
      chain: "base-sepolia",
      token,
      openOrders: [order({ chain: "base-sepolia", asset: token.toLowerCase(), remaining: "4" })],
      newNeed: BigInt(1),
      now: NOW,
    });
    expect(r.total).toBe(BigInt(5));
  });
});

describe("candles from settled trades", () => {
  const t = (iso: string, price: string, qty: string, sequence: number) => ({
    matchedAt: iso,
    price,
    quantity: qty,
    lotSize: "1",
    sequence,
  });

  it("is empty without trades", () => {
    expect(buildCandles([], 3600)).toEqual([]);
  });

  it("groups by bucket, oldest first, with OHLC in trade order and lots summed", () => {
    const candles = buildCandles(
      [
        t("2026-11-22T10:50:00Z", "30", "1", 4),
        t("2026-11-22T10:05:00Z", "25", "2", 1),
        t("2026-11-22T10:20:00Z", "28", "3", 2),
        t("2026-11-22T10:20:00Z", "22", "1", 3),
        t("2026-11-22T13:00:00Z", "40", "5", 5),
      ],
      3600,
    );
    expect(candles).toHaveLength(2);
    expect(candles[0]).toEqual({
      time: Date.parse("2026-11-22T10:00:00Z") / 1000,
      open: BigInt(25),
      high: BigInt(30),
      low: BigInt(22),
      close: BigInt(30),
      lots: BigInt(7),
      trades: 4,
    });
    // No candles are invented for the empty 11:00 and 12:00 buckets.
    expect(candles[1].time).toBe(Date.parse("2026-11-22T13:00:00Z") / 1000);
  });
});
