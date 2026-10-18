import { BookOpen, Mail, type LucideIcon } from "lucide-react";
import { en } from "@/lib/i18n/en";

export type NavChild = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export type NavItem = {
  label: string;
  // unused when `children` is present (the item becomes a mega-menu button,
  // not a link); kept required only to keep the type simple.
  href: string;
  children?: NavChild[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: en.nav.trade, href: "/trade" },
  { label: en.nav.exchange, href: "/exchange" },
  { label: en.nav.assets, href: "/assets" },
  { label: en.nav.profile, href: "/profile" },
  // Cashback is a selling point for issuing companies; it will get its own
  // issuer-facing page, outside the main nav.
  {
    label: en.nav.about,
    href: "#",
    children: [
      {
        label: en.nav.docsLabel,
        href: "/docs",
        description: en.nav.docsDescription,
        icon: BookOpen,
      },
      {
        label: en.nav.contactLabel,
        href: "/contact",
        description: en.nav.contactDescription,
        icon: Mail,
      },
    ],
  },
];
