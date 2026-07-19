"use client";

import { useInvestorProfile } from "@/context/InvestorProfileContext";
import { InvestorProfileQuiz } from "./InvestorProfileQuiz";
import { InvestorProfileResultCard } from "./InvestorProfileResultCard";

export function InvestorProfileSection() {
  const { result, hydrated } = useInvestorProfile();

  return (
    <section
      id="perfil-investidor"
      aria-labelledby="perfil-investidor-heading"
      className="scroll-mt-24"
    >
      <h2 id="perfil-investidor-heading" className="font-display text-xl text-text-primary">
        Perfil de investidor
      </h2>
      <p className="mt-1 text-xs text-text-secondary">
        Equivale à API (Análise do Perfil do Investidor) exigida pela CVM.
        Em produção, essa avaliação seria obrigatória antes de operar e o
        cadastro só se completa depois de respondê-la — aqui, como é
        demonstração, o restante do site continua acessível.
      </p>

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
