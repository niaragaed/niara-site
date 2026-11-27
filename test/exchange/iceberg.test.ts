// Iceberg orders (intent v3): the ticket's visible-quantity checks, which mirror the
// engine's admission (engine 057b979: validate.ts and engine.ts `display_below_min_notional`).
import { describe, expect, it } from "vitest";
import {
  ICEBERG_TOTALS_KEY,
  ICEBERG_TOTALS_MAX,
  checkVisibleLots,
  icebergRemaining,
  loadIcebergTotals,
  parseIcebergTotals,
  saveIcebergTotal,
  withLocalTotals,
  type IcebergOrderLike,
} from "@/lib/exchange/iceberg";

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

/** An in-memory Storage, as localStorage behaves. */
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    data,
  };
}

const ID = "6f1c2d3e-4b5a-4c6d-8e7f-0123456789ab";

describe("iceberg totals in localStorage", () => {
  it("keeps the signed total by order id, as a decimal string, and reads it back", () => {
    const storage = memoryStorage();
    expect(saveIcebergTotal(storage, ID, big(5_000_000))).toEqual({ [ID]: "5000000" });
    expect(JSON.parse(storage.data.get(ICEBERG_TOTALS_KEY) as string)).toEqual({ [ID]: "5000000" });
    expect(loadIcebergTotals(storage)).toEqual({ [ID]: "5000000" });
  });

  it("keeps order data only: ids and totals, nothing else", () => {
    const storage = memoryStorage();
    saveIcebergTotal(storage, ID, big(7));
    const stored = JSON.parse(storage.data.get(ICEBERG_TOTALS_KEY) as string) as Record<string, unknown>;
    expect(Object.keys(stored)).toEqual([ID]);
    expect(Object.values(stored)).toEqual(["7"]);
  });

  it("drops malformed entries and survives corrupt or unavailable storage", () => {
    expect(parseIcebergTotals("not json")).toEqual({});
    expect(parseIcebergTotals("[1,2]")).toEqual({});
    expect(parseIcebergTotals(JSON.stringify({ [ID]: "12", bad: 5, other: "1.5", "a b": "3", zero: "0" }))).toEqual({ [ID]: "12" });
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(loadIcebergTotals(broken)).toEqual({});
    expect(saveIcebergTotal(broken, ID, big(3))).toEqual({ [ID]: "3" });
  });

  it("keeps another tab's entries and drops the oldest beyond the cap", () => {
    const storage = memoryStorage({ [ICEBERG_TOTALS_KEY]: JSON.stringify({ other: "9" }) });
    expect(saveIcebergTotal(storage, ID, big(3))).toEqual({ other: "9", [ID]: "3" });
    const many = Object.fromEntries(Array.from({ length: ICEBERG_TOTALS_MAX }, (_, i) => [`o${i}`, "1"]));
    const full = memoryStorage({ [ICEBERG_TOTALS_KEY]: JSON.stringify(many) });
    const next = saveIcebergTotal(full, ID, big(3));
    expect(Object.keys(next)).toHaveLength(ICEBERG_TOTALS_MAX);
    expect(next.o0).toBeUndefined();
    expect(next[ID]).toBe("3");
  });
});

describe("iceberg remaining from the signed total", () => {
  // As GET /v1/orders returns an iceberg: quantity and remaining null.
  const stored = (o: Partial<IcebergOrderLike> = {}): IcebergOrderLike => ({
    id: ID,
    quantity: null,
    remaining: null,
    filledQuantity: "0",
    releasedQuantity: "0",
    voidedQuantity: "0",
    displayQuantity: "2000000",
    ...o,
  });

  it("is total - (filled - released - voided), as the engine counts it", () => {
    expect(icebergRemaining(big(10_000_000), stored({ filledQuantity: "4000000" }))).toBe(big(6_000_000));
    // Failed matches gave quantity back to the order (released and voided counters).
    expect(
      icebergRemaining(big(10_000_000), stored({ filledQuantity: "4000000", releasedQuantity: "1000000", voidedQuantity: "1000000" })),
    ).toBe(big(8_000_000));
  });

  it("does not trust a total that does not match the fills", () => {
    expect(icebergRemaining(big(3_000_000), stored({ filledQuantity: "4000000" }))).toBeNull();
  });

  it("fills quantity and remaining in for icebergs with a local total only", () => {
    const plain = { ...stored(), id: "plain", displayQuantity: null, quantity: "5", remaining: "5" };
    const other = stored({ id: "other-device" });
    const mine = stored({ filledQuantity: "2000000" });
    const out = withLocalTotals([plain, other, mine], { [ID]: "10000000" });
    expect(out[0]).toBe(plain);
    expect(out[1]).toBe(other); // total hidden: still null
    expect(out[2]).toMatchObject({ quantity: "10000000", remaining: "8000000" });
  });
});
