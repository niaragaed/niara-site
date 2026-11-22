// Exact conversion between decimal text and base units (bigint). Never floats:
// the engine and the contracts only accept integers in base units.

const ZERO = BigInt(0);
const TEN = BigInt(10);

/**
 * "12.5" with 6 decimals → 12500000n. Returns null if the text is not a simple
 * positive decimal or has more places than `decimals` (never rounds).
 */
export function parseUnitsExact(text: string, decimals: number): bigint | null {
  const t = text.trim();
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const [whole, frac = ""] = t.split(".");
  if (frac.length > decimals) return null;
  const value = BigInt(whole + frac.padEnd(decimals, "0"));
  return value;
}

/** 12500000n with 6 decimals → "12.5" (no trailing zeros; optional thousands separator). */
export function formatUnitsExact(value: bigint, decimals: number, grouping = false): string {
  const negative = value < ZERO;
  const abs = negative ? -value : value;
  const base = TEN ** BigInt(decimals);
  const whole = (abs / base).toString();
  const frac = decimals > 0 ? (abs % base).toString().padStart(decimals, "0").replace(/0+$/, "") : "";
  const wholeText = grouping ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : whole;
  return `${negative ? "-" : ""}${wholeText}${frac ? `.${frac}` : ""}`;
}

/** Decimal integer string from the engine/Supabase → bigint (throws if invalid). */
export function parseBaseUnits(value: unknown): bigint {
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  if (typeof value !== "string" || !/^(0|[1-9][0-9]*)$/.test(value)) {
    throw new Error(`not a base-unit integer: ${String(value)}`);
  }
  return BigInt(value);
}

/** Unix seconds now (for `expiresAt`; used only in handlers, never during render). */
export function unixNow(): number {
  return Math.floor(Date.now() / 1000);
}
