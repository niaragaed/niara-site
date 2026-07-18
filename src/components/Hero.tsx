import Link from "next/link";
import { ArrowLeftRight, ChevronDown } from "lucide-react";
import { HeroGlobe } from "@/components/HeroGlobe";
import { IndexTicker } from "@/components/IndexTicker";

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg-base px-6 text-center">
      {/* profundidade sutil: leve mescla azul/violeta sobre bg-base, centrada
          onde o globo fica, desaparecendo nas bordas — sem cor hardcoded */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, color-mix(in srgb, var(--color-accent-blue) 6%, var(--color-bg-base)) 0%, color-mix(in srgb, var(--color-accent-violet) 4%, var(--color-bg-base)) 45%, var(--color-bg-base) 80%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-accent-blue/8 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-accent-violet/8 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-border) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* globo completo, centralizado atrás do conteúdo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="aspect-square w-[min(85vw,75vh)] max-w-[900px] translate-y-[5%]">
          <HeroGlobe />
        </div>
      </div>
      {/* overlay atrás do bloco de texto (centro) para garantir contraste,
          esmaecendo para transparente na borda do globo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 50%, color-mix(in srgb, var(--color-bg-base) 55%, transparent) 0%, transparent 70%)",
        }}
      />

      <div className="absolute inset-x-0 top-16 sm:top-20">
        <IndexTicker />
      </div>

      <div className="relative flex max-w-3xl flex-col items-center">
        <span className="inline-flex items-center rounded-full border border-border px-4 py-1.5 text-xs font-medium text-text-secondary">
          Infraestrutura de ativos tokenizados
        </span>

        <h1 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
          Negocie ativos globais, 24/7, sem intermediários.
        </h1>

        <p className="mt-6 max-w-2xl text-base text-text-secondary sm:text-lg">
          A Niara tokeniza ações, ETFs, commodities e cripto com lastro real e
          os negocia numa exchange descentralizada — sem bolsas tradicionais,
          sem SWIFT, sem fronteiras.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/trade"
            className="rounded-md bg-gradient-primary px-6 py-3 text-sm font-semibold text-text-primary sm:text-base"
          >
            Acessar Terminal
          </Link>
          <Link
            href="/exchange"
            className="flex items-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-semibold text-text-primary sm:text-base"
          >
            <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
            Acessar menu de câmbio
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-text-muted">
        <span className="text-xs">Role para explorar</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </div>
    </section>
  );
}
