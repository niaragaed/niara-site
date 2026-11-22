"use client";

// The connected wallet's orders and settlements on the selected chain, across
// sessions: `GET /v1/orders?chain=&wallet=` (with nonces, so live orders can be
// cancelled with a signed message), `GET /v1/orders/:id` for one order's matches,
// and `GET /v1/matches?chain=&wallet=` for settlements. "Settled" only appears with
// the transaction hash and an explorer link.

import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { explorerTxUrl } from "@/lib/exchange/config";
import { cancelOrder, fetchOrder, type MatchHistory, type StoredOrder, type WalletMatch } from "@/lib/exchange/engine-api";
import { formatUnitsExact, unixNow } from "@/lib/exchange/units";
import { en } from "@/lib/i18n/en";
import { engineErrorMessage } from "./OrderTicket";
import { useTrade } from "./TradeContext";
import { isUserRejection, useChainActions } from "./useChainActions";

const LIVE = new Set(["open", "partially_filled"]);
const lots = (qty: string, lotSize: string) => (BigInt(qty) / BigInt(lotSize)).toString();
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function SettlementLine({ m }: { m: MatchHistory | WalletMatch }) {
  const t = en.trade.session;
  const { config } = useTrade();
  const tx = m.settlement?.txHash ?? null;
  const settled = m.status === "settled" && tx;
  const url = tx ? explorerTxUrl(config, tx) : null;
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className={settled ? "text-positive" : m.status === "failed" ? "text-negative" : "flex items-center gap-1 text-accent-cyan"}>
        {!settled && m.status !== "failed" && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
        {t.matchStatus[m.status] ?? m.status}
        {m.settlement && m.settlement.attempts > 0 && !settled && ` · ${t.attempts(m.settlement.attempts)}`}
      </span>
      {url && tx && (
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-accent-blue hover:underline">
          {t.viewTx}: {tx.slice(0, 10)}… <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      )}
      {m.status === "failed" && m.settlement?.error && <span className="text-text-muted">{m.settlement.error}</span>}
    </span>
  );
}

function OrderMatches({ orderId, usdtDecimals }: { orderId: string; usdtDecimals: number }) {
  const t = en.trade.session;
  const detail = useQuery({
    queryKey: ["exchange", "order", orderId],
    queryFn: () => fetchOrder(orderId),
    refetchInterval: (q) =>
      q.state.data?.matches.some((m) => m.status === "pending" || m.status === "settling") ? 5_000 : false,
  });
  if (detail.error) return <p className="text-negative">{engineErrorMessage(detail.error)}</p>;
  if (!detail.data) return <p className="text-text-muted">{t.loading}</p>;
  if (detail.data.matches.length === 0) return <p className="text-text-muted">{t.noMatches}</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {detail.data.matches.map((m) => (
        <li key={m.id} className="flex flex-col gap-1 rounded-md border border-border bg-bg-base p-2">
          <span className="font-mono tabular-nums text-text-secondary">
            {t.matchQty(lots(m.quantity, m.lotSize), formatUnitsExact(BigInt(m.price), usdtDecimals, true))} ·{" "}
            {new Date(m.matchedAt).toLocaleString("en-US")}
          </span>
          <SettlementLine m={m} />
        </li>
      ))}
    </ul>
  );
}

