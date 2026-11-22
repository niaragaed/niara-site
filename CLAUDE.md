# CLAUDE.md — niara-site

Standing instructions for Claude Code in this repository.
Read this file before writing any code.

---

## ⚠️ Next.js 16 (keep this)

This project uses **Next.js 16**, which has breaking changes compared to earlier
versions. Before writing new code, check the docs for the installed version in
`node_modules/next/dist/docs/`.

Things that have already bitten us:
- `params`, `searchParams`, `cookies` and `headers` are **async**: always `await` them.
- `next/image` defaults changed.
- React 19 runs effects twice in dev (StrictMode), so every `useEffect` with a
  canvas, WebGL, chart or listener needs a correct cleanup.

---

## The project

**Niara**: a peer-to-peer exchange for tokenized securities with **self-custody**
and **curated listing**. Reference spec:
`niara-exchange-solana/EXCHANGE-MULTICHAIN-DESIGN.md`.

- **Direct issuance, approved by Niara.** The issuer creates its own asset token
  (equity, fixed income or credit) from **its self-custody wallet**; the token
  *is* the instrument (native issuance). There is no 1:1 backing and no
  custodian: Niara never holds anyone's assets. An asset only becomes tradable
  after Niara approves its listing, so Niara controls eligibility, never custody.
- **Two trading modes, fixed on-chain by asset class:** `Equity` → order book
  (the owner approves the exact order amount as an SPL delegate / ERC-20
  allowance; tokens stay in the wallet); `FixedIncome`, `Credit` and
  `Currency` → P2P with a per-deal escrow.
- **Off-chain matching, atomic on-chain settlement.** Orders are wallet-signed
  intents, matched by the order engine (centralized by design) and settled
  on-chain by the settlement operator. **Do not describe it as a "decentralized
  exchange" or "fully on-chain".** Until the contract verifies intents
  on-chain, the operator is a documented trust assumption: never say "trustless".

Revenue: two fees, both in **USDT**. There is no custody fee.
- **Trading fee:** 0.1%–0.5% of each trade, paid by whoever receives USDT (the
  seller, in the order book). On-chain only the cap is enforced: **0.5%**
  (`MAX_FEE_BPS = 50`); the 0.1% floor is pricing policy.
- **Listing fee:** 0.1%–1% of the issuer's valuation, once per listing
  (on-chain cap 1%).

Differentiator: **issuer cashback** = **20% of the trading fee**
(`cashback_bps = 2000`), credited in USDT to the issuer of the traded asset
through the contract. The listing fee earns no cashback; `Currency` never does.

**Current stage: smart contracts live on testnets (Solana devnet; Base Sepolia,
Robinhood Chain testnet and Tempo testnet; HyperEVM not deployed yet) + an
off-chain order engine (`niara-exchange-engine`: order API, matching and
settlement worker; Supabase `niara-exchange-dev`).** `/trade` runs the real
flow on testnet; the rest of the site is still institutional/prototype with
illustrative data. Everything is testnet: test tokens, no real value, no
regulatory authorization. Every screen that touches a wallet says so.

---

## 🔴 Main rule: nothing simulated may look real

This is the project's most important rule. It is a financial product; an
interface that looks like it operates but doesn't harms the user and creates
regulatory risk.

- All mock data gets a comment: `// illustrative data: replace with [real source]`.
- Every screen with simulated data shows a visible demo notice.
- **Never** label anything as "live", "real time" or "market quote".
- Actions that don't exist (executing an order, converting, sending a form,
  connecting a wallet) stay disabled or are explicitly labeled as a simulation.
  Never fake a successful transaction.
- Don't make up audits, partnerships, regulatory licenses, user counts,
  contract addresses or financial institutions' logos.
- Don't show third-party logos (Goldman Sachs, asset managers, etc.); they
  would suggest partnerships that don't exist.

### Real testnet flow (`/trade`)

- Every page that touches a wallet shows the connected network and the permanent
  **"TESTNET — no real value"** banner (`src/components/web3/TestnetBanner.tsx`).
- Market data comes only from the engine (`/v1/markets`, `/v1/trades`, `/v1/orders`,
  `/v1/matches`) and Supabase (`order_book`). Candles are built only from settled trades.
  Where no real history exists, show an **empty state**, never invented data.
- Order and cancel intents match the engine's `src/intents` **byte for byte**
  (`src/lib/exchange/intents`, with tests). Never change the format without
  changing the engine too.
- Approve only the **exact** delegate/allowance needed, never "infinite": the sum of the
  wallet's open orders on that token **plus** the new order, because a new approval
  replaces the previous amount (`src/lib/exchange/approvals.ts`, with tests).
