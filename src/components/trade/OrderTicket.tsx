"use client";

// Real order ticket (intent v2): Limit = GTC at the price typed; Market = IOC whose
// signed limit is a price cap, the best opposite price of the book ± the slippage
// (1% default, 5% max). The cap and the maximum total are shown before signing.
// It builds the OrderIntent exactly as the engine defines it, the
// wallet signs it, the delegate/allowance is raised to EXACTLY what the wallet's open
// orders on that token plus this one need (a new approval replaces the previous one,
// it does not add to it), the intent goes to the order service and the ticket shows
// its answer. Nothing here fakes success: the result shown is what the engine answered.

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CHAINS } from "@/lib/exchange/chains";
import { ENGINE_URL, explorerTxUrl } from "@/lib/exchange/config";
import {
  EngineError,
  fetchAllPages,
  fetchWalletOrders,
  submitOrder,
} from "@/lib/exchange/engine-api";
import { requiredApproval } from "@/lib/exchange/approvals";
import { fetchBook } from "@/lib/exchange/market-data";
import { DelegationMismatchError, vaultAuthority } from "@/lib/exchange/solana";
import { SignedTxError } from "@/lib/exchange/solana-tx-check";
import {
  INTENT_VERSION,
  IntentError,
  MARKET_ORDER_DEFAULT_SLIPPAGE_BPS,
  MARKET_ORDER_MAX_SLIPPAGE_BPS,
  marketOrderLimitPrice,
  randomNonce,
  solanaIntentMessage,
  validateIntent,
  type OrderIntent,
  type Side,
  type TimeInForce,
} from "@/lib/exchange/intents";
import { formatUnitsExact, parseUnitsExact, unixNow } from "@/lib/exchange/units";
import { en } from "@/lib/i18n/en";
import { useTrade } from "./TradeContext";
import { isUserRejection, useChainActions } from "./useChainActions";

const EXPIRY_OPTIONS = [3600, 86400, 604800, 2592000];
/** Market (IOC) orders: signed validity, the time their matches have to settle. */
const MARKET_VALIDITY_SECS = 86400;
const SLIPPAGE_PRESETS = ["0.5", "1", "2", "5"];
/** Same refresh as the order book panel (same query key, so one request for both). */
const BOOK_REFRESH_MS = 5_000;

type Mode = "limit" | "market";

/** "1.25" (%) → 125 bps; null unless 0–5% with at most 2 decimals. */
export function parseSlippageBps(text: string): number | null {
  const bps = parseUnitsExact(text, 2);
  if (bps === null || bps > BigInt(MARKET_ORDER_MAX_SLIPPAGE_BPS)) return null;
  return Number(bps);
}

type Phase =
  | { step: "form" }
  | { step: "sign" | "approve" | "confirming" | "submit"; approvalTx?: string | null }
  | { step: "explain"; amount: string; symbol: string; token: string; spenderAddress: string }
  | {
      step: "done";
      orderId: string;
      status: string;
      matches: number;
      approvalTx: string | null;
      timeInForce: TimeInForce;
      /** IOC: lots matched and lots cancelled (never left in the book). */
      filledLots: string;
      cancelledLots: string;
    }
  | { step: "error"; message: string; approvalTx: string | null };

export function engineErrorMessage(e: unknown): string {
  const t = en.trade.errors;
  if (e instanceof EngineError) {
    if (e.code === "unreachable") return t.unreachable(ENGINE_URL ?? "—");
    if (e.code === "not_configured") return en.trade.ticket.engineNotConfigured;
    const known = t.codes[e.code];
    return known ? `${known}${e.detail ? ` (${e.detail})` : ""}` : `${e.code}${e.detail ? `: ${e.detail}` : ""}`;
  }
  if (e instanceof IntentError) return `${e.code}: ${e.message}`;
  if (e instanceof SignedTxError) return t.signedTx(e.detail);
  if (e instanceof DelegationMismatchError) return t.delegationMismatch;
  return t.generic(e instanceof Error ? e.message : String(e));
}

/** Why ordering is disabled on this chain, in the order that matters most. */
export function blockerMessage(blockers: readonly string[]): string | null {
  const t = en.trade.ticket.blocked;
  for (const b of ["engine_not_configured", "engine_unreachable", "orders_not_accepted", "settlement_disabled", "config_mismatch", "paused"]) {
    if (blockers.includes(b)) return t[b] ?? null;
  }
  return null;
}

