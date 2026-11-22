import type { Metadata } from "next";
import { ExchangeTerminal } from "@/components/trade/ExchangeTerminal";
import { en } from "@/lib/i18n/en";

export const metadata: Metadata = {
  title: en.trade.metaTitle,
  description: en.trade.metaDescription,
};

type TradePageProps = {
  // Next 16: searchParams é assíncrono.
  searchParams: Promise<{ asset?: string | string[] }>;
};

export default async function TradePage({ searchParams }: TradePageProps) {
  const params = await searchParams;
  const assetParam = Array.isArray(params.asset) ? params.asset[0] : params.asset;

  // ?asset=<mint ou endereço do token> pré-seleciona a listagem, se existir.
  return <ExchangeTerminal initialAsset={assetParam} />;
}
