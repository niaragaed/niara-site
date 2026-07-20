import type { Metadata } from "next";
import { DocsNav } from "@/components/about/DocsNav";
import { FaqAccordion } from "@/components/about/FaqAccordion";
import { en } from "@/lib/i18n/en";

export const metadata: Metadata = {
  title: en.docs.metaTitle,
  description: en.docs.metaDescription,
};

const SECTIONS = [
  { id: "what-is", label: en.docs.sections.whatIs },
  { id: "tokenization", label: en.docs.sections.tokenization },
  { id: "cashback", label: en.docs.sections.cashback },
  { id: "revenue", label: en.docs.sections.revenue },
  { id: "technology", label: en.docs.sections.technology },
  { id: "faq", label: en.docs.sections.faq },
];

export default function DocsPage() {
  return (
    <div className="bg-bg-base">
      <div className="border-b border-border px-6 py-16 text-center">
        <h1 className="font-display text-3xl text-text-primary sm:text-4xl">
          {en.docs.heading}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-text-secondary sm:text-base">
          {en.docs.subheading}
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-start">
        <DocsNav sections={SECTIONS} />

        <div className="min-w-0 flex-1 space-y-16">
          <section id="what-is" className="scroll-mt-24">
            <h2 className="font-display text-xl text-text-primary sm:text-2xl">
              {en.docs.sections.whatIs}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
              {en.docs.whatIs}
            </p>
          </section>

          <section id="tokenization" className="scroll-mt-24">
            <h2 className="font-display text-xl text-text-primary sm:text-2xl">
              {en.docs.sections.tokenization}
            </h2>
            <ol className="mt-4 flex max-w-2xl flex-col gap-3">
              {en.docs.tokenizationSteps.map((step, index) => (
                <li key={step.title} className="flex gap-3 text-sm sm:text-base">
                  <span className="font-mono text-text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-text-secondary">
                    <span className="font-medium text-text-primary">
                      {step.title}.
                    </span>{" "}
                    {step.text}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section id="cashback" className="scroll-mt-24">
            <h2 className="font-display text-xl text-text-primary sm:text-2xl">
              {en.docs.sections.cashback}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
              {en.docs.cashback}
            </p>
          </section>

          <section id="revenue" className="scroll-mt-24">
            <h2 className="font-display text-xl text-text-primary sm:text-2xl">
              {en.docs.sections.revenue}
            </h2>
            <ul className="mt-4 max-w-2xl space-y-2 text-sm text-text-secondary sm:text-base">
              {en.docs.revenueItems.map((item) => (
                <li key={item.title}>
                  <span className="font-medium text-text-primary">{item.title}</span>{" "}
                  — {item.text}
                </li>
              ))}
            </ul>
          </section>

          <section id="technology" className="scroll-mt-24">
            <h2 className="font-display text-xl text-text-primary sm:text-2xl">
              {en.docs.sections.technology}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
              {en.docs.technology}
            </p>
            <p className="mt-3 max-w-2xl rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text-secondary">
              <span className="font-medium text-warning">
                {en.docs.technologyNoteLabel}
              </span>{" "}
              {en.docs.technologyNote}
            </p>
            {/* TODO: detalhar rede/testnet específica e endereços de
                contrato assim que existirem publicamente */}
          </section>

          <section id="faq" className="scroll-mt-24">
            <h2 className="font-display text-xl text-text-primary sm:text-2xl">
              {en.docs.faqTitle}
            </h2>
            <div className="mt-6 max-w-2xl">
              <FaqAccordion />
            </div>
          </section>
        </div>
      </div>

      <div className="border-t border-border px-6 py-6">
        <p className="mx-auto max-w-6xl text-xs text-text-muted">{en.common.disclaimer}</p>
      </div>
    </div>
  );
}
