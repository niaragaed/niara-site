"use client";

import { useConnection } from "wagmi";
import { sepolia } from "wagmi/chains";
import { en } from "@/lib/i18n/en";

function networkName(chainId: number | undefined) {
  if (chainId === undefined) return "—";
  if (chainId === sepolia.id) return sepolia.name;
  return `${en.pilot.wrongNetwork} (${chainId})`;
}

export function ConnectionPanel() {
  const connection = useConnection();

  const rows: Array<{ label: string; value: string; mono?: boolean }> = [
    {
      label: en.pilot.statusLabel,
      value: connection.isConnected ? en.pilot.statusConnected : en.pilot.statusDisconnected,
    },
    {
      label: en.pilot.addressLabel,
      value: connection.address ?? "—",
      mono: true,
    },
    {
      label: en.pilot.chainIdLabel,
      value: connection.chainId?.toString() ?? "—",
      mono: true,
    },
    {
      label: en.pilot.networkLabel,
      value: connection.isConnected ? networkName(connection.chainId) : "—",
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4 sm:p-6">
      <h2 className="font-display text-sm text-text-primary">{en.pilot.panelTitle}</h2>

      <dl className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
            <dt className="text-text-muted">{row.label}</dt>
            <dd
              className={
                row.mono
                  ? "font-mono tabular-nums text-text-primary break-all text-right"
                  : "text-text-primary text-right"
              }
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {!connection.isConnected && (
        <p className="mt-4 text-xs text-text-muted">{en.pilot.notConnectedHint}</p>
      )}
    </div>
  );
}
