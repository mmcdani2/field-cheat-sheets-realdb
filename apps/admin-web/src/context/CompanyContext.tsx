import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCompany, updateCompanyName, type Company } from "../lib/company";

type CompanyContextValue = {
  company: Company | null;
  loading: boolean;
  error: string;
  refreshCompany: () => Promise<void>;
  saveCompanyName: (name: string) => Promise<Company>;
};

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refreshCompany() {
    try {
      setLoading(true);
      setError("");
      const nextCompany = await getCompany();
      setCompany(nextCompany);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach API.");
    } finally {
      setLoading(false);
    }
  }

  async function saveCompanyName(name: string) {
    const nextCompany = await updateCompanyName(name);
    setCompany(nextCompany);
    return nextCompany;
  }

  useEffect(() => {
    refreshCompany();
  }, []);

  const value = useMemo(
    () => ({
      company,
      loading,
      error,
      refreshCompany,
      saveCompanyName,
    }),
    [company, loading, error]
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const context = useContext(CompanyContext);

  if (!context) {
    throw new Error("useCompany must be used within CompanyProvider");
  }

  return context;
}
