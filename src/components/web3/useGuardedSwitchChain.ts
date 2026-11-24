"use client";

// "Switch to <network>" for an already connected EVM wallet, with the same timeout
// and visible error as the connect dialog (lib/web3/wallet-errors.ts): a wallet that
// ignores the request or does not support the network must not leave the button
// spinning forever.

import { useCallback, useState } from "react";
import { useConnection, useSwitchChain } from "wagmi";
import { en } from "@/lib/i18n/en";
import type { EvmChainId } from "@/lib/web3/config";
import { brandKey } from "@/lib/web3/wallet-brands";
import { SWITCH_TIMEOUT_MS, describeWalletError, withTimeout, type WalletErrorMessage } from "@/lib/web3/wallet-errors";

export function useGuardedSwitchChain() {
  const connection = useConnection();
  const { mutateAsync } = useSwitchChain();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<WalletErrorMessage | null>(null);
  const walletName = connection.connector?.name ?? en.wallets.genericWallet;

  const switchTo = useCallback(
    async (chainId: EvmChainId, network: string) => {
      setPending(true);
      setError(null);
      try {
        await withTimeout(mutateAsync({ chainId }), SWITCH_TIMEOUT_MS);
      } catch (e) {
        setError(describeWalletError(e, { wallet: walletName, brand: brandKey(walletName), phase: "switch", network }));
      } finally {
        setPending(false);
      }
    },
    [mutateAsync, walletName],
  );

  const clearError = useCallback(() => setError(null), []);

  return { switchTo, pending, error, clearError };
}
