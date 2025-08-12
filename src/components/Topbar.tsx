"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccent, Accent } from "@/hooks/use-accent";
import { usePathname } from "next/navigation";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pathname = usePathname();
  const pageMeta = useMemo(() => getTopbarHeading(pathname ?? "/"), [pathname]);

  return (
    <div className="flex items-center justify-between border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2">
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">{pageMeta.title}</div>
        {pageMeta.subtitle && <div className="text-xs text-muted-foreground truncate">{pageMeta.subtitle}</div>}
      </div>
      <div className="flex items-center gap-3">
        {/* Accent */}
        <Select value={accent} onValueChange={(v) => setAccent(v as Accent)}>
          <SelectTrigger aria-label="Accent" className="w-[130px]">
            <SelectValue placeholder="Accent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="violet">Violet</SelectItem>
            <SelectItem value="blue">Blue</SelectItem>
            <SelectItem value="green">Green</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
            <SelectItem value="rose">Rose</SelectItem>
          </SelectContent>
        </Select>
        {/* Theme */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {mounted ? (theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />) : <span className="block size-5" />}
        </Button>
        <div className="size-8 rounded-full bg-gradient-to-tr from-primary to-accent" />
      </div>
    </div>
  );
}

function getTopbarHeading(path: string) {
  if (path.startsWith("/dashboard")) return { title: "Dashboard", subtitle: "Overview and insights" };
  if (path.startsWith("/agency-contacts")) return { title: "Agency Contacts", subtitle: "Reach key partners quickly" };
  if (path.startsWith("/users/")) return { title: "User Details", subtitle: "Profile, activity and status" };
  if (path.startsWith("/users")) return { title: "Users", subtitle: "Search, filter and manage" };
  if (path.startsWith("/complaints/")) return { title: "Complaint", subtitle: "Timeline and actions" };
  if (path.startsWith("/complaints")) return { title: "Complaints", subtitle: "Track and resolve citizen issues" };
  return { title: "Admin", subtitle: "" };
}

