"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { tr } from "@/lib/i18n";

export type NavItem = {
  titleKey: string;
  url: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  items?: Array<{ title: string; url: string }>; // not used yet
};

export function NavMain({ items, lang }: { items: NavItem[]; lang: "en" | "hi" | "mr" }) {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{tr(lang, "sidebar.nav.main")}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.titleKey}>
              <SidebarMenuButton asChild isActive={pathname === item.url}>
                <Link href={item.url}>
                  {item.icon ? <item.icon className="size-4" /> : null}
                  <span>{tr(lang, item.titleKey)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

