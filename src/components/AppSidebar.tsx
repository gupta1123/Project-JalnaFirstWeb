"use client";

import * as React from "react";
import { LayoutDashboard, Users, FileWarning, Megaphone, UsersRound, Ticket, UserCheck, Tags } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { UserMenu } from "@/components/UserMenu";
import { getCurrentUser } from "@/lib/api";
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
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      ...(isAdmin ? [{ title: "Users", url: "/users", icon: Users }] : []),
      ...(isAdmin ? [{ title: "Staff", url: "/staff", icon: UsersRound }] : []),
    ],
    navSecondary: [],
    projects: [
      ...(isAdmin ? [{ name: "Complaints", url: "/complaints", icon: FileWarning }] : []),
      ...(isStaff ? [{ name: "My Tickets", url: "/my-tickets", icon: Ticket }] : []),
      ...(isAdmin ? [{ name: "Agency Contacts", url: "/agency-contacts", icon: Megaphone }] : []),
      ...(isAdmin ? [{ name: "Teams", url: "/teams", icon: UsersRound }] : []),
      // ...(isAdmin ? [{ name: "Categories", url: "/admin-categories", icon: Tags }] : []), // Hidden from sidebar
      ...(isTeamLead ? [{ name: "Team Members", url: "/team-members", icon: UserCheck }] : []),
      // ...(isTeamLead ? [{ name: "Categories", url: "/categories", icon: Tags }] : []), // Hidden from sidebar
    ],
  };
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  // Fetch current user to determine role
  const { data: currentUser, isLoading } = useSWR("current-user", getCurrentUser, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // Check if user is a team lead directly from user object
  const userRole = currentUser?.role || "user";
  const isTeamLead = currentUser?.teams?.some(team => team.isLeader) || false;
  const navigationData = getNavigationData(userRole, isTeamLead);


  // Determine panel title based on role
  const panelTitle = userRole === "staff" ? (isTeamLead ? "Team Lead Panel" : "Staff Panel") : "Admin Panel";

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  <Image src="/logo.png" alt="Jalna First" width={32} height={32} className="object-contain" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Jalna First</span>
                  <span className="truncate text-xs">{panelTitle}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {!isLoading && (
          <>
            <NavMain items={navigationData.navMain} />
            <NavProjects projects={navigationData.projects} />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}

