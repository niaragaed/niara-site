"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  isInvestorProfileResult,
  type InvestorProfileResult,
} from "@/lib/investor-profile";

// só a categoria, o escore agregado e a data são persistidos — nunca as
// respostas individuais do questionário (dado de perfil, não dado sensível
// de identificação, mas ainda assim mantemos o mínimo necessário).
const STORAGE_KEY = "niara:investor-profile";

type InvestorProfileState = {
  result: InvestorProfileResult | null;
  /** true só depois da hidratação no cliente — evita "pendente" piscar antes de ler o localStorage */
  hydrated: boolean;
  saveResult: (result: InvestorProfileResult) => void;
  clearResult: () => void;
};

const InvestorProfileContext = createContext<InvestorProfileState | null>(null);

export function useInvestorProfile(): InvestorProfileState {
  const ctx = useContext(InvestorProfileContext);
  if (!ctx) {
    throw new Error("useInvestorProfile precisa estar dentro de <InvestorProfileProvider>");
  }
  return ctx;
}

export function InvestorProfileProvider({ children }: { children: ReactNode }) {
  // nasce nulo no servidor e no primeiro render do cliente — a leitura do
  // localStorage só acontece depois do mount, num efeito, pra não dar
  // mismatch de hidratação.
  const [result, setResult] = useState<InvestorProfileResult | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (isInvestorProfileResult(parsed)) setResult(parsed);
      } catch {
        // valor corrompido/antigo — ignora e segue como "pendente"
      }
    }
    setHydrated(true);
  }, []);

  const saveResult = useCallback((next: InvestorProfileResult) => {
    setResult(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<InvestorProfileState>(
    () => ({ result, hydrated, saveResult, clearResult }),
    [result, hydrated, saveResult, clearResult],
  );

  return (
    <InvestorProfileContext.Provider value={value}>
      {children}
    </InvestorProfileContext.Provider>
  );
}
