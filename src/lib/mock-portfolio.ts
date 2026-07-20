// dados ilustrativos — substituir por leitura on-chain da carteira conectada

export type Holding = {
  symbol: string;
  qty: number;
  avgPriceUsdt: number;
};

export const MOCK_HOLDINGS: Holding[] = [
  { symbol: "PETR4", qty: 400, avgPriceUsdt: 13.2 },
  { symbol: "VALE3", qty: 250, avgPriceUsdt: 17.1 },
  { symbol: "AAPL", qty: 18, avgPriceUsdt: 204 },
  { symbol: "NVDA", qty: 12, avgPriceUsdt: 123 },
  { symbol: "SPY", qty: 6, avgPriceUsdt: 615 },
  { symbol: "GOLD", qty: 900, avgPriceUsdt: 2.94 },
  { symbol: "BTC", qty: 0.35, avgPriceUsdt: 60300 },
  { symbol: "USDC", qty: 1800, avgPriceUsdt: 1 },
];

export type MonthlyEvolution = {
  month: string;
  investedUsdt: number;
  gainUsdt: number;
};

// série mensal (últimos 12 meses) — valor aplicado e ganho de capital
// acumulados, mês a mês. Valores em USDT (unidade interna do site).
export const MOCK_EVOLUTION: MonthlyEvolution[] = [
  { month: "Aug 25", investedUsdt: 24600, gainUsdt: 450 },
  { month: "Sep 25", investedUsdt: 26700, gainUsdt: 900 },
  { month: "Oct 25", investedUsdt: 28800, gainUsdt: -300 },
  { month: "Nov 25", investedUsdt: 30300, gainUsdt: 150 },
  { month: "Dec 25", investedUsdt: 32400, gainUsdt: 1200 },
  { month: "Jan 26", investedUsdt: 34500, gainUsdt: 1800 },
  { month: "Feb 26", investedUsdt: 36900, gainUsdt: 1050 },
  { month: "Mar 26", investedUsdt: 38700, gainUsdt: 2100 },
  { month: "Apr 26", investedUsdt: 40200, gainUsdt: 2700 },
  { month: "May 26", investedUsdt: 41700, gainUsdt: 2250 },
  { month: "Jun 26", investedUsdt: 42900, gainUsdt: 3000 },
  { month: "Jul 26", investedUsdt: 43944, gainUsdt: 3381 },
];
