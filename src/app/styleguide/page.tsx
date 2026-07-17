type Swatch = {
  label: string;
  hex: string;
  className: string;
};

const surfaceSwatches: Swatch[] = [
  { label: "bg-base", hex: "#05070E", className: "bg-bg-base" },
  { label: "bg-surface", hex: "#0A0E1A", className: "bg-bg-surface" },
  { label: "bg-elevated", hex: "#111728", className: "bg-bg-elevated" },
  { label: "border", hex: "#1C2438", className: "bg-border" },
];

const textSwatches: Swatch[] = [
  { label: "text-primary", hex: "#F4F6FB", className: "bg-text-primary" },
  { label: "text-secondary", hex: "#A6B0C3", className: "bg-text-secondary" },
  { label: "text-muted", hex: "#6B7688", className: "bg-text-muted" },
];

const accentSwatches: Swatch[] = [
  { label: "accent-blue", hex: "#2E6BFF", className: "bg-accent-blue" },
  { label: "accent-violet", hex: "#7B3FE4", className: "bg-accent-violet" },
  { label: "accent-cyan", hex: "#38BDF8", className: "bg-accent-cyan" },
];

const semanticSwatches: Swatch[] = [
  { label: "positive", hex: "#16C784", className: "bg-positive" },
  { label: "negative", hex: "#F6465D", className: "bg-negative" },
  { label: "warning", hex: "#F0B90B", className: "bg-warning" },
];

function SwatchGrid({ swatches }: { swatches: Swatch[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {swatches.map((swatch) => (
        <div key={swatch.label} className="flex flex-col gap-2">
          <div
            className={`h-16 rounded-lg border border-border ${swatch.className}`}
          />
          <div>
            <p className="text-sm text-text-primary">{swatch.label}</p>
            <p className="font-mono text-xs text-text-muted">{swatch.hex}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function StyleGuide() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-16 px-6 py-16">
      <header className="flex flex-col gap-2 border-b border-border pb-8">
        <h1 className="text-3xl font-semibold">Niara — Style Guide</h1>
        <p className="text-text-muted">
          Referência interna dos tokens de design. Não é conteúdo de
          marketing.
        </p>
      </header>

      <Section title="Cores — Superfícies">
        <SwatchGrid swatches={surfaceSwatches} />
      </Section>

      <Section title="Cores — Texto">
        <SwatchGrid swatches={textSwatches} />
      </Section>

      <Section title="Cores — Acento">
        <SwatchGrid swatches={accentSwatches} />
        <div className="flex flex-col gap-2">
          <div className="h-16 w-full rounded-lg bg-gradient-primary sm:w-1/2" />
          <div>
            <p className="text-sm text-text-primary">gradiente primário</p>
            <p className="font-mono text-xs text-text-muted">
              linear-gradient(135deg, #2E6BFF, #7B3FE4)
            </p>
          </div>
        </div>
      </Section>

      <Section title="Cores — Semânticos">
        <SwatchGrid swatches={semanticSwatches} />
      </Section>

      <Section title="Tipografia">
        <div className="flex flex-col gap-6">
          <h1 className="font-display text-5xl font-bold tracking-[0.2em] text-text-primary">
            NIARA
          </h1>
          <p className="max-w-2xl font-sans text-base text-text-secondary">
            Este parágrafo usa Inter, a fonte padrão do corpo do texto. É a
            família usada para interface, textos longos e conteúdo geral do
            site — legibilidade em qualquer tamanho.
          </p>
          <p className="font-mono text-2xl tabular-nums text-text-primary">
            BTC/USD 67,240.15{" "}
            <span className="text-positive">+2.34%</span>{" "}
            <span className="text-negative">-1.08%</span>
          </p>
        </div>
      </Section>

      <Section title="Botões e links">
        <div className="flex flex-wrap items-center gap-4">
          <button className="rounded-md bg-gradient-primary px-5 py-2.5 font-sans text-sm font-medium text-text-primary">
            Botão primário
          </button>
          <button className="rounded-md border border-border px-5 py-2.5 font-sans text-sm font-medium text-text-primary">
            Botão secundário
          </button>
          <a
            href="#"
            className="font-sans text-sm font-medium text-accent-cyan underline underline-offset-4"
          >
            Link em destaque
          </a>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-bg-surface p-6">
            <p className="font-display text-lg text-text-primary">
              bg-surface
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Card padrão sobre o fundo base, usado para painéis e blocos de
              conteúdo.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-bg-elevated p-6">
            <p className="font-display text-lg text-text-primary">
              bg-elevated
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Card elevado, usado em hover ou para destacar um elemento sobre
              bg-surface.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
