import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { ContactForm } from "@/components/about/ContactForm";
import { en } from "@/lib/i18n/en";

export const metadata: Metadata = {
  title: en.contact.metaTitle,
  description: en.contact.metaDescription,
};

const CONTACT_EMAIL = "niaragaed@gmail.com";

export default function ContactPage() {
  return (
    <div className="bg-bg-base px-6 py-16">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="font-display text-3xl text-text-primary sm:text-4xl">
          {en.contact.heading}
        </h1>
        <p className="mt-3 max-w-xl text-sm text-text-secondary sm:text-base">
          {en.contact.subheading}
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <ContactForm />

          <div className="flex flex-col gap-6">
            <div className="rounded-lg border border-border bg-bg-surface p-6">
              <h2 className="text-sm font-semibold text-text-primary">
                {en.contact.directTitle}
              </h2>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-2 inline-flex items-center gap-2 text-sm text-accent-cyan transition-colors hover:underline"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {CONTACT_EMAIL}
              </a>
            </div>

            {/* Social media: add here once Niara's official profiles exist
                (e.g. X/Twitter, LinkedIn, Discord). Do not make up links to
                profiles that don't exist yet.
            <div className="rounded-lg border border-border bg-bg-surface p-6">
              <h2 className="text-sm font-semibold text-text-primary">Social media</h2>
              ...
            </div>
            */}
          </div>
        </div>
      </div>
    </div>
  );
}
