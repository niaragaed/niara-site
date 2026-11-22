# Engine changes needed by `/trade`

`niara-site` `/trade` runs the real testnet flow against `niara-exchange-engine`
(order service API at commit `d5b32d6`). These are the gaps the site hits.
None of them is worked around in the site.

## Blocking

1. **CORS on the order service** (`src/service/http.ts`). The site calls
   `POST /v1/orders`, `POST /v1/orders/cancel` and `GET /v1/matches/:id` from the
   browser. Today there is no CORS middleware, so the browser blocks every call
   (the site then shows "could not reach the order service … (CORS)").
   - Allow only the site's origins (a list from env, e.g.
     `CORS_ORIGINS=http://localhost:3000,https://<vercel domain>`), never `*`.
   - Methods `GET, POST, OPTIONS`; header `content-type`; no credentials.
   - Answer the `OPTIONS` preflight for `/v1/*` (Hono `cors()` does this).

## Needed for "your orders and settlements"

2. **List a wallet's orders**: e.g. `GET /v1/orders?chain=…&wallet=…`, newest
   first, paginated, returning `orderJson` plus `nonce` (needed to cancel) and
   `cancelReason`. Today the site only knows orders placed from the current
   tab, and their status as returned at placement or cancel time.
   - Orders are public on-chain intents, but a wallet's open orders and nonces
     are not in the public `order_book` view; decide whether this endpoint must
     be authenticated (e.g. a wallet-signed, short-lived read request) or is
     public by wallet address.
3. **One order's current status**: `GET /v1/orders/:id` (or by chain, wallet and
   nonce), with `filledQuantity`, `remaining`, `status`, and its match ids. Today a
   resting order filled later by another taker is never seen by the site.
4. **A wallet's settlements**: matches of the wallet's orders with their
   settlement status and tx hash (the shape of `GET /v1/matches/:id`), so a fill
   that happens after the tab closes can still be shown with its explorer link.

## Needed for real market data instead of empty states

5. **Trade history / candles**: settled matches per market (time, price,
   quantity, tx hash), e.g. `GET /v1/trades/:chain/:asset`, or a public
   Supabase view over settled `matches` (no wallets). Until then `/trade` shows
   "No trade history yet".
6. **Listing metadata**: `symbol` / `name` in `listings` (or in a listings
   endpoint). The site reads them on-chain today (Token-2022 metadata on
   Solana, `symbol()`/`name()` on EVM); a listing without metadata shows
   "symbol not published".

## Nice to have

7. **A listings/markets endpoint** on the order service (chains config +
   approved Equity markets + lot size + min notional), so the site can use the
   engine as its single source instead of reading Supabase directly.
8. **Expose whether settlement is enabled per chain** (`EVM_SETTLEMENT_CHAINS` +
   `reviewed`), e.g. in `/health`. Today an order on Robinhood or Tempo can be
   accepted and matched but its match stays `pending`, and the site can only say
   "waiting for settlement".
