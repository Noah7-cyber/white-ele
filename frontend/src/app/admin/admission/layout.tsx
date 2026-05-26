"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import Drawer from "@mui/material/Drawer";
import ScrollableTabBar from "@/layout/Shared/ScrollableTabBar";
import { CWPopover } from "@/modules/shared/component/Popover";
import CaretDown from "@/modules/shared/assets/svgs/caretDown.svg";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();

  const [mobileAddOpen, setMobileAddOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMobileAddOpen(true);
    window.addEventListener("open-tours-add", handler);
    return () => window.removeEventListener("open-tours-add", handler);
  }, []);

  const isToursListing = pathname === "/admin/admission/tours";
  const isTourEditRoute =
    (pathname.startsWith("/admin/admission/tours/") && pathname.endsWith("/edit")) ||
    pathname === "/admin/admission/tours/edit" ||
    pathname.startsWith("/admin/admission/tours/edit/");
  const isCreateTourorFormRoute =
    pathname === "/admin/admission/tours/create" ||
    pathname.startsWith("/admin/admission/tours/create/") ||
    isTourEditRoute ||
    pathname === "/admin/admission/forms" ||
    pathname.startsWith("/admin/admission/forms/");

  const tabs: Array<{ label: string; path: string }> = [
    { label: "Events", path: "/admin/admission/events" },
    { label: "Tours & Forms", path: "/admin/admission/tours" },
    { label: "Leads & Requests", path: "/admin/admission/leads-requests" },
    { label: "Admissions", path: "/admin/admission/admissions" },
  ];

  if (isCreateTourorFormRoute) {
    return <>{children}</>;
  }
  const CREATE_OPTIONS = [
    {
      name: "Create Tour",
      isActive: true,
      route: "tours/create",
    },
    {
      name: "Create Form",
      isActive: false,
      route: "forms",
    },
  ];
  const handleRouteChange = (route: string) => {
    router.push(`/admin/admission/${route}`);
  };
  return (
    <Box className="h-full p-5 space-y-6">
      <Box className="flex items-center justify-between">
        <Typography className="text-xl! font-semibold! text-primary-gray! md:block hidden">Admission</Typography>
        <Box className={`hidden md:flex items-center ${!isToursListing && "-z-100"}`}>
          <CWPopover
            actionComponent={
              <>
                <CaretDown className="mr-2" /> Create New
              </>
            }
            buttonProps={{
              isRounded: false,
              className: "!rounded-lg! text-sm w-full min-w-fit!",
            }}
          >
            <Box paddingY={1} className="flex flex-col gap-y-2 2xl:gap-y-3 p-4!">
              {CREATE_OPTIONS.map(
                ({ name, route }: { name: string; route: string }, index: number) => (
                  <button
                    className="text-left !text-sm px-3 py-0.5 !cursor-pointer hover:bg-gray-100 rounded flex items-center transition-colors"
                    key={index}
                    onClick={() => handleRouteChange(route)}
                  >
                    <span className="pr-3 !text-lg">+</span> {name}
                  </button>
                ),
              )}
            </Box>
          </CWPopover>
        </Box>
      </Box>
      <ScrollableTabBar className="border-b! border-border-lighten!">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path || pathname.startsWith(tab.path + "/");
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`shrink-0 whitespace-nowrap text-sm! font-normal! pb-2 px-3 ${isActive
                  ? "font-medium! border-b! border-brandColor-active! text-brandColor-active!"
                  : "text-[#475467]"
                }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </ScrollableTabBar>

      {/* Mobile: Create New bottom sheet - triggered by header + */}
      <Drawer
        anchor="bottom"
        open={mobileAddOpen}
        onClose={() => setMobileAddOpen(false)}
        PaperProps={{ className: "rounded-t-2xl", style: { maxHeight: "40vh" } }}
      >
        <div className="px-6 pt-3 pb-10">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
          {CREATE_OPTIONS.map(({ name, route }) => (
            <button
              key={name}
              className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 last:border-0 text-[#022F2F]"
              onClick={() => {
                setMobileAddOpen(false);
                handleRouteChange(route);
              }}
            >
              <span className="pr-3 text-lg">+</span> {name}
            </button>
          ))}
        </div>
      </Drawer>

      {children}
    </Box>
  );
}