- Never say an order executed before the engine answers; a settlement is only
  "settled" with the transaction hash and an explorer link.
- Operator keys and any secret **never** go in `NEXT_PUBLIC_*`. The Supabase
  anon key is public by design (RLS).

## 🔴 Sensitive data (LGPD)

- **Never** persist CPF, date of birth or address in `localStorage`. That data
  lives only in React state.
- Allowed to persist: currency preference, theme, investor profile result
  (category).
- Never commit `.env`, API keys or private keys. The repository is **public**.

---

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind **v4**
- Tailwind v4 is **CSS-first**: there is no `tailwind.config.js`; tokens live in
  `@theme` inside `src/app/globals.css`
- `next/font/google` (not a CDN) for fonts
- Libraries: `cobe` (WebGL globe), `lightweight-charts` (candlesticks),
  `recharts` (donut/bars), `lucide-react` (icons), `flag-icons` (flags),
  `wagmi` + `viem` (EVM wallets), `@solana/web3.js` + Wallet Standard (Solana
  wallets), `@tanstack/react-query`, `vitest` (tests)
- State: React (`useState`, Context). No external state libraries.

---

## Design system

Use **only** `@theme` tokens. Never hardcoded colors.
If a library needs a hex value (Recharts, lightweight-charts, cobe), read the
CSS vars with `getComputedStyle`.

**Surfaces:** `bg-base` #05070E · `bg-surface` #0A0E1A · `bg-elevated` #111728 · `border` #1C2438
**Text:** `text-primary` #F4F6FB · `text-secondary` #A6B0C3 · `text-muted` #6B7688
**Accent:** `accent-blue` #2E6BFF · `accent-violet` #7B3FE4 · `accent-cyan` #38BDF8
**Primary gradient:** `bg-gradient-primary` (135deg, blue → violet)
**Semantic:** `positive` #16C784 (buy) · `negative` #F6465D (sell) · `warning` #F0B90B

**Typography:** Space Grotesk (`--font-display`, headings) · Inter (`--font-sans`,
body) · JetBrains Mono (`--font-mono`, numbers and prices, always with `tabular-nums`)

**Radius:** sm 6px · md 10px · lg 16px · full

Note: the text tokens generate classes like `text-text-primary`. That's
intentional; it avoids clashing with Tailwind's native utilities.

Living visual reference: `/styleguide`.

Aesthetic: dark, spacey, dense (density reference: terminals like Hyperliquid).
We adapt the **structure** of external references, never their look or copy.

---

## Language

- **English is the standard for everything in this repo:** identifiers,
  comments, docs, commit messages and PR descriptions. This applies to all
  Niara repositories.
- The site's interface language is **English** (`<html lang="en">` in the root
  layout). All interface copy is centralized in `src/lib/i18n/en.ts` (a typed
  dictionary by area: `nav`, `home`, `trade`, `exchange`, `assets`, `profile`,
  `docs`, `contact`, `pilot`, `common`, etc.). Components import `{ en }` from
  that file; don't hardcode interface strings in JSX. Structured mock data (e.g.
  `mock-assets.ts`, `investor-profile.ts`) is also in English but lives in its
  own `lib/` files, not in the dictionary.
- Formatting (locale) is independent of language: BRL stays in pt-BR
  (R$ 1.234,56) and USD in en-US ($1,234.56) through `CurrencyContext`;
  changing the interface language doesn't change that. Dates use the en-US format.
- TODO: add `src/lib/i18n/pt.ts` and a language switcher when there is demand
  for a bilingual site.

## No AI attribution (hard rule)

Nothing in this repository credits an AI tool, anywhere:

- no `Co-Authored-By: Claude` or `Claude-Session:` trailers, and no "Generated with Claude Code"
  line, in commit messages;
- no AI tool as a commit author or committer: commits use the project identity
  (`git config user.name`/`user.email` = `Niara <niaragaed@gmail.com>`, set in every clone and
  environment before the first commit — some environments default to `Claude <noreply@anthropic.com>`);
- no "Generated with/by Claude Code" footer in pull request descriptions, comments, issues or files.

It's enforced in two layers: the versioned `.claude/settings.json` turns Claude Code's commit
and PR attribution off (`"attribution": {"commit": "", "pr": ""}`), and the `No AI attribution`
GitHub Actions check (`.github/workflows/no-ai-attribution.yml`) fails on any commit or pull
request description that carries it. Some hosted environments append a footer to PR
descriptions by themselves; if the check flags one, delete that line in the GitHub UI. The rule
applies to every Niara repository, including new ones: copy both files when creating a repo.

