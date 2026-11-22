"use client";

// Orders submitted from THIS tab (React state, not persisted) with the status the
// engine returned and, for each match, the settlement status read from
// GET /v1/matches/:id. "Settled" only appears with the transaction hash.
// The wallet's full history depends on an endpoint the engine doesn't have yet;
// it is not reconstructed here.

import { useState } from "react";
import { ExternalLink, Info, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { explorerTxUrl } from "@/lib/exchange/config";
import { cancelOrder, matchStatus, type EngineMatch } from "@/lib/exchange/engine-api";
import { formatUnitsExact } from "@/lib/exchange/units";
import { en } from "@/lib/i18n/en";
import { engineErrorMessage } from "./OrderTicket";
import { useTrade, type SessionOrder } from "./TradeContext";
import { isUserRejection, useChainActions } from "./useChainActions";

const TERMINAL = new Set(["settled", "failed"]);

function MatchRow({ match, lotSize, usdtDecimals }: { match: EngineMatch; lotSize: bigint; usdtDecimals: number }) {
  const t = en.trade.session;
  const { config } = useTrade();
  const status = useQuery({
    queryKey: ["exchange", "match", match.id],
    queryFn: () => matchStatus(match.id),
    refetchInterval: (q) => (q.state.data && TERMINAL.has(q.state.data.status) ? false : 5_000),
  });
  const s = status.data;
  const tx = s?.settlement?.txHash ?? null;
  const label = s ? (t.matchStatus[s.status] ?? s.status) : t.matchStatus.pending;
  const settled = s?.status === "settled" && tx;

  return (
    <li className="flex flex-col gap-1 rounded-md border border-border bg-bg-base p-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono tabular-nums text-text-secondary">
          {t.matchQty((BigInt(match.quantity) / lotSize).toString(), formatUnitsExact(BigInt(match.price), usdtDecimals, true))}
        </span>
        <span
          className={
            settled ? "text-positive" : s?.status === "failed" ? "text-negative" : "flex items-center gap-1 text-accent-cyan"
          }
        >
          {!settled && s?.status !== "failed" && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
          {label}
          {s?.settlement && s.settlement.attempts > 0 && !settled && ` · ${t.attempts(s.settlement.attempts)}`}
        </span>
      </div>
      {status.error && <span className="text-negative">{t.statusUnavailable}</span>}
      {s?.settlement?.error && s.status === "failed" && <span className="text-text-muted">{s.settlement.error}</span>}
      {tx && (
        <a
          href={explorerTxUrl(config, tx) ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1 font-mono text-accent-blue underline-offset-2 hover:underline"
        >
          {t.viewTx}: {tx.slice(0, 10)}… <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      )}
      <span className="font-mono text-[10px] text-text-muted">match {match.id}</span>
    </li>
  );
}

function SessionOrderCard({ entry }: { entry: SessionOrder }) {
  const t = en.trade.session;
  const { config, terms, updateSessionOrder } = useTrade();
  const actions = useChainActions(config);
  const [cancelState, setCancelState] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });
  const { intent, order, matches } = entry;
  const usdtDecimals = terms?.usdt.decimals ?? 0;
  const live = order.status === "open" || order.status === "partially_filled";

  async function cancel() {
    setCancelState({ busy: true, error: null });
    try {
      const c = { version: 1 as const, chain: intent.chain, settlement: intent.settlement, wallet: intent.wallet, nonce: intent.nonce };
      const signature = await actions.signCancel(c);
      const res = await cancelOrder(c, signature);
      updateSessionOrder(order.id, res.order);
      setCancelState({ busy: false, error: null });
    } catch (e) {
      setCancelState({ busy: false, error: isUserRejection(e) ? en.trade.ticket.rejected : engineErrorMessage(e) });
    }
  }

  return (
    <li className="rounded-md border border-border bg-bg-elevated p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={`font-semibold ${intent.side === "buy" ? "text-positive" : "text-negative"}`}>
          {intent.side === "buy" ? en.trade.ticket.buy : en.trade.ticket.sell}
        </span>
        <span className="font-mono tabular-nums text-text-secondary">
          {(intent.quantity / intent.lotSize).toString()} {t.lots} · {formatUnitsExact(intent.limitPrice, usdtDecimals, true)} USDT
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-text-primary">
          {t.orderStatus[order.status] ?? order.status}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-text-muted">
        {t.expires} {new Date(intent.expiresAt * 1000).toLocaleString("en-US")} ·{" "}
        <span className="font-mono">id {order.id}</span>
      </p>

      {matches.length === 0 ? (
        <p className="mt-2 text-xs text-text-muted">{t.noMatches}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {matches.map((m) => (
            <MatchRow key={m.id} match={m} lotSize={intent.lotSize} usdtDecimals={usdtDecimals} />
          ))}
        </ul>
      )}

      {live && (
        <div className="mt-2 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => void cancel()}
            disabled={cancelState.busy}
            className="flex w-fit items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue disabled:opacity-60"
          >
            {cancelState.busy && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
            {cancelState.busy ? t.cancelling : t.cancel}
          </button>
          <p className="text-[11px] text-text-muted">{t.cancelNote}</p>
        </div>
      )}
      {cancelState.error && <p className="mt-1 text-xs text-negative">{cancelState.error}</p>}
    </li>
  );
}

export function SessionOrders() {
  const t = en.trade.session;
  const { sessionOrders, chain } = useTrade();
  const mine = sessionOrders.filter((o) => o.intent.chain === chain);

  return (
    <section aria-labelledby="session-heading" className="flex h-full flex-col rounded-md border border-border bg-bg-surface">
      <div className="border-b border-border px-3 py-2">
        <h2 id="session-heading" className="text-sm font-semibold text-text-primary">
          {t.title}
        </h2>
        <p className="text-[11px] text-text-muted">{t.subtitle}</p>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <p className="mb-3 flex items-start gap-2 rounded-md border border-border bg-bg-base p-2 text-[11px] text-text-secondary">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-cyan" aria-hidden="true" />
          <span>
            {t.noEndpoint} {t.statusNote}
          </span>
        </p>
        {mine.length === 0 ? (
          <p className="text-xs text-text-muted">{t.empty}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {mine.map((o) => (
              <SessionOrderCard key={o.order.id} entry={o} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
