"use client";

// Chain-dependent actions for the order flow: sign the intent and the
// cancellation, read coverage (balance + delegate/allowance) and approve the
// EXACT amount. Every signature is checked locally before it goes to the engine.

import { useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { verifyAsync } from "@noble/ed25519";
import { getAddress, recoverTypedDataAddress, type Hex } from "viem";
import { signTypedData, switchChain, waitForTransactionReceipt, writeContract, getConnection } from "wagmi/actions";
import { CHAINS } from "@/lib/exchange/chains";
import type { ChainConfig } from "@/lib/exchange/config";
import { erc20Abi } from "@/lib/web3/abis/erc20";
import { config as wagmiConfig, type EvmChainId } from "@/lib/web3/config";
import {
  encodeSolanaSignature,
  evmCancelTypedData,
  evmIntentTypedData,
  normalizeEvmSignature,
  solanaCancelMessage,
  solanaIntentMessage,
  type CancelIntent,
  type OrderIntent,
} from "@/lib/exchange/intents";
import {
  buildApproveTransaction,
  readMint,
  readTokenAccount,
  sendAndConfirm,
  solanaConnection,
  vaultAuthority,
  verifyDelegation,
} from "@/lib/exchange/solana";
import { checkSignedTransaction } from "@/lib/exchange/solana-tx-check";
import { evmClient, readEvmCoverage } from "@/lib/exchange/evm";
import { useSolanaWallet } from "@/components/web3/SolanaWalletProvider";
import { base58 } from "@scure/base";

export interface Coverage {
  balance: bigint;
  /** How much the vault (Solana) / NiaraSettlement (EVM) can move today. */
  approved: bigint;
  /** Solana: the ATA delegates to someone else (not the vault) — approving would replace it. */
  delegatedElsewhere: boolean;
}

export function isUserRejection(error: unknown): boolean {
  let e: unknown = error;
  for (let depth = 0; e && typeof e === "object" && depth < 6; depth++) {
    const o = e as { code?: unknown; name?: unknown; message?: unknown; cause?: unknown };
    if (o.code === 4001 || o.name === "UserRejectedRequestError" || o.name === "WalletSignMessageError") return true;
    if (typeof o.message === "string" && /reject|denied|cancel+ed by user/i.test(o.message)) return true;
    e = o.cause;
  }
  return false;
}

export function useChainActions(config: ChainConfig) {
  const sol = useSolanaWallet();
  const kind = CHAINS[config.chain].kind;

  const ensureEvmChain = useCallback(async () => {
    if (!config.ready || config.evmChainId === null) throw new Error("chain not configured");
    if (getConnection(wagmiConfig).chainId !== config.evmChainId) {
      await switchChain(wagmiConfig, { chainId: config.evmChainId as EvmChainId });
    }
  }, [config]);

  /** Signs the order intent; returns the signature in the engine's format. */
  const signIntent = useCallback(
    async (intent: OrderIntent): Promise<string> => {
      if (kind === "solana") {
        const message = solanaIntentMessage(intent);
        const sig = await sol.signMessage(message);
        // strict local verification (same rule as the engine) before sending
        if (!(await verifyAsync(sig, message, base58.decode(intent.wallet), { zip215: false }))) {
          throw new Error("the wallet's signature does not verify");
        }
        return encodeSolanaSignature(sig);
      }
      await ensureEvmChain();
      const typed = evmIntentTypedData(intent);
      const raw = await signTypedData(wagmiConfig, { account: getAddress(intent.wallet), ...typed });
      const sig = normalizeEvmSignature(raw);
      if ((await recoverTypedDataAddress({ ...typed, signature: sig as Hex })) !== getAddress(intent.wallet)) {
        throw new Error("the wallet's signature does not verify");
      }
      return sig;
    },
    [kind, sol, ensureEvmChain],
  );

  const signCancel = useCallback(
    async (cancel: CancelIntent): Promise<string> => {
      if (kind === "solana") {
        const message = solanaCancelMessage(cancel);
        const sig = await sol.signMessage(message);
        if (!(await verifyAsync(sig, message, base58.decode(cancel.wallet), { zip215: false }))) {
          throw new Error("the wallet's signature does not verify");
        }
        return encodeSolanaSignature(sig);
      }
      await ensureEvmChain();
      const typed = evmCancelTypedData(cancel);
      const sig = normalizeEvmSignature(
        await signTypedData(wagmiConfig, { account: getAddress(cancel.wallet), ...typed }),
      );
      if ((await recoverTypedDataAddress({ ...typed, signature: sig as Hex })) !== getAddress(cancel.wallet)) {
        throw new Error("the wallet's signature does not verify");
      }
      return sig;
    },
    [kind, sol, ensureEvmChain],
  );

  /** Current balance and approval of the account `settle` will debit. */
  const readCoverage = useCallback(
    async (wallet: string, token: string): Promise<Coverage> => {
      if (!config.ready) throw new Error("chain not configured");
      if (kind === "solana") {
        const conn = solanaConnection(config.rpcUrl);
        const mint = await readMint(conn, token);
        const acct = await readTokenAccount(conn, wallet, token, mint.tokenProgram);
        const vault = vaultAuthority(config.settlement).toBase58();
        const toVault = acct.delegate === vault;
        return {
          balance: acct.frozen ? BigInt(0) : acct.amount,
          approved: toVault ? acct.delegatedAmount : BigInt(0),
          delegatedElsewhere: acct.delegate !== null && !toVault,
        };
      }
      const c = await readEvmCoverage(evmClient(config.rpcUrl, config.evmChainId as number), token, wallet, config.settlement);
      return { balance: c.balance, approved: c.allowance, delegatedElsewhere: false };
    },
    [config, kind],
  );

  /**
   * Approves EXACTLY `amount` of `token` to the vault PDA (Solana) or the
   * NiaraSettlement (EVM) and waits for confirmation. On Solana it then re-reads the
   * token account and requires exactly that delegation to the vault. Returns the
   * hash/signature.
   */
  const approveExact = useCallback(
    async (wallet: string, token: string, amount: bigint, onSent?: (tx: string) => void): Promise<string> => {
      if (!config.ready) throw new Error("chain not configured");
      if (kind === "solana") {
        const conn = solanaConnection(config.rpcUrl);
        const mint = await readMint(conn, token);
        const built = await buildApproveTransaction(conn, {
          owner: new PublicKey(wallet).toBase58(),
          mint: token,
          programId: config.settlement,
          amount,
          decimals: mint.decimals,
          tokenProgram: mint.tokenProgram,
        });
        const signed = await sol.signTransaction(built.bytes);
        // Accepts only ComputeBudget / Lighthouse additions; refuses anything else.
        await checkSignedTransaction(built.bytes, signed, wallet);
        const signature = await sendAndConfirm(conn, signed, built.blockhash, built.lastValidBlockHeight, onSent);
        // The order is submitted only if the chain shows exactly the intended delegation.
        await verifyDelegation(conn, {
          owner: wallet,
          mint: token,
          programId: config.settlement,
          amount,
          tokenProgram: mint.tokenProgram,
          signature,
        });
        return signature;
      }
      await ensureEvmChain();
      const hash = await writeContract(wagmiConfig, {
        address: getAddress(token),
        abi: erc20Abi,
        functionName: "approve",
        args: [getAddress(config.settlement), amount],
        chainId: config.evmChainId as EvmChainId,
        account: getAddress(wallet),
      });
      onSent?.(hash);
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, chainId: config.evmChainId as EvmChainId });
      if (receipt.status !== "success") throw Object.assign(new Error("the approval transaction reverted"), { tx: hash });
      return hash;
    },
    [config, kind, sol, ensureEvmChain],
  );

  return { signIntent, signCancel, readCoverage, approveExact };
}
