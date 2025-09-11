"use client";

import * as React from "react";
import useSWR from "swr";
import { getCurrentUser } from "@/lib/api";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Moon, Sun, Monitor, LogOut } from "lucide-react";

export function UserMenu() {
  const { data } = useSWR("me", getCurrentUser);
  const { setTheme } = useTheme();
  const name = data?.fullName ?? (data ? `${data.firstName} ${data.lastName}` : "Admin");
  const email = data?.email ?? "admin@example.com";

  // Determine display role. Admin/superadmin => Admin; if user has any team with isLeader => Team Lead; else Staff/User
  const isTeamLead = Boolean(
    data?.teams && Array.isArray(data.teams) && data.teams.some((t) => t?.isLeader === true)
  );

  const roleLabel = (() => {
    const role = data?.role;
    if (role === "admin" || role === "superadmin") return "Admin";
    if (isTeamLead) return "Team Lead";
    if (role === "staff") return "Staff";
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";
  })();

  async function handleLogout() {
    try {
      await fetch("/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-pointer select-none">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <span className="text-xs font-bold">{name?.slice(0, 1) ?? "A"}</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs opacity-70">{roleLabel}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-md text-sm font-bold">
              {name?.slice(0, 1) ?? "A"}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{name}</div>
              <div className="truncate text-xs text-muted-foreground">{roleLabel}</div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 size-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 size-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 size-4" /> System
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
          <LogOut className="mr-2 size-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

