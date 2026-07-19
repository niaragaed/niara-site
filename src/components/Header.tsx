"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { NavDropdown } from "./NavDropdown";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAccordionOpen, setMobileAccordionOpen] = useState<string | null>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function closeMobileMenu() {
    setMobileOpen(false);
    setMobileAccordionOpen(null);
  }

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors ${
        scrolled
          ? "border-border bg-bg-surface/80 backdrop-blur"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/niara-mark.png"
            alt="Niara"
            width={36}
            height={30}
            priority
            className="h-[30px] w-auto"
          />
          <span className="font-display text-lg tracking-widest text-text-primary">
            NIARA
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <li key={item.label}>
                  <NavDropdown item={item} />
                </li>
              ) : (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <Link
          href="/trade"
          className="hidden rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-text-primary md:inline-block"
        >
          Acessar Terminal
        </Link>

        <button
          type="button"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
          className="text-text-primary md:hidden"
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Navegação mobile"
          className="border-t border-border bg-bg-surface px-6 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-4">
            {NAV_ITEMS.map((item) => {
              if (!item.children) {
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={closeMobileMenu}
                      className="text-sm text-text-secondary hover:text-text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              }

              const isAccordionOpen = mobileAccordionOpen === item.label;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    aria-expanded={isAccordionOpen}
                    onClick={() =>
                      setMobileAccordionOpen((current) =>
                        current === item.label ? null : item.label,
                      )
                    }
                    className="flex w-full items-center justify-between text-sm text-text-secondary hover:text-text-primary"
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isAccordionOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  {isAccordionOpen && (
                    <ul className="mt-3 flex flex-col gap-3 border-l border-border pl-4">
                      {item.children.map((child) => {
                        const Icon = child.icon;
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={closeMobileMenu}
                              className="flex items-start gap-3"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bg-elevated text-text-secondary">
                                <Icon className="h-4 w-4" aria-hidden="true" />
                              </span>
                              <span>
                                <span className="block text-sm text-text-primary">
                                  {child.label}
                                </span>
                                <span className="block text-xs text-text-muted">
                                  {child.description}
                                </span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
            <li>
              <Link
                href="/trade"
                onClick={closeMobileMenu}
                className="inline-block rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-text-primary"
              >
                Acessar Terminal
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
