"use client";

import { useState } from "react";
import { useExchange } from "./ExchangeContext";
import { useCurrency } from "@/context/CurrencyContext";
import type { OrderSide } from "@/lib/trading";
import { en } from "@/lib/i18n/en";

const FEE_RATE = 0.001; // 0,1% — taxa estimada da Niara
const DEVIATION_WARNING_THRESHOLD = 0.2; // 20%

// O componente pai monta este formulário com `key={selectedAsset.symbol}` —
// trocar de ativo remonta o form do zero, resetando quantidade/preço/
// aprovação sem precisar sincronizar estado via useEffect.
export function OrderForm() {
  const { selectedAsset, submitOrder } = useExchange();
  const { currency, convert, toUsdt, format, formatPlain } = useCurrency();

  const [side, setSide] = useState<OrderSide>("buy");
  const [qty, setQty] = useState("");
  // `priceUsdt` é a fonte da verdade (sempre em USDT); `priceInput` é só o
  // texto exibido/editado, na moeda selecionada no momento.
  const [priceUsdt, setPriceUsdt] = useState<number | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  // Troca de moeda: reexibe o mesmo valor (o `priceUsdt` armazenado nunca
  // muda) convertido pra nova moeda — evita arredondamento acumulado, já
  // que nunca reconverte em cima de um número já arredondado na tela.
  // Ajuste feito durante o render (padrão recomendado pelo React para
  // "reagir a uma prop/dependência mudando"), não em useEffect.
  const [prevCurrency, setPrevCurrency] = useState(currency);
  if (currency !== prevCurrency) {
    setPrevCurrency(currency);
    if (priceUsdt !== null) {
      setPriceInput(String(convert(priceUsdt)));
    }
  }

  function handlePriceChange(raw: string) {
    setPriceInput(raw);
    const num = Number(raw);
    setPriceUsdt(raw.trim() !== "" && Number.isFinite(num) ? toUsdt(num) : null);
    setApproved(false);
  }

  const qtyNum = Number(qty);
  const isValid =
    qty.trim() !== "" && qtyNum > 0 && priceUsdt !== null && priceUsdt > 0;
  const totalUsdt = isValid ? qtyNum * (priceUsdt as number) : 0;
  const feeUsdt = totalUsdt * FEE_RATE;

  const deviation =
    isValid && priceUsdt !== null
      ? Math.abs(priceUsdt - selectedAsset.priceUsdt) / selectedAsset.priceUsdt
      : 0;
  const isFarFromMarket = isValid && deviation > DEVIATION_WARNING_THRESHOLD;

  function handleSideChange(next: OrderSide) {
    setSide(next);
    setApproved(false);
    setConfirmation(null);
  }

  function handleApprove() {
    setConfirmation(null);
    if (!isValid) {
      setError(en.trade.orderForm.invalidError);
      return;
    }
    setError(null);
    setApproved(true);
  }

  function handleExecute() {
    if (!approved || priceUsdt === null || priceUsdt <= 0 || qtyNum <= 0) return;
    const result = submitOrder(side, qtyNum, priceUsdt);
    setQty("");
    setPriceUsdt(null);
    setPriceInput("");
    setApproved(false);
    setError(null);
    setConfirmation(
      result.status === "filled"
        ? en.trade.orderForm.filledConfirmation(side, format(result.fillPrice))
        : en.trade.orderForm.restingConfirmation(side),
    );
  }

  return (
    <div className="rounded-md border border-border bg-bg-surface p-4">
      <h2 className="text-sm font-semibold text-text-primary">{en.trade.orderForm.title}</h2>

      <div
        role="group"
        aria-label={en.trade.orderForm.sideGroupLabel}
        className="mt-4 grid grid-cols-2 gap-2"
      >
        <button
          type="button"
          aria-pressed={side === "buy"}
          onClick={() => handleSideChange("buy")}
          className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
            side === "buy"
              ? "border-positive/40 bg-positive/15 text-positive"
              : "border-border text-text-muted hover:text-text-secondary"
          }`}
        >
          {en.trade.orderForm.buy}
        </button>
        <button
          type="button"
          aria-pressed={side === "sell"}
          onClick={() => handleSideChange("sell")}
          className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
            side === "sell"
              ? "border-negative/40 bg-negative/15 text-negative"
              : "border-border text-text-muted hover:text-text-secondary"
          }`}
        >
          {en.trade.orderForm.sell}
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div>
          <label
            htmlFor="order-qty"
            className="mb-1 block text-xs text-text-muted"
          >
            {en.trade.orderForm.qtyLabel}
          </label>
          <input
            id="order-qty"
            type="number"
            min="0"
            step="any"
            value={qty}
            onChange={(event) => {
              setQty(event.target.value);
              setApproved(false);
            }}
            placeholder="0"
            className="w-full rounded-md border border-border bg-bg-base px-3 py-2 font-mono text-sm tabular-nums text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
          />
        </div>
        <div>
          <label
            htmlFor="order-price"
            className="mb-1 block text-xs text-text-muted"
          >
            {en.trade.orderForm.priceLabel} ({currency})
          </label>
          <input
            id="order-price"
            type="number"
            min="0"
            step="any"
            value={priceInput}
            onChange={(event) => handlePriceChange(event.target.value)}
            placeholder={formatPlain(selectedAsset.priceUsdt)}
            className="w-full rounded-md border border-border bg-bg-base px-3 py-2 font-mono text-sm tabular-nums text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
          />
        </div>
      </div>

      <div className="mt-4 space-y-1 border-t border-border pt-3 font-mono text-xs tabular-nums text-text-secondary">
        <div className="flex justify-between">
          <span>{en.trade.orderForm.total}</span>
          <span className="text-text-primary">{format(totalUsdt)}</span>
        </div>
        <div className="flex justify-between text-text-muted">
          <span>{en.trade.orderForm.estimatedFee}</span>
          <span>{format(feeUsdt)}</span>
        </div>
      </div>

      {isFarFromMarket && (
        <p className="mt-3 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          {en.trade.orderForm.deviationWarning(
            (deviation * 100).toFixed(1),
            format(selectedAsset.priceUsdt),
          )}
        </p>
      )}
      {error && <p className="mt-3 text-xs text-negative">{error}</p>}
      {confirmation && (
        <p className="mt-3 rounded-md border border-positive/30 bg-positive/10 px-3 py-2 text-xs text-positive">
          {confirmation}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={approved}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent-blue/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {approved ? en.trade.orderForm.approved : en.trade.orderForm.approve}
        </button>
        <button
          type="button"
          onClick={handleExecute}
          disabled={!approved || !isValid}
          className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {en.trade.orderForm.execute}
        </button>
      </div>

      <p className="mt-3 text-[11px] text-text-muted">
        {en.trade.orderForm.simDisclaimer}
      </p>
    </div>
  );
}
