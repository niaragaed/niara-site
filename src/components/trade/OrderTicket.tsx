"use client";

// Real order ticket: builds the OrderIntent exactly as the engine defines it, the wallet
// signs it, approves on-chain only the exact amount `settle` would move (if the current
// approval doesn't cover it), submits to the order service and shows its answer. Nothing here
// fakes success: the result shown is what the engine answered.

import { useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CHAINS } from "@/lib/exchange/chains";
import { ENGINE_URL, explorerTxUrl } from "@/lib/exchange/config";
import { EngineError, submitOrder } from "@/lib/exchange/engine-api";
import {
  IntentError,
  randomNonce,
  solanaIntentMessage,
  validateIntent,
  type OrderIntent,
  type Side,
} from "@/lib/exchange/intents";
import { formatUnitsExact, parseUnitsExact, unixNow } from "@/lib/exchange/units";
import { en } from "@/lib/i18n/en";
import { useTrade } from "./TradeContext";
import { isUserRejection, useChainActions } from "./useChainActions";

const EXPIRY_OPTIONS = [3600, 86400, 604800, 2592000];

type Phase =
  | { step: "form" }
  | { step: "sign" | "approve" | "confirming" | "submit"; approvalTx?: string | null }
  | { step: "done"; orderId: string; approvalTx: string | null }
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
  return t.generic(e instanceof Error ? e.message : String(e));
}

