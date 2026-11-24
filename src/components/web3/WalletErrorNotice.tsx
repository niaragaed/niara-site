"use client";

import { AlertTriangle } from "lucide-react";
import type { WalletErrorMessage } from "@/lib/web3/wallet-errors";

/** A wallet failure: what happened and what to do. Announced to screen readers. */
export function WalletErrorNotice({ heading, error, className = "" }: { heading?: string; error: WalletErrorMessage; className?: string }) {
  return (
    <div role="alert" className={`flex gap-2 rounded-md border border-negative/40 bg-negative/10 px-3 py-2 text-xs ${className}`}>
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-negative" aria-hidden="true" />
      <div className="min-w-0">
        {heading && <p className="font-semibold text-negative">{heading}</p>}
        <p className="text-text-primary">{error.reason}</p>
        <p className="mt-1 text-text-secondary">{error.action}</p>
      </div>
    </div>
  );
}
