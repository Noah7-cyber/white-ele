"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/layout/Shared";

export default function GuidesLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout role="admin" hideSidebarContent showNotifications={false}>
      {children}
    </DashboardLayout>
  );
}
