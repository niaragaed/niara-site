import type { Metadata } from "next";
import { ExchangeTerminal } from "@/components/trade/ExchangeTerminal";

export const metadata: Metadata = {
  title: "Trade — Niara",
  description:
    "Terminal de negociação simulado da Niara: gráfico, livro de ofertas, ordens e posições.",
};

type TradePageProps = {
  searchParams: Promise<{ asset?: string | string[] }>;
};

export default async function TradePage({ searchParams }: TradePageProps) {
  const params = await searchParams;
  const assetParam = Array.isArray(params.asset) ? params.asset[0] : params.asset;

  return <ExchangeTerminal initialSymbol={assetParam} />;
}
