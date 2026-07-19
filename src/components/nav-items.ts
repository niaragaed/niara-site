import { BookOpen, Mail, type LucideIcon } from "lucide-react";

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

// se preferir consistência com o português do site, trocar os labels para
// "Perfil" e "Sobre" — alterar apenas aqui
export const NAV_ITEMS: NavItem[] = [
  { label: "Trade", href: "/trade" },
  // se preferir, "Exchange" pode virar "Câmbio" — alterar apenas o label aqui
  { label: "Exchange", href: "/exchange" },
  { label: "Ativos", href: "/ativos" },
  { label: "Profile", href: "/profile" },
  // Cashback é argumento para empresas emissoras — terá página própria
  // voltada a emissores, fora do nav principal.
  {
    label: "About",
    href: "#",
    children: [
      {
        label: "Docs & FAQs",
        href: "/docs",
        description: "Conheça o produto, a tecnologia e o modelo da Niara.",
        icon: BookOpen,
      },
      {
        label: "Contato",
        href: "/contato",
        description:
          "Fale com a Niara para parcerias, emissão de ativos ou suporte.",
        icon: Mail,
      },
    ],
  },
];
