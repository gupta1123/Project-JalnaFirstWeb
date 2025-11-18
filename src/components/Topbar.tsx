"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccent, Accent } from "@/hooks/use-accent";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const [mounted, setMounted] = useState(false);
  const { lang, setLang } = useLanguage();
  useEffect(() => setMounted(true), []);
  const pathname = usePathname();
  const pageMeta = useMemo(() => getTopbarHeading(pathname ?? "/"), [pathname]);

  const translatedTitle = useMemo(() => {
    if (!pathname || !pageMeta.titleKey) return pageMeta.title;
    return tr(lang, pageMeta.titleKey);
  }, [lang, pageMeta.titleKey, pageMeta.title, pathname]);

  const translatedSubtitle = useMemo(() => {
    if (!pathname || !pageMeta.subtitleKey) return pageMeta.subtitle;
    return tr(lang, pageMeta.subtitleKey);
  }, [lang, pageMeta.subtitleKey, pageMeta.subtitle, pathname]);

  return (
    <div className="flex items-center justify-between border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2">
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">{translatedTitle}</div>
        {translatedSubtitle && <div className="text-xs text-muted-foreground truncate">{translatedSubtitle}</div>}
      </div>
      <div className="flex items-center gap-3">
        {/* Language */}
        <div className="hidden sm:inline-flex items-center gap-1 rounded-full border bg-muted/40 px-1 py-0.5 text-[11px]">
          {(["en", "hi", "mr"] as const).map((code) => (
            <Button
              key={code}
              type="button"
              size="sm"
              variant={lang === code ? "default" : "ghost"}
              className="h-7 px-2 text-[11px]"
              onClick={() => setLang(code)}
            >
              {code.toUpperCase()}
            </Button>
          ))}
        </div>
        {/* Accent */}
        <Select value={accent} onValueChange={(v) => setAccent(v as Accent)}>
          <SelectTrigger aria-label={tr(lang, "topbar.accent.label")} className="w-[130px]">
            <SelectValue placeholder={tr(lang, "topbar.accent.label")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">{tr(lang, "topbar.accent.default")}</SelectItem>
            <SelectItem value="violet">{tr(lang, "topbar.accent.violet")}</SelectItem>
            <SelectItem value="blue">{tr(lang, "topbar.accent.blue")}</SelectItem>
            <SelectItem value="green">{tr(lang, "topbar.accent.green")}</SelectItem>
            <SelectItem value="orange">{tr(lang, "topbar.accent.orange")}</SelectItem>
            <SelectItem value="rose">{tr(lang, "topbar.accent.rose")}</SelectItem>
          </SelectContent>
        </Select>
        {/* Theme */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={tr(lang, "topbar.theme.toggle")}
          title={tr(lang, "topbar.theme.toggle")}
        >
          {mounted ? (theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />) : <span className="block size-5" />}
        </Button>
        <div className="size-8 rounded-full bg-gradient-to-tr from-primary to-accent" />
      </div>
    </div>
  );
}

function getTopbarHeading(path: string) {
  if (path.startsWith("/dashboard")) return { title: "Dashboard", subtitle: "Overview and insights", titleKey: "topbar.dashboard.title", subtitleKey: "topbar.dashboard.subtitle" };
  if (path.startsWith("/agency-contacts")) return { title: "Agency Contacts", subtitle: "Reach key partners quickly", titleKey: "topbar.agencyContacts.title", subtitleKey: "topbar.agencyContacts.subtitle" };
  if (path.startsWith("/users/")) return { title: "User Details", subtitle: "Profile, activity and status", titleKey: "topbar.userDetails.title", subtitleKey: "topbar.userDetails.subtitle" };
  if (path.startsWith("/users")) return { title: "Users", subtitle: "Search, filter and manage", titleKey: "topbar.users.title", subtitleKey: "topbar.users.subtitle" };
  if (path.startsWith("/complaints/")) return { title: "Complaint", subtitle: "Timeline and actions", titleKey: "topbar.complaint.title", subtitleKey: "topbar.complaint.subtitle" };
  if (path.startsWith("/complaints")) return { title: "Complaints", subtitle: "Track and resolve citizen issues", titleKey: "topbar.complaints.title", subtitleKey: "topbar.complaints.subtitle" };
  if (path.startsWith("/teams")) return { title: "Teams", subtitle: "Manage staff teams and assignments", titleKey: "topbar.teams.title", subtitleKey: "topbar.teams.subtitle" };
  if (path.startsWith("/team-members")) return { title: "Team Members", subtitle: "Manage your team", titleKey: "topbar.teamMembers.title", subtitleKey: "topbar.teamMembers.subtitle" };
  if (path.startsWith("/my-tickets")) return { title: "Team Tickets", subtitle: "View and manage tickets assigned to your team", titleKey: "topbar.teamTickets.title", subtitleKey: "topbar.teamTickets.subtitle" };
  if (path.startsWith("/staff")) return { title: "Staff", subtitle: "Manage staff members", titleKey: "topbar.staff.title", subtitleKey: "topbar.staff.subtitle" };
  if (path.startsWith("/categories")) return { title: "Categories", subtitle: "Manage categories and subcategories", titleKey: "topbar.categories.title", subtitleKey: "topbar.categories.subtitle" };
  return { title: "Admin", subtitle: "", titleKey: "topbar.admin.title", subtitleKey: "topbar.admin.subtitle" };
}

