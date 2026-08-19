"use client";

import * as React from "react";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { tr } from "@/lib/i18n";

export function NavProjects({
  projects,
  lang,
}: {
  projects: Array<{ nameKey: string; url: string; icon?: React.ComponentType<React.SVGProps<SVGSVGElement>> }>;
  lang: "en" | "hi" | "mr";
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{tr(lang, "sidebar.nav.operations")}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {projects.map((item) => (
            <SidebarMenuItem key={item.nameKey}>
              <SidebarMenuButton asChild>
                <Link href={item.url}>
                  {item.icon ? <item.icon className="size-4" /> : null}
                  <span>{tr(lang, item.nameKey)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

