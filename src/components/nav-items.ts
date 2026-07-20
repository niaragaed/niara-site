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
  // não usado quando `children` está presente (o item vira um botão de
  // mega-menu, não um link) — mantido obrigatório só para simplificar o tipo.
  href: string;
  children?: NavChild[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: en.nav.trade, href: "/trade" },
  { label: en.nav.exchange, href: "/exchange" },
  { label: en.nav.assets, href: "/assets" },
  { label: en.nav.profile, href: "/profile" },
  // Cashback é argumento para empresas emissoras — terá página própria
  // voltada a emissores, fora do nav principal.
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
