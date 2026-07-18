import type { Metadata } from "next";
import { CurrencyConverter } from "@/components/exchange/CurrencyConverter";
import { RateGrid } from "@/components/exchange/RateGrid";

export const metadata: Metadata = {
  title: "Câmbio — Niara",
  description:
    "Conversor de moedas simulado da Niara — cotações de referência entre reais, dólar, euro e cripto.",
};

export default function ExchangePage() {
  return (
    <div className="flex min-h-[70vh] flex-col bg-bg-base">
      <div className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-xs text-text-secondary sm:text-sm">
        <span className="font-semibold text-warning">Demonstração</span> —
        cotações de referência, simulação. Não são valores de mercado.
      </div>

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl text-text-primary sm:text-3xl">
            Câmbio
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Converta entre moedas fiduciárias e cripto usando cotações de
            referência simuladas.
          </p>
        </div>

        <CurrencyConverter />

        <div className="mt-8">
          <RateGrid />
        </div>
      </div>
    </div>
  );
}
