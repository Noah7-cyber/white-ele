"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { DashboardLayout } from "@/layout/Shared";
import { useRouter } from "next/navigation";
import { SchoolLogoLoading } from "@/components/Loading/SchoolLogoLoading";
import { getEffectiveRole, hasAccessToken, runRoleGuard } from "@/utils/auth/sessionGuards";

function ParentLayoutContent({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    runRoleGuard("parent", router.replace);
  }, [router]);

  if (status === "loading" || typeof window === "undefined") {
    return <SchoolLogoLoading />;
  }

  if (typeof window !== "undefined") {
    try {
      const accessToken = hasAccessToken();
      const userRole = getEffectiveRole();

      if (accessToken && userRole === "parent") {
        return (
          <DashboardLayout role={userRole as "admin" | "staff" | "parent"}>
            {children}
          </DashboardLayout>
        );
      }
      if (!accessToken || !userRole) {
        return <SchoolLogoLoading />;
      }
      return <SchoolLogoLoading />;
    } catch (error) {
      console.error("Failed to parse auth data:", error);
    }
  }

  return <SchoolLogoLoading />;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ParentLayoutContent>{children}</ParentLayoutContent>
    </SessionProvider>
  );
}
