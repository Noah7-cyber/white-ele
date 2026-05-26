/* eslint-disable @next/next/no-img-element */
"use client";

import React, { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Box } from "@mui/material";
import ImagePreloader from "./imagePreloader";
import Head from "next/head";
import { isOnAuthDomain, redirectToAuthRoute } from "@/utils/helper";
import { SchoolLogoLoading } from "@/components/Loading/SchoolLogoLoading";

function AuthLayoutGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = pathname ?? window.location.pathname;
    if (!path.startsWith("/auth")) return;
    if (isOnAuthDomain()) return;
    redirectToAuthRoute(path);
  }, [pathname]);

  return <>{children}</>;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthLayoutGuard>
      <Head>
        <link rel="preload" as="image" href="/images/penguin.png" />
      </Head>

      <ImagePreloader />

      <Suspense
        fallback={
          <SchoolLogoLoading />
        }
      >
        <Box
          sx={{
            position: "relative",
            minHeight: "100dvh",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundImage: 'url("/images/penguin.png")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            overflowX: "hidden",
            overflowY: "auto",
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 4 },
          }}
        >
          {/* Logo at top left */}
          <Box
            sx={{
              position: "absolute",
              top: { xs: 12, sm: 24 },
              left: { xs: 12, sm: 56 },
              zIndex: 10,
            }}
          >
            <img
              src="/images/LOGO (1).svg"
              alt="Logo"
              style={{ height: 36, width: "auto", objectFit: "contain" }}
            />
          </Box>

          <Box sx={{ position: "relative", width: "100%", maxWidth: 920, mt: { xs: 7, sm: 0 } }}>
            {children}
          </Box>
        </Box>
      </Suspense>
    </AuthLayoutGuard>
  );
}
