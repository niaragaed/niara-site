import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { en } from "@/lib/i18n/en";

export function WalletSection() {
  return (
    <section id="wallet" aria-labelledby="wallet-heading" className="scroll-mt-24">
      <h2 id="wallet-heading" className="font-display text-xl text-text-primary">
        {en.profile.wallet.title}
      </h2>
      <p className="mt-1 text-xs text-text-secondary">{en.profile.wallet.subtitle}</p>

      <div className="mt-6 rounded-lg border border-border bg-bg-surface p-6">
        <ConnectWallet />
      </div>
    </section>
  );
}
