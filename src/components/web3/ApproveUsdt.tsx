"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";
import {
  useConnection,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatUnits, InsufficientFundsError, parseUnits, UserRejectedRequestError } from "viem";
import type { Address } from "viem";
import { erc20Abi } from "@/lib/web3/abis/erc20";
import { ERC20_TOKENS } from "@/lib/web3/tokens";
import { en } from "@/lib/i18n/en";

// Addresses confirmed with the user for Step 2 of the pilot. They don't
// appear in any other doc in the repo; they are specific to this approve flow.
const NIARA_SETTLEMENT_ADDRESS: Address = "0xd7DEabcAc261CbDC9bb898baF8E60DA1355bD178";
const MOCK_USDT_ADDRESS =
  ERC20_TOKENS.find((token) => token.fallbackSymbol === "USDT")?.address ??
  (() => {
    throw new Error("MockUSDT not found in ERC20_TOKENS");
  })();

type Phase =
  | "form"
  | "signing"
  | "confirming"
  | "confirmed"
  | "reverted"
  | "receipt-error"
  | "rejected"
  | "insufficient-funds"
  | "write-error";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function isUserRejection(error: unknown) {
  if (error instanceof UserRejectedRequestError) return true;
  if (error && typeof error === "object" && "walk" in error) {
    const found = (error as { walk: (fn: (err: unknown) => boolean) => unknown }).walk(
      (err) => err instanceof UserRejectedRequestError,
    );
    if (found) return true;
  }
  if (error && typeof error === "object") {
    const err = error as { code?: number; cause?: { code?: number } };
    return err.code === 4001 || err.cause?.code === 4001;
  }
  return false;
}

function isInsufficientFunds(error: unknown) {
  if (error instanceof InsufficientFundsError) return true;
  if (error && typeof error === "object" && "walk" in error) {
    const found = (error as { walk: (fn: (err: unknown) => boolean) => unknown }).walk(
      (err) => err instanceof InsufficientFundsError,
    );
    if (found) return true;
  }
  return /insufficient funds/i.test(error instanceof Error ? error.message : "");
}

