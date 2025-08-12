"use client";

import { useCallback, useEffect, useState } from "react";

export type Accent = "default" | "violet" | "blue" | "green" | "orange" | "rose";

const STORAGE_KEY = "accent_theme";
const SUPPORTED: Accent[] = ["default", "violet", "blue", "green", "orange", "rose"];

function applyAccent(accent: Accent) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (accent === "default") root.removeAttribute("data-accent");
  else root.setAttribute("data-accent", accent);
}

export function useAccent() {
  const [accent, setAccentState] = useState<Accent>("default");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as Accent | null;
    const next = stored && SUPPORTED.includes(stored) ? stored : "default";
    setAccentState(next);
    applyAccent(next);
  }, []);

  const setAccent = useCallback((next: Accent) => {
    setAccentState(next);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
    applyAccent(next);
  }, []);

  return { accent, setAccent, supportedAccents: SUPPORTED } as const;
}

