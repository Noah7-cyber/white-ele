"use client";

import { SETTINGS_ROUTES_OPTIONS, STAFF_SETTINGS_ROUTES_OPTIONS } from "@/constants";
import { Box, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUserRoleFromCookie } from "@/utils/helper";
import React, { FC, ReactNode, useState, useEffect } from "react";

interface SettingsLayoutProps {
  children: ReactNode;
}

interface LinkTabProps {
  label?: string;
  href: string;
  selected?: boolean;
}

const SettingsLayout: FC<SettingsLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<"admin" | "staff" | null>(null);

  useEffect(() => {
    const userRole = getUserRoleFromCookie();
    if (userRole) {
      try {
        setUserRole(userRole?.toLowerCase() === "staff" ? "staff" : "admin");
      } catch (error) {
        console.error("Error parsing user data:", error);
        setUserRole("admin"); // Default to admin
      }
    } else {
      setUserRole("admin"); // Default to admin
    }
  }, []);

  function LinkTab({ label, href }: LinkTabProps) {
    const isActive = href === pathname;

    return (
      <Link
        href={href}
        className={`shrink-0 border-b px-2 py-3 text-[13px] font-medium transition-colors sm:px-3 sm:text-sm ${
          isActive
            ? "border-[#008080] text-[#008080]"
            : "border-transparent text-[#667085] hover:text-[#008080]"
        }`}
      >
        {label}
      </Link>
    );
  }

  // Filter settings options based on role and map hrefs to appropriate routes
  const filteredSettingsOptions =
    userRole === "staff"
      ? STAFF_SETTINGS_ROUTES_OPTIONS
      : SETTINGS_ROUTES_OPTIONS;

  return (
    <Box className="flex flex-col gap-3 md:px-4 py-4 sm:px-6 sm:py-6 bg-white md:bg-transparent h-full md:h-fit">
      <Typography className="!text-xl !font-semibold sm:!text-2xl hidden md:block">Settings</Typography>
      <Box sx={{ width: "100%" }}>
        <Box
          role="navigation"
          aria-label="settings nav tabs"
          className="md:-mx-0 mx-1 overflow-x-auto scrollbar-hide border-b border-[#E4E7EC] px-4 sm:px-0"
        >
          <Box className="flex min-w-max items-center gap-3 sm:gap-3">
            {filteredSettingsOptions.map(({ label, href }) => (
              <LinkTab label={label} href={href} key={href} />
            ))}
          </Box>
        </Box>
        <Box className="">{children}</Box>
      </Box>
    </Box>
  );
};

export default SettingsLayout;
