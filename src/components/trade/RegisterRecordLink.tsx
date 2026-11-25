// "Register record ↗": the Niara Register's record of a settlement transaction
// (`registerRecordUrl` in lib/site-links.ts). Callers render it only for a confirmed
// settlement and only when the Register URL is configured.

import { en } from "@/lib/i18n/en";

export function RegisterRecordLink({ href }: { href: string }) {
  const t = en.trade.registerRecord;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={t.title}
      className="inline-flex items-center gap-0.5 whitespace-nowrap text-accent-blue hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
    >
      {t.label} <span aria-hidden="true">↗</span>
      <span className="sr-only"> {t.srHint}</span>
    </a>
  );
}
