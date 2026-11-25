# Deploying niara-site on Vercel (https://niaraglobal.com) — testnet only

The production site is **testnet only**: every network below is a testnet, every
token is a test token with no value, and the "TESTNET — no real value" banner stays
on every page that touches a wallet. Nothing in this setup turns on a mainnet.

## 1. Project

- Import the GitHub repository `niara-site` into Vercel. Framework preset: Next.js.
  The build command (`next build`) and output directory are the defaults.
- Production branch: `main`.
- Node.js: the Vercel default LTS.

## 2. Environment variables (Production)

All of them are `NEXT_PUBLIC_*`, so **all of them are public**: they are inlined
into the browser bundle at build time. Never add an operator key, keystore,
password, `DATABASE_URL`, the Supabase service role key or a private RPC URL with
an API key.

Because they are inlined at build time, **changing one requires a redeploy**. The
Content-Security-Policy's `connect-src` is built from the same values
(`src/lib/security/csp.ts`), so a new RPC or engine URL is allowed only after a
redeploy as well.

Set them in Vercel → Project → Settings → Environment Variables, scope
**Production** (and Preview if you want previews to work, see §5).

| Variable | Production value |
|---|---|
| `NEXT_PUBLIC_ENGINE_URL` | `https://api.niaraglobal.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` (Supabase `niara-exchange-dev` → Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the project's anon / publishable key (public by design, RLS) |
| **Solana devnet** | |
| `NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL` | `https://api.devnet.solana.com` |
| `NEXT_PUBLIC_SOLANA_DEVNET_PROGRAM_ID` | `B311xH3PcEx86gdRbuinrGrh1r9G2qzjDCji8uc6eD9v` |
| `NEXT_PUBLIC_SOLANA_DEVNET_USDT_MINT` | `8iWQ7VxYrkUv471vEoZ664eLwDzWinPiCJpRvcTUA24y` |
| `NEXT_PUBLIC_SOLANA_DEVNET_EXPLORER_TX` | `https://explorer.solana.com/tx/{tx}?cluster=devnet` |
| **Base Sepolia** | |
| `NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID` | `84532` |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` | `https://sepolia.base.org` |
| `NEXT_PUBLIC_BASE_SEPOLIA_SETTLEMENT` | `0x14C6F9DeD6C97F67149B4305c57331F9d3820B6F` |
| `NEXT_PUBLIC_BASE_SEPOLIA_USDT` | `0x4ED579b02B53d050624c0F04Fb1F4D9b1d347457` |
| `NEXT_PUBLIC_BASE_SEPOLIA_EXPLORER_TX` | `https://sepolia.basescan.org/tx/{tx}` |
| **Robinhood Chain testnet** | |
| `NEXT_PUBLIC_ROBINHOOD_TESTNET_CHAIN_ID` | `46630` |
| `NEXT_PUBLIC_ROBINHOOD_TESTNET_RPC_URL` | `https://rpc.testnet.chain.robinhood.com` |
| `NEXT_PUBLIC_ROBINHOOD_TESTNET_SETTLEMENT` | `0x14C6F9DeD6C97F67149B4305c57331F9d3820B6F` |
| `NEXT_PUBLIC_ROBINHOOD_TESTNET_USDT` | `0x4ED579b02B53d050624c0F04Fb1F4D9b1d347457` |
| `NEXT_PUBLIC_ROBINHOOD_TESTNET_EXPLORER_TX` | `https://explorer.testnet.chain.robinhood.com/tx/{tx}` |
| **Tempo testnet** | |
| `NEXT_PUBLIC_TEMPO_TESTNET_CHAIN_ID` | `42431` |
| `NEXT_PUBLIC_TEMPO_TESTNET_RPC_URL` | `https://rpc.moderato.tempo.xyz` |
| `NEXT_PUBLIC_TEMPO_TESTNET_SETTLEMENT` | `0x14C6F9DeD6C97F67149B4305c57331F9d3820B6F` |
| `NEXT_PUBLIC_TEMPO_TESTNET_USDT` | `0x4ED579b02B53d050624c0F04Fb1F4D9b1d347457` |
| `NEXT_PUBLIC_TEMPO_TESTNET_EXPLORER_TX` | `https://explore.testnet.tempo.xyz/tx/{tx}` |
| **HyperEVM testnet** (not deployed: leave the last three empty, the chain shows as not configured) | |
| `NEXT_PUBLIC_HYPEREVM_TESTNET_CHAIN_ID` | `998` |
| `NEXT_PUBLIC_HYPEREVM_TESTNET_RPC_URL` | `https://rpc.hyperliquid-testnet.xyz/evm` |
| `NEXT_PUBLIC_HYPEREVM_TESTNET_SETTLEMENT` | *(empty)* |
| `NEXT_PUBLIC_HYPEREVM_TESTNET_USDT` | *(empty)* |
| `NEXT_PUBLIC_HYPEREVM_TESTNET_EXPLORER_TX` | *(empty)* |
| **Ethereum Sepolia** (old `/pilot`) | |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | *(empty: viem's public Sepolia RPC is used)* or a public RPC URL |
| **Wallets** | |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | the project id from the Reown dashboard (public by design). Empty = no WalletConnect, and its hosts stay out of the CSP |
| **Other Niara products** (header links, opened in a new tab) | |
| `NEXT_PUBLIC_REGISTER_URL` | `https://register.niaraglobal.com` (empty = the "Register" link is hidden) |
| `NEXT_PUBLIC_SMES_URL` | `https://sme.niaraglobal.com` (empty = the "SMEs" link is hidden) |

The contract addresses are the testnet deployments from `niara-exchange-engine/config`
(the same values as `.env.example`). Check them against the engine's config before
the first deploy; if the site and the order service disagree, `/trade` disables
ordering and says so (`config_mismatch`).

## 3. Domain: apex `niaraglobal.com`, `www` redirects to it

In Vercel → Project → Settings → Domains:

1. Add `niaraglobal.com`. This is the primary domain.
2. Add `www.niaraglobal.com` and choose **Redirect to `niaraglobal.com`**
   (permanent, 308).

Vercel then shows the DNS records it expects. Use **exactly the values shown on that
page**: Vercel has been moving new projects to project-specific records, so they can
differ from the generic ones below.

| Host | Type | Value (generic Vercel values; prefer the ones the Domains page shows) |
|---|---|---|
| `@` (`niaraglobal.com`) | `A` | `76.76.21.21` (newer projects are shown `216.198.79.1`) |
| `www` | `CNAME` | `cname.vercel-dns.com` (or the project-specific `….vercel-dns-0xx.com` shown) |

At the DNS provider:

- Remove any other `A`/`AAAA` record on `@` and any other record on `www`; a
  leftover record makes the verification fail or sends some visitors elsewhere.
- **Do not touch `api.niaraglobal.com`**: it points to the order service, not to
  Vercel.
- If the provider has CAA records, allow Let's Encrypt (`0 issue "letsencrypt.org"`),
  which Vercel uses for the certificate.
- Alternatively, move the whole zone to Vercel's nameservers (`ns1.vercel-dns.com`,
  `ns2.vercel-dns.com`); then the `api` record must be recreated in Vercel DNS.

Vercel issues the HTTPS certificates once the records resolve.

## 4. WalletConnect (Reown)

- Create a project at the Reown dashboard and copy its project id into
  `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.
- In the project's settings, set the allowed domains to `niaraglobal.com` only
  (plus `localhost` on a separate development project). That stops other sites from
  using the id.
- When the id is set, the CSP adds WalletConnect's relay, RPC, API, font and Verify
  hosts (`WALLETCONNECT_SOURCES` in `src/lib/security/csp.ts`).
- The WalletConnect client starts only when someone picks WalletConnect, or when
  reconnecting a wallet that last connected through it. Other visitors never
  contact WalletConnect's servers.

## 5. The order service (`api.niaraglobal.com`)

- The engine's `CORS_ORIGINS` must contain exactly `https://niaraglobal.com`. `www`
  never calls the API, because it redirects first.
- `api.niaraglobal.com` must serve HTTPS. The site sends HSTS with
  `includeSubDomains`, so browsers refuse plain HTTP on every subdomain.

## 6. Security headers (already in the code)

- `src/proxy.ts`: a per-request `Content-Security-Policy` with a nonce. Scripts run
  only with the nonce (`'strict-dynamic'`), with no `'unsafe-inline'` and, in
  production, no `'unsafe-eval'`. `connect-src` allows only the engine, Supabase and
  the RPCs above (plus Solana devnet's WebSocket), and `frame-ancestors 'none'`.
- `next.config.ts`: `X-Frame-Options: DENY`, HSTS (two years, subdomains, no
  `preload`), `Referrer-Policy: strict-origin-when-cross-origin`,
  `X-Content-Type-Options: nosniff` and a `Permissions-Policy` that turns off
  camera, microphone, geolocation, payment, USB/HID/serial/Bluetooth and the like.

Preview deployments (`*.vercel.app`):

- The engine's CORS does not include their origin, so `/trade` shows the order
  service as unreachable. That is expected.
- The CSP also blocks the Vercel Toolbar script on previews. Turn the toolbar off in
  Project → Settings if its console errors bother you.

## 7. After the first deploy

- Run `curl -sI https://niaraglobal.com` and check that `content-security-policy`,
  `x-frame-options: DENY` and `strict-transport-security` are present.
- Run `curl -sI https://www.niaraglobal.com` and expect a `308` to
  `https://niaraglobal.com/`.
- Open `/trade` with the browser console open:
  - there must be no CSP violation;
  - connect a Solana wallet and an EVM wallet;
  - sign an order intent;
  - when the engine is up, check that listings and the book load.
