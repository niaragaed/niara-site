"use client";

// Shared state through Context (instead of lifting everything into
// ExchangeTerminal and prop-drilling) because the terminal has ~6 sibling
// panels (account, chart, order book, order form, orders, positions) that read
// and write the same state. Passing 8+ props through several levels would be
// more confusing than a single top-level Provider with a `useExchange()` hook.

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
import { INITIAL_BALANCE_USDT, SEED_POSITIONS } from "@/lib/mock-account";
import {
  applyFillToPosition,
  getBestPrices,
  resolveOrder,
  type OpenOrder,
  type OrderSide,
  type Position,
} from "@/lib/trading";

const FEE_RATE = 0.001; // 0.1%: estimated Niara fee

export type SubmitResult =
  | { status: "filled"; fillPrice: number }
  | { status: "resting" };

type ExchangeState = {
  assets: Asset[];
  selectedAsset: Asset;
  selectAsset: (asset: Asset) => void;

  // simulated: no value here reflects a real balance or position
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
    throw new Error("useExchange must be used inside <ExchangeProvider>");
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
  // only used on the first render (useState ignores later changes); this is
  // how /trade?asset=XXXX preselects the asset coming from /assets
  const [selectedAsset, setSelectedAsset] = useState<Asset>(
    () => MOCK_ASSETS.find((asset) => asset.symbol === initialSymbol) ?? MOCK_ASSETS[0],
  );
  const [balance, setBalance] = useState(INITIAL_BALANCE_USDT);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [positions, setPositions] = useState<Position[]>(SEED_POSITIONS);

  const priceBySymbol = useMemo(() => {
    const map = new Map<string, number>();
    MOCK_ASSETS.forEach((asset) => map.set(asset.symbol, asset.priceUsdt));
    return map;
  }, []);

  const marginUsed = useMemo(
    () => positions.reduce((sum, p) => sum + Math.abs(p.qty) * p.avgPrice, 0),
    [positions],
  );

  // Illustrative "day" P/L: compares each position's average price with the
  // asset's mock reference price (there is no real intraday series here).
  const pnlToday = useMemo(
    () =>
      positions.reduce((sum, p) => {
        const current = priceBySymbol.get(p.symbol) ?? p.avgPrice;
        return sum + (current - p.avgPrice) * p.qty;
      }, 0),
    [positions, priceBySymbol],
  );

  const buyingPower = balance * 2; // simulated trading limit (2x the balance)

  const bookForSelected = useMemo(() => {
    const base = generateMockOrderBook(
      selectedAsset.symbol,
      selectedAsset.priceUsdt,
    );
    const resting = openOrders.filter((o) => o.symbol === selectedAsset.symbol);
    const restingAsks: BookOrder[] = resting
      .filter((o) => o.side === "sell")
      .map((o) => ({ id: o.id, side: "sell", qty: o.qty, price: o.price, isUser: true }));
    const restingBids: BookOrder[] = resting
      .filter((o) => o.side === "buy")
      .map((o) => ({ id: o.id, side: "buy", qty: o.qty, price: o.price, isUser: true }));

    // always re-sorted after insertion: asks from highest to lowest, bids
    // from highest to lowest. This re-sort is what prevents a broken spread.
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
