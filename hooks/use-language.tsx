"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Language } from "@/lib/i18n/types";
import { t } from "@/lib/i18n";

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

function getInitialLanguage(): Language {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("dashboard-lang");
    if (stored === "en" || stored === "bn") return stored;
  }
  return "bn";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem("dashboard-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === "bn" ? "en" : "bn"));
  }, []);

  const translate = useCallback((key: string) => t(key, lang), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
