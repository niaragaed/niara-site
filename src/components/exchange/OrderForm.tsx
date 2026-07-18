"use client";

import { useState } from "react";
import { useExchange } from "./ExchangeContext";
import { useCurrency } from "@/context/CurrencyContext";
import type { OrderSide } from "@/lib/trading";

const FEE_RATE = 0.001; // 0,1% — taxa estimada da Niara
const DEVIATION_WARNING_THRESHOLD = 0.2; // 20%

// O componente pai monta este formulário com `key={selectedAsset.symbol}` —
// trocar de ativo remonta o form do zero, resetando quantidade/preço/
// aprovação sem precisar sincronizar estado via useEffect.
export function OrderForm() {
  const { selectedAsset, submitOrder } = useExchange();
  const { currency, convert, toEth, format, formatPlain } = useCurrency();

  const [side, setSide] = useState<OrderSide>("buy");
  const [qty, setQty] = useState("");
  // `priceEth` é a fonte da verdade (sempre em ETH); `priceInput` é só o
  // texto exibido/editado, na moeda selecionada no momento.
  const [priceEth, setPriceEth] = useState<number | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  // Troca de moeda: reexibe o mesmo valor (o `priceEth` armazenado nunca
  // muda) convertido pra nova moeda — evita arredondamento acumulado, já
  // que nunca reconverte em cima de um número já arredondado na tela.
  // Ajuste feito durante o render (padrão recomendado pelo React para
  // "reagir a uma prop/dependência mudando"), não em useEffect.
  const [prevCurrency, setPrevCurrency] = useState(currency);
  if (currency !== prevCurrency) {
    setPrevCurrency(currency);
    if (priceEth !== null) {
      setPriceInput(String(convert(priceEth)));
    }
  }

  function handlePriceChange(raw: string) {
    setPriceInput(raw);
    const num = Number(raw);
    setPriceEth(raw.trim() !== "" && Number.isFinite(num) ? toEth(num) : null);
    setApproved(false);
  }

  const qtyNum = Number(qty);
  const isValid =
    qty.trim() !== "" && qtyNum > 0 && priceEth !== null && priceEth > 0;
  const totalEth = isValid ? qtyNum * (priceEth as number) : 0;
  const feeEth = totalEth * FEE_RATE;

  const deviation =
    isValid && priceEth !== null
      ? Math.abs(priceEth - selectedAsset.priceEth) / selectedAsset.priceEth
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
      setError("Informe quantidade e preço válidos (maiores que zero).");
      return;
    }
    setError(null);
    setApproved(true);
  }

  function handleExecute() {
    if (!approved || priceEth === null || priceEth <= 0 || qtyNum <= 0) return;
    const result = submitOrder(side, qtyNum, priceEth);
    setQty("");
    setPriceEth(null);
    setPriceInput("");
    setApproved(false);
    setError(null);
    setConfirmation(
      result.status === "filled"
        ? `Ordem simulada de ${side === "buy" ? "compra" : "venda"} executada a ${format(result.fillPrice, 6)} — nenhuma transação real foi feita.`
        : `Ordem simulada de ${side === "buy" ? "compra" : "venda"} registrada como aberta no livro — nenhuma transação real foi feita.`,
    );
  }

  return (
    <div className="rounded-md border border-border bg-bg-surface p-4">
      <h2 className="text-sm font-semibold text-text-primary">Nova ordem</h2>

      <div
        role="group"
        aria-label="Lado da ordem"
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
          Compra
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
          Venda
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div>
          <label
            htmlFor="order-qty"
            className="mb-1 block text-xs text-text-muted"
          >
            Quantidade de tokens
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
            Preço ({currency})
          </label>
          <input
            id="order-price"
            type="number"
            min="0"
            step="any"
            value={priceInput}
            onChange={(event) => handlePriceChange(event.target.value)}
            placeholder={formatPlain(selectedAsset.priceEth)}
            className="w-full rounded-md border border-border bg-bg-base px-3 py-2 font-mono text-sm tabular-nums text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
          />
        </div>
      </div>

      <div className="mt-4 space-y-1 border-t border-border pt-3 font-mono text-xs tabular-nums text-text-secondary">
        <div className="flex justify-between">
          <span>Total</span>
          <span className="text-text-primary">{format(totalEth, 6)}</span>
        </div>
        <div className="flex justify-between text-text-muted">
          <span>Taxa estimada da Niara (0,1%)</span>
          <span>{format(feeEth, 6)}</span>
        </div>
      </div>

      {isFarFromMarket && (
        <p className="mt-3 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          Esse preço está a {(deviation * 100).toFixed(1)}% do preço de
          referência ({format(selectedAsset.priceEth)}). Confira antes de
          continuar.
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
          {approved ? "Aprovado ✓" : "1. Aprovar token"}
        </button>
        <button
          type="button"
          onClick={handleExecute}
          disabled={!approved || !isValid}
          className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          2. Executar ordem
        </button>
      </div>

      <p className="mt-3 text-[11px] text-text-muted">
        Simulação — nenhuma ordem é enviada à blockchain.
      </p>
    </div>
  );
}
