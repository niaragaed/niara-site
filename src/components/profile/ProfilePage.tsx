import { ProfileNav } from "./ProfileNav";
import { PersonalDataSection } from "./PersonalDataSection";

export function ProfilePage() {
  return (
    <div className="flex min-h-[70vh] flex-col bg-bg-base">
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
          <div className="min-w-0 flex-1">
            <PersonalDataSection />
          </div>
        </div>
      </div>
    </div>
  );
}
