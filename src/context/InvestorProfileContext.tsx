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

// only the category, the aggregate score and the date are persisted, never
// the individual questionnaire answers (profile data, not sensitive identity
// data, but we still keep only the minimum needed).
const STORAGE_KEY = "niara:investor-profile";

type InvestorProfileState = {
  result: InvestorProfileResult | null;
  /** true only after client hydration, so "pending" doesn't flash before localStorage is read */
  hydrated: boolean;
  saveResult: (result: InvestorProfileResult) => void;
  clearResult: () => void;
};

const InvestorProfileContext = createContext<InvestorProfileState | null>(null);

export function useInvestorProfile(): InvestorProfileState {
  const ctx = useContext(InvestorProfileContext);
  if (!ctx) {
    throw new Error("useInvestorProfile must be used inside <InvestorProfileProvider>");
  }
  return ctx;
}

export function InvestorProfileProvider({ children }: { children: ReactNode }) {
  // starts as null on the server and on the client's first render; reading
  // localStorage only happens after mount, in an effect, to avoid a
  // hydration mismatch.
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
        // corrupted/old value: ignore it and stay "pending"
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
