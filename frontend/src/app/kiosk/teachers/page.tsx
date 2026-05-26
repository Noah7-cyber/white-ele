"use client";

import TeachersKioskPage from "@/modules/kiosk/page/TeachersKiosk/teacherskiosk";
import React, { useEffect, useState } from "react";
import KioskDateTime from "../_components/KioskDateTime";
import { getToken, getUserRoleFromCookie } from "@/utils/helper";
import { useRouter } from "next/navigation";
import { AuthRoutes } from "@/routes/auth.routes";
import { SchoolLogoLoading } from "@/components/Loading/SchoolLogoLoading";

const Page = () => {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = getToken();
    const role = getUserRoleFromCookie()?.toLowerCase();
    if (!token || role !== "admin") {
      console.error("Blocked kiosk teachers route access", { role, hasToken: Boolean(token) });
      router.replace(
        `${AuthRoutes.login}?role=admin&returnUrl=${encodeURIComponent("/kiosk/check-in")}`,
      );
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) return <SchoolLogoLoading />;

  return (
    <div className="min-h-screen">
      <div className="flex w-full justify-end px-3 pt-2 sm:px-6 sm:pt-2">
        <KioskDateTime />
      </div>
      <TeachersKioskPage />
    </div>
  );
};

export default Page;