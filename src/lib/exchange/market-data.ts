// Public reads of the Supabase niara-exchange-dev (PostgREST, anon key, RLS):
// `chains`, `listings` (only approved equity/currency are visible) and the
// aggregated `order_book` view (price levels, never wallets/nonces).
// `base_units` values are numeric: requested as text (`::text`) so no
// precision is lost in a JSON number.
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import { isChainId, type ChainId } from "./chains";
import { parseBaseUnits } from "./units";

export class MarketDataError extends Error {
  readonly kind: "not_configured" | "unreachable" | "bad_response";
  constructor(kind: MarketDataError["kind"], message: string) {
    super(message);
    this.name = "MarketDataError";
    this.kind = kind;
  }
}

async function rest(path: string): Promise<unknown[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new MarketDataError("not_configured", "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set");
  }
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      cache: "no-store",
    });
  } catch {
    throw new MarketDataError("unreachable", "could not reach Supabase");
  }
  if (!res.ok) throw new MarketDataError("bad_response", `Supabase answered ${res.status}`);
  const body: unknown = await res.json();
  if (!Array.isArray(body)) throw new MarketDataError("bad_response", "unexpected Supabase response");
  return body;
}

export interface ChainRow {
  id: ChainId;
  settlementProgram: string | null;
  quoteAsset: string | null;
  minOrderNotional: bigint;
  maxIntentValiditySecs: number;
}

export async function fetchChainRow(chain: ChainId): Promise<ChainRow | null> {
  const rows = await rest(
    `chains?select=id,settlement_program,quote_asset,min_order_notional::text,max_intent_validity_secs&id=eq.${encodeURIComponent(chain)}`,
  );
  const r = rows[0] as Record<string, unknown> | undefined;
  if (!r) return null;
  if (!isChainId(r.id)) throw new MarketDataError("bad_response", "unknown chain id");
  return {
    id: r.id,
    settlementProgram: typeof r.settlement_program === "string" ? r.settlement_program : null,
    quoteAsset: typeof r.quote_asset === "string" ? r.quote_asset : null,
    minOrderNotional: parseBaseUnits(r.min_order_notional),
    maxIntentValiditySecs: Number(r.max_intent_validity_secs),
  };
}

export interface ListingRow {
  chain: ChainId;
  asset: string;
  issuer: string | null;
  assetClass: "equity" | "fixed_income" | "credit" | "currency";
  status: string;
  cashbackEligible: boolean;
  assetDecimals: number;
  lotSize: bigint;
  txHash: string | null;
}

/** Approved `equity` listings of the chain (the only ones tradable in the book). */
export async function fetchEquityListings(chain: ChainId): Promise<ListingRow[]> {
  const rows = await rest(
    `listings?select=chain_id,asset,issuer,asset_class,status,cashback_eligible,asset_decimals,lot_size::text,tx_hash` +
      `&chain_id=eq.${encodeURIComponent(chain)}&asset_class=eq.equity&status=eq.approved&order=created_at.asc`,
  );
  return rows.map((raw) => {
    const r = raw as Record<string, unknown>;
    if (!isChainId(r.chain_id) || typeof r.asset !== "string") {
      throw new MarketDataError("bad_response", "malformed listing row");
    }
    return {
      chain: r.chain_id,
      asset: r.asset,
      issuer: typeof r.issuer === "string" ? r.issuer : null,
      assetClass: r.asset_class as ListingRow["assetClass"],
      status: String(r.status),
      cashbackEligible: r.cashback_eligible === true,
      assetDecimals: Number(r.asset_decimals),
      lotSize: parseBaseUnits(r.lot_size),
      txHash: typeof r.tx_hash === "string" ? r.tx_hash : null,
    };
  });
}

export interface BookLevel {
  /** USDT base units per lot. */
  price: bigint;
  /** Asset base units still open at this level. */
  quantity: bigint;
  orders: number;
}

export interface Book {
  bids: BookLevel[];
  asks: BookLevel[];
}

/** Aggregated book (`order_book` view): bids highest to lowest, asks lowest to highest. */
export async function fetchBook(chain: ChainId, asset: string): Promise<Book> {
  const rows = await rest(
    `order_book?select=side,price::text,quantity::text,orders,lot_size::text` +
      `&chain_id=eq.${encodeURIComponent(chain)}&asset=eq.${encodeURIComponent(asset)}`,
  );
  const bids: BookLevel[] = [];
  const asks: BookLevel[] = [];
  for (const raw of rows) {
    const r = raw as Record<string, unknown>;
    const level = { price: parseBaseUnits(r.price), quantity: parseBaseUnits(r.quantity), orders: Number(r.orders) };
    if (level.quantity <= BigInt(0)) continue;
    if (r.side === "buy") bids.push(level);
    else if (r.side === "sell") asks.push(level);
  }
  // The view also groups by lot_size; levels with the same price are summed.
  const merge = (levels: BookLevel[]) => {
    const map = new Map<string, BookLevel>();
    for (const l of levels) {
      const k = l.price.toString();
      const prev = map.get(k);
      map.set(k, prev ? { price: l.price, quantity: prev.quantity + l.quantity, orders: prev.orders + l.orders } : l);
    }
    return [...map.values()];
  };
  const cmp = (a: bigint, b: bigint) => (a < b ? -1 : a > b ? 1 : 0);
  return {
    bids: merge(bids).sort((a, b) => cmp(b.price, a.price)),
    asks: merge(asks).sort((a, b) => cmp(a.price, b.price)),
  };
}
