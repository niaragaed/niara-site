"use client";

import { useMemo } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useBalance, useConnection, useReadContracts, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatUnits } from "viem";
import { erc20Abi } from "@/lib/web3/abis/erc20";
import { ERC20_TOKENS } from "@/lib/web3/tokens";
import { en } from "@/lib/i18n/en";

type Row = {
  key: string;
  symbol: string;
  formatted: string | null;
  isLoading: boolean;
  isError: boolean;
};

export function TokenBalances() {
  const connection = useConnection();
  const { mutate: switchChain, isPending: isSwitching } = useSwitchChain();

  const isOnSepolia = connection.chainId === sepolia.id;
  const enabled = connection.isConnected && isOnSepolia && Boolean(connection.address);
  const address = connection.address;

  const ethBalance = useBalance({
    address,
    chainId: sepolia.id,
    query: { enabled },
  });

  const contracts = useMemo(() => {
    if (!address) return [];
    return ERC20_TOKENS.flatMap((token) => [
      { address: token.address, abi: erc20Abi, functionName: "balanceOf", args: [address] },
      { address: token.address, abi: erc20Abi, functionName: "decimals" },
      { address: token.address, abi: erc20Abi, functionName: "symbol" },
    ]);
  }, [address]);

  const tokenReads = useReadContracts({
    contracts,
    query: { enabled },
  });

  const retry = () => {
    ethBalance.refetch();
    tokenReads.refetch();
  };

  const tokenRows: Row[] = ERC20_TOKENS.map((token, i) => {
    const balanceEntry = tokenReads.data?.[i * 3];
    const decimalsEntry = tokenReads.data?.[i * 3 + 1];
    const symbolEntry = tokenReads.data?.[i * 3 + 2];

    const symbol =
      symbolEntry?.status === "success" && typeof symbolEntry.result === "string"
        ? symbolEntry.result
        : token.fallbackSymbol;

    let formatted: string | null = null;
    if (balanceEntry?.status === "success" && decimalsEntry?.status === "success") {
      formatted = formatUnits(
        balanceEntry.result as unknown as bigint,
        decimalsEntry.result as unknown as number,
      );
    }

    return {
      key: token.address,
      symbol,
      formatted,
      isLoading: enabled && tokenReads.isPending,
      isError: enabled && !tokenReads.isPending && formatted === null,
    };
  });

  const ethRow: Row = {
    key: "eth-native",
    symbol: ethBalance.data?.symbol ?? "ETH",
    formatted: ethBalance.data
      ? formatUnits(ethBalance.data.value, ethBalance.data.decimals)
      : null,
    isLoading: enabled && ethBalance.isPending,
    isError: enabled && !ethBalance.isPending && ethBalance.isError,
  };

  const header = (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="font-display text-lg text-text-primary">{en.web3.balances.title}</h2>
      <span className="rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-2 py-0.5 text-xs text-accent-cyan">
        {en.web3.balances.badge}
      </span>
    </div>
  );

  return (
    <section className="rounded-lg border border-border bg-bg-surface p-4 sm:p-6">
      {header}
      <p className="mt-2 text-xs text-text-muted">{en.web3.balances.testnetNote}</p>

      {!connection.isConnected ? (
        <p className="mt-4 text-sm text-text-secondary">{en.web3.balances.notConnected}</p>
      ) : !isOnSepolia ? (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{en.web3.balances.wrongNetworkText}</span>
          </div>
          <button
            type="button"
            onClick={() => switchChain({ chainId: sepolia.id })}
            disabled={isSwitching}
            className="flex w-fit items-center gap-2 rounded-md border border-border bg-bg-elevated px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSwitching && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>{isSwitching ? en.pilot.switching : en.pilot.switchNetwork}</span>
          </button>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {[ethRow, ...tokenRows].map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span className="text-text-secondary">{row.symbol}</span>
              {row.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-text-muted" aria-hidden="true" />
              ) : row.isError ? (
                <button
                  type="button"
                  onClick={retry}
                  className="flex items-center gap-1.5 text-xs text-negative hover:underline"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  {en.web3.balances.retry}
                </button>
              ) : (
                <span className="font-mono tabular-nums text-text-primary">{row.formatted}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
