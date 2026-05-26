"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  getToken,
  getUserRoleFromCookie,
  isOnAuthDomain,
  getSchoolFromCookie,
} from "@/utils/helper";

/**
 * When on the auth app domain with admin + school cookie, redirect to the school
 * subdomain so the kiosk URL always includes the school subdomain (e.g. greenwood.domain.com/kiosk/check-in).
 */
function useRedirectToKioskSubdomain() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined" || !pathname?.startsWith("/kiosk")) return;
    if (!isOnAuthDomain()) return;

    const token = getToken();
    const role = getUserRoleFromCookie()?.toLowerCase();
    const school = getSchoolFromCookie();

    if (token && role === "admin" && school?.subDomain) {
      const raw =
        typeof process !== "undefined" ? process.env.NEXT_PUBLIC_APP_DOMAIN : undefined;
      const base = typeof raw === "string" ? raw.trim() : "";
      if (base && !base.includes("localhost")) {
        const protocol = window.location.protocol;
        const port =
          window.location.port && window.location.port !== "80" && window.location.port !== "443"
            ? `:${window.location.port}`
            : "";
        const url = `${protocol}//${school.subDomain}.${base}${port}${pathname}`;
        window.location.replace(url);
      }
    }
  }, [pathname]);
}

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  useRedirectToKioskSubdomain();
  return (
    <main className="min-h-screen min-h-[100dvh] bg-dashboard-bg">
      <div className="mx-auto w-full max-w-screen-2xl">{children}</div>
    </main>
  );
}
