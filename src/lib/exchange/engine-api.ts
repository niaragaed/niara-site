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
