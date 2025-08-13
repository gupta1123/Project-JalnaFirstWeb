"use client";
import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Topbar } from "@/components/Topbar";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  useAuthGuard();
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex">
        <AppSidebar />
        <div className="flex flex-1 min-h-screen flex-col">
          <Topbar />
          <main className="p-6 flex-1">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

