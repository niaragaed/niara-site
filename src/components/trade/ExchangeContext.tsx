"use client";

// Estado compartilhado via Context (em vez de elevar tudo em ExchangeTerminal
// e prop-drillar) porque o terminal tem ~6 painéis irmãos (conta, gráfico,
// livro, boleta, ordens, posições) que leem e escrevem o mesmo estado —
// passar 8+ props por vários níveis ficaria mais confuso do que um Provider
// único no topo com um hook `useExchange()`.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_ASSETS, type Asset } from "@/lib/mock-assets";
import { generateMockOrderBook, type BookOrder } from "@/lib/mock-orderbook";
import { INITIAL_BALANCE_ETH, SEED_POSITIONS } from "@/lib/mock-account";
import {
  applyFillToPosition,
  getBestPrices,
  resolveOrder,
  type OpenOrder,
  type OrderSide,
  type Position,
} from "@/lib/trading";

const FEE_RATE = 0.001; // 0,1% — taxa estimada da Niara

export type SubmitResult =
  | { status: "filled"; fillPrice: number }
  | { status: "resting" };

type ExchangeState = {
  assets: Asset[];
  selectedAsset: Asset;
  selectAsset: (asset: Asset) => void;

  // simulado — nenhum valor aqui reflete saldo ou posição reais
  balance: number;
  buyingPower: number;
  marginUsed: number;
  pnlToday: number;

  openOrders: OpenOrder[];
  positions: Position[];
  bookForSelected: { asks: BookOrder[]; bids: BookOrder[] };

  submitOrder: (side: OrderSide, qty: number, price: number) => SubmitResult;
  cancelOrder: (id: string) => void;
  closePosition: (symbol: string) => void;
};

const ExchangeContext = createContext<ExchangeState | null>(null);

export function useExchange(): ExchangeState {
  const ctx = useContext(ExchangeContext);
  if (!ctx) {
    throw new Error("useExchange precisa estar dentro de <ExchangeProvider>");
  }
  return ctx;
}

export function ExchangeProvider({
  children,
  initialSymbol,
}: {
  children: ReactNode;
  initialSymbol?: string;
}) {
  // só usado na primeira renderização (useState ignora mudanças depois) —
  // é assim que /trade?asset=XXXX pré-seleciona o ativo vindo de /assets
  const [selectedAsset, setSelectedAsset] = useState<Asset>(
    () => MOCK_ASSETS.find((asset) => asset.symbol === initialSymbol) ?? MOCK_ASSETS[0],
  );
  const [balance, setBalance] = useState(INITIAL_BALANCE_ETH);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [positions, setPositions] = useState<Position[]>(SEED_POSITIONS);

  const priceBySymbol = useMemo(() => {
    const map = new Map<string, number>();
    MOCK_ASSETS.forEach((asset) => map.set(asset.symbol, asset.priceEth));
    return map;
  }, []);

  const marginUsed = useMemo(
    () => positions.reduce((sum, p) => sum + Math.abs(p.qty) * p.avgPrice, 0),
    [positions],
  );

  // P/L "do dia" ilustrativo: compara o preço médio de cada posição com o
  // preço de referência mock do ativo (não há série intradiária real aqui).
  const pnlToday = useMemo(
    () =>
      positions.reduce((sum, p) => {
        const current = priceBySymbol.get(p.symbol) ?? p.avgPrice;
        return sum + (current - p.avgPrice) * p.qty;
      }, 0),
    [positions, priceBySymbol],
  );

  const buyingPower = balance * 2; // limite operacional simulado (2x o saldo)

  const bookForSelected = useMemo(() => {
    const base = generateMockOrderBook(
      selectedAsset.symbol,
      selectedAsset.priceEth,
    );
    const resting = openOrders.filter((o) => o.symbol === selectedAsset.symbol);
    const restingAsks: BookOrder[] = resting
      .filter((o) => o.side === "sell")
      .map((o) => ({ id: o.id, side: "sell", qty: o.qty, price: o.price, isUser: true }));
    const restingBids: BookOrder[] = resting
      .filter((o) => o.side === "buy")
      .map((o) => ({ id: o.id, side: "buy", qty: o.qty, price: o.price, isUser: true }));

    // sempre reordenado após inserção: asks do maior pro menor, bids do
    // maior pro menor — é essa reordenação que evita o spread quebrado.
    const asks = [...base.asks, ...restingAsks].sort((a, b) => b.price - a.price);
    const bids = [...base.bids, ...restingBids].sort((a, b) => b.price - a.price);
    return { asks, bids };
  }, [selectedAsset, openOrders]);

  const submitOrder = useCallback(
    (side: OrderSide, qty: number, price: number): SubmitResult => {
      const symbol = selectedAsset.symbol;
      const { bestAsk, bestBid } = getBestPrices(
        bookForSelected.asks,
        bookForSelected.bids,
      );
      const { crossed, fillPrice } = resolveOrder(side, price, bestAsk, bestBid);

      if (crossed) {
        const total = qty * fillPrice;
        const fee = total * FEE_RATE;
        setBalance((prev) => prev + (side === "buy" ? -(total + fee) : total - fee));
        setPositions((prev) => {
          const existing = prev.find((p) => p.symbol === symbol);
          const updated = applyFillToPosition(existing, side, qty, fillPrice);
          const rest = prev.filter((p) => p.symbol !== symbol);
          return updated.qty === 0 ? rest : [...rest, { symbol, ...updated }];
        });
        return { status: "filled", fillPrice };
      }

      const newOrder: OpenOrder = {
        id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        symbol,
        side,
        qty,
        price,
      };
      setOpenOrders((prev) => [newOrder, ...prev]);
      return { status: "resting" };
    },
    [selectedAsset, bookForSelected],
  );

  const cancelOrder = useCallback((id: string) => {
    setOpenOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const closePosition = useCallback(
    (symbol: string) => {
      const position = positions.find((p) => p.symbol === symbol);
      if (!position) return;
      const current = priceBySymbol.get(symbol) ?? position.avgPrice;
      const proceeds = position.qty * current;
      const fee = Math.abs(proceeds) * FEE_RATE;
      setBalance((b) => b + proceeds - fee);
      setPositions((prev) => prev.filter((p) => p.symbol !== symbol));
    },
    [positions, priceBySymbol],
  );

  const value: ExchangeState = {
    assets: MOCK_ASSETS,
    selectedAsset,
    selectAsset: setSelectedAsset,
    balance,
    buyingPower,
    marginUsed,
    pnlToday,
    openOrders,
    positions,
    bookForSelected,
    submitOrder,
    cancelOrder,
    closePosition,
  };

  return (
    <ExchangeContext.Provider value={value}>{children}</ExchangeContext.Provider>
  );
}
