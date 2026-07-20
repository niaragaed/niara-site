import type { Position } from "./trading";

// simulado — saldo e posição inicial só para a demonstração não começar
// zerada. Poder de compra, margem utilizada e P/L do dia são DERIVADOS
// disso (ver ExchangeContext), não valores fixos separados. Valores em
// USDT (unidade interna do site — ver CLAUDE.md).
export const INITIAL_BALANCE_USDT = 37446;

export const SEED_POSITIONS: Position[] = [{ symbol: "AAPL", qty: 45, avgPrice: 207 }];
