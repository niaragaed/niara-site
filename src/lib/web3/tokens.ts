import type { Address } from "viem";

// Lista fixa dos tokens ERC-20 mock na Sepolia lidos pelo TokenBalances.
// fallbackSymbol só é usado se a leitura on-chain de symbol() falhar — o
// símbolo real sempre vem do contrato.
export type Erc20TokenConfig = {
  address: Address;
  fallbackSymbol: string;
};

export const ERC20_TOKENS: Erc20TokenConfig[] = [
  { address: "0x87374912F372378f94af3f93B36e06126e53b112", fallbackSymbol: "USDT" },
  { address: "0xA202111580a6D9afA3f0F7E48fE49dE650528bb7", fallbackSymbol: "WBTC" },
  { address: "0xcE920BA910c1ecb8e767f37933b38520892Eb37f", fallbackSymbol: "nDEMO" },
];
