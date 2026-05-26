"use client"

import { SharedDashboardLayout } from "@/modules/shared/component/SharedDashboardLayout"
import type { FC, ReactNode } from "react"

interface StaffDashboardLayoutProps {
  children: ReactNode
}

export const StaffDashboardLayout: FC<StaffDashboardLayoutProps> = ({ children }) => {
  // Always staff: this tree is only mounted under `/staff/*`. Reading `userRole` from the cookie
  // could surface a stale "admin" value and push the shell/header toward admin routes.
  return <SharedDashboardLayout role="staff">{children}</SharedDashboardLayout>
}
