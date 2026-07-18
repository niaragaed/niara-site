"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";

const FAKE_ADDRESS = "0x1a2b...c3d4";

export function TerminalHeader() {
  const [connected, setConnected] = useState(false);

  return (
    <div className="border-b border-border">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div role="tablist" aria-label="Seções do terminal" className="flex items-center gap-1">
          <button
            type="button"
            role="tab"
            aria-selected="true"
            className="rounded-md bg-bg-elevated px-3 py-1.5 text-sm font-medium text-text-primary"
          >
            Terminal
          </button>
          {/* TODO: Dashboard do emissor com gráficos (Recharts) — volume, taxas e cashback acumulado */}
          <button
            type="button"
            role="tab"
            aria-selected="false"
            aria-disabled="true"
            disabled
            title="Em breve"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-text-muted"
          >
            Dashboard
            <span className="text-[10px] uppercase tracking-wide">
              em breve
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setConnected((current) => !current)}
          title="Simulação — nenhuma carteira real é conectada"
          className="flex items-center gap-2 rounded-md border border-border bg-bg-surface px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <Wallet className="h-4 w-4" aria-hidden="true" />
          {connected ? (
            <>
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-positive"
              />
              <span className="font-mono tabular-nums">{FAKE_ADDRESS}</span>
            </>
          ) : (
            <span>Conectar carteira</span>
          )}
        </button>
      </div>
    </div>
  );
}
