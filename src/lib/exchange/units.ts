// Conversão exata entre texto decimal e unidades base (bigint). Nunca float:
// o engine e os contratos só aceitam inteiros em unidades base.

const ZERO = BigInt(0);
const TEN = BigInt(10);

/**
 * "12.5" com 6 casas → 12500000n. Devolve null se o texto não for um decimal
 * positivo simples ou tiver mais casas do que `decimals` (nunca arredonda).
 */
export function parseUnitsExact(text: string, decimals: number): bigint | null {
  const t = text.trim();
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const [whole, frac = ""] = t.split(".");
  if (frac.length > decimals) return null;
  const value = BigInt(whole + frac.padEnd(decimals, "0"));
  return value;
}

/** 12500000n com 6 casas → "12.5" (sem zeros à direita; separador de milhar opcional). */
export function formatUnitsExact(value: bigint, decimals: number, grouping = false): string {
  const negative = value < ZERO;
  const abs = negative ? -value : value;
  const base = TEN ** BigInt(decimals);
  const whole = (abs / base).toString();
  const frac = decimals > 0 ? (abs % base).toString().padStart(decimals, "0").replace(/0+$/, "") : "";
  const wholeText = grouping ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : whole;
  return `${negative ? "-" : ""}${wholeText}${frac ? `.${frac}` : ""}`;
}

/** Inteiro decimal em string vindo do engine/Supabase → bigint (lança se inválido). */
export function parseBaseUnits(value: unknown): bigint {
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  if (typeof value !== "string" || !/^(0|[1-9][0-9]*)$/.test(value)) {
    throw new Error(`not a base-unit integer: ${String(value)}`);
  }
  return BigInt(value);
}
