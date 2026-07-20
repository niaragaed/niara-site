"use client";

import { RefreshCw, TrendingUp } from "lucide-react";
import { useInvestorProfile } from "@/context/InvestorProfileContext";
import {
  INVESTOR_CATEGORY_DETAILS,
  INVESTOR_CATEGORY_LABELS,
  SCORE_MAX,
  SCORE_MIN,
} from "@/lib/investor-profile";
import { en } from "@/lib/i18n/en";

export function InvestorProfileResultCard() {
  const { result, clearResult } = useInvestorProfile();
  if (!result) return null;

  const details = INVESTOR_CATEGORY_DETAILS[result.category];
  const percent = ((result.score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100;
  const date = new Date(result.completedAt).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent-blue/40 bg-accent-blue/10 px-3 py-1.5">
          <TrendingUp className="h-4 w-4 text-accent-blue" aria-hidden="true" />
          <span className="font-display text-sm font-semibold text-text-primary">
            {INVESTOR_CATEGORY_LABELS[result.category]}
          </span>
        </div>
        <span className="text-xs text-text-muted">
          {en.profile.investorProfile.assessedOn(date)}
        </span>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-[10px] uppercase tracking-wide text-text-muted">
          <span>{INVESTOR_CATEGORY_LABELS.conservador}</span>
          <span>{INVESTOR_CATEGORY_LABELS.moderado}</span>
          <span>{INVESTOR_CATEGORY_LABELS.arrojado}</span>
        </div>
        <div className="relative mt-2">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-bg-elevated">
            <div className="h-full w-1/3 bg-accent-cyan/70" />
            <div className="h-full w-1/3 bg-accent-blue/70" />
            <div className="h-full w-1/3 bg-accent-violet/70" />
          </div>
          <div
            aria-hidden="true"
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg-surface bg-text-primary"
            style={{ left: `${percent}%` }}
          />
        </div>
      </div>

      <dl className="mt-6 flex flex-col gap-4 border-t border-border pt-5 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {en.profile.investorProfile.whatItMeans}
          </dt>
          <dd className="mt-1 text-text-secondary">{details.summary}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {en.profile.investorProfile.riskReaction}
          </dt>
          <dd className="mt-1 text-text-secondary">{details.riskReaction}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {en.profile.investorProfile.assetClasses}
          </dt>
          <dd className="mt-1 text-text-secondary">{details.assetClasses}</dd>
        </div>
      </dl>

      <p className="mt-6 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-text-secondary">
        {en.profile.investorProfile.disclaimer}
      </p>

      <button
        type="button"
        onClick={clearResult}
        className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-text-primary hover:border-accent-blue"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        {en.profile.investorProfile.retake}
      </button>
    </div>
  );
}
