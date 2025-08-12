"use client";

import { useEffect } from "react";

const STORAGE_KEY = "base_theme";

export function ThemeInit() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const stored = (typeof window !== "undefined"
      ? window.localStorage.getItem(STORAGE_KEY)
      : null) as string | null;
    const next = stored && ["neutral", "zinc", "gray", "slate", "stone"].includes(stored)
      ? stored
      : "neutral";
    const root = document.documentElement;
    if (next === "neutral") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", next);
  }, []);
  return null;
}

