import { BTC_USDT, ETH_USD } from "./rates";

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
  priceUsdt: number;
  change24h: number;
  volume24hUsdt: number;
};

// dados ilustrativos — substituir por feed/on-chain real. Preços em USDT
// (unidade interna do site — ver CLAUDE.md).
export const MOCK_ASSETS: Asset[] = [
  {
    symbol: "PETR4",
    name: "Petrobras",
    country: "br",
    region: "BR",
    assetClass: "Stocks",
    priceUsdt: 14.4,
    change24h: -0.62,
    volume24hUsdt: 5_550_000,
  },
  {
    symbol: "VALE3",
    name: "Vale",
    country: "br",
    region: "BR",
    assetClass: "Stocks",
    priceUsdt: 18.3,
    change24h: 1.14,
    volume24hUsdt: 6_630_000,
  },
  {
    symbol: "ITUB4",
    name: "Itaú Unibanco",
    country: "br",
    region: "BR",
    assetClass: "Stocks",
    priceUsdt: 9.3,
    change24h: 0.45,
    volume24hUsdt: 2_940_000,
  },
  {
    symbol: "AAPL",
    name: "Apple",
    country: "us",
    region: "US",
    assetClass: "Stocks",
    priceUsdt: 217.5,
    change24h: 0.38,
    volume24hUsdt: 9_360_000,
  },
  {
    symbol: "TSLA",
    name: "Tesla",
    country: "us",
    region: "US",
    assetClass: "Stocks",
    priceUsdt: 287.4,
    change24h: -2.41,
    volume24hUsdt: 12_600_000,
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    country: "us",
    region: "US",
    assetClass: "Stocks",
    priceUsdt: 474.9,
    change24h: 0.72,
    volume24hUsdt: 8_280_000,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    country: "us",
    region: "US",
    assetClass: "Stocks",
    priceUsdt: 141.9,
    change24h: 3.05,
    volume24hUsdt: 15_300_000,
  },
  {
    symbol: "SPY",
    name: "S&P 500 ETF",
    country: "us",
    region: "US",
    assetClass: "ETFs",
    priceUsdt: 669.3,
    change24h: 0.19,
    volume24hUsdt: 18_600_000,
  },
  {
    symbol: "QQQ",
    name: "Nasdaq 100 ETF",
    country: "us",
    region: "US",
    assetClass: "ETFs",
    priceUsdt: 495,
    change24h: 0.55,
    volume24hUsdt: 11_700_000,
  },
  {
    symbol: "GOLD",
    name: "Tokenized gold",
    region: "Global",
    assetClass: "Commodities",
    priceUsdt: 3.12,
    change24h: 0.05,
    volume24hUsdt: 4_500_000,
  },
  {
    symbol: "SILVER",
    name: "Tokenized silver",
    region: "Global",
    assetClass: "Commodities",
    priceUsdt: 0.2463,
    change24h: -0.31,
    volume24hUsdt: 1_920_000,
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    region: "Global",
    assetClass: "Crypto",
    priceUsdt: BTC_USDT,
    change24h: 1.85,
    volume24hUsdt: 24_600_000,
  },
  {
    symbol: "ETH",
    name: "Ether",
    region: "Global",
    assetClass: "Crypto",
    priceUsdt: ETH_USD,
    change24h: 0.92,
    volume24hUsdt: 37_500_000,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    region: "Global",
    assetClass: "Stablecoins",
    priceUsdt: 1,
    change24h: 0,
    volume24hUsdt: 29_400_000,
  },
  {
    symbol: "USDT",
    name: "Tether",
    region: "Global",
    assetClass: "Stablecoins",
    priceUsdt: 1,
    change24h: -0.01,
    volume24hUsdt: 45_600_000,
  },
];
