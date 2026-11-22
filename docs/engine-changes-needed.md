# Engine changes needed by `/trade`

`niara-site` `/trade` runs the real testnet flow against `niara-exchange-engine`.
This list was written against engine commit `d5b32d6`. **Every item is now done**
(engine commits `7b9d6b2..6f49b2d`) and used by the site.

## Blocking

1. ✅ **CORS on the order service** — done in `7b9d6b2`: only the exact origins
   of `CORS_ORIGINS`, never `*`; GET/POST/OPTIONS; `content-type`; no
   credentials; preflights answered. The deployment must list the site's
   origins (e.g. `http://localhost:3000` and the Vercel domain).

## Needed for "your orders and settlements"

2. ✅ **List a wallet's orders** — `GET /v1/orders?chain=&wallet=` (`7448da2`),
   newest first, paged, with `nonce` and `cancelReason`. Unsigned on testnet;
   the engine's `docs/decisions.md` requires a wallet sign-in on mainnet. The
   site uses it for "Your orders" (across sessions, with signed cancel) and to
   sum the wallet's open orders for the approval amount.
3. ✅ **One order's current status** — `GET /v1/orders/:id` (`0816eda`), with
   its matches and their settlements. The site shows it when an order is
   expanded.
4. ✅ **A wallet's settlements** — `GET /v1/matches?chain=&wallet=` (`ada98d1`),
   with side, role, settlement status and tx hash. The site's "Settlements" tab.

## Needed for real market data instead of empty states

5. ✅ **Trade history / candles** — `GET /v1/trades/:chain/:asset` (`f9e0a0c`):
   settled trades only. The site builds candles (1h/4h/1d) and a trade table
   from them; the empty state stays when a market has no settled trade.
6. ✅ **Listing metadata** — `listings.symbol` / `listings.name` (`79b33f2`),
   exposed by `GET /v1/markets`. The site no longer reads them on-chain.

## Nice to have

7. ✅ **A markets endpoint** — `GET /v1/markets` (`6f49b2d`): chains, settlement
   program, quote asset, minimum notional, intent validity and approved Equity
   markets. The site's listings and order limits come from it. Supabase is still
   read for the aggregated book and for issuer / cashback eligibility, which
   `/v1/markets` does not carry.
8. ✅ **Whether settlement is enabled per chain** — `ordersAccepted` and
   `settlementEnabled` in `GET /v1/markets` (`6f49b2d`). The site disables
   ordering where either is false and says which.

## Remaining (not blocking)

- `GET /v1/markets` could also carry `issuer` and `cashbackEligible` per market,
  so the site would not need Supabase for them.
