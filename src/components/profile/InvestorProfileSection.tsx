"use client";

import { useInvestorProfile } from "@/context/InvestorProfileContext";
import { InvestorProfileQuiz } from "./InvestorProfileQuiz";
import { InvestorProfileResultCard } from "./InvestorProfileResultCard";
import { en } from "@/lib/i18n/en";

export function InvestorProfileSection() {
  const { result, hydrated } = useInvestorProfile();

  return (
    <section
      id="investor-profile"
      aria-labelledby="investor-profile-heading"
      className="scroll-mt-24"
    >
      <h2 id="investor-profile-heading" className="font-display text-xl text-text-primary">
        {en.profile.investorProfile.title}
      </h2>
      <p className="mt-1 text-xs text-text-secondary">{en.profile.investorProfile.intro}</p>

      <div className="mt-6">
        {!hydrated ? null : result ? (
          <InvestorProfileResultCard />
        ) : (
          <InvestorProfileQuiz />
        )}
      </div>
    </section>
  );
}
