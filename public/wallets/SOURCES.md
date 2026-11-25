# Wallet icons: sources

Every file here is the vendor's own artwork from its official brand or press kit,
copied **unmodified** (never redrawn, recolored or approximated). Checked on
2026-11-25. Niara has no partnership with any of these vendors; the connect dialog
says so. A wallet that is not listed here shows a generic wallet glyph.

`test/web3/wallet-icon.test.ts` checks that every file in this folder is listed
below with its SHA-256, and that the directory only points to files that exist.

| File | Vendor | Source | SHA-256 |
|---|---|---|---|
| `phantom.svg` | Phantom | The icon Phantom recommends for dApp integrations, on its "Logos & Assets" page: https://docs.phantom.com/resources/assets (`Phantom_SVG_Icon.svg`). The same page links the full kit and style guide. | `2f238875a4b52e80eac9acfdd7e30bd9d81e7f8d13a3faff80cacd6cf413cddd` |
| `metamask.svg` | MetaMask | `MetaMask-Logo-Pack/MetaMask/MetaMask-icon-fox.svg` in the "MetaMask Logo Pack" download on https://metamask.io/assets (served from `metamask.com/assets`). | `1489898add91119438809430cb5e39293e6a9bd2b273f7f24563de1f2f33918b` |
| `solflare.svg` | Solflare | `solflare-brand-kit/SVG/Solflare_INSIGNIA_SOL_Yellow.svg` in https://solflare.com/solflare-brand-kit.zip | `d226b489e3a1c44980b1fb84818fb8d235abb6491ad9089035e7e198812e2fea` |
| `backpack.svg` | Backpack | `symbol/backpack-symbol-color.svg` from Backpack's brand page https://backpack.exchange/brand (assets under `/marketing/brand/assets/`; full kit: https://backpack.exchange/marketing/brand/downloads/backpack-brand-assets.zip) | `6f0c325af04c526d8971ffa68f38c0928aac5cf0d93c6df21678218fe6d7720d` |
| `ledger.svg` | Ledger | `Logos/Ledger/LEDGER-WORDMARK-SINGLE-CHARACTER-BLACK-CMYK-01.svg` in Ledger's press kit (`Ledger_Press_kit_october_2025.zip`), linked from https://www.ledger.com/press. Black artwork on a transparent background, so the dialog shows it on a light tile. | `ff2408c70d73cd6d1ba3fd91d82d78f4f0fc6a15261678c68701d72b90d407fc` |
| `trezor.svg` | Trezor | `trezor-symbol-white-rgb.svg` from Trezor's brand manual (Logos → Symbol), https://trezor.visualbook.pro/trezor/logos, linked from https://trezor.io/press-and-media | `f2c498f96003cd5a535658ceca24ff10cb41b620234399473156ebbdbb4ac2c2` |

## No icon shipped (generic glyph kept)

| Wallet | Why |
|---|---|
| Trust Wallet | Its official kit (https://trustwallet.com/download/logos.zip, linked from https://trustwallet.com/press) has only wordmark and stacked lockups on a 1920×1080 canvas, with no icon-only file. Scaled to icon size they are unreadable, and cropping them would modify the artwork. |
| Coinbase Wallet | No kit reachable: coinbase.com/press and its brand pages answer 403 to automated requests, and the wallet icon kit its developer docs used to link is gone (404). |
| Kraken Wallet | Kraken's kit (https://payward.com/newsroom) has the Kraken wordmark and Payward logos, but no Kraken Wallet icon. |
| Rabby | No public brand or press kit on rabby.io. |
| OKX Wallet | No public brand or press kit found on okx.com or web3.okx.com. |
| Binance Wallet | binance.com's brand pages answer 202 to automated requests with no content, so no kit could be read. |
| Tangem | No public brand or press kit on tangem.com (its media kit is not on the official site). |
