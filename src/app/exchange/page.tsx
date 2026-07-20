import type { Metadata } from "next";
import { CurrencyConverter } from "@/components/exchange/CurrencyConverter";
import { RateGrid } from "@/components/exchange/RateGrid";
import { en } from "@/lib/i18n/en";

export const metadata: Metadata = {
  title: en.exchange.metaTitle,
  description: en.exchange.metaDescription,
};

export default function ExchangePage() {
  return (
    <div className="flex min-h-[70vh] flex-col bg-bg-base">
      <div className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-xs text-text-secondary sm:text-sm">
        <span className="font-semibold text-warning">{en.common.demoLabel}</span> —{" "}
        {en.exchange.demoBanner}
      </div>

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl text-text-primary sm:text-3xl">
            {en.exchange.heading}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {en.exchange.subheading}
          </p>
        </div>

        <CurrencyConverter />

        <div className="mt-8">
          <RateGrid />
        </div>
      </div>
    </div>
  );
}
