"use client";

import { Header } from "@/modules/shared/component/Header";
import { Sidebar } from "@/components/Sidebar";
import { FC, ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { shouldHideMobileDashboardHeader } from "@/utils/dashboardMobileHeader";
import { showToast } from "@/modules/shared/component/Toast";
import { QR_ROLE_BLOCKED_TOAST_KEY } from "@/utils/auth/sessionGuards";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "staff" | "parent";
  hideSidebarContent?: boolean;
  showNotifications?: boolean;
}

export const DashboardLayout: FC<DashboardLayoutProps> = ({
  children,
  role,
  hideSidebarContent = false,
  showNotifications = true,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width:768px)");
  const hideShellForStandaloneDetail =
    /\/(admin|staff|parent)\/communication\/announcement\/[^/]+$/.test(pathname) ||
    /\/admin\/parents\/[^/]+\/invoice\/[^/]+$/.test(pathname);
  const showHeader =
    pathname.split("/").filter(Boolean).length >= 2 &&
    !hideShellForStandaloneDetail &&
    !(isMobile && shouldHideMobileDashboardHeader(pathname));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldShowQrBlockedToast = window.sessionStorage.getItem(QR_ROLE_BLOCKED_TOAST_KEY) === "1";
    if (!shouldShowQrBlockedToast) return;

    window.sessionStorage.removeItem(QR_ROLE_BLOCKED_TOAST_KEY);
    showToast({
      message: "Access denied",
      description: "Only parent accounts can scan this QR code.",
      severity: "error",
    });
  }, []);

  return (
    <div className="flex h-screen">
      {!hideShellForStandaloneDetail && (
        <Sidebar
          role={role}
          isOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
          hideContent={hideSidebarContent}
        />
      )}
      <div className="flex flex-col flex-1 overflow-hidden">
        {showHeader && (
          <Header
            role={role}
            onHamburgerClick={() => setIsMobileOpen((prev) => !prev)}
            showNotifications={showNotifications}
          />
        )}
        <main
          className="flex-1 bg-dashboard-bg overflow-y-auto hide-scrollbar"
          style={{ overscrollBehaviorX: "none", WebkitOverflowScrolling: "auto" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
