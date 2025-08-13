"use client";

import { useEffect } from "react";
import { getCurrentUser, clearAuthToken } from "@/lib/api";

export function useAuthGuard() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getCurrentUser();
      } catch {
        if (cancelled) return;
        // Clear token and redirect to login with next param
        clearAuthToken();
        const next = typeof window !== "undefined" ? window.location.pathname : "/";
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
      }
    })();
    return () => { cancelled = true; };
  }, []);
}

