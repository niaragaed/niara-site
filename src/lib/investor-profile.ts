// Lógica pura do questionário de perfil de investidor (suitability) — sem
// React, sem storage. Equivalente à API (Análise do Perfil do Investidor)
// exigida pela CVM antes de recomendar ou permitir certas operações.

export type InvestorCategory = "conservador" | "moderado" | "arrojado";

// nomenclatura de mercado (CVM). Para usar a nomenclatura própria da Niara
// (Comedido/Moderado/Sofisticado), alterar apenas aqui.
export const INVESTOR_CATEGORY_LABELS: Record<InvestorCategory, string> = {
  conservador: "Conservative",
  moderado: "Moderate",
  arrojado: "Aggressive",
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
    prompt: "What is the main goal of your investment?",
    options: [
      { label: "Preserve the capital I already have", weight: 1 },
      { label: "Supplement income with predictability", weight: 2 },
      { label: "Balanced growth over the medium term", weight: 3 },
      { label: "Maximize return, accepting fluctuations", weight: 4 },
    ],
  },
  {
    id: "horizonte",
    prompt: "How long do you plan to hold this investment?",
    options: [
      { label: "Less than 1 year", weight: 1 },
      { label: "1 to 3 years", weight: 2 },
      { label: "3 to 5 years", weight: 3 },
      { label: "More than 5 years", weight: 4 },
    ],
  },
  {
    id: "experiencia",
    prompt: "What is your experience with stocks and crypto assets?",
    options: [
      { label: "Never invested in stocks or crypto", weight: 1 },
      { label: "Invested in stocks, but not crypto", weight: 2 },
      { label: "Invested in stocks and crypto occasionally", weight: 3 },
      { label: "Actively invest in stocks and crypto for years", weight: 4 },
    ],
  },
  {
    id: "percentual-patrimonio",
    prompt: "What percentage of your wealth do you plan to invest?",
    options: [
      { label: "Up to 10%", weight: 1 },
      { label: "10% to 30%", weight: 2 },
      { label: "30% to 60%", weight: 3 },
      { label: "More than 60%", weight: 4 },
    ],
  },
  {
    id: "renda-mensal",
    prompt: "What is your approximate monthly income?",
    options: [
      { label: "Up to 2 minimum wages", weight: 1 },
      { label: "2 to 5 minimum wages", weight: 2 },
      { label: "5 to 15 minimum wages", weight: 3 },
      { label: "More than 15 minimum wages", weight: 4 },
    ],
  },
  {
    id: "reserva-emergencia",
    prompt: "What does your emergency fund look like?",
    options: [
      { label: "I don't have an emergency fund", weight: 1 },
      { label: "Covers less than 3 months of expenses", weight: 2 },
      { label: "Covers 3 to 6 months of expenses", weight: 3 },
      { label: "Covers more than 6 months of expenses", weight: 4 },
    ],
  },
  {
    id: "reacao-queda",
    prompt: "If your portfolio dropped 20% in a month, what would you do?",
    options: [
      { label: "Sell everything to avoid further losses", weight: 1 },
      { label: "Sell part of it to reduce risk", weight: 2 },
      { label: "Hold the position and wait for a recovery", weight: 3 },
      { label: "Take the opportunity to buy more", weight: 4 },
    ],
  },
  {
    id: "tolerancia-risco",
    prompt: "How would you describe your risk tolerance?",
    options: [
      { label: "None — I don't accept losing invested money", weight: 1 },
      { label: "Low — I accept small fluctuations", weight: 2 },
      { label: "Moderate — I accept temporary losses for higher returns", weight: 3 },
      { label: "High — I seek returns even with risk of significant losses", weight: 4 },
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
      "Prioritizes capital preservation and predictability, with low tolerance for losses.",
    riskReaction:
      "Tends to react to sharp drops by quickly reducing exposure, even if it means taking a loss.",
    assetClasses:
      "Best suited to stablecoins, tokenized fixed income, and low-volatility assets.",
  },
  moderado: {
    summary:
      "Seeks a balance between growth and safety, accepting moderate fluctuations for better returns than fixed income.",
    riskReaction:
      "Usually tolerates temporary drops without panicking, but reassesses the strategy if volatility persists.",
    assetClasses:
      "Best suited to a diversified mix combining tokenized ETFs, stocks, and a smaller allocation to crypto.",
  },
  arrojado: {
    summary:
      "Prioritizes maximizing long-term returns and accepts high volatility as part of the process.",
    riskReaction:
      "Tends to hold or even increase positions during drops, trusting a recovery within the investment horizon.",
    assetClasses:
      "Best suited to greater exposure to growth stocks and crypto assets, with more concentrated positions.",
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
