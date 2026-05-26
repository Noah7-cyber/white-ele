"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SchoolLogoLoading } from "@/components/Loading/SchoolLogoLoading";
import { Box, Card, CardActionArea, CardContent, Typography } from "@mui/material";
import { AuthRoutes } from "@/routes/auth.routes";
import Link from "next/link";
import {
  getToken,
  getUserRoleFromCookie,
  isOnAuthDomain,
  redirectToAuthRoute,
  redirectToSchoolDashboard,
} from "@/utils/helper";
import { StaffRoutes } from "@/routes/staff.routes";
import { ParentRoutes } from "@/routes/parent.routes";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { AUTH_RETURN_URL_STORAGE_KEY } from "@/utils/hooks/useAuthSession";
import { normalizeReturnUrl } from "@/utils/auth/returnUrl";

type OnboardingRole = "admin" | "staff" | "parent";

const roleCards: { label: string; description: string; role: OnboardingRole }[] = [
  {
    label: "Admin",
    description: "Manage your school, staff and operations.",
    role: "admin",
  },
  {
    label: "Staff",
    description: "Take attendance, manage classrooms and learning.",
    role: "staff",
  },
  {
    label: "Parent",
    description: "Track your child’s activities, payments and updates.",
    role: "parent",
  },
];

export default function SelectLoginRole() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingSession, setCheckingSession] = useState(true);

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
        const dashboardPath =
          userRole === "admin"
            ? DashboardRoutes.dashboard
            : userRole === "staff"
              ? StaffRoutes.dashboard
              : userRole === "parent"
                ? ParentRoutes.dashboard
                : "/dashboard";

        // On auth domain (app/localhost): send to school subdomain dashboard only; never router.replace to app/staff/dashboard.
        if (redirectToSchoolDashboard(dashboardPath)) return;
        if (isOnAuthDomain()) {
          setCheckingSession(false);
          return;
        }

        // On school subdomain: if subdomain doesn't match cookie, send back to select-role.
        if (redirectToAuthRoute("/auth/select-role")) return;

        if (!userRole) {
          setCheckingSession(false);
          return;
        }
        router.replace(dashboardPath);
      } catch {
        setCheckingSession(false);
      }
      return;
    }

    setCheckingSession(false);
  }, [router]);

  if (checkingSession) {
    return <SchoolLogoLoading />;
  }

  const handleSelectRole = (role: OnboardingRole) => {
    const rawReturnUrl =
      searchParams?.get("returnUrl") ||
      (typeof window !== "undefined"
        ? window.sessionStorage.getItem(AUTH_RETURN_URL_STORAGE_KEY)
        : null);
    const returnUrl = normalizeReturnUrl(rawReturnUrl);
    const params = new URLSearchParams({ role });
    if (returnUrl) params.set("returnUrl", returnUrl);
    router.push(`/auth/login?${params.toString()}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 0.5, sm: 2 },
      }}
    >
      <Box
        sx={{
          maxWidth: 900,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: { xs: 3, sm: 4 },
          alignItems: "center",
          backgroundColor: "white",
          padding: { xs: 2.5, sm: 6 },
          borderRadius: 3,
        }}
      >
        <Box className="text-center flex flex-col gap-1">
          <Typography className="!font-bold !text-secondary-text-gray leading-[1.2] !text-xl sm:!text-2xl mb-2">
            Welcome to WhitePenguin!
          </Typography>
          <Typography className="!text-secondary-text-gray !font-normal !text-xs sm:!text-sm">
            Choose how you want to use the platform.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1.5fr))" },
            gap: 3,
            width: "100%",
          }}
        >
          {roleCards.map((card) => (
            <Card
              key={card.role}
              elevation={4}
              sx={{
                borderRadius: 1,
                overflow: "hidden",
              }}
              className="border border-brandColor-active/20 !shadow-none"
            >
              <CardActionArea onClick={() => handleSelectRole(card.role)}>
                <CardContent
                  sx={{ py: 3, px: 3 }}
                  className="!min-h-[132px] sm:!min-h-[150px] !w-full flex items-center justify-center"
                >
                  <Box className="flex flex-col gap-2 items-center justify-center">
                    <Typography className="!font-semibold !text-primary-dark mb-1 uppercase !text-lg sm:!text-2xl">
                      {card.label}
                    </Typography>
                    <Typography className="!text-text-tertiary/70 text-center !text-xs sm:!text-sm">
                      {card.description}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
        <Box className="flex items-center justify-center">
          <Link href={AuthRoutes.role} className="!text-xs !text-text-gray">
            Don&apos;t have an account?{" "}
            <span className="!text-brandColor-active !font-semibold hover:underline">Sign Up</span>
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
