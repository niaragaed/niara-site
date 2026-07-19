import type { Metadata } from "next";
import { DocsNav } from "@/components/about/DocsNav";
import { FaqAccordion } from "@/components/about/FaqAccordion";

export const metadata: Metadata = {
  title: "Docs & FAQs — Niara",
  description:
    "Documentação institucional da Niara: o que é, como funciona a tokenização, cashback ao emissor, modelo de receita e tecnologia.",
};

const SECTIONS = [
  { id: "o-que-e", label: "O que é a Niara" },
  { id: "tokenizacao", label: "Como funciona a tokenização" },
  { id: "cashback", label: "Cashback ao emissor" },
  { id: "receita", label: "Modelo de receita" },
  { id: "tecnologia", label: "Tecnologia" },
  { id: "faq", label: "FAQ" },
];

export default function DocsPage() {
  return (
    <div className="bg-bg-base">
      <div className="border-b border-border px-6 py-16 text-center">
        <h1 className="font-display text-3xl text-text-primary sm:text-4xl">
          Documentação
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-text-secondary sm:text-base">
          O que é a Niara, como a tokenização funciona e em que estágio o
          projeto está hoje.
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-start">
        <DocsNav sections={SECTIONS} />

        <div className="min-w-0 flex-1 space-y-16">
          <section id="o-que-e" className="scroll-mt-24">
            <h2 className="font-display text-xl text-text-primary sm:text-2xl">
              O que é a Niara
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
              A Niara é uma infraestrutura para tokenizar ativos do mundo
              real — ações, ETFs, commodities e criptoativos — com lastro
              1:1 sob custódia regulada. Uma vez tokenizados, esses ativos
              podem ser negociados 24 horas por dia, 7 dias por semana, numa
              exchange descentralizada, sem depender de bolsas tradicionais
              ou de redes de liquidação como o SWIFT.
            </p>
          </section>

          <section id="tokenizacao" className="scroll-mt-24">
            <h2 className="font-display text-xl text-text-primary sm:text-2xl">
              Como funciona a tokenização
            </h2>
            <ol className="mt-4 flex max-w-2xl flex-col gap-3">
              {[
                {
                  title: "Custódia do ativo real",
                  text: "O ativo (ação, ETF, commodity ou criptoativo) é colocado sob custódia.",
                },
                {
                  title: "Emissão do token lastreado",
                  text: "Um token 1:1 é emitido on-chain, representando a fração do ativo em custódia.",
                },
                {
                  title: "Negociação on-chain",
                  text: "O token circula e é negociado livremente na exchange descentralizada da Niara.",
                },
                {
                  title: "Resgate ou queima",
                  text: "O detentor pode resgatar o token, que é queimado à medida que o lastro correspondente é liberado.",
                },
              ].map((step, index) => (
                <li key={step.title} className="flex gap-3 text-sm sm:text-base">
                  <span className="font-mono text-text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-text-secondary">
                    <span className="font-medium text-text-primary">
                      {step.title}.
                    </span>{" "}
                    {step.text}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section id="cashback" className="scroll-mt-24">
            <h2 className="font-display text-xl text-text-primary sm:text-2xl">
              Cashback ao emissor
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
              Uma parcela da taxa de transação é devolvida automaticamente,
              via smart contract, à carteira da empresa emissora do ativo —
              proporcional ao volume negociado do próprio ativo. Esse
              mecanismo é o principal diferencial da Niara e o motor de
              adoção junto a empresas: quanto mais líquido for o ativo
              tokenizado de uma empresa, maior a receita recorrente que ela
              recebe, sem custo operacional adicional.
            </p>
          </section>

          <section id="receita" className="scroll-mt-24">
            <h2 className="font-display text-xl text-text-primary sm:text-2xl">
              Modelo de receita
            </h2>
            <ul className="mt-4 max-w-2xl space-y-2 text-sm text-text-secondary sm:text-base">
              <li>
                <span className="font-medium text-text-primary">
                  Taxa de transação
                </span>{" "}
                — 0,1% a 0,15% sobre cada negociação.
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Taxa de listagem/tokenização
                </span>{" "}
                — cobrada da empresa emissora ao colocar um ativo na Niara.
              </li>
              <li>
                <span className="font-medium text-text-primary">
                  Taxa de custódia
                </span>{" "}
                — modelo AUM (percentual sobre o volume de ativos sob
                custódia).
              </li>
            </ul>
          </section>

          <section id="tecnologia" className="scroll-mt-24">
            <h2 className="font-display text-xl text-text-primary sm:text-2xl">
              Tecnologia
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
              Os contratos da Niara são escritos em Solidity e compatíveis
              com EVM (Ethereum Virtual Machine), o que permite implantação
              em qualquer rede compatível — a rede definitiva ainda está em
              definição. No longo prazo, a visão é migrar para uma
              blockchain própria (L1), dedicada às necessidades específicas
              de um mercado de ativos tokenizados operando 24/7.
            </p>
            <p className="mt-3 max-w-2xl rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text-secondary">
              <span className="font-medium text-warning">
                Estágio atual:
              </span>{" "}
              protótipo em ambiente de testnet. Não há contratos em produção
              na mainnet nem auditoria de segurança publicada até o momento.
            </p>
            {/* TODO: detalhar rede/testnet específica e endereços de
                contrato assim que existirem publicamente */}
          </section>

          <section id="faq" className="scroll-mt-24">
            <h2 className="font-display text-xl text-text-primary sm:text-2xl">
              Perguntas frequentes
            </h2>
            <div className="mt-6 max-w-2xl">
              <FaqAccordion />
            </div>
          </section>
        </div>
      </div>

      <div className="border-t border-border px-6 py-6">
        <p className="mx-auto max-w-6xl text-xs text-text-muted">
          Conteúdo meramente informativo. Não constitui oferta,
          recomendação de investimento ou solicitação de compra e venda de
          valores mobiliários. Projeto em desenvolvimento.
        </p>
      </div>
    </div>
  );
}