---

## Routes

| Route | What it is |
|---|---|
| `/` | Home: hero with a 3D globe (cobe) + index ticker |
| `/trade` | **Real testnet terminal**: engine listings and book, signed-intent order form, settlement status |
| `/exchange` | Currency exchange: converter + pairs table |
| `/assets` | Simulated portfolio (Recharts) + asset catalog |
| `/profile` | User profile (personal data, investor profile, wallet) |
| `/pilot` | Real wallet pilot on Sepolia (connect, read balances, sign a real USDT approve) |
| `/docs` | Institutional docs + FAQ |
| `/contact` | Contact form |
| `/styleguide` | Internal design system reference |

Nav (`src/components/nav-items.ts`, shared by Header and Footer):
Trade · Exchange · Assets · Profile · About (submenu: Docs & FAQs, Contact)

"Cashback" was removed from the nav: it's a selling point for issuing companies
and will get its own issuer-facing page.

---

## Layout

```
src/
  app/                 routes (App Router)
  components/
    trade/             terminal
    exchange/          currency exchange
    portfolio/         /assets
    profile/           profile
    about/             docs and contact
    web3/              wallets (wagmi, Solana Wallet Standard), testnet banner
    ui/                shared (e.g. Flag.tsx)
  lib/
    i18n/              copy dictionary (en.ts)
    web3/              wagmi config, ABIs, token list
    exchange/          /trade real flow: intents, engine API, Supabase reads, chains
    mocks, validators, nav-items, rates
  context/             CurrencyContext, InvestorProfileContext
```

---

## Conventions

- **Currency:** the internal source of truth is always **USDT** (a stablecoin:
  readable prices for tokenized assets, without ETH/BTC volatility). **BTC** is
  the site's second main currency. USD, BRL and EUR are available only as
  reference display currencies; ETH is still available only in the currency
  converter (`/exchange`) and is no longer an internal unit. Conversion happens
  only at display time, through `CurrencyContext` (`format()`/`convert()`).
  Fixed rates live in `src/lib/rates.ts`, marked as simulated references. Fixed
  formatting per currency: USDT with 2 decimals, BTC with 8 (satoshis).
  Exception: the home ticker shows **index points**, not currency; don't convert.
- **Numbers:** JetBrains Mono + `tabular-nums`, right-aligned in tables.
- **Flags:** `src/components/ui/Flag.tsx` (flag-icons), ~16–18px in lists, ~20px
  when highlighted. Crypto has no country → a lucide icon of the same size, so
  alignment doesn't break.
- **Client components:** anything that uses a canvas, WebGL, chart, listener or
  `localStorage` needs `"use client"` and a cleanup in `useEffect`.
- **Hydration:** when rehydrating from `localStorage`, render the default on the
  server and adjust in an effect; never cause a mismatch.
- **Accessibility:** labels tied to inputs, `aria-label` on icon buttons,
  visible focus, decorative charts with `aria-hidden` (the data also appears in
  a table/legend).
- **Responsive**, always: test desktop and mobile.

---

## Workflow

1. Before coding, read the files involved; don't assume.
2. Run `tsc --noEmit` and `eslint` at the end; fix whatever comes up.
3. Check that the routes return 200 on the dev server.
4. **Local commit at the end of each task**, message in English using
   `feat:` / `fix:` / `refactor:` / `chore:`.
5. Never `--force`, never rewrite history, never push unless asked.
   2026-11-22: commit messages rewritten to English once, with the founder's authorization; the no-rewrite rule applies again from now on.
6. If something breaks or is ambiguous: **stop and explain**, don't improvise.

Git identity for this repository: `Niara <niaragaed@gmail.com>` (local, not `--global`).

---

## Known open items

- Internationalization: the site is in English (default language). `pt.ts` and
  a language switcher wait for bilingual demand (see "Language").
- `/profile`: done (personal data, investor profile/suitability and wallet). It
  won't get security or preferences sections.
- Home: the content sections below the hero are missing (problem, solution,
  cashback, how it works, roadmap, contact capture)
- Page for issuing companies (cashback at the center of the pitch)
- Replace the remaining mocks (`/assets`, `/exchange`, home) with real data
- Issuer flow (create mint, listing, listing fee, issuance batches, cashback
  withdrawal) and P2P escrow in the UI
- Real profile and KYC
- Solidity contracts (`AssetToken`, exchange, cashback) live in
  `niaragaed/niara-contracts`
- `README.md` is still the create-next-app default
- Deploy on Vercel
- 2 moderate vulnerabilities from the template (don't run `npm audit fix --force`)
