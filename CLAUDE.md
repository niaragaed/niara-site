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

**Niara** — exchange peer-to-peer de valores mobiliários tokenizados, com
**autocustódia** e **listagem curada**. Spec de referência:
`niara-exchange-solana/EXCHANGE-MULTICHAIN-DESIGN.md`.

- **Emissão direta, aprovada pela Niara.** O emissor cria o token do próprio
  ativo (equity, renda fixa ou crédito) a partir da **sua carteira de
  autocustódia**; o token *é* o instrumento (emissão nativa). Não há lastro 1:1
  nem custodiante: a Niara não guarda ativos de ninguém. O ativo só fica
  negociável depois que a Niara aprova a listagem — a Niara controla a
  elegibilidade, nunca a custódia.
- **Dois modos de negociação, fixados pela classe do ativo (on-chain):**
  `Equity` → livro de ofertas (o dono aprova o valor exato da ordem como
  delegate SPL / allowance ERC-20; os tokens ficam na carteira); `FixedIncome`,
  `Credit` e `Currency` → negociação P2P com escrow por negócio.
- **Matching off-chain, liquidação on-chain atômica.** Ordens são intents
  assinadas pela carteira, casadas pelo order engine (centralizado por design)
  e liquidadas on-chain pelo operador de liquidação. **Não descrever como
  "exchange descentralizada" nem "totalmente on-chain".** Até o contrato
  verificar as intents on-chain, o operador é uma premissa de confiança
  documentada — nunca dizer "trustless".

Receita: duas taxas, ambas em **USDT**. Não há taxa de custódia.
- **Taxa de negociação:** 0,1%–0,5% de cada operação, paga por quem recebe USDT
  (o vendedor, no livro). On-chain só o teto é imposto: **0,5%**
  (`MAX_FEE_BPS = 50`); o piso de 0,1% é política de preço.
- **Taxa de listagem:** 0,1%–1% do valuation do emissor, uma vez por listagem
  (teto on-chain de 1%).

Diferencial: **cashback ao emissor** = **20% da taxa de negociação**
(`cashback_bps = 2000`), creditado em USDT ao emissor do ativo negociado, via
contrato. A taxa de listagem não gera cashback; `Currency` nunca gera.

**Estágio atual: smart contracts no ar em testnets (Solana devnet; Base
Sepolia, Robinhood Chain testnet e Tempo testnet; HyperEVM ainda sem deploy)
+ order engine off-chain (`niara-exchange-engine`: API de ordens, matching e
worker de liquidação; Supabase `niara-exchange-dev`).** `/trade` roda o fluxo
real em testnet; o resto do site segue institucional/protótipo com dados
ilustrativos. Tudo é testnet: tokens de teste, sem valor real, sem autorização
regulatória — toda tela que toca carteira diz isso.

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

### Fluxo real em testnet (`/trade`)

- Toda página que toca carteira mostra a rede conectada e o aviso permanente
  **"TESTNET — no real value"** (`src/components/web3/TestnetBanner.tsx`).
- Dados de mercado vêm só do engine / Supabase (`listings`, `order_book`).
  Onde não há histórico real, **estado vazio** — nunca dado inventado.
- Intents de ordem e cancelamento seguem **byte a byte** o `src/intents` do
  engine (`src/lib/exchange/intents`, com testes). Não mudar formato sem mudar
  o engine junto.
- Aprovar só o delegate/allowance **exato** da ordem — nunca "infinito".
- Nunca dizer que uma ordem executou antes de o engine responder; liquidação só
  é "settled" com o hash da transação e link do explorer.
- Chaves de operador e qualquer segredo **nunca** em `NEXT_PUBLIC_*`. A anon key
  do Supabase é pública por design (RLS).

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

## Idioma

O idioma padrão (e, por enquanto, único) do site é **inglês** —
`<html lang="en">` no layout raiz. Todo texto de interface fica centralizado em
`src/lib/i18n/en.ts` (dicionário tipado por área: `nav`, `home`, `trade`,
`exchange`, `assets`, `profile`, `docs`, `contact`, `common` etc.). Componentes
importam `{ en }` desse arquivo — não hardcodar strings de interface direto no
JSX. Dados mock estruturados (ex.: `mock-assets.ts`, `investor-profile.ts`)
seguem traduzidos em inglês, mas vivem nos próprios arquivos de `lib/`, não no
dicionário.

Formatação (locale) é independente de idioma: BRL continua em pt-BR
(R$ 1.234,56) e USD em en-US ($1,234.56) via `CurrencyContext` — trocar o
idioma da interface não muda isso. Datas usam formato en-US.

Comentários de código continuam em português (convenção do projeto).

TODO: adicionar `src/lib/i18n/pt.ts` e um seletor de idioma quando houver
demanda bilíngue.

---

## Rotas

| Rota | O que é |
|---|---|
| `/` | Home: hero com globo 3D (cobe) + ticker de índices |
| `/trade` | Terminal **real em testnet**: listagens e livro do engine, boleta com intent assinada, status de liquidação |
| `/pilot` | Piloto antigo de carteira EVM (Sepolia) |
| `/exchange` | Câmbio: conversor de moedas + tabela de paridades |
| `/assets` | Carteira simulada (Recharts) + catálogo de ativos |
| `/profile` | Perfil do usuário (dados pessoais, perfil de investidor, carteira) |
| `/docs` | Documentação institucional + FAQ |
| `/contact` | Formulário de contato |
| `/styleguide` | Referência interna do design system |

Nav (`src/components/nav-items.ts`, compartilhado por Header e Footer):
Trade · Exchange · Assets · Profile · About (submenu: Docs & FAQs, Contact)

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
    portfolio/         /assets
    profile/           perfil
    about/             docs e contact
    ui/                compartilhados (ex.: Flag.tsx)
  lib/
    i18n/              dicionário de textos (en.ts)
    mocks, validators, nav-items, rates, indicators
  context/             CurrencyContext
```

---

## Convenções

- **Moeda:** a fonte da verdade interna é sempre **USDT** (stablecoin — preço
  legível para os ativos tokenizados, sem a oscilação de ETH/BTC). **BTC** é a
  segunda moeda principal do site. USD, BRL e EUR ficam disponíveis só como
  exibição de referência; ETH segue disponível apenas no conversor de câmbio
  (`/exchange`), não é mais unidade interna. A conversão acontece só na
  exibição, via `CurrencyContext` (`format()`/`convert()`). Cotações fixas em
  `src/lib/rates.ts`, marcadas como referência simulada. Formatação fixa por
  moeda: USDT com 2 casas, BTC com 8 (satoshis).
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

- Internacionalização: site em inglês (idioma padrão). `pt.ts` + seletor de
  idioma ficam para quando houver demanda bilíngue (ver seção "Idioma").
- `/profile`: concluído — dados pessoais, perfil de investidor (suitability) e
  carteira. Não terá seções de segurança nem preferências.
- Home: faltam as seções de conteúdo abaixo do hero (problema, solução, cashback,
  como funciona, roadmap, captura de contato)
- Página para empresas emissoras (cashback como centro do discurso)
- Substituir os mocks restantes (`/assets`, `/exchange`, home) por dados reais
- `/trade`: histórico de negócios/candles, "minhas ordens" e CORS dependem de
  mudanças no engine (ver relatório da tarefa de integração)
- Fluxo do emissor (criar mint, listagem, taxa de listagem, lotes de emissão,
  saque de cashback) e P2P escrow na UI
- Perfil e KYC reais
- `README.md` ainda é o padrão do create-next-app
- Deploy na Vercel
- 2 vulnerabilidades moderadas do template (não rodar `npm audit fix --force`)
