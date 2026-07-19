# CLAUDE.md — niara-site

Instruções permanentes para o Claude Code neste repositório.
Leia este arquivo antes de escrever qualquer código.

---

## ⚠️ Next.js 16 (preservar)

Este projeto usa **Next.js 16**, que tem breaking changes em relação a versões
anteriores. Antes de escrever código novo, consulte a documentação da versão
instalada em `node_modules/next/dist/docs/`.

Pontos que já nos afetaram:
- `params`, `searchParams`, `cookies` e `headers` são **assíncronos** — sempre com `await`.
- Defaults do `next/image` mudaram.
- React 19 em dev roda efeitos duas vezes (StrictMode) — todo `useEffect` com
  canvas, WebGL, chart ou listener precisa de cleanup correto.

---

## O projeto

**Niara** — infraestrutura de exchange global descentralizada. Tokeniza ativos
reais (ações, ETFs, commodities, cripto) com lastro 1:1 sob custódia regulada e
os negocia 24/7 em uma exchange descentralizada, sem bolsas tradicionais nem SWIFT.

Diferencial e motor de adoção: **cashback programático ao emissor** — parcela da
taxa de transação devolvida automaticamente, via smart contract, à carteira da
empresa emissora, proporcional ao volume negociado do próprio ativo.

Receita: taxa de transação (0,1%–0,15%), taxa de listagem/tokenização e taxa de
custódia (modelo AUM).

**Estágio atual: site institucional + protótipo de interface. Não há backend,
autenticação, carteira real nem blockchain conectada.**

---

## 🔴 Regra principal: nada simulado pode parecer real

Esta é a regra mais importante do projeto. É um produto financeiro; uma interface
que parece operar mas não opera causa dano ao usuário e risco regulatório.

- Todo dado mock recebe comentário `// dados ilustrativos — substituir por [fonte real]`.
- Toda tela com dados simulados exibe aviso visível de demonstração.
- **Nunca** rotular nada como "ao vivo", "tempo real" ou "cotação de mercado".
- Ações que não existem (executar ordem, converter, enviar formulário, conectar
  carteira) ficam desabilitadas ou explicitamente rotuladas como simulação.
  Nunca fingir sucesso de transação.
- Não inventar auditorias, parcerias, licenças regulatórias, número de usuários,
  endereços de contrato ou logos de instituições financeiras.
- Não exibir logos de terceiros (Goldman Sachs, gestoras etc.) — sugeriria
  parcerias inexistentes.

## 🔴 Dados sensíveis (LGPD)

- **Nunca** persistir CPF, data de nascimento ou endereço em `localStorage`.
  Esses dados vivem só em estado React.
- Pode persistir: preferência de moeda, tema, resultado (categoria) do perfil de
  investidor.
- Nunca commitar `.env`, chaves de API ou private key. O repositório é **público**.

---

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind **v4**
- Tailwind v4 é **CSS-first**: não há `tailwind.config.js`; tokens ficam em
  `@theme` dentro de `src/app/globals.css`
- `next/font/google` (não CDN) para as fontes
- Bibliotecas: `cobe` (globo WebGL), `lightweight-charts` (candlestick),
  `recharts` (donut/barras), `lucide-react` (ícones), `flag-icons` (bandeiras)
- Estado: React (`useState`, Context). Sem libs de estado externas.

---

## Design system

Use **somente** tokens do `@theme`. Nunca cores hardcoded.
Se precisar passar hex para uma lib (Recharts, lightweight-charts, cobe), leia as
CSS vars com `getComputedStyle`.

**Superfícies:** `bg-base` #05070E · `bg-surface` #0A0E1A · `bg-elevated` #111728 · `border` #1C2438
**Texto:** `text-primary` #F4F6FB · `text-secondary` #A6B0C3 · `text-muted` #6B7688
**Acento:** `accent-blue` #2E6BFF · `accent-violet` #7B3FE4 · `accent-cyan` #38BDF8
**Gradiente primário:** `bg-gradient-primary` (135deg, blue → violet)
**Semânticos:** `positive` #16C784 (compra) · `negative` #F6465D (venda) · `warning` #F0B90B

**Tipografia:** Space Grotesk (`--font-display`, títulos) · Inter (`--font-sans`,
corpo) · JetBrains Mono (`--font-mono`, números e preços, sempre com `tabular-nums`)

