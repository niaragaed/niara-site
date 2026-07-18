"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";

const FAKE_ADDRESS = "0x1a2b...c3d4";

export function TerminalHeader() {
  const [connected, setConnected] = useState(false);

  return (
    <div className="border-b border-border">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <span className="font-display text-sm tracking-wide text-text-primary">
          Terminal
        </span>

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
