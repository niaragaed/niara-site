"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
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
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/trade"
                onClick={() => setMobileOpen(false)}
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
