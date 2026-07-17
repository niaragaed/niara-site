import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { HeroGlobe } from "@/components/HeroGlobe";

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg-base px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-accent-blue/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-accent-violet/10 blur-[120px]"
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

      {/* "horizonte de planeta": globo grande, deslocado para baixo, só a
          curvatura superior aparece atrás dos CTAs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
      >
        <div className="aspect-square w-[140vw] max-w-[1100px] translate-y-[38%] sm:w-[110vw]">
          <HeroGlobe />
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 100%, transparent 30%, var(--color-bg-base) 90%)",
        }}
      />

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
            href="/exchange"
            className="rounded-md bg-gradient-primary px-6 py-3 text-sm font-semibold text-text-primary sm:text-base"
          >
            Acessar Terminal
          </Link>
          <Link
            href="#cashback"
            className="rounded-md border border-border px-6 py-3 text-sm font-semibold text-text-primary sm:text-base"
          >
            Conheça o Cashback
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
