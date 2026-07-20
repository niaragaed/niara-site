import { en } from "@/lib/i18n/en";

type ProfileSection = {
  id: string;
  label: string;
};

const SECTIONS: ProfileSection[] = [
  { id: "personal-data", label: en.profile.nav.personalData },
  { id: "investor-profile", label: en.profile.nav.investorProfile },
  { id: "wallet", label: en.profile.nav.wallet },
];

export function ProfileNav() {
  return (
    <>
      {/* Desktop: sidebar sticky */}
      <nav
        aria-label={en.profile.sectionsAriaLabel}
        className="hidden shrink-0 lg:sticky lg:top-24 lg:block lg:w-56"
      >
        <ul className="flex flex-col gap-1">
          {SECTIONS.map((section) => (
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

      {/* Mobile: abas horizontais roláveis */}
      <div
        role="tablist"
        aria-label={en.profile.sectionsAriaLabel}
        className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 pb-px lg:hidden"
      >
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            role="tab"
            className="shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent-blue hover:text-text-primary"
          >
            {section.label}
          </a>
        ))}
      </div>
    </>
  );
}
