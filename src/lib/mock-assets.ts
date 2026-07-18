export type Asset = {
  symbol: string;
  name: string;
  // código ISO 3166-1 alpha-2 em minúsculas, para flag-icons — ausente para
  // ativos sem país (ex.: commodities), que caem no ícone de fallback
  country?: string;
  priceEth: number;
  change24h: number;
};

// dados ilustrativos — substituir por feed/on-chain real
export const MOCK_ASSETS: Asset[] = [
  { symbol: "PETR4", name: "Petrobras", country: "br", priceEth: 0.0048, change24h: -0.62 },
  { symbol: "VALE3", name: "Vale", country: "br", priceEth: 0.0061, change24h: 1.14 },
  { symbol: "AAPL", name: "Apple", country: "us", priceEth: 0.0725, change24h: 0.38 },
  { symbol: "TSLA", name: "Tesla", country: "us", priceEth: 0.0958, change24h: -2.41 },
  { symbol: "MSFT", name: "Microsoft", country: "us", priceEth: 0.1583, change24h: 0.72 },
  { symbol: "NVDA", name: "NVIDIA", country: "us", priceEth: 0.0473, change24h: 3.05 },
  { symbol: "SPY", name: "ETF S&P 500", country: "us", priceEth: 0.2231, change24h: 0.19 },
  { symbol: "GOLD", name: "Ouro tokenizado", priceEth: 0.00104, change24h: 0.05 },
];
