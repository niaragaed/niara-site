"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "O que é um ativo tokenizado?",
    answer:
      "É a representação digital de um ativo real — uma ação, um ETF, uma commodity ou um criptoativo — registrada on-chain como um token. Cada token é lastreado 1:1 pelo ativo correspondente, mantido sob custódia.",
  },
  {
    question: "O que garante o lastro?",
    answer:
      "O ativo real fica sob custódia regulada, e o token só é emitido depois que esse lastro é confirmado. O processo de custódia (instituição responsável, auditoria de reservas) está em definição — não afirmamos hoje uma estrutura específica de custódia em produção.",
  },
  {
    question: "Preciso de carteira para negociar?",
    answer:
      "Sim, a negociação on-chain depende de uma carteira compatível com a rede utilizada. A conexão de carteira ainda não está disponível no site — o terminal e o câmbio atuais são demonstrações com dados simulados.",
  },
  {
    question: "Quais são as taxas?",
    answer:
      "O modelo previsto inclui uma taxa de transação (0,1%–0,15%), uma taxa de listagem/tokenização para empresas emissoras e uma taxa de custódia sobre o volume sob custódia (modelo AUM). Os valores finais ainda estão em definição.",
  },
  {
    question: "Como uma empresa lista seu ativo na Niara?",
    answer:
      "O processo passa por due diligence do ativo, estruturação da custódia do lastro e configuração do smart contract de emissão — incluindo o mecanismo de cashback ao emissor. Entre em contato pela página de Contato para conversar sobre listagem.",
  },
  {
    question: "Em que estágio o projeto está?",
    answer:
      "A Niara está em desenvolvimento: o site atual mostra a estrutura do produto com terminal, câmbio e carteira totalmente simulados, sem conexão com blockchain ou dados de mercado reais. Os contratos inteligentes estão em protótipo, em ambiente de testnet.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-bg-surface">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        const buttonId = `faq-button-${index}`;
        const panelId = `faq-panel-${index}`;
        return (
          <div key={item.question}>
            <h3 className="text-base font-normal">
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-medium text-text-primary"
              >
                {item.question}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
            </h3>
            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="px-4 pb-4 text-sm leading-relaxed text-text-secondary"
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
