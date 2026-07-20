export type LinkedWallet = {
  id: string;
  label: string;
  address: string;
  network: string;
  isPrimary: boolean;
};

// dados ilustrativos — substituir por carteiras reais vinculadas via wagmi/ethers
export const MOCK_LINKED_WALLETS: LinkedWallet[] = [
  {
    id: "w1",
    label: "Primary wallet",
    address: "0x1a2b3c4d5e6f78901234567890abcdefc3d4",
    network: "Ethereum Sepolia — testnet",
    isPrimary: true,
  },
  {
    id: "w2",
    label: "Secondary wallet",
    address: "0x9f8e7d6c5b4a30201f2e3d4c5b6a7988f1e2",
    network: "Ethereum Sepolia — testnet",
    isPrimary: false,
  },
];

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
