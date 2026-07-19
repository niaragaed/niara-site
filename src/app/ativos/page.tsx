import type { Metadata } from "next";
import { PortfolioPage } from "@/components/portfolio/PortfolioPage";

export const metadata: Metadata = {
  title: "Ativos — Niara",
  description:
    "Carteira simulada de ativos tokenizados e catálogo completo de ativos disponíveis para negociação na Niara.",
};

export default function AtivosPage() {
  return <PortfolioPage />;
}
