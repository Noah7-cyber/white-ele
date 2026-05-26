"use client"

import { Header } from "@/modules/shared/component/Header"
import { Sidebar } from "@/components/Sidebar"
import type { FC, ReactNode } from "react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { useMediaQuery } from "@/utils/hooks/useMediaQuery"
import { shouldHideMobileDashboardHeader } from "@/utils/dashboardMobileHeader"

interface SharedDashboardLayoutProps {
  children: ReactNode
  role: "admin" | "staff" | "parent"
  sidebarPosition?: "left" | "right"
  headerPosition?: "top" | "bottom"
}

export const SharedDashboardLayout: FC<SharedDashboardLayoutProps> = ({
  children,
  role,
  sidebarPosition = "left",
  headerPosition = "top",
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width:768px)")
  const hideShellForAnnouncementDetail = /\/(admin|staff|parent)\/communication\/announcement\/[^/]+$/.test(
    pathname,
  )
  const segments = pathname.split("/").filter(Boolean)
  const root = segments[0]
  const isDashboardShell =
    root === "staff" || root === "admin" || root === "parent"
  // Previously header only showed when depth === 2 (e.g. /staff/dashboard), which hid the
  // shell on messaging, learning, settings, etc. Mobile sidebar opens from the header menu.
  const showHeader =
    isDashboardShell &&
    segments.length >= 2 &&
    !hideShellForAnnouncementDetail &&
    !(isMobile && shouldHideMobileDashboardHeader(pathname))
  const isSidebarLeft = sidebarPosition === "left"
  const isHeaderTop = headerPosition === "top"

  return (
    <div className={`flex ${isSidebarLeft ? "flex-row" : "flex-row-reverse"} h-screen`}>
      {!hideShellForAnnouncementDetail && (
        <Sidebar role={role} isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
      )}
      <div className={`flex flex-col flex-1 overflow-hidden ${isHeaderTop ? "" : "flex-col-reverse"}`}>
        {showHeader && <Header role={role} onHamburgerClick={() => setIsMobileOpen((prev) => !prev)} />}
        <main
          className="flex-1 bg-dashboard-bg overflow-y-auto hide-scrollbar"
          style={{ overscrollBehaviorX: "none", WebkitOverflowScrolling: "auto" }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
