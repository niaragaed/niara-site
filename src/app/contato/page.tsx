import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { ContactForm } from "@/components/about/ContactForm";

export const metadata: Metadata = {
  title: "Contato — Niara",
  description: "Fale com a Niara para parcerias, emissão de ativos ou suporte.",
};

const CONTACT_EMAIL = "niaragaed@gmail.com";

export default function ContatoPage() {
  return (
    <div className="bg-bg-base px-6 py-16">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="font-display text-3xl text-text-primary sm:text-4xl">
          Contato
        </h1>
        <p className="mt-3 max-w-xl text-sm text-text-secondary sm:text-base">
          Parcerias, emissão de ativos, imprensa ou suporte — escolha o
          assunto e conte pra gente.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <ContactForm />

          <div className="flex flex-col gap-6">
            <div className="rounded-lg border border-border bg-bg-surface p-6">
              <h2 className="text-sm font-semibold text-text-primary">
                Fale diretamente
              </h2>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-2 inline-flex items-center gap-2 text-sm text-accent-cyan transition-colors hover:underline"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {CONTACT_EMAIL}
              </a>
            </div>

            {/* Redes sociais — adicionar aqui quando os perfis oficiais da
                Niara existirem (ex.: X/Twitter, LinkedIn, Discord). Não
                inventar links de perfis que ainda não existem.
            <div className="rounded-lg border border-border bg-bg-surface p-6">
              <h2 className="text-sm font-semibold text-text-primary">Redes sociais</h2>
              ...
            </div>
            */}
          </div>
        </div>
      </div>
    </div>
  );
}