export function OrderTicket() {
  const t = en.trade.ticket;
  const trade = useTrade();
  const { chain, config, listing, terms, assetMeta, wallet, blockers, chainRow, addSessionOrder } = trade;
  const actions = useChainActions(config);
  const kind = CHAINS[chain].kind;

  const [side, setSide] = useState<Side>("buy");
  const [lotsText, setLotsText] = useState("");
  const [priceText, setPriceText] = useState("");
  const [expirySecs, setExpirySecs] = useState(86400);
  const [phase, setPhase] = useState<Phase>({ step: "form" });
  const [formError, setFormError] = useState<string | null>(null);

  const usdtDecimals = terms?.usdt.decimals;
  const symbol = assetMeta?.symbol ?? "";
  const maxValidity = chainRow?.maxIntentValiditySecs ?? 0;
  const expiryChoices = EXPIRY_OPTIONS.filter((s) => s <= maxValidity);

  // Exact values (bigint) from the text.
  const parsed = useMemo(() => {
    if (!listing || usdtDecimals === undefined) return null;
    const lots = /^[1-9][0-9]*$/.test(lotsText.trim()) ? BigInt(lotsText.trim()) : null;
    const price = parseUnitsExact(priceText, usdtDecimals);
    if (lots === null || price === null || price <= BigInt(0)) return { lots, price, quantity: null, notional: null };
    return { lots, price, quantity: lots * listing.lotSize, notional: lots * price };
  }, [lotsText, priceText, listing, usdtDecimals]);

  // What `settle` will debit from this wallet (spec §3.5): the seller's asset,
  // the buyer's maximum payment in USDT.
  const need =
    parsed?.quantity && parsed.notional && listing && config.ready
      ? side === "sell"
        ? { token: listing.asset, amount: parsed.quantity, decimals: listing.assetDecimals, symbol: symbol || "asset" }
        : { token: config.usdt, amount: parsed.notional, decimals: usdtDecimals as number, symbol: terms?.usdt.symbol ?? "USDT" }
      : null;

  const coverage = useQuery({
    queryKey: ["exchange", "coverage", chain, wallet, need?.token],
    enabled: Boolean(wallet && need && config.ready),
    queryFn: () => actions.readCoverage(wallet as string, need!.token),
    staleTime: 15_000,
  });

  const busy = phase.step === "sign" || phase.step === "approve" || phase.step === "confirming" || phase.step === "submit";

  const blockerMessage = blockers.includes("not_configured")
    ? null
    : blockers.includes("config_mismatch")
      ? t.configMismatch
      : blockers.includes("paused")
        ? t.programPaused
        : blockers.includes("chain_not_ready")
          ? en.trade.errors.codes.chain_not_ready
          : !ENGINE_URL
            ? t.engineNotConfigured
            : null;

  const canOrder = config.ready && blockers.length === 0 && Boolean(ENGINE_URL) && Boolean(wallet) && listing !== null && terms !== undefined && chainRow;

  async function place() {
    setFormError(null);
    if (!canOrder || !listing || !wallet || !config.ready || !chainRow || usdtDecimals === undefined) return;
    if (!parsed?.lots) return setFormError(t.invalidLots);
    if (!parsed.price || parsed.price <= BigInt(0) || !parsed.quantity || !parsed.notional) {
      return setFormError(t.invalidPrice(usdtDecimals));
    }
    if (parsed.notional < chainRow.minOrderNotional) return setFormError(t.belowMin);

    // 1. Build the intent exactly as the engine's src/intents.
    let intent: OrderIntent;
    try {
      intent = validateIntent({
        version: 1,
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
        expiresAt: unixNow() + expirySecs,
      });
    } catch (e) {
      return setFormError(e instanceof IntentError && e.code === "amount_overflow" ? t.overflow : engineErrorMessage(e));
    }
    const needNow = need!;

    // Balance before asking for any signature (read-only).
    let cov;
    try {
      cov = await actions.readCoverage(wallet, needNow.token);
    } catch {
      return setFormError(en.trade.errors.chainRead);
    }
    if (cov.balance < needNow.amount) return setFormError(t.insufficientBalance);

    let approvalTx: string | null = null;
    try {
      // 2. Sign the intent.
      setPhase({ step: "sign" });
      const signature = await actions.signIntent(intent);

      // 3. Exact delegate / allowance, only if the current one doesn't cover it.
      if (cov.approved < needNow.amount) {
        setPhase({ step: "approve" });
        approvalTx = await actions.approveExact(wallet, needNow.token, needNow.amount, (tx) => {
          approvalTx = tx;
          setPhase({ step: "confirming", approvalTx: tx });
        });
        setPhase({ step: "confirming", approvalTx });
      }

      // 4. Submit to the order service.
      setPhase({ step: "submit", approvalTx });
      const res = await submitOrder(intent, signature);
      addSessionOrder({ intent, order: res.order, matches: res.matches, approvalTx, placedAt: unixNow() });
      setPhase({ step: "done", orderId: res.order.id, approvalTx });
      void coverage.refetch();
    } catch (e) {
      const tx = approvalTx ?? ((e as { tx?: string; signature?: string })?.tx ?? (e as { signature?: string })?.signature ?? null);
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

  // Preview of the text the Solana wallet will show.
  const preview = useMemo(() => {
    if (kind !== "solana" || !canOrder || !parsed?.quantity || !parsed.price || !listing || !wallet || !config.ready) return null;
    try {
      return new TextDecoder().decode(
        solanaIntentMessage({
          version: 1,
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
        .replace(/Expires at: .*/, "Expires at: (now + selected expiry) (unix seconds)");
    } catch {
      return null;
    }
  }, [kind, canOrder, parsed, listing, wallet, config, chain, side]);

  if (!listing) return null;

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

          <div className="mt-4 flex flex-col gap-3">
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
          </div>

          <dl className="mt-4 space-y-1 border-t border-border pt-3 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">{t.notional}</dt>
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
                {!listing.cashbackEligible
                  ? t.cashbackNone
                  : terms?.cashbackBps != null
                    ? t.cashbackValue(`${terms.cashbackBps / 100}%`)
                    : "—"}
              </dd>
            </div>
            {chainRow && chainRow.minOrderNotional > BigInt(0) && usdtDecimals !== undefined && (
              <p className="text-text-muted">{t.minNotional(formatUnitsExact(chainRow.minOrderNotional, usdtDecimals, true))}</p>
            )}
          </dl>

          {need && wallet && (
            <div className="mt-3 rounded-md border border-border bg-bg-elevated p-3 text-xs">
              <p className="font-semibold text-text-primary">{t.approvalLabel}</p>
              {coverage.data ? (
                <>
                  <dl className="mt-2 space-y-1">
                    <div className="flex justify-between gap-3">
                      <dt className="text-text-muted">{t.balanceLabel}</dt>
                      <dd className="font-mono tabular-nums text-text-secondary">
                        {formatUnitsExact(coverage.data.balance, need.decimals, true)} {need.symbol}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-text-muted">{t.currentApproval}</dt>
                      <dd className="font-mono tabular-nums text-text-secondary">
                        {formatUnitsExact(coverage.data.approved, need.decimals, true)} {need.symbol}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-text-secondary">
                    {coverage.data.approved >= need.amount
                      ? t.approvalCovered
                      : t.approvalExact(formatUnitsExact(need.amount, need.decimals, true), need.symbol, spender)}
                  </p>
                  {coverage.data.approved < need.amount && <p className="mt-1 text-warning">{t.approvalReplaces}</p>}
                  {coverage.data.balance < need.amount && <p className="mt-1 text-negative">{t.insufficientBalance}</p>}
                </>
              ) : coverage.error ? (
                <p className="mt-1 text-negative">{en.trade.errors.chainRead}</p>
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

          {busy && (
            <p role="status" className="mt-3 flex items-center gap-2 text-xs text-accent-cyan">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.steps[phase.step as keyof typeof t.steps]}
            </p>
          )}
          {"approvalTx" in phase && approvalLink(phase.approvalTx)}
          {formError && <p className="mt-3 text-xs text-negative">{formError}</p>}
          {blockerMessage && <p className="mt-3 text-xs text-warning">{blockerMessage}</p>}
          {!wallet && config.ready && <p className="mt-3 text-xs text-text-muted">{t.connectFirst}</p>}

          <button
            type="button"
            onClick={() => void place()}
            disabled={!canOrder || busy || !parsed?.notional}
            className="mt-4 w-full rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-cyan disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t.place}
          </button>
        </>
      )}
    </section>
  );
}
