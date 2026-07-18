"use client";

import { useState } from "react";
import type { Asset } from "@/lib/mock-assets";
import type { OrderSide } from "@/lib/mock-orderbook";

const FEE_RATE = 0.001; // 0,1% — taxa estimada da Niara

type OrderFormProps = {
  asset: Asset;
  onExecute: (order: { side: OrderSide; qty: number; price: number }) => void;
};

// O componente pai monta este formulário com `key={asset.symbol}` — trocar
// de ativo remonta o form do zero, resetando quantidade/preço/aprovação sem
// precisar sincronizar estado via useEffect.
export function OrderForm({ asset, onExecute }: OrderFormProps) {
  const [side, setSide] = useState<OrderSide>("buy");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const qtyNum = Number(qty);
  const priceNum = Number(price);
  const isValid =
    qty.trim() !== "" && price.trim() !== "" && qtyNum > 0 && priceNum > 0;
  const total = isValid ? qtyNum * priceNum : 0;
  const fee = total * FEE_RATE;

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
    if (!approved || !isValid) return;
    onExecute({ side, qty: qtyNum, price: priceNum });
    setQty("");
    setPrice("");
    setApproved(false);
    setError(null);
    setConfirmation(
      `Ordem simulada de ${side === "buy" ? "compra" : "venda"} registrada — nenhuma transação real foi executada.`,
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
            Preço (ETH)
          </label>
          <input
            id="order-price"
            type="number"
            min="0"
            step="any"
            value={price}
            onChange={(event) => {
              setPrice(event.target.value);
              setApproved(false);
            }}
            placeholder={asset.priceEth.toString()}
            className="w-full rounded-md border border-border bg-bg-base px-3 py-2 font-mono text-sm tabular-nums text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
          />
        </div>
      </div>

      <div className="mt-4 space-y-1 border-t border-border pt-3 font-mono text-xs tabular-nums text-text-secondary">
        <div className="flex justify-between">
          <span>Total</span>
          <span className="text-text-primary">{total.toFixed(6)} ETH</span>
        </div>
        <div className="flex justify-between text-text-muted">
          <span>Taxa estimada da Niara (0,1%)</span>
          <span>{fee.toFixed(6)} ETH</span>
        </div>
      </div>

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
