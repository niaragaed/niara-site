// Iceberg orders (intent v3): the ticket's visible-quantity checks, which mirror the
// engine's admission (engine 057b979: validate.ts and engine.ts `display_below_min_notional`).
import { describe, expect, it } from "vitest";
import { checkVisibleLots } from "@/lib/exchange/iceberg";

const big = (v: number) => BigInt(v);

describe("checkVisibleLots", () => {
  const base = { lots: big(10), limitPrice: big(2_000_000), minOrderNotional: big(5_000_000) };

  it("accepts whole lots, at least one, below the quantity, meeting the minimum", () => {
    expect(checkVisibleLots({ ...base, visibleLots: big(3) })).toBeNull();
    expect(checkVisibleLots({ ...base, visibleLots: big(9) })).toBeNull();
    expect(checkVisibleLots({ ...base, minOrderNotional: big(0), visibleLots: big(1) })).toBeNull();
  });

  it("refuses a missing or zero visible quantity", () => {
    expect(checkVisibleLots({ ...base, visibleLots: null })).toBe("invalid");
    expect(checkVisibleLots({ ...base, visibleLots: big(0) })).toBe("invalid");
  });

  it("refuses a visible quantity equal to or above the order (that is a plain v2 order)", () => {
    expect(checkVisibleLots({ ...base, visibleLots: big(10) })).toBe("not_below");
    expect(checkVisibleLots({ ...base, visibleLots: big(11) })).toBe("not_below");
  });

  it("refuses a visible slice worth less than the chain's minimum at the limit price", () => {
    // 2 lots x 2 USDT = 4 USDT < 5 USDT; 3 lots = 6 USDT; exactly the minimum is allowed.
    expect(checkVisibleLots({ ...base, visibleLots: big(2) })).toBe("below_min");
    expect(checkVisibleLots({ ...base, limitPrice: big(2_500_000), visibleLots: big(2) })).toBeNull();
  });
});
