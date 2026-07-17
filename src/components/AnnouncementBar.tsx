"use client";

import { useState } from "react";
import { ChevronRight, X } from "lucide-react";

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="relative border-b border-accent-blue bg-bg-elevated">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-10 py-2 text-center text-xs text-text-secondary sm:text-sm">
        <span>
          Niara — a exchange global de ativos tokenizados, 24/7. Em
          construção.
        </span>
        <a
          href="#"
          className="inline-flex items-center gap-0.5 font-medium text-accent-cyan hover:underline"
        >
          Saiba mais
          <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </div>
      <button
        type="button"
        aria-label="Dispensar aviso"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
