// placeholder — trocar por SVGs oficiais das redes
const NETWORKS = ["Ethereum", "Solana", "Bitcoin", "USDC", "+ em breve"];

export function SupportedNetworks() {
  const track = [...NETWORKS, ...NETWORKS];

  return (
    <section className="border-t border-border bg-bg-base py-12">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs uppercase tracking-widest text-text-muted">
          Ativos e redes suportadas
        </p>

        <div className="mt-6 overflow-hidden">
          <div className="flex w-max animate-marquee gap-16">
            {track.map((name, index) => (
              <span
                key={`${name}-${index}`}
                className="font-display text-lg text-text-muted opacity-60"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
