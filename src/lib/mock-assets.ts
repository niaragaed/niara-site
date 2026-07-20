export type AssetClass = "Stocks" | "ETFs" | "Commodities" | "Crypto" | "Stablecoins";
export type Region = "BR" | "US" | "EU" | "Global";

export type Asset = {
  symbol: string;
  name: string;
  // código ISO 3166-1 alpha-2 em minúsculas, para flag-icons — ausente para
  // ativos sem país (ex.: commodities, cripto), que caem no ícone de fallback
  country?: string;
  region: Region;
  assetClass: AssetClass;
  priceEth: number;
  change24h: number;
  volume24hEth: number;
};

// dados ilustrativos — substituir por feed/on-chain real
export const MOCK_ASSETS: Asset[] = [
  {
    symbol: "PETR4",
    name: "Petrobras",
    country: "br",
    region: "BR",
    assetClass: "Stocks",
    priceEth: 0.0048,
    change24h: -0.62,
    volume24hEth: 1850,
  },
  {
    symbol: "VALE3",
    name: "Vale",
    country: "br",
    region: "BR",
    assetClass: "Stocks",
    priceEth: 0.0061,
    change24h: 1.14,
    volume24hEth: 2210,
  },
  {
    symbol: "ITUB4",
    name: "Itaú Unibanco",
    country: "br",
    region: "BR",
    assetClass: "Stocks",
    priceEth: 0.0031,
    change24h: 0.45,
    volume24hEth: 980,
  },
  {
    symbol: "AAPL",
    name: "Apple",
    country: "us",
    region: "US",
    assetClass: "Stocks",
    priceEth: 0.0725,
    change24h: 0.38,
    volume24hEth: 3120,
  },
  {
    symbol: "TSLA",
    name: "Tesla",
    country: "us",
    region: "US",
    assetClass: "Stocks",
    priceEth: 0.0958,
    change24h: -2.41,
    volume24hEth: 4200,
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    country: "us",
    region: "US",
    assetClass: "Stocks",
    priceEth: 0.1583,
    change24h: 0.72,
    volume24hEth: 2760,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    country: "us",
    region: "US",
    assetClass: "Stocks",
    priceEth: 0.0473,
    change24h: 3.05,
    volume24hEth: 5100,
  },
  {
    symbol: "SPY",
    name: "S&P 500 ETF",
    country: "us",
    region: "US",
    assetClass: "ETFs",
    priceEth: 0.2231,
    change24h: 0.19,
    volume24hEth: 6200,
  },
  {
    symbol: "QQQ",
    name: "Nasdaq 100 ETF",
    country: "us",
    region: "US",
    assetClass: "ETFs",
    priceEth: 0.165,
    change24h: 0.55,
    volume24hEth: 3900,
  },
  {
    symbol: "GOLD",
    name: "Tokenized gold",
    region: "Global",
    assetClass: "Commodities",
    priceEth: 0.00104,
    change24h: 0.05,
    volume24hEth: 1500,
  },
  {
    symbol: "SILVER",
    name: "Tokenized silver",
    region: "Global",
    assetClass: "Commodities",
    priceEth: 0.0000821,
    change24h: -0.31,
    volume24hEth: 640,
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    region: "Global",
    assetClass: "Crypto",
    priceEth: 21.667,
    change24h: 1.85,
    volume24hEth: 8200,
  },
  {
    symbol: "ETH",
    name: "Ether",
    region: "Global",
    assetClass: "Crypto",
    priceEth: 1,
    change24h: 0.92,
    volume24hEth: 12500,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    region: "Global",
    assetClass: "Stablecoins",
    priceEth: 1 / 3000,
    change24h: 0,
    volume24hEth: 9800,
  },
  {
    symbol: "USDT",
    name: "Tether",
    region: "Global",
    assetClass: "Stablecoins",
    priceEth: 1 / 3000,
    change24h: -0.01,
    volume24hEth: 15200,
  },
];
