"use client";

import { useState } from "react";
import { Star, Trash2, Wallet } from "lucide-react";
import { MOCK_LINKED_WALLETS, truncateAddress, type LinkedWallet } from "@/lib/mock-wallets";
import { en } from "@/lib/i18n/en";

// TODO: integrar wagmi/ethers + WalletConnect — hoje é só uma simulação
// local, sem conexão on-chain de verdade.
const CONNECTED_ADDRESS = "0x1a2b3c4d5e6f78901234567890abcdefc3d4"; // dados ilustrativos
const CONNECTED_NETWORK = "Ethereum Sepolia — testnet";
const CONNECTED_BALANCE_ETH = 2.4531; // dados ilustrativos

export function WalletSection() {
  const [connected, setConnected] = useState(false);
  const [wallets, setWallets] = useState<LinkedWallet[]>(MOCK_LINKED_WALLETS);

  function setPrimary(id: string) {
    setWallets((current) => current.map((w) => ({ ...w, isPrimary: w.id === id })));
  }

  function removeWallet(id: string) {
    setWallets((current) => current.filter((w) => w.id !== id));
  }

  return (
    <section id="wallet" aria-labelledby="wallet-heading" className="scroll-mt-24">
      <h2 id="wallet-heading" className="font-display text-xl text-text-primary">
        {en.profile.wallet.title}
      </h2>
      <p className="mt-1 text-xs text-text-secondary">{en.profile.wallet.subtitle}</p>

      <div className="mt-6 rounded-lg border border-border bg-bg-surface p-6">
        {connected ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-elevated">
                <Wallet className="h-5 w-5 text-accent-blue" aria-hidden="true" />
              </div>
              <div>
                <p className="font-mono text-sm text-text-primary">
                  {truncateAddress(CONNECTED_ADDRESS)}
                </p>
                <p className="text-xs text-text-muted">{CONNECTED_NETWORK}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-text-muted">
                {en.profile.wallet.simulatedBalance}
              </p>
              <p className="font-mono text-sm tabular-nums text-text-primary">
                {CONNECTED_BALANCE_ETH.toFixed(4)} ETH
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConnected(false)}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              {en.profile.wallet.disconnect}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <Wallet className="h-5 w-5 text-text-muted" aria-hidden="true" />
              {en.profile.wallet.noWalletConnected}
            </div>
            <button
              type="button"
              onClick={() => setConnected(true)}
              className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-text-primary"
            >
              {en.profile.wallet.connect}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-bg-surface p-6">
        <h3 className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {en.profile.wallet.linkedWallets}
        </h3>
        <ul className="mt-3 flex flex-col gap-2">
          {wallets.map((wallet) => (
            <li
              key={wallet.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3"
            >
              <div>
                <p className="text-sm text-text-primary">
                  {wallet.label}
                  {wallet.isPrimary && (
                    <span className="ml-2 rounded-full border border-accent-blue/40 bg-accent-blue/10 px-2 py-0.5 text-[10px] font-medium text-accent-blue">
                      {en.profile.wallet.primary}
                    </span>
                  )}
                </p>
                <p className="font-mono text-xs text-text-muted">
                  {truncateAddress(wallet.address)} · {wallet.network}
                </p>
              </div>
              <div className="flex gap-2">
                {!wallet.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(wallet.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-text-secondary hover:border-accent-blue hover:text-text-primary"
                  >
                    <Star className="h-3 w-3" aria-hidden="true" />
                    {en.profile.wallet.setPrimary}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeWallet(wallet.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-text-secondary hover:border-negative hover:text-negative"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                  {en.profile.wallet.remove}
                </button>
              </div>
            </li>
          ))}
          {wallets.length === 0 && (
            <li className="text-xs text-text-muted">{en.profile.wallet.none}</li>
          )}
        </ul>
      </div>
    </section>
  );
}
