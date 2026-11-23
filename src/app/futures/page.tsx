import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { en } from "@/lib/i18n/en";

export const metadata: Metadata = {
  title: en.futures.metaTitle,
  description: en.futures.metaDescription,
};

// Futures do not exist on Niara. This page says so plainly: no trading UI, no
// prices, no charts, nothing that could look live.
export default function FuturesPage() {
  const t = en.futures;
  return (
    <div className="bg-bg-base">
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-6 py-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs text-warning">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          {t.status}
        </span>
        <h1 className="font-display text-3xl text-text-primary sm:text-4xl">{t.heading}</h1>
        {t.body.map((p) => (
          <p key={p} className="text-sm leading-relaxed text-text-secondary sm:text-base">
            {p}
          </p>
        ))}
        <Link
          href="/trade"
          className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
        >
          {t.cta}
        </Link>
      </div>
    </div>
  );
}
