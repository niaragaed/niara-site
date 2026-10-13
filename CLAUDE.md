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

**Niara**: a decentralized global exchange infrastructure. It tokenizes real
assets (stocks, ETFs, commodities, crypto) backed 1:1 under regulated custody
and trades them 24/7 on a decentralized exchange, without traditional stock
exchanges or SWIFT.

Differentiator and adoption driver: **programmatic cashback to the issuer**: a
share of the transaction fee is returned automatically, through a smart
contract, to the issuing company's wallet, in proportion to the traded volume
of its own asset.

Revenue: transaction fee (0.1%–0.15%), listing/tokenization fee and custody fee
(AUM model).

**Current stage: institutional site + interface prototype. There is no backend
or authentication. Everything is simulated except the isolated `/pilot` page
and the on-chain balances in `/profile` and `/assets`, which read a real wallet
on the Sepolia testnet.**

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
  `wagmi` + `viem` (wallet pilot)
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

---

## Routes

| Route | What it is |
|---|---|
| `/` | Home: hero with a 3D globe (cobe) + index ticker |
| `/trade` | Terminal: candlestick chart, indicators, order book, orders/positions, order form |
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
    web3/              wallet pilot (wagmi)
    ui/                shared (e.g. Flag.tsx)
  lib/
    i18n/              copy dictionary (en.ts)
    web3/              wagmi config, ABIs, token list
    mocks, validators, nav-items, rates, indicators
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
- Replace mocks with real feeds (market, on-chain)
- Wallet integration beyond the `/pilot` page → then a real profile and KYC
- Solidity contracts (`AssetToken`, exchange, cashback) live in
  `niaragaed/niara-contracts`
- `README.md` is still the create-next-app default
- Deploy on Vercel
- 2 moderate vulnerabilities from the template (don't run `npm audit fix --force`)
