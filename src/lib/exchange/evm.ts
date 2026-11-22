// EVM reads (read-only, env RPC) for the book: token metadata,
// balance/allowance for NiaraSettlement and the on-chain fee. The approve and the
// EIP-712 signature go through the wallet (wagmi) — see components/trade.
import { createPublicClient, getAddress, http, type Address, type PublicClient } from "viem";
import { erc20Abi } from "@/lib/web3/abis/erc20";

/** Fragment of the NiaraSettlement ABI (niara-exchange-engine/src/evm/abi). */
export const niaraSettlementAbi = [
  { type: "function", name: "feeBps", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint16" }] },
  { type: "function", name: "feeToken", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  { type: "function", name: "paused", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "bool" }] },
] as const;

const erc20NameAbi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
] as const;

const clients = new Map<string, PublicClient>();

export function evmClient(rpcUrl: string, chainId: number): PublicClient {
  const key = `${chainId}:${rpcUrl}`;
  let c = clients.get(key);
  if (!c) {
    c = createPublicClient({ transport: http(rpcUrl) }) as PublicClient;
    clients.set(key, c);
  }
  return c;
}

/** Rejects an RPC whose chain id is not the expected one (the engine does the same). */
export async function assertEvmChain(client: PublicClient, chainId: number): Promise<void> {
  const actual = await client.getChainId();
  if (actual !== chainId) throw new Error(`the configured RPC is chain ${actual}, expected ${chainId}`);
}

export interface EvmTokenInfo {
  decimals: number;
  symbol: string | null;
  name: string | null;
}

export async function readEvmToken(client: PublicClient, token: string): Promise<EvmTokenInfo> {
  const address = getAddress(token);
  const [decimals, symbol, name] = await Promise.all([
    client.readContract({ address, abi: erc20Abi, functionName: "decimals" }),
    client.readContract({ address, abi: erc20Abi, functionName: "symbol" }).catch(() => null),
    client.readContract({ address, abi: erc20NameAbi, functionName: "name" }).catch(() => null),
  ]);
  return { decimals: Number(decimals), symbol: symbol || null, name: name || null };
}

export async function readEvmCoverage(
  client: PublicClient,
  token: string,
  owner: string,
  spender: string,
): Promise<{ balance: bigint; allowance: bigint }> {
  const address = getAddress(token);
  const [balance, allowance] = await Promise.all([
    client.readContract({ address, abi: erc20Abi, functionName: "balanceOf", args: [getAddress(owner)] }),
    client.readContract({
      address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [getAddress(owner), getAddress(spender)],
    }),
  ]);
  return { balance, allowance };
}

export async function readSettlementTerms(
  client: PublicClient,
  settlement: string,
): Promise<{ feeBps: number; feeToken: Address; paused: boolean }> {
  const address = getAddress(settlement);
  const [feeBps, feeToken, paused] = await Promise.all([
    client.readContract({ address, abi: niaraSettlementAbi, functionName: "feeBps" }),
    client.readContract({ address, abi: niaraSettlementAbi, functionName: "feeToken" }),
    client.readContract({ address, abi: niaraSettlementAbi, functionName: "paused" }),
  ]);
  return { feeBps: Number(feeBps), feeToken, paused };
}
