"use client";

import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { en } from "@/lib/i18n/en";

export function TerminalHeader() {
  return (
    <div className="border-b border-border">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <span className="font-display text-sm tracking-wide text-text-primary">
          {en.trade.terminalLabel}
        </span>

        <ConnectWallet />
      </div>
    </div>
  );
}
