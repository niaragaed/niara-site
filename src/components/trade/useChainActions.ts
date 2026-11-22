"use client";

// Ações dependentes da cadeia para o fluxo de ordem: assinar intent e
// cancelamento, ler cobertura (saldo + delegate/allowance) e aprovar o valor
// EXATO. Toda assinatura é conferida localmente antes de ir ao engine.

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
  checkSignedTransaction,
  readMint,
  readTokenAccount,
  sendAndConfirm,
  solanaConnection,
  vaultAuthority,
} from "@/lib/exchange/solana";
import { evmClient, readEvmCoverage } from "@/lib/exchange/evm";
import { useSolanaWallet } from "@/components/web3/SolanaWalletProvider";
import { base58 } from "@scure/base";

export interface Coverage {
  balance: bigint;
  /** Quanto o vault (Solana) / NiaraSettlement (EVM) pode mover hoje. */
  approved: bigint;
  /** Solana: a ATA delega a outro (não ao vault) — aprovar substituiria. */
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

  /** Assina a intent da ordem; devolve a assinatura no formato do engine. */
  const signIntent = useCallback(
    async (intent: OrderIntent): Promise<string> => {
      if (kind === "solana") {
        const message = solanaIntentMessage(intent);
        const sig = await sol.signMessage(message);
        // verificação estrita local (mesma regra do engine) antes de enviar
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

  /** Saldo e aprovação atuais da conta que `settle` vai debitar. */
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
   * Aprova EXATAMENTE `amount` de `token` para o vault PDA (Solana) ou o
   * NiaraSettlement (EVM) e espera a confirmação. Devolve o hash/assinatura.
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
        checkSignedTransaction(built.bytes, signed, wallet);
        return sendAndConfirm(conn, signed, built.blockhash, built.lastValidBlockHeight);
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
