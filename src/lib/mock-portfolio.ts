// dados ilustrativos — substituir por leitura on-chain da carteira conectada

export type Holding = {
  symbol: string;
  qty: number;
  avgPriceEth: number;
};

export const MOCK_HOLDINGS: Holding[] = [
  { symbol: "PETR4", qty: 400, avgPriceEth: 0.0044 },
  { symbol: "VALE3", qty: 250, avgPriceEth: 0.0057 },
  { symbol: "AAPL", qty: 18, avgPriceEth: 0.068 },
  { symbol: "NVDA", qty: 12, avgPriceEth: 0.041 },
  { symbol: "SPY", qty: 6, avgPriceEth: 0.205 },
  { symbol: "GOLD", qty: 900, avgPriceEth: 0.00098 },
  { symbol: "BTC", qty: 0.35, avgPriceEth: 20.1 },
  { symbol: "USDC", qty: 1800, avgPriceEth: 1 / 3000 },
];

export type MonthlyEvolution = {
  month: string;
  investedEth: number;
  gainEth: number;
};

// série mensal (últimos 12 meses) — valor aplicado e ganho de capital
// acumulados, mês a mês
export const MOCK_EVOLUTION: MonthlyEvolution[] = [
  { month: "ago/25", investedEth: 8.2, gainEth: 0.15 },
  { month: "set/25", investedEth: 8.9, gainEth: 0.3 },
  { month: "out/25", investedEth: 9.6, gainEth: -0.1 },
  { month: "nov/25", investedEth: 10.1, gainEth: 0.05 },
  { month: "dez/25", investedEth: 10.8, gainEth: 0.4 },
  { month: "jan/26", investedEth: 11.5, gainEth: 0.6 },
  { month: "fev/26", investedEth: 12.3, gainEth: 0.35 },
  { month: "mar/26", investedEth: 12.9, gainEth: 0.7 },
  { month: "abr/26", investedEth: 13.4, gainEth: 0.9 },
  { month: "mai/26", investedEth: 13.9, gainEth: 0.75 },
  { month: "jun/26", investedEth: 14.3, gainEth: 1.0 },
  { month: "jul/26", investedEth: 14.648, gainEth: 1.127 },
];
