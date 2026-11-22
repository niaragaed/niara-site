"use client";

// Carteiras Solana via Wallet Standard (Phantom, Backpack, Solflare…): o site
// descobre as carteiras registradas no navegador, sem adaptador por marca.
// Exigimos `standard:connect`, `solana:signMessage` (intents) e
// `solana:signTransaction` (approve do delegate; o envio é nosso, pelo RPC
// devnet com genesis conferido — ver lib/exchange/solana.ts).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getWallets } from "@wallet-standard/app";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import {
  StandardConnect,
  StandardDisconnect,
  StandardEvents,
  type StandardConnectFeature,
  type StandardDisconnectFeature,
  type StandardEventsFeature,
} from "@wallet-standard/features";
import {
  SolanaSignMessage,
  SolanaSignTransaction,
  type SolanaSignMessageFeature,
  type SolanaSignTransactionFeature,
} from "@solana/wallet-standard-features";

const DEVNET = "solana:devnet";

type SolanaWallet = Wallet & {
  features: StandardConnectFeature & SolanaSignMessageFeature & SolanaSignTransactionFeature;
};

function isUsable(wallet: Wallet): wallet is SolanaWallet {
  const f = wallet.features as Record<string, unknown>;
  return (
    StandardConnect in f &&
    SolanaSignMessage in f &&
    SolanaSignTransaction in f &&
    wallet.chains.some((c) => c.startsWith("solana:"))
  );
}

type SolanaWalletState = {
  wallets: readonly SolanaWallet[];
  wallet: SolanaWallet | null;
  account: WalletAccount | null;
  /** Endereço base58, ou null se desconectado. */
  address: string | null;
  connecting: boolean;
  error: string | null;
  connect: (walletName: string) => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  signTransaction: (transaction: Uint8Array) => Promise<Uint8Array>;
};

const SolanaWalletContext = createContext<SolanaWalletState | null>(null);

export function useSolanaWallet(): SolanaWalletState {
  const ctx = useContext(SolanaWalletContext);
  if (!ctx) throw new Error("useSolanaWallet precisa estar dentro de <SolanaWalletProvider>");
  return ctx;
}

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<readonly SolanaWallet[]>([]);
  const [wallet, setWallet] = useState<SolanaWallet | null>(null);
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Descoberta: carteiras podem se registrar depois da hidratação.
  useEffect(() => {
    const api = getWallets();
    const refresh = () => setWallets(api.get().filter(isUsable));
    refresh();
    const offRegister = api.on("register", refresh);
    const offUnregister = api.on("unregister", refresh);
    return () => {
      offRegister();
      offUnregister();
    };
  }, []);

  // Troca de conta / desconexão feita na própria carteira.
  useEffect(() => {
    if (!wallet) return;
    const events = (wallet.features as Partial<StandardEventsFeature>)[StandardEvents];
    if (!events) return;
    return events.on("change", ({ accounts }) => {
      if (!accounts) return;
      setAccount(accounts.find((a) => a.chains.some((c) => c.startsWith("solana:"))) ?? null);
    });
  }, [wallet]);

  const connect = useCallback(
    async (walletName: string) => {
      const target = wallets.find((w) => w.name === walletName);
      if (!target) return;
      setConnecting(true);
      setError(null);
      try {
        const { accounts } = await target.features[StandardConnect].connect();
        const first = accounts.find((a) => a.chains.some((c) => c.startsWith("solana:"))) ?? accounts[0] ?? null;
        setWallet(target);
        setAccount(first);
        if (!first) setError("no-account");
      } catch {
        setError("rejected");
      } finally {
        setConnecting(false);
      }
    },
    [wallets],
  );

  const disconnect = useCallback(async () => {
    const feature = wallet ? (wallet.features as Partial<StandardDisconnectFeature>)[StandardDisconnect] : undefined;
    try {
      await feature?.disconnect();
    } finally {
      setWallet(null);
      setAccount(null);
    }
  }, [wallet]);

  const signMessage = useCallback(
    async (message: Uint8Array) => {
      if (!wallet || !account) throw new Error("wallet not connected");
      const [out] = await wallet.features[SolanaSignMessage].signMessage({ account, message });
      // A carteira tem de ter assinado exatamente os nossos bytes.
      const signed = out.signedMessage;
      if (signed.length !== message.length || !signed.every((b, i) => b === message[i])) {
        throw new Error("the wallet signed a different message");
      }
      return out.signature;
    },
    [wallet, account],
  );

  const signTransaction = useCallback(
    async (transaction: Uint8Array) => {
      if (!wallet || !account) throw new Error("wallet not connected");
      const [out] = await wallet.features[SolanaSignTransaction].signTransaction({
        account,
        transaction,
        chain: DEVNET,
      });
      return out.signedTransaction;
    },
    [wallet, account],
  );

  const value = useMemo<SolanaWalletState>(
    () => ({
      wallets,
      wallet,
      account,
      address: account?.address ?? null,
      connecting,
      error,
      connect,
      disconnect,
      signMessage,
      signTransaction,
    }),
    [wallets, wallet, account, connecting, error, connect, disconnect, signMessage, signTransaction],
  );

  return <SolanaWalletContext.Provider value={value}>{children}</SolanaWalletContext.Provider>;
}
