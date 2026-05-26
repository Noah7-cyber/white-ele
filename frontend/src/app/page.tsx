"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { StaffRoutes } from "@/routes/staff.routes";
import { ParentRoutes } from "@/routes/parent.routes";
import {
  getToken,
  getUserRoleFromCookie,
  getSchoolFromCookie,
  isOnAuthDomain,
  redirectToAuthRoute,
} from "@/utils/helper";
import { AuthRoutes } from "@/routes/auth.routes";
import SelectLoginRole from "@/modules/admin/page/SelectLoginRole/selectLoginRole";
import AuthLayout from "./auth/layout";

export default function HomePage() {
  const router = useRouter();

  function getEffectiveRole(): string | null {
    if (typeof window === "undefined") return null;
    const fromCookie = getUserRoleFromCookie();
    if (fromCookie) return fromCookie.toLowerCase();
    return null;
  }

  useEffect(() => {
    const token = getToken();

    if (token) {
      try {
        const userRole = getEffectiveRole();
        if (userRole) {
          if (userRole === "admin") {
            router.replace(DashboardRoutes.dashboard);
          } else if (userRole === "staff") {
            router.replace(StaffRoutes.dashboard);
          } else if (userRole === "parent") {
            const school = getSchoolFromCookie();
            if (school?.id != null && school?.subDomain) {
              router.replace(ParentRoutes.dashboard);
            } else {
              router.replace(AuthRoutes.parentGetStarted);
            }
          } else {
            router.replace("/dashboard");
          }
        }
      } catch {
        router.replace("/dashboard");
      }
      return;
    }
    if (!isOnAuthDomain()) {
      if (redirectToAuthRoute(AuthRoutes.selectRole)) return;
    }
    router.replace(AuthRoutes.selectRole);
  }, [router]);

  return (
    <AuthLayout>
      <SelectLoginRole />
    </AuthLayout>
  );
}
