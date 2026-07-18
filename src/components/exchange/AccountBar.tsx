"use client";

import { useExchange } from "./ExchangeContext";

function formatEth(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(4)} ETH`;
}

export function AccountBar() {
  const { balance, buyingPower, marginUsed, pnlToday } = useExchange();
  const pnlPositive = pnlToday >= 0;

  return (
    <div className="w-full border-b border-border bg-bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-3 px-4 py-3 sm:grid-cols-4 sm:px-6">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-muted">
            Saldo em carteira
          </p>
          <p className="font-mono text-sm tabular-nums text-text-primary">
            {formatEth(balance)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-muted">
            Poder de compra{" "}
            <span className="normal-case text-text-muted/80">
              (limite simulado)
            </span>
          </p>
          <p className="font-mono text-sm tabular-nums text-text-primary">
            {formatEth(buyingPower)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-muted">
            Margem utilizada
          </p>
          <p className="font-mono text-sm tabular-nums text-text-primary">
            {formatEth(marginUsed)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-muted">
            P/L do dia
          </p>
          <p
            className={`font-mono text-sm tabular-nums ${
              pnlPositive ? "text-positive" : "text-negative"
            }`}
          >
            {pnlPositive ? "+" : ""}
            {formatEth(pnlToday)}
          </p>
        </div>
      </div>
    </div>
  );
}
