"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("jalna-lang") as Lang | null;
      if (stored === "en" || stored === "hi" || stored === "mr") {
        setLangState(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLang = (value: Lang) => {
    setLangState(value);
    try {
      window.localStorage.setItem("jalna-lang", value);
    } catch {
      // ignore
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}


