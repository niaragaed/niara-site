import type { Metadata } from "next";
import { Wallet } from "lucide-react";

export const metadata: Metadata = {
  title: "Perfil — Niara",
  description:
    "Seu perfil na Niara estará disponível assim que a conexão de carteira for implementada.",
};

// TODO: perfil real após integração de carteira (wagmi/ethers)
export default function ProfilePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-bg-base px-6 text-center">
      <h1 className="font-display text-2xl text-text-primary sm:text-3xl">
        Perfil
      </h1>
      <p className="max-w-md text-sm text-text-secondary">
        Seu perfil vai mostrar posições, histórico e preferências assim que
        a conexão de carteira for implementada. Por enquanto, essa tela é
        só um placeholder.
      </p>
      <button
        type="button"
        disabled
        className="cursor-not-allowed rounded-md border border-border px-4 py-2 text-sm font-medium text-text-muted opacity-60"
      >
        <span className="inline-flex items-center gap-2">
          <Wallet className="h-4 w-4" aria-hidden="true" />
          Conectar carteira
        </span>
      </button>
    </div>
  );
}
