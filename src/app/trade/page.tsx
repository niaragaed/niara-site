import type { Metadata } from "next";
import { ExchangeTerminal } from "@/components/trade/ExchangeTerminal";

export const metadata: Metadata = {
  title: "Trade — Niara",
  description:
    "Terminal de negociação simulado da Niara: gráfico, livro de ofertas, ordens e posições.",
};

export default function TradePage() {
  return <ExchangeTerminal />;
}
