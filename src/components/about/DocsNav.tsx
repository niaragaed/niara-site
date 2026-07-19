type DocsSection = {
  id: string;
  label: string;
};

export function DocsNav({ sections }: { sections: DocsSection[] }) {
  return (
    <nav
      aria-label="Navegação da documentação"
      className="hidden shrink-0 lg:sticky lg:top-24 lg:block lg:w-56"
    >
      <ul className="flex flex-col gap-1">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="block border-l-2 border-border py-1.5 pl-4 text-sm text-text-secondary transition-colors hover:border-accent-blue hover:text-text-primary"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
