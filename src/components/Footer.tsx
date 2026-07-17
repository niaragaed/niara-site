import Image from "next/image";
import Link from "next/link";
import { NAV_ITEMS } from "./nav-items";

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-base">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/niara-mark.png"
            alt="Niara"
            width={29}
            height={24}
            className="h-6 w-auto"
          />
          <span className="font-display text-lg tracking-widest text-text-primary">
            NIARA
          </span>
        </div>

        <nav aria-label="Links do rodapé">
          <ul className="flex flex-col gap-3 sm:flex-row sm:gap-8">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-border px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl">
            Conteúdo meramente informativo. Não constitui oferta,
            recomendação de investimento ou solicitação de compra e venda de
            valores mobiliários. Projeto em desenvolvimento.
          </p>
          <p className="whitespace-nowrap">© 2026 Niara</p>
        </div>
      </div>
    </footer>
  );
}
