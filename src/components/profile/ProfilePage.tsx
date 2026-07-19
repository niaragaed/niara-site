import { InvestorProfileProvider } from "@/context/InvestorProfileContext";
import { ProfileNav } from "./ProfileNav";
import { PersonalDataSection } from "./PersonalDataSection";
import { InvestorProfileSection } from "./InvestorProfileSection";
import { WalletSection } from "./WalletSection";
import { PendingProfileAlert } from "./PendingProfileAlert";

export function ProfilePage() {
  return (
    <InvestorProfileProvider>
      <div className="flex min-h-[70vh] flex-col bg-bg-base">
        <PendingProfileAlert />

        <div className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-xs text-text-secondary sm:text-sm">
          <span className="font-semibold text-warning">Demonstração</span> —
          formulário ilustrativo. Nenhum dado é enviado a servidores nem
          armazenado permanentemente.
        </div>

        <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
          <h1 className="font-display text-2xl text-text-primary sm:text-3xl">
            Perfil
          </h1>

          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
            <ProfileNav />
            <div className="flex min-w-0 flex-1 flex-col gap-10">
              <PersonalDataSection />
              <InvestorProfileSection />
              <WalletSection />
            </div>
          </div>
        </div>
      </div>
    </InvestorProfileProvider>
  );
}
