import type { Metadata } from "next";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { ConnectionPanel } from "@/components/web3/ConnectionPanel";
import { ApproveUsdt } from "@/components/web3/ApproveUsdt";
import { TestnetBanner } from "@/components/web3/TestnetBanner";
import { en } from "@/lib/i18n/en";

export const metadata: Metadata = {
  title: en.pilot.metaTitle,
  description: en.pilot.metaDescription,
};

export default function PilotPage() {
  return (
    <div className="flex min-h-[70vh] flex-col bg-bg-base">
      <TestnetBanner />

      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-2xl text-text-primary sm:text-3xl">
          {en.pilot.heading}
        </h1>
        <p className="mt-2 text-sm text-text-secondary sm:text-base">{en.pilot.subheading}</p>

        <div className="mt-8">
          <ConnectWallet />
        </div>

        <div className="mt-6">
          <ConnectionPanel />
        </div>

        <div className="mt-6">
          <ApproveUsdt />
        </div>
      </div>
    </div>
  );
}
