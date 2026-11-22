import type { Metadata } from "next";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { TestnetBanner } from "@/components/web3/TestnetBanner";
import { en } from "@/lib/i18n/en";

export const metadata: Metadata = {
  title: en.profile.metaTitle,
  description: en.profile.metaDescription,
};

export default function Page() {
  return (
    <>
      <TestnetBanner />
      <ProfilePage />
    </>
  );
}
