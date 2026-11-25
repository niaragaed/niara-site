import { describe, expect, it } from "vitest";
import { coversOrderFills, summarizeFills, type Fill } from "@/lib/exchange/fills";

const fill = (lots: number, pricePerLot: number, status: Fill["status"] = "settled", tx: string | null = "0xabc"): Fill => ({
  quantity: String(lots * 1000),
  lotSize: "1000",
  paymentAmount: String(lots * pricePerLot),
  status,
  settlement: status === "pending" ? null : { status: "confirmed", attempts: 1, txHash: tx, error: null, settledAt: null },
});

describe("fill summary", () => {
  it("a market buy capped at 25.25/lot that filled at 5.05: average and total from the fills, not the cap", () => {
    // USDT with 6 decimals: 5.05 = 5_050_000 per lot.
    const s = summarizeFills([fill(3, 5_050_000), fill(2, 5_050_000)])!;
    expect(s.lots).toBe(BigInt(5));
    expect(s.total).toBe(BigInt(25_250_000));
    expect(s.averagePrice).toBe(BigInt(5_050_000));
    expect(s.exact).toBe(true);
    expect(s.settled).toBe(true);
  });

  it("weights the average by lots and rounds half up, flagging it as inexact", () => {
    const s = summarizeFills([fill(1, 10), fill(2, 11)])!; // 32 / 3 = 10.67
    expect(s.total).toBe(BigInt(32));
    expect(s.averagePrice).toBe(BigInt(11));
    expect(s.exact).toBe(false);
  });

  it("is not settled while any counted fill lacks a confirmed transaction", () => {
    expect(summarizeFills([fill(1, 10), fill(1, 10, "pending")])!.settled).toBe(false);
    expect(summarizeFills([fill(1, 10, "settled", null)])!.settled).toBe(false);
  });

  it("leaves failed settlements out, and is null without a counted fill", () => {
    const s = summarizeFills([fill(1, 10), fill(4, 99, "failed")])!;
    expect(s.lots).toBe(BigInt(1));
    expect(s.total).toBe(BigInt(10));
    expect(summarizeFills([])).toBeNull();
    expect(summarizeFills([fill(1, 10, "failed")])).toBeNull();
  });

  it("knows when a fill list is missing some of an order's fills", () => {
    const fills = [fill(2, 10), fill(3, 10, "failed")];
    expect(coversOrderFills(fills, "5000")).toBe(true); // engine counts failed fills
    expect(coversOrderFills(fills, "2000")).toBe(true); // engine leaves them out
    expect(coversOrderFills(fills, "7000")).toBe(false); // the list was cut short
    expect(coversOrderFills([], "0")).toBe(true);
  });
});
