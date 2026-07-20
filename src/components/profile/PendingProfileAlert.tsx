"use client";

import { AlertTriangle } from "lucide-react";
import { useInvestorProfile } from "@/context/InvestorProfileContext";
import { en } from "@/lib/i18n/en";

export function PendingProfileAlert() {
  const { result, hydrated } = useInvestorProfile();
  if (!hydrated || result) return null;

  return (
    <div className="border-b border-negative/30 bg-negative/10 px-4 py-3">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-text-primary">
          <AlertTriangle className="h-4 w-4 shrink-0 text-negative" aria-hidden="true" />
          <span>
            <span className="font-semibold">{en.profile.pendingAlert.title}</span>{" "}
            {en.profile.pendingAlert.suffix}
          </span>
        </div>
        <a
          href="#investor-profile"
          className="shrink-0 rounded-md border border-negative/40 px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-negative/20"
        >
          {en.profile.pendingAlert.cta}
        </a>
      </div>
    </div>
  );
}