export function OrderTicket() {
  const t = en.trade.ticket;
  const trade = useTrade();
  const { chain, config, listing, terms, wallet, blockers, chainInfo, orders, ordersComplete, refreshWallet } = trade;
  const actions = useChainActions(config);
  const kind = CHAINS[chain].kind;

  const [side, setSide] = useState<Side>("buy");
  const [mode, setMode] = useState<Mode>("limit");
  const [slippageText, setSlippageText] = useState(String(MARKET_ORDER_DEFAULT_SLIPPAGE_BPS / 100));
  const [lotsText, setLotsText] = useState("");
  const [priceText, setPriceText] = useState("");
  const [expirySecs, setExpirySecs] = useState(86400);
  const [phase, setPhase] = useState<Phase>({ step: "form" });
  const [formError, setFormError] = useState<string | null>(null);
  // Resolves the pause before the approval opens the wallet (true = continue).
  const explainResolve = useRef<((proceed: boolean) => void) | null>(null);
  useEffect(() => () => explainResolve.current?.(false), []);

  const usdtDecimals = terms?.usdt.decimals;
  const symbol = listing?.symbol ?? "";
  const maxValidity = chainInfo?.maxIntentValiditySecs ?? 0;
  const expiryChoices = EXPIRY_OPTIONS.filter((s) => s <= maxValidity);

  // The aggregated book (Supabase order_book): the best opposite price for a market order.
  const book = useQuery({
    queryKey: ["exchange", "book", chain, listing?.asset],
    enabled: Boolean(listing),
    queryFn: () => fetchBook(chain, listing!.asset),
    refetchInterval: BOOK_REFRESH_MS,
  });
  const isMarket = mode === "market";
  const slippageBps = parseSlippageBps(slippageText);
  const opposite = side === "buy" ? book.data?.asks : book.data?.bids;
  const bestOpposite = opposite?.[0]?.price ?? null;
  // The cap the wallet will sign: best ask + slippage (buy) / best bid − slippage (sell).
  const cap =
    isMarket && bestOpposite !== null && slippageBps !== null ? marketOrderLimitPrice(side, bestOpposite, slippageBps) : null;
  // Book depth that can fill within the cap (at the last read; the engine decides).
  const depthLots =
    cap !== null && opposite && listing
      ? opposite
          .filter((l) => (side === "buy" ? l.price <= cap : l.price >= cap))
          .reduce((sum, l) => sum + l.quantity, BigInt(0)) / listing.lotSize
      : null;
  const marketUnavailable = isMarket && book.data !== undefined && bestOpposite === null;

  // Exact values (bigint) from the text. Market: the price is the cap.
  const parsed = (() => {
    if (!listing || usdtDecimals === undefined) return null;
    const lots = /^[1-9][0-9]*$/.test(lotsText.trim()) ? BigInt(lotsText.trim()) : null;
    const price = isMarket ? cap : parseUnitsExact(priceText, usdtDecimals);
    if (lots === null || price === null || price <= BigInt(0)) return { lots, price, quantity: null, notional: null };
    return { lots, price, quantity: lots * listing.lotSize, notional: lots * price };
  })();

  // What `settle` can debit for THIS order (spec §3.5): the seller's asset, the
  // buyer's maximum payment in USDT.
  const need =
    parsed?.quantity && parsed.notional && listing && config.ready
      ? side === "sell"
        ? { token: listing.asset, amount: parsed.quantity, decimals: listing.assetDecimals, symbol: symbol || "asset" }
        : { token: config.usdt, amount: parsed.notional, decimals: usdtDecimals as number, symbol: terms?.usdt.symbol ?? "USDT" }
      : null;

  // The approval that keeps the wallet's open orders on this token AND the new one covered.
  // Read during render for display only; `place()` recomputes it from a fresh list.
  const [renderNow] = useState(() => unixNow());
  const requirement =
    need && orders ? requiredApproval({ chain, token: need.token, openOrders: orders, newNeed: need.amount, now: renderNow }) : null;

  const coverage = useQuery({
    queryKey: ["exchange", "coverage", chain, wallet, need?.token],
    enabled: Boolean(wallet && need && config.ready),
    queryFn: () => actions.readCoverage(wallet as string, need!.token),
    staleTime: 15_000,
  });

  const busy =
    phase.step === "sign" ||
    phase.step === "explain" ||
    phase.step === "approve" ||
    phase.step === "confirming" ||
    phase.step === "submit";
  const blocked = blockerMessage(blockers);

  const canOrder =
    config.ready &&
    blockers.length === 0 &&
    Boolean(ENGINE_URL) &&
    Boolean(wallet) &&
    listing !== null &&
    terms !== undefined &&
    chainInfo !== null &&
    orders !== undefined &&
    ordersComplete;

  async function place() {
    setFormError(null);
    if (!canOrder || !listing || !wallet || !config.ready || !chainInfo || usdtDecimals === undefined) return;
    if (!parsed?.lots) return setFormError(t.invalidLots);
    if (isMarket && slippageBps === null) return setFormError(t.market.invalidSlippage);
    if (isMarket && marketUnavailable) return setFormError(t.market.emptySide(side));
    if (!parsed.price || parsed.price <= BigInt(0) || !parsed.quantity || !parsed.notional) {
      return setFormError(t.invalidPrice(usdtDecimals));
    }
    if (parsed.notional < chainInfo.minOrderNotional) return setFormError(t.belowMin);

    // Market: re-read the book and require the cap shown to be the cap signed.
    if (isMarket) {
      let fresh: bigint;
      try {
        const b = (await book.refetch({ throwOnError: true })).data;
        const best = (side === "buy" ? b?.asks : b?.bids)?.[0]?.price ?? null;
        if (best === null) return setFormError(t.market.emptySide(side));
        fresh = marketOrderLimitPrice(side, best, slippageBps as number);
      } catch {
        return setFormError(t.market.bookError);
      }
      if (fresh !== parsed.price) return setFormError(t.market.capMoved(formatUnitsExact(fresh, usdtDecimals, true)));
    }
    const timeInForce: TimeInForce = isMarket ? "IOC" : "GTC";

    // 1. Build the intent exactly as the engine's src/intents (v2: time in force signed).
    let intent: OrderIntent;
    try {
      intent = validateIntent({
        version: INTENT_VERSION,
        timeInForce,
        chain,
        settlement: config.settlement,
        wallet,
        side,
        asset: listing.asset,
        quantity: parsed.quantity,
        lotSize: listing.lotSize,
        limitPrice: parsed.price,
        paymentAsset: config.usdt,
        nonce: randomNonce(),
        expiresAt: unixNow() + (isMarket ? Math.min(MARKET_VALIDITY_SECS, maxValidity) : expirySecs),
      });
    } catch (e) {
      return setFormError(e instanceof IntentError && e.code === "amount_overflow" ? t.overflow : engineErrorMessage(e));
    }
    const needNow = need!;

    // Fresh, complete list of the wallet's orders and the on-chain state, before any
    // signature (read-only). A partial list would under-approve: refuse instead.
    let total: bigint;
    let cov;
    try {
      const all = await fetchAllPages((before) => fetchWalletOrders(chain, wallet, before, 100), 20);
      if (!all.complete) return setFormError(t.tooManyOrders);
      total = requiredApproval({ chain, token: needNow.token, openOrders: all.items, newNeed: needNow.amount, now: unixNow() }).total;
      cov = await actions.readCoverage(wallet, needNow.token);
    } catch (e) {
      return setFormError(e instanceof EngineError ? engineErrorMessage(e) : en.trade.errors.chainRead);
    }
    if (cov.balance < needNow.amount) return setFormError(t.insufficientBalance);

    let approvalTx: string | null = null;
    try {
      // 2. Sign the intent.
      setPhase({ step: "sign" });
      const signature = await actions.signIntent(intent);

      // 3. Raise the delegate / allowance to exactly the total, only if it is below it.
      if (cov.approved < total) {
        // Before the wallet opens: say in plain words what the approval does.
        const proceed = await new Promise<boolean>((resolve) => {
          explainResolve.current = resolve;
          setPhase({
            step: "explain",
            amount: formatUnitsExact(total, needNow.decimals, true),
            symbol: needNow.symbol,
            token: needNow.token,
            spenderAddress: kind === "solana" ? vaultAuthority(config.settlement).toBase58() : config.settlement,
          });
        });
        explainResolve.current = null;
        if (!proceed) {
          setPhase({ step: "error", message: t.approvalCancelled, approvalTx: null });
          return;
        }
        setPhase({ step: "approve" });
        approvalTx = await actions.approveExact(wallet, needNow.token, total, (tx) => {
          approvalTx = tx;
          setPhase({ step: "confirming", approvalTx: tx });
        });
        setPhase({ step: "confirming", approvalTx });
      }

      // 4. Submit to the order service.
      setPhase({ step: "submit", approvalTx });
      const res = await submitOrder(intent, signature);
      const lotsOf = (q: string | undefined) => (q ? (BigInt(q) / listing.lotSize).toString() : "0");
      setPhase({
        step: "done",
        orderId: res.order.id,
        status: res.order.status,
        matches: res.matches.length,
        approvalTx,
        timeInForce,
        filledLots: lotsOf(res.order.filledQuantity),
        // An IOC leaves nothing in the book: what did not fill was cancelled.
        cancelledLots: res.order.cancelReason === "ioc_unfilled" ? lotsOf(res.order.remaining) : "0",
      });
      void coverage.refetch();
      void refreshWallet();
    } catch (e) {
      const tx = approvalTx ?? ((e as { tx?: string })?.tx ?? (e as { signature?: string })?.signature ?? null);
      setPhase({ step: "error", message: isUserRejection(e) ? t.rejected : engineErrorMessage(e), approvalTx: tx });
    }
  }

  function reset() {
    setPhase({ step: "form" });
    setLotsText("");
    setPriceText("");
  }

  const approvalLink = (tx: string | null | undefined) =>
    tx ? (
      <a
        href={explorerTxUrl(config, tx) ?? "#"}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 font-mono text-xs text-accent-blue underline-offset-2 hover:underline"
      >
        {t.approvalTx}: {tx.slice(0, 10)}… <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>
    ) : null;

  const spender = kind === "solana" ? t.vaultLabel : t.settlementLabel;
  const feePct = terms ? `${(terms.feeBps / 100).toFixed(2)}%` : null;

  // Preview of the text the Solana wallet will show (the React Compiler memoizes it).
  const preview = (() => {
    if (kind !== "solana" || !canOrder || !parsed?.quantity || !parsed.price || !listing || !wallet || !config.ready) return null;
    try {
      return new TextDecoder().decode(
        solanaIntentMessage({
          version: INTENT_VERSION,
          timeInForce: isMarket ? "IOC" : "GTC",
          chain,
          settlement: config.settlement,
          wallet,
          side,
          asset: listing.asset,
          quantity: parsed.quantity,
          lotSize: listing.lotSize,
          limitPrice: parsed.price,
          paymentAsset: config.usdt,
          // placeholders for the preview only; the lines are rewritten below
          nonce: "1".repeat(32),
          expiresAt: 1,
        }),
      )
        .replace(/Nonce: .*/, "Nonce: (random, 16 bytes)")
        .replace(/Expires at: .*/, `Expires at: (now + ${isMarket ? "1 day" : "selected expiry"}) (unix seconds)`);
    } catch {
      return null;
    }
  })();

  if (!listing) {
    return blocked ? (
      <section className="rounded-md border border-border bg-bg-surface p-4">
        <p className="text-xs text-warning">{blocked}</p>
      </section>
    ) : null;
  }

  const fmt = (v: bigint) => (need ? formatUnitsExact(v, need.decimals, true) : "");

  return (
    <section aria-labelledby="ticket-heading" className="rounded-md border border-border bg-bg-surface p-4">
      <h2 id="ticket-heading" className="text-sm font-semibold text-text-primary">
        {t.title}
      </h2>

      {phase.step === "done" ? (
        <div className="mt-4 flex flex-col gap-2 rounded-md border border-positive/30 bg-positive/10 p-3 text-sm text-positive">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {t.accepted}
          </span>
          <span className="text-xs text-text-secondary">
            {t.acceptedStatus(en.trade.session.orderStatus[phase.status] ?? phase.status, phase.matches)}
          </span>
          {phase.timeInForce === "IOC" && (
            <span className="text-xs text-text-secondary">
              {phase.filledLots === "0" ? t.iocNothing : t.iocResult(phase.filledLots, phase.cancelledLots)}
            </span>
          )}
          <span className="font-mono text-xs text-text-secondary">id {phase.orderId}</span>
          {approvalLink(phase.approvalTx)}
          <button type="button" onClick={reset} className="w-fit text-xs text-accent-blue underline underline-offset-2">
            {t.reset}
          </button>
        </div>
      ) : phase.step === "error" ? (
        <div role="alert" className="mt-4 flex flex-col gap-2 rounded-md border border-negative/30 bg-negative/10 p-3 text-sm text-negative">
          <span className="flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {t.failed}
          </span>
          <span className="text-xs text-text-secondary">{phase.message}</span>
          {approvalLink(phase.approvalTx)}
          <button
            type="button"
            onClick={() => setPhase({ step: "form" })}
            className="w-fit text-xs text-accent-blue underline underline-offset-2"
          >
            {en.web3.approve.tryAgain}
          </button>
        </div>
      ) : (
        <>
          <div role="group" aria-label={t.sideGroupLabel} className="mt-4 grid grid-cols-2 gap-2">
            {(["buy", "sell"] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={side === s}
                disabled={busy}
                onClick={() => setSide(s)}
                className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue ${
                  side === s
                    ? s === "buy"
                      ? "border-positive/40 bg-positive/15 text-positive"
                      : "border-negative/40 bg-negative/15 text-negative"
                    : "border-border text-text-muted hover:text-text-secondary"
                }`}
              >
                {s === "buy" ? t.buy : t.sell}
              </button>
            ))}
          </div>

          <div role="tablist" aria-label={t.orderTypeGroup} className="mt-3 flex gap-1 border-b border-border">
            {(["limit", "market"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                id={`ticket-tab-${m}`}
                aria-selected={mode === m}
                aria-controls="ticket-panel"
                disabled={busy}
                onClick={() => {
                  setMode(m);
                  setFormError(null);
                }}
                className={`-mb-px border-b-2 px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue ${
                  mode === m ? "border-accent-blue text-text-primary" : "border-transparent text-text-muted hover:text-text-secondary"
                }`}
              >
                {m === "limit" ? t.limitTab : t.marketTab}
              </button>
            ))}
          </div>

          <div id="ticket-panel" role="tabpanel" aria-labelledby={`ticket-tab-${mode}`} className="mt-4 flex flex-col gap-3">
            <div>
              <label htmlFor="ticket-lots" className="mb-1 block text-xs text-text-muted">
                {t.lotsLabel}
              </label>
              <input
                id="ticket-lots"
                inputMode="numeric"
                value={lotsText}
                disabled={busy}
                onChange={(e) => setLotsText(e.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-border bg-bg-base px-3 py-2 font-mono text-sm tabular-nums text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
              />
              <p className="mt-1 text-[11px] text-text-muted">
                {t.lotsHint(formatUnitsExact(listing.lotSize, listing.assetDecimals, true), symbol)}
              </p>
            </div>
            {isMarket ? (
              <MarketFields
                side={side}
                busy={busy}
                slippageText={slippageText}
                setSlippageText={setSlippageText}
                slippageValid={slippageBps !== null}
                bookState={book.error ? "error" : book.data === undefined ? "loading" : "ready"}
                best={bestOpposite === null || usdtDecimals === undefined ? null : formatUnitsExact(bestOpposite, usdtDecimals, true)}
                cap={cap === null || usdtDecimals === undefined ? null : formatUnitsExact(cap, usdtDecimals, true)}
                total={
                  parsed?.notional && usdtDecimals !== undefined
                    ? `${formatUnitsExact(parsed.notional, usdtDecimals, true)} ${terms?.usdt.symbol ?? "USDT"}`
                    : null
                }
                depthLots={depthLots === null ? null : depthLots.toString()}
                unavailable={marketUnavailable}
              />
            ) : (
            <>
            <div>
              <label htmlFor="ticket-price" className="mb-1 block text-xs text-text-muted">
                {t.priceLabel}
              </label>
              <input
                id="ticket-price"
                inputMode="decimal"
                value={priceText}
                disabled={busy}
                onChange={(e) => setPriceText(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-border bg-bg-base px-3 py-2 font-mono text-sm tabular-nums text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
              />
            </div>
            <div>
              <label htmlFor="ticket-expiry" className="mb-1 block text-xs text-text-muted">
                {t.expiryLabel}
              </label>
              <select
                id="ticket-expiry"
                value={expirySecs}
                disabled={busy || expiryChoices.length === 0}
                onChange={(e) => setExpirySecs(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
              >
                {expiryChoices.map((s) => (
                  <option key={s} value={s}>
                    {t.expiry[String(s)]}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-text-muted">{t.limitNote}</p>
            </>
            )}
          </div>

          <dl className="mt-4 space-y-1 border-t border-border pt-3 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">{isMarket ? t.market.total(side) : t.notional}</dt>
              <dd className="font-mono tabular-nums text-text-primary">
                {parsed?.notional && usdtDecimals !== undefined
                  ? `${formatUnitsExact(parsed.notional, usdtDecimals, true)} ${terms?.usdt.symbol ?? "USDT"}`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-muted">{t.feeLabel}</dt>
              <dd className="font-mono tabular-nums text-text-secondary">{feePct ? t.feeValue(feePct) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-muted">{t.cashbackLabel}</dt>
              <dd className="font-mono tabular-nums text-text-secondary">
                {listing.cashbackEligible === false
                  ? t.cashbackNone
                  : listing.cashbackEligible && terms?.cashbackBps != null
                    ? t.cashbackValue(`${terms.cashbackBps / 100}%`)
                    : "—"}
              </dd>
            </div>
            {chainInfo && chainInfo.minOrderNotional > BigInt(0) && usdtDecimals !== undefined && (
              <p className="text-text-muted">{t.minNotional(formatUnitsExact(chainInfo.minOrderNotional, usdtDecimals, true))}</p>
            )}
          </dl>

          {need && wallet && (
            <div className="mt-3 rounded-md border border-border bg-bg-elevated p-3 text-xs">
              <p className="font-semibold text-text-primary">{t.approvalLabel}</p>
              <p className="mt-1 text-text-secondary">{t.approvalWhy}</p>
              {coverage.data && requirement ? (
                <>
                  <dl className="mt-2 space-y-1">
                    <div className="flex justify-between gap-3">
                      <dt className="text-text-muted">{t.openOrdersNeed(requirement.openCount)}</dt>
                      <dd className="font-mono tabular-nums text-text-secondary">
                        {fmt(requirement.openNeed)} {need.symbol}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-text-muted">{t.thisOrderNeed}</dt>
                      <dd className="font-mono tabular-nums text-text-secondary">
                        + {fmt(requirement.newNeed)} {need.symbol}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-border pt-1">
                      <dt className="text-text-secondary">{t.totalNeed}</dt>
                      <dd className="font-mono tabular-nums text-text-primary">
                        {fmt(requirement.total)} {need.symbol}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-text-muted">{t.currentApproval}</dt>
                      <dd className="font-mono tabular-nums text-text-secondary">
                        {fmt(coverage.data.approved)} {need.symbol}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-text-muted">{t.balanceLabel}</dt>
                      <dd className="font-mono tabular-nums text-text-secondary">
                        {fmt(coverage.data.balance)} {need.symbol}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-text-secondary">
                    {coverage.data.approved >= requirement.total
                      ? t.approvalCovered
                      : t.approvalExact(fmt(requirement.total), need.symbol, spender)}
                  </p>
                  {coverage.data.delegatedElsewhere && <p className="mt-1 text-warning">{t.delegatedElsewhere}</p>}
                  {coverage.data.balance < requirement.newNeed ? (
                    <p className="mt-1 text-negative">{t.insufficientBalance}</p>
                  ) : (
                    coverage.data.balance < requirement.total && <p className="mt-1 text-warning">{t.balanceBelowTotal}</p>
                  )}
                </>
              ) : coverage.error ? (
                <p className="mt-1 text-negative">{en.trade.errors.chainRead}</p>
              ) : !ordersComplete ? (
                <p className="mt-1 text-negative">{t.tooManyOrders}</p>
              ) : (
                <p className="mt-1 text-text-muted">{t.loadingChain}</p>
              )}
            </div>
          )}

          {preview && (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-text-muted hover:text-text-secondary">{t.signedText}</summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-border bg-bg-base p-2 font-mono text-[11px] text-text-secondary">
                {preview}
              </pre>
            </details>
          )}

          {phase.step === "explain" && (
            <div className="mt-3 rounded-md border border-accent-blue/40 bg-accent-blue/10 p-3 text-xs">
              <p className="font-semibold text-text-primary">{t.explain.title}</p>
              <p className="mt-1 break-words text-text-secondary">
                {t.explain.what(phase.amount, phase.symbol, phase.token, spender, phase.spenderAddress)}
              </p>
              <p className="mt-1 text-text-secondary">{t.explain.why}</p>
              {kind === "solana" && <p className="mt-1 text-text-muted">{t.explain.solanaExtras}</p>}
              <p className="mt-1 text-warning">{t.explain.warning}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => explainResolve.current?.(true)}
                  className="rounded-md bg-gradient-primary px-3 py-1.5 font-semibold text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-cyan"
                >
                  {t.explain.continue}
                </button>
                <button
                  type="button"
                  onClick={() => explainResolve.current?.(false)}
                  className="rounded-md border border-border px-3 py-1.5 text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
                >
                  {t.explain.cancel}
                </button>
              </div>
            </div>
          )}
          {busy && (
            <p role="status" className="mt-3 flex items-center gap-2 text-xs text-accent-cyan">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.steps[phase.step as keyof typeof t.steps]}
            </p>
          )}
          {"approvalTx" in phase && approvalLink(phase.approvalTx)}
          {formError && <p className="mt-3 text-xs text-negative">{formError}</p>}
          {blocked && <p className="mt-3 text-xs text-warning">{blocked}</p>}
          {!wallet && config.ready && <p className="mt-3 text-xs text-text-muted">{t.connectFirst}</p>}

          <button
            type="button"
            onClick={() => void place()}
            disabled={!canOrder || busy || !parsed?.notional || marketUnavailable}
            className="mt-4 w-full rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-cyan disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isMarket ? t.market.place : t.place}
          </button>
        </>
      )}
    </section>
  );
}

/** Market (IOC) inputs and what will be signed: best price, slippage, cap, total. */
function MarketFields({
  side,
  busy,
  slippageText,
  setSlippageText,
  slippageValid,
  bookState,
  best,
  cap,
  total,
  depthLots,
  unavailable,
}: {
  side: Side;
  busy: boolean;
  slippageText: string;
  setSlippageText: (v: string) => void;
  slippageValid: boolean;
  bookState: "loading" | "error" | "ready";
  best: string | null;
  cap: string | null;
  total: string | null;
  depthLots: string | null;
  unavailable: boolean;
}) {
  const t = en.trade.ticket.market;
  return (
    <>
      <div>
        <label htmlFor="ticket-slippage" className="mb-1 block text-xs text-text-muted">
          {t.slippageLabel}
        </label>
        <div className="flex gap-2">
          <input
            id="ticket-slippage"
            inputMode="decimal"
            value={slippageText}
            disabled={busy}
            aria-invalid={!slippageValid}
            aria-describedby="ticket-slippage-hint"
            onChange={(e) => setSlippageText(e.target.value)}
            className="w-20 rounded-md border border-border bg-bg-base px-3 py-2 font-mono text-sm tabular-nums text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
          />
          <div role="group" aria-label={t.slippagePresetsAria} className="flex flex-1 gap-1">
            {SLIPPAGE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={busy}
                aria-pressed={slippageText === p}
                onClick={() => setSlippageText(p)}
                className={`flex-1 rounded-md border px-2 font-mono text-xs tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue ${
                  slippageText === p ? "border-accent-blue/60 bg-accent-blue/15 text-text-primary" : "border-border text-text-secondary hover:text-text-primary"
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>
        <p id="ticket-slippage-hint" className={`mt-1 text-[11px] ${slippageValid ? "text-text-muted" : "text-negative"}`}>
          {slippageValid ? t.slippageHint : t.invalidSlippage}
        </p>
      </div>

      {bookState === "error" ? (
        <p className="text-xs text-negative">{t.bookError}</p>
      ) : bookState === "loading" ? (
        <p className="text-xs text-text-muted">{t.bookLoading}</p>
      ) : unavailable ? (
        <p role="status" className="rounded-md border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
          {t.emptySide(side)}
        </p>
      ) : (
        <dl className="space-y-1 rounded-md border border-border bg-bg-elevated p-3 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-text-muted">{t.best(side)}</dt>
            <dd className="font-mono tabular-nums text-text-secondary">{best ?? "—"} USDT</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-text-secondary">{t.cap(side)}</dt>
            <dd className="font-mono tabular-nums text-text-primary">{cap ?? "—"} USDT</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-text-secondary">{t.total(side)}</dt>
            <dd className="font-mono tabular-nums text-text-primary">{total ?? "—"}</dd>
          </div>
          {depthLots !== null && <p className="pt-1 text-text-muted">{t.depth(depthLots)}</p>}
        </dl>
      )}

      <p className="rounded-md border border-accent-blue/30 bg-accent-blue/5 p-2 text-[11px] text-text-secondary">{t.ioc}</p>
      <p className="text-[11px] text-text-muted">{t.validity}</p>
    </>
  );
}
