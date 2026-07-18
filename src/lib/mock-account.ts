import type { Position } from "./trading";

// simulado — saldo e posição inicial só para a demonstração não começar
// zerada. Poder de compra, margem utilizada e P/L do dia são DERIVADOS
// disso (ver ExchangeContext), não valores fixos separados.
export const INITIAL_BALANCE_ETH = 12.482;

export const SEED_POSITIONS: Position[] = [{ symbol: "AAPL", qty: 45, avgPrice: 0.069 }];