export function ApproveUsdt() {
  const t = en.web3.approve;
  const connection = useConnection();
  const { mutate: switchChain, isPending: isSwitching } = useSwitchChain();

  const isOnSepolia = connection.chainId === sepolia.id;
  const enabled = connection.isConnected && isOnSepolia && Boolean(connection.address);
  const address = connection.address;

  const [amountInput, setAmountInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const decimalsRead = useReadContract({
    address: MOCK_USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled },
  });

  const balanceRead = useReadContract({
    address: MOCK_USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const allowanceRead = useReadContract({
    address: MOCK_USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, NIARA_SETTLEMENT_ADDRESS] : undefined,
    query: { enabled },
  });

  const {
    mutate: writeContract,
    data: hash,
    error: writeError,
    status: writeStatus,
    isPending: isSigning,
    reset: resetWrite,
  } = useWriteContract();

  const { data: receipt, status: receiptStatus } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: Boolean(hash) },
  });

  useEffect(() => {
    if (receiptStatus === "success") {
      allowanceRead.refetch();
      balanceRead.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptStatus]);

  const decimals = decimalsRead.data;
  const balance = balanceRead.data;
  const tokenDataReady = enabled && typeof decimals === "number" && typeof balance === "bigint";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!tokenDataReady || decimals === undefined || balance === undefined) {
      setFormError(t.loadingTokenData);
      return;
    }

    const trimmed = amountInput.trim();
    if (trimmed === "") {
      setFormError(t.errorEmpty);
      return;
    }
    if (!/^\d+(\.\d+)?$/.test(trimmed)) {
      setFormError(t.errorInvalid);
      return;
    }

    let parsedAmount: bigint;
    try {
      parsedAmount = parseUnits(trimmed, decimals);
    } catch {
      setFormError(t.errorTooManyDecimals);
      return;
    }

    if (parsedAmount <= BigInt(0)) {
      setFormError(t.errorZero);
      return;
    }
    if (parsedAmount > balance) {
      setFormError(t.errorExceedsBalance);
      return;
    }

    writeContract({
      address: MOCK_USDT_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [NIARA_SETTLEMENT_ADDRESS, parsedAmount],
    });
  }

  function handleReset() {
    resetWrite();
    setAmountInput("");
    setFormError(null);
  }

  const etherscanTxUrl = hash ? `https://sepolia.etherscan.io/tx/${hash}` : null;

  function computePhase(): Phase {
    if (writeStatus === "error") {
      if (isUserRejection(writeError)) return "rejected";
      if (isInsufficientFunds(writeError)) return "insufficient-funds";
      return "write-error";
    }
    if (isSigning) return "signing";
    if (hash && receiptStatus === "pending") return "confirming";
    if (receiptStatus === "success" && receipt) {
      return receipt.status === "success" ? "confirmed" : "reverted";
    }
    if (receiptStatus === "error") return "receipt-error";
    return "form";
  }

  const phase = computePhase();

  return (
    <section className="rounded-lg border border-border bg-bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg text-text-primary">{t.title}</h2>
        <span className="rounded-full border border-accent-violet/40 bg-accent-violet/10 px-2 py-0.5 text-xs text-accent-violet">
          {t.badge}
        </span>
      </div>
      <p className="mt-2 text-xs text-text-muted">{t.description}</p>

      <div className="mt-3 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{t.warning}</span>
      </div>

      {!connection.isConnected ? (
        <p className="mt-4 text-sm text-text-secondary">{t.notConnected}</p>
      ) : !isOnSepolia ? (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t.wrongNetworkText}</span>
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
        <div className="mt-4 space-y-4">
          <dl className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-muted">{t.tokenLabel}</dt>
              <dd className="font-mono text-text-secondary break-all text-right">
                {MOCK_USDT_ADDRESS}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-muted">{t.spenderLabel}</dt>
              <dd className="font-mono text-text-secondary break-all text-right">
                {NIARA_SETTLEMENT_ADDRESS}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-muted">{t.balanceLabel}</dt>
              <dd className="font-mono tabular-nums text-text-primary text-right">
                {tokenDataReady ? formatUnits(balance, decimals) : "…"}
              </dd>
            </div>
            {allowanceRead.data !== undefined && typeof decimals === "number" && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-muted">{t.currentAllowanceLabel}</dt>
                <dd className="font-mono tabular-nums text-text-primary text-right">
                  {formatUnits(allowanceRead.data, decimals)}
                </dd>
              </div>
            )}
          </dl>

          {(phase === "form" || phase === "signing") && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <div className="flex-1">
                <label htmlFor="approve-amount" className="sr-only">
                  {t.amountLabel}
                </label>
                <input
                  id="approve-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder={t.amountPlaceholder}
                  value={amountInput}
                  onChange={(e) => {
                    setAmountInput(e.target.value);
                    setFormError(null);
                  }}
                  disabled={isSigning || !tokenDataReady}
                  className="w-full rounded-md border border-border bg-bg-elevated px-3 py-1.5 font-mono text-sm tabular-nums text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                />
                {formError && <p className="mt-1 text-xs text-negative">{formError}</p>}
                {!tokenDataReady && !formError && (
                  <p className="mt-1 text-xs text-text-muted">{t.loadingTokenData}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSigning || !tokenDataReady}
                className="flex items-center justify-center gap-2 rounded-md bg-gradient-primary px-4 py-1.5 text-sm font-medium text-text-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigning && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>{isSigning ? t.statusAwaitingSignature : t.submit}</span>
              </button>
            </form>
          )}

          {phase === "rejected" && (
            <div className="flex flex-col gap-2 rounded-md border border-border bg-bg-elevated p-3 text-sm text-text-secondary">
              <span>{t.statusRejected}</span>
              <button
                type="button"
                onClick={handleReset}
                className="w-fit text-xs text-accent-blue underline underline-offset-2 hover:text-accent-cyan"
              >
                {t.tryAgain}
              </button>
            </div>
          )}

          {phase === "insufficient-funds" && (
            <div className="flex flex-col gap-2 rounded-md border border-negative/30 bg-negative/10 p-3 text-sm text-negative">
              <span>{t.statusInsufficientFunds}</span>
              <button
                type="button"
                onClick={handleReset}
                className="w-fit text-xs text-accent-blue underline underline-offset-2 hover:text-accent-cyan"
              >
                {t.tryAgain}
              </button>
            </div>
          )}

          {phase === "write-error" && (
            <div className="flex flex-col gap-2 rounded-md border border-negative/30 bg-negative/10 p-3 text-sm text-negative">
              <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t.statusGenericError}</span>
              <button
                type="button"
                onClick={handleReset}
                className="w-fit text-xs text-accent-blue underline underline-offset-2 hover:text-accent-cyan"
              >
                {t.tryAgain}
              </button>
            </div>
          )}

          {phase === "confirming" && etherscanTxUrl && (
            <div className="flex flex-col gap-2 rounded-md border border-accent-blue/30 bg-accent-blue/10 p-3 text-sm text-accent-blue">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                <span>{t.statusAwaitingConfirmation}</span>
              </div>
              <a
                href={etherscanTxUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-fit items-center gap-1 font-mono text-xs underline underline-offset-2 hover:text-accent-cyan"
              >
                {truncateAddress(hash as string)}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          )}

          {phase === "confirmed" && etherscanTxUrl && (
            <div className="flex flex-col gap-2 rounded-md border border-positive/30 bg-positive/10 p-3 text-sm text-positive">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.statusConfirmed}</span>
              </div>
              <a
                href={etherscanTxUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-fit items-center gap-1 font-mono text-xs underline underline-offset-2 hover:text-accent-cyan"
              >
                {t.viewOnEtherscan}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={handleReset}
                className="w-fit text-xs text-accent-blue underline underline-offset-2 hover:text-accent-cyan"
              >
                {t.newApproval}
              </button>
            </div>
          )}

          {phase === "reverted" && etherscanTxUrl && (
            <div className="flex flex-col gap-2 rounded-md border border-negative/30 bg-negative/10 p-3 text-sm text-negative">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.statusReverted}</span>
              </div>
              <a
                href={etherscanTxUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-fit items-center gap-1 font-mono text-xs underline underline-offset-2 hover:text-accent-cyan"
              >
                {t.viewOnEtherscan}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={handleReset}
                className="w-fit text-xs text-accent-blue underline underline-offset-2 hover:text-accent-cyan"
              >
                {t.tryAgain}
              </button>
            </div>
          )}

          {phase === "receipt-error" && (
            <div className="flex flex-col gap-2 rounded-md border border-negative/30 bg-negative/10 p-3 text-sm text-negative">
              <span>{t.statusReceiptError}</span>
              {etherscanTxUrl && (
                <a
                  href={etherscanTxUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-fit items-center gap-1 font-mono text-xs underline underline-offset-2 hover:text-accent-cyan"
                >
                  {t.viewOnEtherscan}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="w-fit text-xs text-accent-blue underline underline-offset-2 hover:text-accent-cyan"
              >
                {t.tryAgain}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
