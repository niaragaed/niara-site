import type { Address } from "viem";

// Fixed list of the Sepolia mock ERC-20 tokens read by TokenBalances.
// fallbackSymbol is only used if the on-chain symbol() read fails; the real
// symbol always comes from the contract.
export type Erc20TokenConfig = {
  address: Address;
  fallbackSymbol: string;
};

export const ERC20_TOKENS: Erc20TokenConfig[] = [
  { address: "0x87374912F372378f94af3f93B36e06126e53b112", fallbackSymbol: "USDT" },
  { address: "0xA202111580a6D9afA3f0F7E48fE49dE650528bb7", fallbackSymbol: "WBTC" },
  { address: "0xcE920BA910c1ecb8e767f37933b38520892Eb37f", fallbackSymbol: "nDEMO" },
];
