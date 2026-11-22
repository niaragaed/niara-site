"use client";

// Real terminal on testnet. DOM order = mobile order (single column):
// listing, book, ticket, history (empty), session orders. On desktop,
// wide column on the left (history + orders), narrow one on the right.

import { CHAINS } from "@/lib/exchange/chains";
import { CHAIN_LABEL } from "@/lib/exchange/config";
import { SolanaWalletProvider } from "@/components/web3/SolanaWalletProvider";
import { TestnetBanner } from "@/components/web3/TestnetBanner";
import { evmNetworkName } from "@/lib/web3/config";
import { useConnection } from "wagmi";
import { en } from "@/lib/i18n/en";
import { NetworkWalletBar } from "./NetworkWalletBar";
import { ListingsPanel } from "./ListingsPanel";
import { OrderBookPanel, TradeHistoryEmpty } from "./OrderBookPanel";
import { OrderTicket } from "./OrderTicket";
import { SessionOrders } from "./SessionOrders";
import { TradeProvider, useTrade } from "./TradeContext";

function Banner() {
  const { chain, wallet } = useTrade();
  const evm = useConnection();
  let network = CHAIN_LABEL[chain];
  // EVM: also shows the network the wallet is on, if it differs.
  if (CHAINS[chain].kind === "evm" && evm.isConnected && evm.chainId !== CHAINS[chain].evmChainId) {
    const actual = evm.chainId === undefined ? null : (evmNetworkName(evm.chainId) ?? en.testnet.unknownNetwork(evm.chainId));
    if (actual) network = `${network} — ${en.testnet.walletOn(actual)}`;
  }
  return <TestnetBanner network={network} wallet={wallet} />;
}

function Layout() {
  return (
    <div className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,2fr)_380px]">
      <div className="lg:col-start-2 lg:row-start-1">
        <ListingsPanel />
      </div>
      <div className="min-h-[240px] lg:col-start-2 lg:row-start-2">
        <OrderBookPanel />
      </div>
      <div className="lg:col-start-2 lg:row-start-3">
        <OrderTicket />
      </div>
      <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <TradeHistoryEmpty />
      </div>
      <div className="min-h-[240px] lg:col-start-1 lg:row-start-3">
        <SessionOrders />
      </div>
    </div>
  );
}

export function ExchangeTerminal({ initialAsset }: { initialAsset?: string }) {
  return (
    <SolanaWalletProvider>
      <TradeProvider initialAsset={initialAsset}>
        <div className="flex min-h-[70vh] flex-col bg-bg-base">
          <Banner />
          <NetworkWalletBar />
          <p className="mx-auto w-full max-w-[1600px] px-4 pt-3 text-xs text-text-muted sm:px-6">{en.trade.flowNote}</p>
          <Layout />
        </div>
      </TradeProvider>
    </SolanaWalletProvider>
  );
}
