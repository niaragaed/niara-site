// Central dictionary for all interface copy. English is the default (and,
// for now, only) language — components import `en` directly, no routing or
// locale switching involved.
// TODO: add pt.ts and a language switcher when there is demand for bilingual support.

export const en = {
  common: {
    demoLabel: "Demonstration",
    accessTerminal: "Access Terminal",
    disclaimer:
      "This content is for informational purposes only. It does not constitute an offer, investment recommendation, or solicitation to buy or sell securities. Project under development.",
    copyright: "© 2026 Niara",
  },

  announcement: {
    text: "Niara — the global 24/7 tokenized-asset exchange. Under construction.",
    learnMore: "Learn more",
    dismiss: "Dismiss announcement",
  },

  nav: {
    trade: "Trade",
    exchange: "Exchange",
    assets: "Assets",
    profile: "Profile",
    about: "About",
    docsLabel: "Docs & FAQs",
    docsDescription: "Learn about Niara's product, technology, and business model.",
    contactLabel: "Contact",
    contactDescription: "Reach out to Niara for partnerships, asset issuance, or support.",
    mainAriaLabel: "Main navigation",
    mobileAriaLabel: "Mobile navigation",
    footerAriaLabel: "Footer links",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },

  home: {
    badge: "Tokenized asset infrastructure",
    heading: "Trade global assets, 24/7, without intermediaries.",
    subheading:
      "Niara tokenizes stocks, ETFs, commodities, and crypto with real backing and trades them on a decentralized exchange — no traditional exchanges, no SWIFT, no borders.",
    exchangeCta: "Go to Exchange",
    scrollHint: "Scroll to explore",
    networksLabel: "Supported assets and networks",
    comingSoon: "+ coming soon",
  },

  ticker: {
    ariaLabel: "Indices and assets — illustrative values",
  },

  testnet: {
    label: "TESTNET — no real value",
    text: "Test tokens on public test networks. No real assets, no real money, no regulatory authorization.",
    networkLabel: "Network",
    walletLabel: "Wallet",
    notConnected: "not connected",
    unknownNetwork: (id: number) => `unsupported network (chain ${id})`,
    walletOn: (network: string) => `wallet on ${network}`,
  },

  trade: {
    metaTitle: "Trade — Niara (testnet)",
    metaDescription:
      "Niara Exchange on testnets: approved Equity listings, the aggregated order book and signed order intents settled on-chain.",
    terminalLabel: "Exchange terminal",
    flowNote:
      "Off-chain matching, atomic on-chain settlement, self-custody. Your tokens stay in your wallet until a match settles. Order intents are verified by the order service; the settlement operator is still a trusted party until intents are verified on-chain.",

    chainSelector: {
      ariaLabel: "Settlement network",
      notConfigured: "not configured",
      notConfiguredDetail: (problems: string) => `This network is not configured in this deployment: ${problems}.`,
    },

    wallet: {
      connectWith: (name: string) => `Connect ${name}`,
      connect: "Connect wallet",
      connecting: "Connecting…",
      disconnect: "Disconnect",
      noSolanaWallet: "No Solana wallet found in this browser (Wallet Standard: Phantom, Backpack, Solflare…).",
      noEvmWallet: "No EVM wallet announced itself in this browser (EIP-6963: MetaMask, Rabby, Coinbase Wallet, Phantom…).",
      rejected: "Connection request rejected.",
      noAccount: "The wallet did not share a Solana account.",
      switchTo: (network: string) => `Switch to ${network}`,
      switching: "Switching…",
      wrongNetwork: (network: string) => `Your wallet is on another network. Orders here are signed for ${network}.`,
      solanaNetworkNote:
        "Your wallet signs; approval transactions are sent through this site's devnet RPC (genesis hash checked), whatever network the wallet shows.",
    },

    listings: {
      title: "Listings",
      empty: "No approved Equity listing on this network yet.",
      loading: "Loading listings…",
      lotSize: "Lot",
      issuer: "Issuer",
      cashbackEligible: "Issuer cashback eligible",
      unknownSymbol: "symbol not published",
      selectAria: "Select listing",
      asset: "Asset",
      address: "Address",
      approvalTx: "Listing approval transaction",
    },

    chart: {
      title: "Trade history",
      intervalAria: "Candle interval",
      loading: "Loading settled trades…",
      empty: "No trade history yet.",
      emptyDetail:
        "No trade of this market has settled on-chain yet. Candles are built only from settled trades, so there is nothing to chart. Nothing here is invented.",
      source: (n: number, truncated: boolean) =>
        `${n} settled trade${n === 1 ? "" : "s"} from the order service${truncated ? " (most recent only)" : ""}. Candles have no bar for periods without trades.`,
      tableCaption: "Most recent settled trades",
      time: "Time",
      price: "Price / lot",
      lots: "Lots",
      taker: "Taker",
      tx: "Tx",
      viewTx: "View the settlement transaction",
    },

    book: {
      title: "Order book",
      source: "Aggregated price levels from the exchange database (live orders only, no wallets).",
      updatedAt: (time: string) => `Read at ${time}`,
      lots: "Lots",
      price: "Price / lot (USDT)",
      orders: "Orders",
      asks: "Asks",
      bids: "Bids",
      emptySide: "No orders",
      loading: "Loading order book…",
      spread: "Spread",
    },

    ticket: {
      title: "New order",
      sideGroupLabel: "Order side",
      buy: "Buy",
      sell: "Sell",
      lotsLabel: "Quantity (lots)",
      lotsHint: (perLot: string, symbol: string) => `1 lot = ${perLot} ${symbol}`,
      priceLabel: "Limit price per lot (USDT)",
      expiryLabel: "Expires in",
      expiry: { "3600": "1 hour", "86400": "1 day", "604800": "7 days", "2592000": "30 days" } as Record<string, string>,
      notional: "Order value",
      feeLabel: "Trading fee (seller pays, in USDT)",
      feeValue: (pct: string) => `${pct} (on-chain rate)`,
      cashbackLabel: "Issuer cashback",
      cashbackValue: (pct: string) => `${pct} of the trading fee`,
      cashbackNone: "not eligible",
      minNotional: (value: string) => `Minimum order value: ${value} USDT`,
      approvalLabel: "On-chain approval",
      approvalWhy:
        "Your token account has a single approval for the exchange, and a new approval replaces the previous amount instead of adding to it. So it must cover all your open orders on this token plus this one, or the older orders would no longer be covered and could fail to settle.",
      openOrdersNeed: (n: number) => `Your open orders on this token (${n})`,
      thisOrderNeed: "This order",
      totalNeed: "Approval needed",
      approvalExact: (amount: string, symbol: string, spender: string) =>
        `Your wallet will be asked to approve exactly ${amount} ${symbol} to the ${spender} — nothing more.`,
      approvalCovered: "Your current approval already covers your open orders and this one: no new approval.",
      explain: {
        title: "Before your wallet opens: the approval",
        what: (amount: string, symbol: string, token: string, spender: string, spenderAddress: string) =>
          `Your wallet will ask you to approve ${amount} ${symbol} (token ${token}) to the ${spender} (${spenderAddress}). That lets it move up to this amount from your wallet, only to settle your orders on this token when they match. Your tokens stay in your wallet until a trade settles.`,
        why: "The amount covers your open orders on this token plus this one, because a new approval replaces the previous one instead of adding to it. You can revoke it in your wallet at any time.",
        solanaExtras:
          "Your wallet may add priority-fee and safety-check instructions to the transaction. This site accepts only those and refuses any other change.",
        warning:
          "Wallets often show a warning for approvals requested by sites they have not verified, as this testnet site is. Before approving, check that the token, amount and spender in your wallet match the ones above.",
        continue: "Continue in wallet",
        cancel: "Cancel",
      },
      delegatedElsewhere:
        "This token account currently delegates to another program. Approving here replaces that delegation.",
      balanceLabel: "Wallet balance",
      currentApproval: "Current approval",
      vaultLabel: "program vault",
      settlementLabel: "NiaraSettlement contract",
      place: "Sign and place order",
      connectFirst: "Connect a wallet for this network to place an order.",
      invalidLots: "Enter a whole number of lots (at least 1).",
      invalidPrice: (decimals: number) => `Enter a positive price with at most ${decimals} decimals.`,
      belowMin: "The order value is below this network's minimum.",
      insufficientBalance: "Your wallet balance does not cover this order.",
      balanceBelowTotal:
        "Your balance covers this order but not all your open orders on this token: some of them may be marked stale.",
      tooManyOrders:
        "Your order history on this network is longer than this page reads, so the approval your open orders need cannot be computed safely. Ordering is disabled.",
      overflow: "Amounts are too large for this network.",
      engineNotConfigured: "The order service URL is not configured in this deployment.",
      blocked: {
        engine_not_configured: "Ordering is disabled: the order service URL is not configured in this deployment.",
        engine_unreachable:
          "Ordering is disabled: the order service cannot be reached (it may be offline, or not accept requests from this site).",
        orders_not_accepted:
          "Ordering is disabled on this network: the order service does not accept orders here yet (no settlement program or USDT configured).",
        settlement_disabled:
          "Ordering is disabled on this network: the order service would accept and match orders, but its settlement worker does not settle on this network, so matches would never settle.",
        config_mismatch:
          "Ordering is disabled: this site's configuration does not match the order service (settlement program or USDT differ).",
        paused: "Ordering is disabled: the settlement program is paused on-chain.",
      } as Record<string, string>,
      steps: {
        sign: "Sign the order intent in your wallet",
        explain: "Read what the approval does, then continue",
        approve: "Approve the exact amount in your wallet",
        confirming: "Waiting for the approval to confirm on-chain",
        submit: "Submitting the signed intent to the order service",
      },
      rejected: "You rejected the request in your wallet. Nothing was sent.",
      approvalCancelled: "You cancelled before the approval. Nothing was sent and the order was not submitted.",
      approvalTx: "Approval transaction",
      failed: "The order was not placed.",
      accepted: "Order accepted by the order service.",
      acceptedStatus: (status: string, matches: number) =>
        `Status: ${status}. ${matches === 0 ? "No match yet." : `${matches} match${matches === 1 ? "" : "es"} — see Your orders for settlement.`}`,
      reset: "New order",
      signedText: "What your wallet signs",
      loadingChain: "Reading the network…",
    },

    session: {
      title: "Your orders and settlements",
      ordersTab: "Orders",
      settlementsTab: "Settlements",
      connect: "Connect a wallet for this network to see your orders and settlements.",
      loading: "Loading…",
      empty: "This wallet has no order on this network.",
      noSettlements: "This wallet has no match on this network yet.",
      truncated: "Showing your most recent orders only.",
      publicNote:
        "Testnet: the order service lists a wallet's orders by address, without sign-in. A mainnet deployment will require signing in.",
      lots: "lots",
      filled: (filled: string, remaining: string) => `Filled ${filled} · remaining ${remaining} lots`,
      placed: "Placed",
      expires: "Expires",
      noMatches: "No match yet: the order rests in the book.",
      matchQty: (lots: string, price: string) => `${lots} lots at ${price} USDT/lot`,
      matchStatus: {
        pending: "Matched off-chain — waiting for settlement",
        settling: "Settlement in progress",
        settled: "Settled on-chain",
        failed: "Settlement failed",
      } as Record<string, string>,
      role: { maker: "maker", taker: "taker" } as Record<string, string>,
      viewTx: "View transaction",
      attempts: (n: number) => `${n} attempt${n === 1 ? "" : "s"}`,
      cancel: "Cancel (signed)",
      cancelling: "Sign the cancellation in your wallet…",
      cancelNote:
        "Cancelling removes the order from the book off-chain. The on-chain guarantee is revoking your approval in your wallet.",
      cancelReason: {
        by_wallet: "cancelled by you",
        self_trade_prevention: "cancelled: would trade with your own order",
        below_min_notional: "cancelled: below the minimum order value",
      } as Record<string, string>,
      orderStatus: {
        open: "Open",
        partially_filled: "Partially filled",
        filled: "Filled",
        cancelled: "Cancelled",
        expired: "Expired",
        stale: "Stale (approval or balance no longer covers it)",
      } as Record<string, string>,
    },

    errors: {
      unreachable: (url: string) =>
        `Could not reach the order service at ${url}. It may be offline, or it does not accept requests from this site (CORS).`,
      marketData: "Could not load market data from the exchange database.",
      marketNotConfigured: "The exchange database (Supabase) is not configured in this deployment.",
      chainRead: "Could not read this network's RPC.",
      generic: (message: string) => `Something went wrong: ${message}`,
      signedTx: (detail: string) =>
        `Your wallet returned a transaction that differs from the approval this site built, beyond the priority-fee and safety-check instructions wallets may add, so it was not sent. ${detail}.`,
      delegationMismatch:
        "The approval confirmed on-chain, but your token account does not show exactly the intended delegation to the program vault (it may have changed in the meantime, for example if an order settled). The order was not submitted.",
      codes: {
        delegate_not_covered: "The order service found that your on-chain approval or balance does not cover the order.",
        duplicate_nonce: "This order intent was already submitted.",
        too_many_open_orders: "Too many open orders for this wallet on this network.",
        bad_signature: "The order service rejected the signature.",
        expired: "The intent expired before it reached the order service.",
        expiry_too_far: "The expiry is further than this network allows.",
        chain_not_ready: "This network is not ready for orders on the order service.",
        wrong_settlement: "The intent names a different settlement program or contract than the order service.",
        wrong_payment_asset: "The intent names a different USDT than the order service.",
        chain_unavailable: "The order service could not read the chain. Try again.",
        not_live: "The order is no longer live.",
        unknown_order: "The order service does not know this order.",
        unavailable: "The order service is temporarily unavailable.",
      } as Record<string, string>,
    },
  },

  exchange: {
    metaTitle: "Exchange — Niara",
    metaDescription:
      "Niara's simulated currency converter — reference rates between reais, dollars, euros, and crypto.",
    demoBanner: "reference rates, simulated. Not market values.",
    heading: "Exchange",
    subheading:
      "Convert between fiat currencies and crypto using simulated reference rates.",

    converter: {
      from: "From",
      to: "To",
      fromCurrencyLabel: "Source currency",
      toCurrencyLabel: "Target currency",
      invert: "Invert source and target currencies",
      unitRateSuffix: "(simulated reference)",
      estimatedFee: "Estimated Niara fee (0.1%)",
      estimatedNet: "Estimated net amount",
      convert: "Convert",
      disclaimer: "Demonstration — no real conversion is performed.",
      currencies: {
        BRL: "Real (BRL)",
        USD: "Dollar (USD)",
        EUR: "Euro (EUR)",
        ETH: "Ether (ETH)",
        BTC: "Bitcoin (BTC)",
        USDC: "USD Coin (USDC)",
        USDT: "Tether (USDT)",
      } as Record<string, string>,
    },

    rateGrid: {
      title: "Major pairs",
      subtitle: "Reference rates — simulation, not market values.",
    },
  },

  assets: {
    metaTitle: "Assets — Niara",
    metaDescription:
      "Niara's simulated asset portfolio and full catalog of assets available for trading.",
    demoBanner: "simulated portfolio. Does not reflect real positions or values.",
    heading: "Assets",
    sectionsAriaLabel: "Asset sections",
    myPortfolioTab: "My portfolio",
    availableAssetsTab: "Available assets",

    summary: {
      totalEquity: "Total equity",
      investedValue: "Invested value",
      totalPl: "Total profit/loss",
      periodReturn: "Return for period",
      last12Months: "last 12 months",
      simulatedHint: "Simulated — not from your connected wallet",
    },

    evolution: {
      title: "Portfolio evolution",
      periodAriaLabel: "Period",
      max: "Max",
      investedValue: "Invested value",
      capitalGain: "Capital gain",
      description: (months: number) =>
        `Text description of the chart: invested value and accumulated capital gain, month by month, over the last ${months} months — the same data appears in the positions table below.`,
    },

    allocation: {
      title: "Allocation",
      viewAriaLabel: "View allocation",
      byClass: "By class",
      byAsset: "By asset",
      byRegion: "By country/region",
    },

    holdings: {
      title: "Positions",
      empty: "No positions in the simulated portfolio.",
      asset: "Asset",
      quantity: "Quantity",
      avgPrice: "Avg. price",
      currentPrice: "Current price",
      totalValue: "Total value",
      pctOfPortfolio: "% of portfolio",
      pl: "P/L",
    },

    catalog: {
      searchLabel: "Search asset",
      searchPlaceholder: "Search by name or symbol",
      classFilterLabel: "Filter by class",
      regionFilterLabel: "Filter by region",
      allClasses: "All classes",
      allRegions: "All regions",
      empty: "No assets found.",
      asset: "Asset",
      assetClass: "Class",
      price: "Price",
      change24h: "24h change",
      volume24h: "24h volume",
      actions: "Actions",
      trade: "Trade",
    },
  },

  profile: {
    metaTitle: "Profile — Niara",
    metaDescription: "Personal data, investor profile, and wallet.",
    demoBanner:
      "illustrative form. No data is sent to servers or stored permanently.",
    heading: "Profile",
    sectionsAriaLabel: "Profile sections",

    nav: {
      personalData: "Personal data",
      investorProfile: "Investor profile",
      wallet: "Wallet",
    },

    pendingAlert: {
      title: "Investor profile assessment pending",
      suffix: "— required to trade.",
      cta: "Answer now",
    },

    personalData: {
      notVerified: "Not verified",
      kycNote:
        "Identity verification (KYC) will be required once the product goes live. No approval is simulated here.",
      investorPending: "Investor profile: pending",
      investorLabelPrefix: "Investor profile:",
      avatar: {
        changeLabel: "Change",
        removeLabel: "Remove",
        hint: "JPG or PNG, up to 2MB. The image is never uploaded — it stays in your browser.",
        invalidType: "Please select an image file.",
        tooLarge: "The image must be at most 2MB.",
        photoAlt: "Profile photo",
        selectLabel: "Select profile photo",
      },
      savedConfirmation:
        "Data saved — simulated confirmation, nothing was sent to a server.",
      personalSection: "Personal",
      addressSection: "Address",
      fullName: "Full name",
      dob: "Date of birth",
      email: "Email",
      phone: "Phone",
      street: "Street",
      number: "Number",
      complement: "Complement",
      neighborhood: "Neighborhood",
      city: "City",
      cityState: "City / State",
      notInformed: "Not informed",
      edit: "Edit",
      save: "Save (simulation)",
      cancel: "Cancel",
      saveHint:
        "When you save, the data stays only on this page (browser state) — this is a simulation, nothing is sent to a server.",

      // country: the section's first field; it determines the document/date/
      // phone/address fields that follow
      country: "Country",
      selectCountry: "Select a country",
      searchCountryPlaceholder: "Search country...",
      noCountriesFound: "No country found.",
      detectedHint: "Detected from your location — change it if it's wrong.",

      // identity document label + placeholder per country (ISO alpha-2).
      // Countries not in the map fall back to genericDocument.
      // Extend as new markets are served.
      documents: {
        BR: { label: "CPF", placeholder: "000.000.000-00" },
        US: { label: "SSN / ITIN", placeholder: "000-00-0000" },
        GB: { label: "National Insurance Number", placeholder: "QQ 12 34 56 C" },
        PT: { label: "NIF", placeholder: "123456789" },
        DE: { label: "Steuer-ID", placeholder: "00 000 000 000" },
        FR: { label: "Numéro fiscal", placeholder: "00 00 000 000 000" },
        ES: { label: "DNI / NIE", placeholder: "00000000-X" },
        IT: { label: "Codice Fiscale", placeholder: "XXXXXX00X00X000X" },
        CA: { label: "SIN", placeholder: "000-000-000" },
        AU: { label: "Tax File Number (TFN)", placeholder: "000 000 000" },
        MX: { label: "RFC", placeholder: "XXXX000000XXX" },
        AR: { label: "CUIT", placeholder: "00-00000000-0" },
        CL: { label: "RUT", placeholder: "00.000.000-0" },
        JP: { label: "My Number", placeholder: "0000 0000 0000" },
        SG: { label: "NRIC / FIN", placeholder: "S0000000A" },
        AE: { label: "Emirates ID", placeholder: "000-0000-0000000-0" },
        CH: { label: "AHV / AVS Number", placeholder: "756.0000.0000.00" },
        NL: { label: "BSN", placeholder: "123456789" },
      } as Record<string, { label: string; placeholder: string }>,
      genericDocument: { label: "Tax ID / National ID", placeholder: "" },

      // regional labels that vary by country (postal code and state/
      // province); BR and US have their own, the rest use the default
      postalLabels: { BR: "CEP", US: "ZIP code" } as Record<string, string>,
      postalLabelDefault: "Postal code",
      regionLabelBR: "State",
      regionLabelDefault: "State / Province / Region",
      selectState: "Select",

      errors: {
        fullName: "Enter your full name.",
        dob: "Invalid date, or you must be 18 or older.",
        email: "Invalid email.",
        phone: "Invalid phone number.",
        street: "Enter the street.",
        number: "Enter the number.",
        neighborhood: "Enter the neighborhood.",
        city: "Enter the city.",
        country: "Select a country.",
        document: (label: string) => `Invalid ${label}.`,
        postalCode: (label: string) => `Invalid ${label}.`,
        region: (label: string) => `Enter the ${label}.`,
      },
    },

    investorProfile: {
      title: "Investor profile",
      intro:
        "Equivalent to Brazil's API (Investor Profile Assessment) required by the CVM. In production, this assessment would be mandatory before trading, and registration is only complete after answering it — here, since this is a demo, the rest of the site remains accessible.",
      questionCounter: (current: number, total: number) =>
        `Question ${current} of ${total}`,
      back: "Back",
      next: "Next",
      seeResult: "See result",
      assessedOn: (date: string) => `Assessed on ${date}`,
      whatItMeans: "What this profile means",
      riskReaction: "Reaction to risk and volatility",
      assetClasses: "Most suitable asset classes",
      disclaimer:
        "Illustrative result. This does not constitute investment advice or replace the investor profile assessment required by regulation.",
      retake: "Retake assessment",
    },

    wallet: {
      title: "Wallet",
      subtitle:
        "Connect a real wallet (MetaMask, Sepolia testnet) to link it to your profile. Read-only — no on-chain transaction happens here.",
    },
  },

  docs: {
    metaTitle: "Docs & FAQs — Niara",
    metaDescription:
      "Niara's institutional documentation: what it is, how tokenization works, issuer cashback, revenue model, and technology.",
    heading: "Documentation",
    subheading:
      "What Niara is, how tokenization works, and what stage the project is at today.",
    navAriaLabel: "Documentation navigation",

    sections: {
      whatIs: "What is Niara",
      tokenization: "How tokenization works",
      cashback: "Issuer cashback",
      revenue: "Revenue model",
      technology: "Technology",
      faq: "FAQ",
    },

    whatIs:
      "Niara is an infrastructure for tokenizing real-world assets — stocks, ETFs, commodities, and crypto assets — with 1:1 backing under regulated custody. Once tokenized, these assets can be traded 24 hours a day, 7 days a week, on a decentralized exchange, without depending on traditional exchanges or settlement networks like SWIFT.",

    tokenizationSteps: [
      {
        title: "Custody of the real asset",
        text: "The asset (stock, ETF, commodity, or crypto asset) is placed under custody.",
      },
      {
        title: "Issuance of the backed token",
        text: "A 1:1 token is issued on-chain, representing the fraction of the asset in custody.",
      },
      {
        title: "On-chain trading",
        text: "The token circulates and is freely traded on Niara's decentralized exchange.",
      },
      {
        title: "Redemption or burn",
        text: "The holder can redeem the token, which is burned as the corresponding backing is released.",
      },
    ],

    cashback:
      "A portion of the transaction fee is automatically returned, via smart contract, to the issuing company's wallet — proportional to the trading volume of its own asset. This mechanism is Niara's main differentiator and the main driver of adoption among companies: the more liquid a company's tokenized asset becomes, the more recurring revenue it earns, with no additional operating cost.",

    revenueItems: [
      {
        title: "Transaction fee",
        text: "0.1% to 0.5% of each trade, paid in USDT.",
      },
      {
        title: "Listing/tokenization fee",
        text: "0.1% to 1% of the issuer's valuation, charged to the issuing company when listing an asset on Niara and paid in USDT.",
      },
    ],

    technology:
      "Niara's contracts are written in Solidity and are EVM-compatible (Ethereum Virtual Machine), which allows deployment on any compatible network — the final network is still being defined. In the long run, the vision is to migrate to a dedicated blockchain (L1), built for the specific needs of a tokenized-asset market operating 24/7.",
    technologyNoteLabel: "Current stage:",
    technologyNote:
      "prototype in a testnet environment. There are no contracts in production on mainnet, nor any published security audit at this time.",

    faqTitle: "Frequently asked questions",

    faqItems: [
      {
        question: "What is a tokenized asset?",
        answer:
          "It's the digital representation of a real asset — a stock, an ETF, a commodity, or a crypto asset — recorded on-chain as a token. Each token is backed 1:1 by the corresponding asset, held in custody.",
      },
      {
        question: "What guarantees the backing?",
        answer:
          "The real asset is held under regulated custody, and the token is only issued after that backing is confirmed. The custody process (responsible institution, reserve audits) is still being defined — we do not currently claim a specific custody structure in production.",
      },
      {
        question: "Do I need a wallet to trade?",
        answer:
          "Yes, on-chain trading depends on a wallet compatible with the network used. Wallet connection is not yet available on the site — the current terminal and exchange are demonstrations with simulated data.",
      },
      {
        question: "What are the fees?",
        answer:
          "The planned model has two fees, both paid in USDT: a transaction fee of 0.1% to 0.5% of each trade, and a listing/tokenization fee of 0.1% to 1% of the issuer's valuation. Final figures within these ranges are still being defined.",
      },
      {
        question: "How does a company list its asset on Niara?",
        answer:
          "The process involves due diligence of the asset, structuring custody of the backing, and configuring the issuance smart contract — including the issuer cashback mechanism. Reach out through the Contact page to discuss listing.",
      },
      {
        question: "What stage is the project at?",
        answer:
          "Niara is under development: the current site shows the product structure with a fully simulated terminal, exchange, and wallet, with no connection to blockchain or real market data. The smart contracts are in prototype stage, in a testnet environment.",
      },
    ],
  },

  contact: {
    metaTitle: "Contact — Niara",
    metaDescription: "Reach out to Niara for partnerships, asset issuance, or support.",
    heading: "Contact",
    subheading:
      "Partnerships, asset issuance, press, or support — pick a topic and tell us about it.",
    directTitle: "Get in touch directly",

    form: {
      nameLabel: "Name",
      emailLabel: "Email",
      interestLabel: "Type of inquiry",
      messageLabel: "Message",
      interestOptions: ["Issuing company", "Investor", "Press", "Support", "Other"],
      nameError: "Enter your name.",
      emailError: "Enter an email address.",
      emailInvalid: "Invalid email format.",
      messageError: "Write a message.",
      disclaimer: (email: string) =>
        `There's no automatic sending yet — submitting will open your default email client with the message pre-filled to ${email}.`,
      submit: "Open email",
      subjectPrefix: (interest: string, name: string) =>
        `[Niara] Contact — ${interest} — ${name}`,
    },
  },

  pilot: {
    metaTitle: "Wallet Pilot — Niara",
    metaDescription: "Technical pilot for real wallet connection on the Sepolia testnet.",
    heading: "Wallet connection pilot",
    subheading:
      "Real-independence pilot: connect a real wallet via MetaMask on Sepolia and sign real test transactions. Isolated environment — the rest of the site still uses simulated data.",
    bannerLabel: "Sepolia Testnet",
    bannerText:
      "Test network only. Tokens have no economic value. This is a technical demonstration environment, not a financial product.",
    connect: "Connect wallet",
    connectWith: (name: string) => `Connect ${name}`,
    connecting: "Connecting…",
    disconnect: "Disconnect",
    switchNetwork: "Switch to Sepolia",
    switching: "Switching…",
    wrongNetwork: "Wrong network",
    noWallet: "No wallet extension detected.",
    installMetaMask: "Install MetaMask",
    rejected: "Connection request rejected.",
    panelTitle: "Connection details",
    addressLabel: "Address",
    chainIdLabel: "Chain ID",
    networkLabel: "Network",
    statusLabel: "Status",
    statusConnected: "Connected",
    statusDisconnected: "Not connected",
    notConnectedHint: "Connect your wallet to see the details here.",
  },

  web3: {
    balances: {
      title: "On-chain balances",
      badge: "Sepolia testnet — real",
      testnetNote:
        "Real balances read directly from the Sepolia testnet. These are test tokens with no economic value — not a price or market feed.",
      notConnected: "Connect your wallet to see on-chain balances.",
      wrongNetworkText:
        "These balances are read from the Sepolia testnet. Switch networks to see them.",
      retry: "Retry",
    },

    approve: {
      title: "Approve USDT spending",
      badge: "Real signed transaction — Sepolia",
      description:
        "This authorizes the NiaraSettlement contract to spend up to the amount you enter, from your mUSDT balance. This prepares settlement, which is a later step — no settlement happens here.",
      warning:
        "This is a REAL transaction on the Sepolia testnet: you will sign it with your wallet, it costs test gas, and it cannot be undone. The token has no economic value.",
      notConnected: "Connect your wallet to approve USDT spending.",
      wrongNetworkText:
        "Approving requires the Sepolia testnet. Switch networks before continuing.",
      spenderLabel: "Spender (NiaraSettlement)",
      tokenLabel: "Token (mUSDT)",
      amountLabel: "Amount to approve",
      amountPlaceholder: "0.00",
      balanceLabel: "Available balance",
      loadingTokenData: "Loading token data from Sepolia…",
      submit: "Approve USDT",

      errorEmpty: "Enter an amount.",
      errorInvalid: "Enter a valid positive number.",
      errorZero: "Amount must be greater than zero.",
      errorExceedsBalance: "Amount exceeds your available mUSDT balance.",
      errorTooManyDecimals: "Too many decimal places for this token.",

      statusAwaitingSignature: "Waiting for your signature in MetaMask…",
      statusAwaitingConfirmation: "Transaction sent. Waiting for on-chain confirmation…",
      statusConfirmed: "Approval confirmed on-chain.",
      statusReverted: "The transaction was reverted on-chain — the approval did not take effect.",
      statusRejected: "You rejected the signature request in your wallet. No transaction was sent.",
      statusInsufficientFunds:
        "Insufficient Sepolia ETH to pay for gas. Get test ETH from a faucet and try again.",
      statusReceiptError:
        "Could not confirm the transaction status. Check the hash on Etherscan.",
      statusGenericError: "The transaction failed. Check the details on Etherscan.",

      hashLabel: "Transaction hash",
      viewOnEtherscan: "View on Etherscan",
      currentAllowanceLabel: "Current on-chain allowance",
      tryAgain: "Try again",
      newApproval: "New approval",
    },
  },

  styleguide: {
    title: "Niara — Style Guide",
    subtitle: "Internal reference for design tokens. Not marketing content.",
    surfaces: "Colors — Surfaces",
    text: "Colors — Text",
    accent: "Colors — Accent",
    semantic: "Colors — Semantic",
    typography: "Typography",
    typographyBody:
      "This paragraph uses Inter, the default body font. It's the family used for interface, long-form text, and general site content — legible at any size.",
    primaryGradient: "primary gradient",
    buttonsLinks: "Buttons and links",
    primaryButton: "Primary button",
    secondaryButton: "Secondary button",
    featuredLink: "Featured link",
    cards: "Cards",
    surfaceCardTitle: "bg-surface",
    surfaceCardText: "Default card over the base background, used for panels and content blocks.",
    elevatedCardTitle: "bg-elevated",
    elevatedCardText: "Elevated card, used on hover or to highlight an element over bg-surface.",
  },
} as const;

export type Dictionary = typeof en;
