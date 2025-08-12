"use client";

import { useCallback, useEffect, useState } from "react";

export type BaseTheme = "neutral" | "zinc" | "gray" | "slate" | "stone";

const STORAGE_KEY = "base_theme";
const SUPPORTED_THEMES: BaseTheme[] = ["neutral", "zinc", "gray", "slate", "stone"];

function applyBaseTheme(theme: BaseTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "neutral") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

export function useBaseTheme() {
  const [baseTheme, setBaseThemeState] = useState<BaseTheme>("neutral");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as BaseTheme | null;
    const initial = stored && SUPPORTED_THEMES.includes(stored) ? stored : "neutral";
    setBaseThemeState(initial);
    applyBaseTheme(initial);
  }, []);

  const setBaseTheme = useCallback((next: BaseTheme) => {
    setBaseThemeState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
    applyBaseTheme(next);
  }, []);

  return { baseTheme, setBaseTheme, supportedThemes: SUPPORTED_THEMES } as const;
}

