"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { Flag } from "@/components/ui/Flag";
import { en } from "@/lib/i18n/en";

export function CountrySelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (code: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = COUNTRIES.find((country) => country.code === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (country) => country.name.toLowerCase().includes(q) || country.code.toLowerCase() === q,
    );
  }, [query]);

  function select(code: string) {
    onChange(code);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <label htmlFor="pd-country-trigger" className="mb-1 block text-xs text-text-muted">
        {en.profile.personalData.country}
      </label>
      <button
        id="pd-country-trigger"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={error ? "pd-country-error" : undefined}
        className={`flex w-full items-center gap-2 rounded-md border bg-bg-base px-3 py-2 text-left text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue ${
          error ? "border-negative" : "border-border"
        }`}
      >
        {selected ? (
          <>
            <Flag country={selected.code.toLowerCase()} size="sm" />
            <span className="flex-1 truncate">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 truncate text-text-muted">
            {en.profile.personalData.selectCountry}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {error && (
        <p id="pd-country-error" role="alert" className="mt-1 text-xs text-negative">
          {error}
        </p>
      )}

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute left-0 right-0 z-20 mt-1 rounded-md border border-border bg-bg-elevated shadow-lg">
            <div className="relative border-b border-border p-2">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
                aria-hidden="true"
              />
              <label htmlFor="pd-country-search" className="sr-only">
                {en.profile.personalData.searchCountryPlaceholder}
              </label>
              <input
                id="pd-country-search"
                type="text"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={en.profile.personalData.searchCountryPlaceholder}
                className="w-full rounded border border-border bg-bg-base py-1.5 pl-7 pr-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-blue"
              />
            </div>
            <ul
              role="listbox"
              aria-label={en.profile.personalData.country}
              className="max-h-64 overflow-y-auto py-1 [scrollbar-color:var(--color-border)_transparent] [scrollbar-width:thin]"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-xs text-text-muted">
                  {en.profile.personalData.noCountriesFound}
                </li>
              ) : (
                filtered.map((country) => (
                  <li key={country.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={country.code === value}
                      onClick={() => select(country.code)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
                    >
                      <Flag country={country.code.toLowerCase()} size="sm" />
                      <span className="truncate">{country.name}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
