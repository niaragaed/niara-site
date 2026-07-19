import type { Metadata } from "next";
import { ProfilePage } from "@/components/profile/ProfilePage";

export const metadata: Metadata = {
  title: "Perfil — Niara",
  description: "Dados pessoais, perfil de investidor, carteira e preferências.",
};

export default function Page() {
  return <ProfilePage />;
}