function OrderRow({ order }: { order: StoredOrder }) {
  const t = en.trade.session;
  const { config, terms, listings, refreshWallet } = useTrade();
  const actions = useChainActions(config);
  const [open, setOpen] = useState(false);
  const [cancel, setCancel] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });
  const [now] = useState(() => unixNow());
  const usdtDecimals = terms?.usdt.decimals ?? 0;
  const symbol = listings?.find((l) => l.asset === order.asset)?.symbol ?? short(order.asset);
  const live = LIVE.has(order.status) && order.expiresAt > now;

  async function doCancel() {
    if (!config.ready) return;
    setCancel({ busy: true, error: null });
    try {
      const c = { version: 1 as const, chain: config.chain, settlement: config.settlement, wallet: order.wallet, nonce: order.nonce };
      const signature = await actions.signCancel(c);
      await cancelOrder(c, signature);
      setCancel({ busy: false, error: null });
      await refreshWallet();
    } catch (e) {
      setCancel({ busy: false, error: isUserRejection(e) ? en.trade.ticket.rejected : engineErrorMessage(e) });
    }
  }

  return (
    <li className="rounded-md border border-border bg-bg-elevated p-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
        >
          {open ? <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
          <span className={`font-semibold ${order.side === "buy" ? "text-positive" : "text-negative"}`}>
            {order.side === "buy" ? en.trade.ticket.buy : en.trade.ticket.sell}
          </span>
          <span className="ml-1 text-text-primary">{symbol}</span>
        </button>
        <span className="font-mono tabular-nums text-text-secondary">
          {lots(order.quantity, order.lotSize)} {t.lots} · {formatUnitsExact(BigInt(order.limitPrice), usdtDecimals, true)} USDT
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-text-primary">
          {t.orderStatus[order.status] ?? order.status}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-text-muted">
        {t.filled(lots(order.filledQuantity, order.lotSize), lots(order.remaining, order.lotSize))} · {t.placed}{" "}
        {new Date(order.createdAt).toLocaleString("en-US")} · {t.expires} {new Date(order.expiresAt * 1000).toLocaleString("en-US")}
        {order.cancelReason && ` · ${t.cancelReason[order.cancelReason] ?? order.cancelReason}`}
      </p>

      {open && (
        <div className="mt-2">
          <OrderMatches orderId={order.id} usdtDecimals={usdtDecimals} />
        </div>
      )}

      {live && (
        <div className="mt-2 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => void doCancel()}
            disabled={cancel.busy}
            className="flex w-fit items-center gap-1 rounded-md border border-border px-2 py-1 text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue disabled:opacity-60"
          >
            {cancel.busy && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
            {cancel.busy ? t.cancelling : t.cancel}
          </button>
          <p className="text-[11px] text-text-muted">{t.cancelNote}</p>
        </div>
      )}
      {cancel.error && <p className="mt-1 text-negative">{cancel.error}</p>}
    </li>
  );
}

function SettlementRow({ m }: { m: WalletMatch }) {
  const t = en.trade.session;
  const { terms, listings } = useTrade();
  const usdtDecimals = terms?.usdt.decimals ?? 0;
  const symbol = listings?.find((l) => l.asset === m.asset)?.symbol ?? short(m.asset);
  return (
    <li className="flex flex-col gap-1 rounded-md border border-border bg-bg-elevated p-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          <span className={`font-semibold ${m.side === "buy" ? "text-positive" : "text-negative"}`}>
            {m.side === "buy" ? en.trade.ticket.buy : en.trade.ticket.sell}
          </span>{" "}
          <span className="text-text-primary">{symbol}</span> <span className="text-text-muted">({t.role[m.role]})</span>
        </span>
        <span className="font-mono tabular-nums text-text-secondary">
          {t.matchQty(lots(m.quantity, m.lotSize), formatUnitsExact(BigInt(m.price), usdtDecimals, true))}
        </span>
      </div>
      <span className="text-[11px] text-text-muted">{new Date(m.matchedAt).toLocaleString("en-US")}</span>
      <SettlementLine m={m} />
    </li>
  );
}

export function YourOrders() {
  const t = en.trade.session;
  const { wallet, orders, ordersError, ordersComplete, matches, matchesError } = useTrade();
  const [tab, setTab] = useState<"orders" | "settlements">("orders");

  return (
    <section aria-labelledby="your-orders-heading" className="flex h-full flex-col rounded-md border border-border bg-bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h2 id="your-orders-heading" className="text-sm font-semibold text-text-primary">
          {t.title}
        </h2>
        <div role="tablist" aria-label={t.title} className="flex gap-1">
          {(["orders", "settlements"] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded px-2 py-0.5 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue ${
                tab === id ? "bg-accent-blue/20 text-text-primary" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {id === "orders" ? t.ordersTab : t.settlementsTab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {!wallet ? (
          <p className="text-xs text-text-muted">{t.connect}</p>
        ) : tab === "orders" ? (
          ordersError ? (
            <p className="text-xs text-negative">{engineErrorMessage(ordersError)}</p>
          ) : !orders ? (
            <p className="text-xs text-text-muted">{t.loading}</p>
          ) : orders.length === 0 ? (
            <p className="text-xs text-text-muted">{t.empty}</p>
          ) : (
            <>
              {!ordersComplete && <p className="mb-2 text-[11px] text-warning">{t.truncated}</p>}
              <ul className="flex flex-col gap-2">
                {orders.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </ul>
            </>
          )
        ) : matchesError ? (
          <p className="text-xs text-negative">{engineErrorMessage(matchesError)}</p>
        ) : !matches ? (
          <p className="text-xs text-text-muted">{t.loading}</p>
        ) : matches.length === 0 ? (
          <p className="text-xs text-text-muted">{t.noSettlements}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {matches.map((m) => (
              <SettlementRow key={m.matchId} m={m} />
            ))}
          </ul>
        )}
      </div>
      <p className="border-t border-border px-3 py-2 text-[11px] text-text-muted">{t.publicNote}</p>
    </section>
  );
}
