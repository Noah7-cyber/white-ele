"use client";

import { Header } from "@/modules/shared/component/Header";
import { Sidebar } from "@/components/Sidebar";
import { FC, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "staff";
}

export const DashboardLayout: FC<DashboardLayoutProps> = ({ children, role }) => {
  const pathname = usePathname();
  const showHeader = pathname.split("/").filter(Boolean).length === 2;

  return (
    <div className="flex flex-col h-screen">
      {showHeader && <Header role={role} />}
      <div className="flex flex-1 overflow-y-auto">
        <Sidebar role={role} />
        <main className="flex-1 h-full p-4 bg-gray-50 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
