// Lógica pura do questionário de perfil de investidor (suitability) — sem
// React, sem storage. Equivalente à API (Análise do Perfil do Investidor)
// exigida pela CVM antes de recomendar ou permitir certas operações.

export type InvestorCategory = "conservador" | "moderado" | "arrojado";

// nomenclatura de mercado (CVM). Para usar a nomenclatura própria da Niara
// (Comedido/Moderado/Sofisticado), alterar apenas aqui.
export const INVESTOR_CATEGORY_LABELS: Record<InvestorCategory, string> = {
  conservador: "Conservador",
  moderado: "Moderado",
  arrojado: "Arrojado",
};

export type QuizOption = {
  label: string;
  weight: number;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "objetivo",
    prompt: "Qual é o principal objetivo do seu investimento?",
    options: [
      { label: "Preservar o capital que já tenho", weight: 1 },
      { label: "Complementar a renda com previsibilidade", weight: 2 },
      { label: "Crescimento equilibrado no médio prazo", weight: 3 },
      { label: "Maximizar retorno, aceitando oscilações", weight: 4 },
    ],
  },
  {
    id: "horizonte",
    prompt: "Por quanto tempo pretende manter esse investimento?",
    options: [
      { label: "Menos de 1 ano", weight: 1 },
      { label: "De 1 a 3 anos", weight: 2 },
      { label: "De 3 a 5 anos", weight: 3 },
      { label: "Mais de 5 anos", weight: 4 },
    ],
  },
  {
    id: "experiencia",
    prompt: "Qual sua experiência com renda variável e criptoativos?",
    options: [
      { label: "Nunca investi em ações ou cripto", weight: 1 },
      { label: "Já investi em ações, mas não em cripto", weight: 2 },
      { label: "Já investi em ações e cripto, ocasionalmente", weight: 3 },
      { label: "Invisto ativamente em ações e cripto há anos", weight: 4 },
    ],
  },
  {
    id: "percentual-patrimonio",
    prompt: "Que percentual do seu patrimônio pretende investir?",
    options: [
      { label: "Até 10%", weight: 1 },
      { label: "De 10% a 30%", weight: 2 },
      { label: "De 30% a 60%", weight: 3 },
      { label: "Mais de 60%", weight: 4 },
    ],
  },
  {
    id: "renda-mensal",
    prompt: "Qual sua renda mensal aproximada?",
    options: [
      { label: "Até 2 salários mínimos", weight: 1 },
      { label: "De 2 a 5 salários mínimos", weight: 2 },
      { label: "De 5 a 15 salários mínimos", weight: 3 },
      { label: "Mais de 15 salários mínimos", weight: 4 },
    ],
  },
  {
    id: "reserva-emergencia",
    prompt: "Como está sua reserva de emergência?",
    options: [
      { label: "Não tenho reserva formada", weight: 1 },
      { label: "Cobre menos de 3 meses de gastos", weight: 2 },
      { label: "Cobre de 3 a 6 meses de gastos", weight: 3 },
      { label: "Cobre mais de 6 meses de gastos", weight: 4 },
    ],
  },
  {
    id: "reacao-queda",
    prompt: "Se sua carteira caísse 20% em um mês, o que faria?",
    options: [
      { label: "Venderia tudo para evitar mais perdas", weight: 1 },
      { label: "Venderia parte para reduzir o risco", weight: 2 },
      { label: "Manteria a posição e esperaria recuperar", weight: 3 },
      { label: "Aproveitaria para comprar mais", weight: 4 },
    ],
  },
  {
    id: "tolerancia-risco",
    prompt: "Como você descreveria sua tolerância a risco?",
    options: [
      { label: "Nenhuma — não aceito perder dinheiro investido", weight: 1 },
      { label: "Baixa — aceito pequenas oscilações", weight: 2 },
      { label: "Moderada — aceito perdas temporárias por retorno maior", weight: 3 },
      { label: "Alta — busco retorno mesmo com risco de perdas relevantes", weight: 4 },
    ],
  },
];

export const SCORE_MIN = QUIZ_QUESTIONS.reduce(
  (sum, q) => sum + Math.min(...q.options.map((o) => o.weight)),
  0,
);
export const SCORE_MAX = QUIZ_QUESTIONS.reduce(
  (sum, q) => sum + Math.max(...q.options.map((o) => o.weight)),
  0,
);

export function categorizeScore(score: number): InvestorCategory {
  const span = SCORE_MAX - SCORE_MIN;
  const conservadorLimit = SCORE_MIN + span / 3;
  const moderadoLimit = SCORE_MIN + (span * 2) / 3;
  if (score <= conservadorLimit) return "conservador";
  if (score <= moderadoLimit) return "moderado";
  return "arrojado";
}

export type InvestorCategoryDetails = {
  summary: string;
  riskReaction: string;
  assetClasses: string;
};

export const INVESTOR_CATEGORY_DETAILS: Record<InvestorCategory, InvestorCategoryDetails> = {
  conservador: {
    summary:
      "Prioriza a preservação do capital e a previsibilidade, com baixa tolerância a perdas.",
    riskReaction:
      "Tende a reagir a quedas fortes reduzindo a exposição rapidamente, mesmo que isso signifique realizar prejuízo.",
    assetClasses:
      "Mais aderente a stablecoins, renda fixa tokenizada e ativos de baixa volatilidade.",
  },
  moderado: {
    summary:
      "Busca equilíbrio entre crescimento e segurança, aceitando oscilações moderadas em troca de retorno melhor que a renda fixa.",
    riskReaction:
      "Costuma tolerar quedas temporárias sem entrar em pânico, mas reavalia a estratégia se a volatilidade persistir.",
    assetClasses:
      "Mais aderente a um mix diversificado, combinando ETFs tokenizados, ações e uma parcela menor em cripto.",
  },
  arrojado: {
    summary:
      "Prioriza maximizar retorno no longo prazo e aceita alta volatilidade como parte do processo.",
    riskReaction:
      "Tende a manter ou até ampliar posições durante quedas, confiando na recuperação dentro do seu horizonte de investimento.",
    assetClasses:
      "Mais aderente a maior exposição a ações de crescimento e criptoativos, com posições mais concentradas.",
  },
};

// ---------------------------------------------------------------------------
// Persistência (ver InvestorProfileContext) — só o resultado agregado é
// salvo, nunca as respostas individuais.
// ---------------------------------------------------------------------------

export type InvestorProfileResult = {
  category: InvestorCategory;
  score: number;
  completedAt: string; // ISO date
};

export function isInvestorProfileResult(value: unknown): value is InvestorProfileResult {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.category === "string" &&
    candidate.category in INVESTOR_CATEGORY_LABELS &&
    typeof candidate.score === "number" &&
    typeof candidate.completedAt === "string"
  );
}
