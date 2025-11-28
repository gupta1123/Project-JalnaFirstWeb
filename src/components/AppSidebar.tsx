"use client";

import * as React from "react";
import { LayoutDashboard, Users, FileWarning, Megaphone, UsersRound, Ticket, UserCheck, Tags, BarChart3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { UserMenu } from "@/components/UserMenu";
import { getCurrentUser } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Role-based navigation configuration
const getNavigationData = (userRole: string, isTeamLead: boolean = false) => {
  const isAdmin = userRole === "admin" || userRole === "superadmin";
  const isStaff = userRole === "staff";

  return {
    user: {
      name: "User",
      email: "user@example.com",
    },
    navMain: [
      { titleKey: "sidebar.nav.dashboard", url: "/dashboard", icon: LayoutDashboard },
      ...(isAdmin ? [{ titleKey: "sidebar.nav.users", url: "/users", icon: Users }] : []),
      ...(isAdmin ? [{ titleKey: "sidebar.nav.staff", url: "/staff", icon: UsersRound }] : []),
    ],
    navSecondary: [],
    projects: [
      ...(isAdmin ? [{ nameKey: "sidebar.nav.complaints", url: "/complaints", icon: FileWarning }] : []),
      ...(isStaff ? [{ nameKey: "sidebar.nav.teamTickets", url: "/my-tickets", icon: Ticket }] : []),
      ...(isAdmin ? [{ nameKey: "sidebar.nav.agencyContacts", url: "/agency-contacts", icon: Megaphone }] : []),
      ...(isAdmin ? [{ nameKey: "sidebar.nav.teams", url: "/teams", icon: UsersRound }] : []),
      ...(isAdmin ? [{ nameKey: "sidebar.nav.categories", url: "/admin-categories", icon: Tags }] : []),
      ...(isTeamLead ? [{ nameKey: "sidebar.nav.teamMembers", url: "/team-members", icon: UserCheck }] : []),
      ...(isAdmin ? [{ nameKey: "sidebar.nav.reports", url: "/reports", icon: BarChart3 }] : []),
      // ...(isTeamLead ? [{ name: "Categories", url: "/categories", icon: Tags }] : []), // Hidden from sidebar
    ],
  };
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { lang } = useLanguage();
  // Fetch current user to determine role
  const { data: currentUser, isLoading } = useSWR("current-user", getCurrentUser, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // Check if user is a team lead directly from user object
  const userRole = currentUser?.role || "user";
  const userTeams = currentUser?.teams ?? [];
  const leadingTeams = userTeams.filter(team => team.isLeader);
  const memberTeams = userTeams.filter(team => !team.isLeader);
  const isTeamLead = leadingTeams.length > 0;
  const navigationData = getNavigationData(userRole, isTeamLead);


  // Determine panel title based on role
  const panelTitleKey =
    userRole === "staff"
      ? isTeamLead
        ? "sidebar.panel.teamLead"
        : "sidebar.panel.staff"
      : "sidebar.panel.admin";
  const panelTitle = tr(lang, panelTitleKey);

  const teamContextLabel = (() => {
    const relevantTeams = leadingTeams.length > 0 ? leadingTeams : memberTeams;

    if (relevantTeams.length === 0) return null;

    const teamNames = relevantTeams.map(team => team.name).filter(Boolean).join(", ");

    return teamNames || null;
  })();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  <Image src="/logo.png" alt="Maza Jalna" width={32} height={32} className="object-contain" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Maza Jalna</span>
                  <span className="truncate text-xs">{panelTitle}</span>
                  {teamContextLabel && (
                    <span className="truncate text-[10px] text-muted-foreground">{teamContextLabel}</span>
                  )}
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {!isLoading && (
          <>
            <NavMain items={navigationData.navMain} lang={lang} />
            <NavProjects projects={navigationData.projects} lang={lang} />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-4 py-2 text-center">
          <p className="text-[10px] text-muted-foreground">Powered by Nyx Solutions</p>
        </div>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
