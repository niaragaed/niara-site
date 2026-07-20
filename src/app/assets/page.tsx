import type { Metadata } from "next";
import { PortfolioPage } from "@/components/portfolio/PortfolioPage";
import { en } from "@/lib/i18n/en";

export const metadata: Metadata = {
  title: en.assets.metaTitle,
  description: en.assets.metaDescription,
};

export default function AssetsPage() {
  return <PortfolioPage />;
}
