type ProfileSection = {
  id: string;
  label: string;
  disabled?: boolean;
};

// só "dados-pessoais" tem conteúdo por enquanto — as demais seções (perfil
// de investidor, carteira, segurança, preferências) chegam depois; a
// navegação já fica pronta para recebê-las.
const SECTIONS: ProfileSection[] = [
  { id: "dados-pessoais", label: "Dados pessoais" },
  { id: "perfil-investidor", label: "Perfil de investidor", disabled: true },
  { id: "carteira", label: "Carteira", disabled: true },
  { id: "seguranca", label: "Segurança", disabled: true },
  { id: "preferencias", label: "Preferências", disabled: true },
];

export function ProfileNav() {
  return (
    <>
      {/* Desktop: sidebar sticky */}
      <nav
        aria-label="Seções do perfil"
        className="hidden shrink-0 lg:sticky lg:top-24 lg:block lg:w-56"
      >
        <ul className="flex flex-col gap-1">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              {section.disabled ? (
                <span className="flex cursor-not-allowed items-center justify-between border-l-2 border-border py-1.5 pl-4 text-sm text-text-muted opacity-60">
                  {section.label}
                  <span className="mr-2 text-[10px] uppercase tracking-wide">
                    em breve
                  </span>
                </span>
              ) : (
                <a
                  href={`#${section.id}`}
                  aria-current="true"
                  className="block border-l-2 border-accent-blue py-1.5 pl-4 text-sm font-medium text-text-primary"
                >
                  {section.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile: abas horizontais roláveis */}
      <div
        role="tablist"
        aria-label="Seções do perfil"
        className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 pb-px lg:hidden"
      >
        {SECTIONS.map((section) =>
          section.disabled ? (
            <span
              key={section.id}
              role="tab"
              aria-disabled="true"
              aria-selected="false"
              className="shrink-0 cursor-not-allowed whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-xs text-text-muted opacity-60"
            >
              {section.label}
              <span className="ml-1 text-[9px] uppercase tracking-wide">
                (em breve)
              </span>
            </span>
          ) : (
            <a
              key={section.id}
              href={`#${section.id}`}
              role="tab"
              aria-selected="true"
              className="shrink-0 whitespace-nowrap border-b-2 border-accent-blue px-3 py-2 text-xs font-medium text-text-primary"
            >
              {section.label}
            </a>
          ),
        )}
      </div>
    </>
  );
}
