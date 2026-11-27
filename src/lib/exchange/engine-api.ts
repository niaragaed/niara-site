// Client of the order service API (niara-exchange-engine/src/service/http.ts):
//   POST /v1/orders          { intent, signature }
//   POST /v1/orders/cancel   { cancel, signature }
//   GET  /v1/matches/:id     settlement status and tx hash
// Amounts are decimal strings. No secrets: authentication is the wallet's
// signature over the intent.
import { ENGINE_URL } from "./config";
import type { CancelIntent } from "./intents/cancel";
import { cancelToJson } from "./intents/cancel";
import type { OrderIntent } from "./intents/types";
import { intentToJson } from "./intents/validate";

export class EngineError extends Error {
  /** Engine code (`delegate_not_covered`, `bad_signature`…) or a transport code. */
  readonly code: string;
  readonly status: number | null;
  readonly detail: string | null;
  constructor(code: string, status: number | null, detail: string | null) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = "EngineError";
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

export type OrderStatus = "open" | "partially_filled" | "filled" | "cancelled" | "expired" | "stale";

export interface EngineOrder {
  id: string;
  chain: string;
  asset: string;
  wallet: string;
  side: "buy" | "sell";
  quantity: string;
  lotSize: string;
  limitPrice: string;
  expiresAt: number;
  /** Engine ad3a082+. Absent from older builds: GTC. */
  timeInForce?: "GTC" | "IOC";
  /** Engine 057b979+: an iceberg's signed display quantity; null for an order shown whole. */
  displayQuantity?: string | null;
  /** Engine 057b979+: an iceberg's current visible slice; null for an order shown whole. */
  visibleQuantity?: string | null;
  filledQuantity: string;
  remaining: string;
  status: OrderStatus;
  cancelReason?: string;
}

export interface EngineMatch {
  id: string;
  quantity: string;
  price: string;
  paymentAmount: string;
  takerSide: "buy" | "sell";
  expiresAt: number;
  status: string;
}

export interface SettlementStatus {
  matchId: string;
  status: "pending" | "settling" | "settled" | "failed";
  settlement: { status: "pending" | "submitted" | "confirmed" | "failed"; attempts: number; txHash: string | null; error: string | null } | null;
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  if (!ENGINE_URL) throw new EngineError("not_configured", null, "NEXT_PUBLIC_ENGINE_URL not set");
  let res: Response;
  try {
    res = await fetch(`${ENGINE_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    // fetch only fails like this on network/CORS: the browser doesn't say which.
    throw new EngineError("unreachable", null, null);
  }
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON body
  }
  if (!res.ok) {
    const o = (json ?? {}) as { error?: unknown; detail?: unknown };
    throw new EngineError(
      typeof o.error === "string" ? o.error : `http_${res.status}`,
      res.status,
      typeof o.detail === "string" ? o.detail : null,
    );
  }
  return json as T;
}

/** The answer to the wallet's signed placement: the only one with an iceberg's total. */
export function submitOrder(intent: OrderIntent, signature: string) {
  return call<{ order: EngineOrder; matches: EngineMatch[] }>("POST", "/v1/orders", {
    intent: intentToJson(intent),
    signature,
  });
}

export function cancelOrder(cancel: CancelIntent, signature: string) {
  return call<{ order: EngineOrder }>("POST", "/v1/orders/cancel", { cancel: cancelToJson(cancel), signature });
}

export function matchStatus(matchId: string) {
  return call<SettlementStatus>("GET", `/v1/matches/${encodeURIComponent(matchId)}`);
}

// ---------------------------------------------------------------------------
// Read endpoints (engine commits 7b9d6b2..6f49b2d). Lists are newest first and
// page with `limit` and `before` (the `next` cursor of the previous page).
// ---------------------------------------------------------------------------

export interface EngineQuoteAsset {
  asset: string;
  assetDecimals: number | null;
  symbol: string | null;
  name: string | null;
}

export interface EngineMarket {
  asset: string;
  symbol: string | null;
  name: string | null;
  assetDecimals: number;
  lotSize: string;
  status: string;
}

export interface EngineChainMarkets {
  id: string;
  kind: "solana" | "evm";
  caip2: string;
  evmChainId: number | null;
  settlementProgram: string | null;
  quoteAsset: EngineQuoteAsset | null;
  minOrderNotional: string;
  maxIntentValiditySecs: number | null;
  /** Settlement program and quote asset configured: the service admits orders. */
  ordersAccepted: boolean;
  /** The settlement worker runs for this chain: matches get settled. */
  settlementEnabled: boolean;
  markets: EngineMarket[];
}

/**
 * A stored order as `GET /v1/orders` and `GET /v1/orders/:id` return it. These reads are
 * public, so for an iceberg the engine returns `quantity` and `remaining` as null (they
 * would show the hidden quantity) and `visibleQuantity` as 0 once out of the book. The
 * wallet's own total comes from the signed placement answer (`EngineOrder`), kept
 * locally (iceberg.ts).
 */
export interface StoredOrder extends Omit<EngineOrder, "cancelReason" | "quantity" | "remaining"> {
  quantity: string | null;
  remaining: string | null;
  seq: number;
  paymentAsset: string;
  nonce: string;
  settledQuantity: string;
  releasedQuantity: string;
  voidedQuantity: string;
  cancelReason: string | null;
  /** ISO 8601. */
  createdAt: string;
}

export interface MatchSettlement {
  status: "pending" | "submitted" | "confirmed" | "failed";
  attempts: number;
  txHash: string | null;
  error: string | null;
  /** ISO 8601, once confirmed. */
  settledAt: string | null;
}

export interface MatchHistory {
  id: string;
  sequence: number;
  chain: string;
  asset: string;
  paymentAsset: string;
  buyOrderId: string;
  sellOrderId: string;
  makerOrderId: string;
  takerSide: "buy" | "sell";
  quantity: string;
  lotSize: string;
  price: string;
  paymentAmount: string;
  expiresAt: number;
  /** ISO 8601. */
  matchedAt: string;
  status: "pending" | "settling" | "settled" | "failed";
  settlement: MatchSettlement | null;
}

/** One of the wallet's matches (`GET /v1/matches?chain=&wallet=`). */
export interface WalletMatch extends MatchHistory {
  matchId: string;
  side: "buy" | "sell";
  role: "maker" | "taker";
  orderId: string;
}

/** A settled trade (`GET /v1/trades/:chain/:asset`): confirmed on-chain only. */
export interface Trade {
  matchId: string;
  sequence: number;
  price: string;
  quantity: string;
  lotSize: string;
  paymentAmount: string;
  takerSide: "buy" | "sell";
  /** ISO 8601: the trade time used for candles. */
  matchedAt: string;
  settledAt: string;
  txHash: string;
}

interface Page<T> {
  items: T[];
  next: number | null;
}

function pageQuery(params: Record<string, string | number | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined) q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function fetchMarkets() {
  return call<{ testnet: boolean; chains: EngineChainMarkets[] }>("GET", "/v1/markets");
}

export async function fetchWalletOrders(chain: string, wallet: string, before?: number | null, limit = 50): Promise<Page<StoredOrder>> {
  const r = await call<{ orders: StoredOrder[]; next: number | null }>(
    "GET",
    `/v1/orders${pageQuery({ chain, wallet, limit, before })}`,
  );
  return { items: r.orders, next: r.next };
}

export function fetchOrder(orderId: string) {
  return call<{ order: StoredOrder; matchIds: string[]; matches: MatchHistory[] }>(
    "GET",
    `/v1/orders/${encodeURIComponent(orderId)}`,
  );
}

export async function fetchWalletMatches(chain: string, wallet: string, before?: number | null, limit = 50): Promise<Page<WalletMatch>> {
  const r = await call<{ matches: WalletMatch[]; next: number | null }>(
    "GET",
    `/v1/matches${pageQuery({ chain, wallet, limit, before })}`,
  );
  return { items: r.matches, next: r.next };
}

export async function fetchTrades(chain: string, asset: string, before?: number | null, limit = 500): Promise<Page<Trade>> {
  const r = await call<{ trades: Trade[]; next: number | null }>(
    "GET",
    `/v1/trades/${encodeURIComponent(chain)}/${encodeURIComponent(asset)}${pageQuery({ limit, before })}`,
  );
  return { items: r.trades, next: r.next };
}

/**
 * Every page of a list, up to `maxPages`. Returns `complete: false` when the cap
 * was reached, so callers that need the whole list (approval sums) can refuse
 * instead of working from a partial one.
 */
export async function fetchAllPages<T>(
  fetchPage: (before: number | null) => Promise<Page<T>>,
  maxPages: number,
): Promise<{ items: T[]; complete: boolean }> {
  const items: T[] = [];
  let before: number | null = null;
  for (let i = 0; i < maxPages; i++) {
    const page = await fetchPage(before);
    items.push(...page.items);
    if (page.next === null) return { items, complete: true };
    before = page.next;
  }
  return { items, complete: false };
}
