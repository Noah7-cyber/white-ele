"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { DashboardLayout } from "@/layout/Shared";
import { usePathname, useRouter } from "next/navigation";
import { SchoolLogoLoading } from "@/components/Loading/SchoolLogoLoading";
import { getEffectiveRole, hasAccessToken, runRoleGuard } from "@/utils/auth/sessionGuards";
import { usePermissionGuide } from "@/utils/hooks/usePermissionGuide";
import { NoAccess } from "@/components/NoAccess";

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { canAccessPath, isLoading: isPermissionLoading } = usePermissionGuide();
  const isTourPreview = pathname?.includes("/admin/admission/tours/create/preview");
  const canViewCurrentPath = canAccessPath(pathname);

  useEffect(() => {
    if (typeof window === "undefined") return;
    runRoleGuard("admin", router.replace);
  }, [router]);



  if (isTourPreview) {
    return <>{children}</>;
  }

  // Show loading while checking authentication
  if (status === "loading" || isPermissionLoading || typeof window === "undefined") {
    return <SchoolLogoLoading />;
  }

  if (typeof window !== "undefined") {
    try {
      const accessToken = hasAccessToken();
      const userRole = getEffectiveRole();

      if (accessToken && userRole === "admin") {
        if (!canViewCurrentPath) {
          return (
            <DashboardLayout role={userRole as "admin" | "staff" | "parent"}>
              <NoAccess />
            </DashboardLayout>
          );
        }

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

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SessionProvider>
  );
}
