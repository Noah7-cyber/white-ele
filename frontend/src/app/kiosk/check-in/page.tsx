"use client";

import RoleSelectionPage from "@/modules/kiosk/page/RoleSelection/roleSelection";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SchoolLogoLoading } from "@/components/Loading/SchoolLogoLoading";
import KioskDateTime from "../_components/KioskDateTime";
import { AuthRoutes } from "@/routes/auth.routes";
import {
  getToken,
  getUserRoleFromCookie,
  isOnAuthDomain,
  isSubdomainMismatch,
  redirectToAuthRoute,
  redirectToSchoolDashboard,
  getSchoolFromCookie,
} from "@/utils/helper";

function getEffectiveRole(): string | null {
  if (typeof window === "undefined") return null;
  const fromCookie = getUserRoleFromCookie();
  if (fromCookie) return fromCookie.toLowerCase();
  return null;
}

const KIOSK_CHECK_IN_PATH = "/kiosk/check-in";

const CheckInPage = () => {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Future: explicit kiosk logout with loading state
  // const [isLoggingOut, setIsLoggingOut] = useState(false);
  // const handleLogout = () => {
  //   setIsLoggingOut(true);
  //   clearAuthCookies();
  //   router.replace(AuthRoutes.selectRole);
  // };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const accessToken = getToken();
      const userRole = getEffectiveRole();
      const returnUrl = encodeURIComponent(KIOSK_CHECK_IN_PATH);

      if (isOnAuthDomain()) {
        // On app subdomain: require admin; if logged in + school, send to school subdomain /kiosk
        if (!accessToken || !userRole) {
          router.replace(`${AuthRoutes.login}?role=admin&returnUrl=${returnUrl}`);
          return;
        }
        if (userRole !== "admin") {
          router.replace(`${AuthRoutes.login}?role=admin&returnUrl=${returnUrl}`);
          return;
        }
        const school = getSchoolFromCookie();
        if (school?.subDomain) {
          if (redirectToSchoolDashboard(KIOSK_CHECK_IN_PATH)) return;
        }
        router.replace(AuthRoutes.selectRole);
        return;
      }

      // On school subdomain: require admin, then allow kiosk
      if (isSubdomainMismatch()) {
        if (redirectToAuthRoute(`${AuthRoutes.login}?role=admin&returnUrl=${returnUrl}`)) return;
        router.replace(AuthRoutes.selectRole);
        return;
      }
      if (!accessToken || !userRole) {
        if (
          redirectToAuthRoute(
            `${AuthRoutes.login}?role=admin&returnUrl=${encodeURIComponent(KIOSK_CHECK_IN_PATH)}`,
          )
        )
          return;
        router.replace(`${AuthRoutes.login}?role=admin&returnUrl=${returnUrl}`);
        return;
      }
      if (userRole !== "admin") {
        console.error("Kiosk unauthorized role access attempt", {
          role: userRole,
          path: KIOSK_CHECK_IN_PATH,
        });
        if (redirectToAuthRoute(`${AuthRoutes.login}?role=admin&returnUrl=${returnUrl}`)) return;
        router.replace(`${AuthRoutes.login}?role=admin&returnUrl=${returnUrl}`);
        return;
      }

      setIsAuthorized(true);
      setIsCheckingAuth(false);
    } catch (error) {
      console.error("Failed to check kiosk auth:", error);
      if (isOnAuthDomain()) {
        router.replace(
          `${AuthRoutes.login}?role=admin&returnUrl=${encodeURIComponent(KIOSK_CHECK_IN_PATH)}`,
        );
      } else {
        redirectToAuthRoute(
          `${AuthRoutes.login}?role=admin&returnUrl=${encodeURIComponent(KIOSK_CHECK_IN_PATH)}`,
        );
      }
    }
  }, [router]);

  // Show loading while checking authentication
  if (isCheckingAuth || typeof window === "undefined") {
    return <SchoolLogoLoading />;
  }

  // Only render the page if authorized
  if (isAuthorized) {
    return (
      <div className="min-h-screen min-h-[100dvh] px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto flex w-full max-w-screen-2xl justify-end">
          <KioskDateTime />
        </div>
        <div className="mx-auto w-full max-w-screen-2xl">
          <RoleSelectionPage />
        </div>
      </div>
    );
  }

  // Default to loading (will redirect)
  return <SchoolLogoLoading />;
};

export default CheckInPage;
