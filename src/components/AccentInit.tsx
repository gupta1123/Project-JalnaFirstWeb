"use client";

import { useEffect } from "react";
import type { Accent } from "@/hooks/use-accent";

const ACCENT_STORAGE_KEY = "accent_theme";
const SUPPORTED_ACCENTS: Accent[] = ["default", "violet", "blue", "green", "orange", "rose"];

export function AccentInit() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const stored = typeof window !== "undefined" ? (window.localStorage.getItem(ACCENT_STORAGE_KEY) as Accent | null) : null;
    const accent = stored && SUPPORTED_ACCENTS.includes(stored) ? stored : "default";
    const root = document.documentElement;
    if (accent === "default") {
      root.removeAttribute("data-accent");
    } else {
      root.setAttribute("data-accent", accent);
    }
  }, []);

  return null;
}