**Raio:** sm 6px · md 10px · lg 16px · full

Nota: os tokens de texto geram classes como `text-text-primary` — é intencional,
evita colisão com utilities nativas do Tailwind.

Referência visual viva: `/styleguide`.

Estética: escura, espacial, densa (referência de densidade: terminais tipo
Hyperliquid). Adaptamos **estrutura** de referências externas, nunca a estética
nem o texto delas.

---

## Rotas

| Rota | O que é |
|---|---|
| `/` | Home: hero com globo 3D (cobe) + ticker de índices |
| `/trade` | Terminal: gráfico candlestick, indicadores, livro, ordens/posições, boleta |
| `/exchange` | Câmbio: conversor de moedas + tabela de paridades |
| `/ativos` | Carteira simulada (Recharts) + catálogo de ativos |
| `/profile` | Perfil do usuário (dados, suitability, carteira, preferências) |
| `/docs` | Documentação institucional + FAQ |
| `/contato` | Formulário de contato |
| `/styleguide` | Referência interna do design system |

Nav (`src/lib/nav-items.ts`, compartilhado por Header e Footer):
Trade · Exchange · Ativos · Profile · About (submenu: Docs & FAQs, Contato)

"Cashback" foi removido do nav — é argumento para empresas emissoras e terá
página própria voltada a emissores.

---

## Organização

```
src/
  app/                 rotas (App Router)
  components/
    trade/             terminal
    exchange/          câmbio
    portfolio/         /ativos
    profile/           perfil
    about/             docs e contato
    ui/                compartilhados (ex.: Flag.tsx)
  lib/                 mocks, validators, nav-items, rates, indicators
  context/             CurrencyContext
```

---

## Convenções

- **Moeda:** a fonte da verdade interna é sempre **ETH**. A conversão acontece só
  na exibição, via `CurrencyContext` (`format()`/`convert()`). Cotações fixas em
  `src/lib/rates.ts`, marcadas como referência simulada.
  Exceção: o ticker da home mostra **pontos de índice**, não moeda — não converter.
- **Números:** JetBrains Mono + `tabular-nums`, alinhados à direita em tabelas.
- **Bandeiras:** componente `src/components/ui/Flag.tsx` (flag-icons), ~16–18px em
  listas, ~20px em destaque. Cripto não tem país → ícone lucide do mesmo tamanho,
  para não quebrar o alinhamento.
- **Client components:** tudo que usa canvas, WebGL, chart, listener ou
  `localStorage` precisa de `"use client"` e cleanup no `useEffect`.
- **Hidratação:** ao reidratar de `localStorage`, renderizar o padrão no servidor
  e ajustar no efeito — nunca causar mismatch.
- **Acessibilidade:** labels associados aos inputs, `aria-label` em botões de
  ícone, foco visível, gráficos decorativos com `aria-hidden` (os dados também
  aparecem em tabela/legenda).
- **Responsivo** sempre: testar desktop e mobile.

---

## Fluxo de trabalho

1. Antes de codar, ler os arquivos envolvidos — não presumir.
2. Rodar `tsc --noEmit` e `eslint` ao final; corrigir o que aparecer.
3. Testar que as rotas respondem 200 no dev server.
4. **Commit local ao final de cada tarefa**, mensagem em português no padrão
   `feat:` / `fix:` / `refactor:` / `chore:`.
5. Nunca `--force`, nunca reescrever histórico, nunca push sem ser pedido.
6. Se algo quebrar ou ficar ambíguo: **parar e explicar**, não improvisar.

Identidade Git deste repositório: `Niara <niaragaed@gmail.com>` (local, sem `--global`).

---

## Pendências conhecidas

- `/profile`: concluído — dados pessoais, perfil de investidor (suitability) e
  carteira. Não terá seções de segurança nem preferências.
- Home: faltam as seções de conteúdo abaixo do hero (problema, solução, cashback,
  como funciona, roadmap, captura de contato)
- Página para empresas emissoras (cashback como centro do discurso)
- Substituir mocks por feeds reais (mercado, on-chain)
- Integração de carteira (wagmi/ethers) → depois disso, perfil e KYC reais
- Contratos Solidity (`AssetToken`, exchange, cashback) — testnet Sepolia
- `README.md` ainda é o padrão do create-next-app
- Deploy na Vercel
- 2 vulnerabilidades moderadas do template (não rodar `npm audit fix --force`)
