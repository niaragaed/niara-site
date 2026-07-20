// Central dictionary for all interface copy. English is the default (and,
// for now, only) language — components import `en` directly, no routing or
// locale switching involved.
// TODO: adicionar pt.ts e um seletor de idioma quando houver demanda bilíngue.

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

  trade: {
    metaTitle: "Trade — Niara",
    metaDescription:
      "Niara's simulated trading terminal: chart, order book, orders, and positions.",
    demoBanner: "simulated data. No orders are executed and no real assets are traded.",
    terminalLabel: "Terminal",
    connectWallet: "Connect wallet",
    walletSimTitle: "Simulation — no real wallet is connected",

    accountBar: {
      walletBalance: "Wallet balance",
      buyingPower: "Buying power",
      buyingPowerHint: "(simulated limit)",
      marginUsed: "Margin used",
      todayPnl: "Today's P/L",
      referenceSuffix: "(simulated reference)",
    },

    currencySelector: {
      ariaLabel: "Display currency",
      chooseLabel: "Choose display currency",
      eth: "Ether",
      usd: "Dollar (reference)",
      brl: "Real (reference)",
      usdc: "Stablecoin (~US$ parity)",
    },

    assetSearch: {
      searchLabel: "Search asset",
      placeholder: "Search asset (e.g., PETR4)",
      resultsAriaLabel: "Asset search results",
    },

    priceChart: {
      timeframeAriaLabel: "Timeframe",
      indicators: "Indicators",
      searchIndicatorLabel: "Search indicator",
      searchIndicatorPlaceholder: "Search indicator...",
      removeIndicator: (label: string) => `Remove indicator ${label}`,
      overlayGroup: "Overlay",
      paneGroup: "Separate pane",
      bollinger: "Bollinger Bands",
      donchian: "Donchian Channel",
      stochastic: "Stochastic (14/3/3)",
    },

    orderBook: {
      title: "Order book",
      qty: "Qty.",
      asset: "Asset",
      price: "Price",
      spread: "Spread",
    },

    orderForm: {
      title: "New order",
      sideGroupLabel: "Order side",
      buy: "Buy",
      sell: "Sell",
      qtyLabel: "Token quantity",
      priceLabel: "Price",
      total: "Total",
      estimatedFee: "Estimated Niara fee (0.1%)",
      deviationWarning: (pct: string, ref: string) =>
        `This price is ${pct}% away from the reference price (${ref}). Double-check before continuing.`,
      invalidError: "Enter a valid quantity and price (greater than zero).",
      approve: "1. Approve token",
      approved: "Approved ✓",
      execute: "2. Execute order",
      simDisclaimer: "Simulation — no order is sent to the blockchain.",
      filledConfirmation: (side: "buy" | "sell", price: string) =>
        `Simulated ${side} order executed at ${price} — no real transaction was made.`,
      restingConfirmation: (side: "buy" | "sell") =>
        `Simulated ${side} order placed as open in the book — no real transaction was made.`,
    },

    ordersPositions: {
      tabsAriaLabel: "Orders and positions",
      ordersTab: "Orders",
      positionsTab: "Positions",
      memoryHint: "In memory — cleared on page reload",
      noOpenOrders: "No open orders.",
      noPositions: "No positions.",
      time: "Time",
      asset: "Asset",
      side: "Side",
      qty: "Qty",
      price: "Price",
      total: "Total",
      status: "Status",
      actions: "Actions",
      buy: "Buy",
      sell: "Sell",
      open: "Open",
      cancel: "Cancel",
      avgPrice: "Avg. price",
      currentPrice: "Current price",
      pnl: "P/L",
      closePosition: "Close",
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
      cpf: "CPF (Brazilian tax ID)",
      dob: "Date of birth",
      email: "Email",
      phone: "Phone",
      postalCode: "Postal code (CEP)",
      street: "Street",
      number: "Number",
      complement: "Complement",
      neighborhood: "Neighborhood",
      city: "City",
      state: "State",
      cityState: "City / State",
      selectState: "Select",
      notInformed: "Not informed",
      edit: "Edit",
      save: "Save (simulation)",
      cancel: "Cancel",
      saveHint:
        "When you save, the data stays only on this page (browser state) — this is a simulation, nothing is sent to a server.",
      errors: {
        fullName: "Enter your full name.",
        cpf: "Invalid CPF.",
        dob: "Invalid date, or you must be 18 or older.",
        email: "Invalid email.",
        phone: "Invalid phone number.",
        postalCode: "Invalid postal code.",
        street: "Enter the street.",
        number: "Enter the number.",
        neighborhood: "Enter the neighborhood.",
        city: "Enter the city.",
        state: "Select a state.",
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
      subtitle: "Simulated wallet connection — no on-chain transaction happens here.",
      noWalletConnected: "No wallet connected in this session.",
      connect: "Connect wallet (simulation)",
      disconnect: "Disconnect",
      simulatedBalance: "Simulated balance",
      linkedWallets: "Linked wallets",
      primary: "Primary",
      setPrimary: "Set as primary",
      remove: "Remove",
      none: "No linked wallets.",
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
        text: "0.1% to 0.15% on each trade.",
      },
      {
        title: "Listing/tokenization fee",
        text: "charged to the issuing company when listing an asset on Niara.",
      },
      {
        title: "Custody fee",
        text: "AUM-based model (percentage of the volume of assets under custody).",
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
          "The planned model includes a transaction fee (0.1%–0.15%), a listing/tokenization fee for issuing companies, and a custody fee on the volume under custody (AUM model). Final figures are still being defined.",
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
