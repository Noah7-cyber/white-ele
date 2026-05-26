"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { schoolDynamicEndpoints } from "@/services/school.service";
import SchoolLogo from "@/modules/shared/assets/svgs/schoolLogo.svg";

import { AuthRoutes } from "@/routes/auth.routes";

import {
  clearAuthCookies, 
} from "@/utils/helper";
import { CircularProgress } from "@mui/material";
import { useState } from "react";
import { showToast } from "@/modules/shared/component/Toast";

const RoleSelection = () => {
  const router = useRouter();

  const { data: schoolResponse } = useQueryService(
    { service: schoolDynamicEndpoints.getParticularSchool(), options: { refetchOnWindowFocus: false } },
  );
  const schoolName = schoolResponse?.school?.schoolName ?? "";
  const schoolLogoUrl = schoolResponse?.school?.schoolLogoUrl ?? null;
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleTeacherClick = () => {
    router.push("/kiosk/teachers");
  };

  const handleParentClick = () => {
    router.push("/kiosk/parents");
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    clearAuthCookies();
    showToast({ message: "Logged out successfully", severity: "success", duration: 3000 });
    setIsLoggingOut(false);
    router.push(AuthRoutes.selectRole);
  };

  return (
    <div
      className="flex min-h-screen min-h-[100dvh] flex-col bg-dashboard-bg px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      style={{ minHeight: "100dvh" }} // for iOS Safari compatibility
    >
      {/* Main Content Take Full Height, Footer Stick to Bottom */}
      <div className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col items-center justify-center">
          {/* Logo and School Name */}
          <div className="mb-10 flex items-center justify-center gap-3 sm:mb-12 md:mb-16">
            {schoolLogoUrl && <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white sm:h-14 sm:w-14">
              {<img
                  src={schoolLogoUrl}
                  alt={schoolName || "School"}
                  className="w-full h-full object-cover"
                />
              }
            </div>}
            <h1 className="text-xl font-medium text-[#008080] md:text-2xl">
              {schoolName || "School"}
            </h1>
          </div>

          {/* Role Selection Card */}
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-lg md:max-w-xl">
            <div className="flex flex-col md:flex-row">
              {/* Teacher Section */}
              <div
                onClick={handleTeacherClick}
                className="relative flex flex-1 cursor-pointer flex-col items-center justify-center px-8 py-12 text-center transition-colors hover:bg-gray-50 sm:px-10 sm:py-14 md:px-12 md:py-16"
              >
                <h2 className="md:text-lg text-base font-bold text-gray-700 mb-4 tracking-wide">ADMIN / TEACHER</h2>
                <p className="text-gray-500 md:text-sm text-xs">Clock in to start your day.</p>
                {/* Vertical Divider - Desktop */}
                <div className="absolute right-0 top-1/2 hidden h-24 w-px -translate-y-1/2 bg-gray-300 md:block lg:h-28"></div>
              </div>

              {/* Horizontal Divider - Mobile */}
              <div className="mx-auto h-px w-[80%] bg-gray-300 md:hidden"></div>

              {/* Parent Section */}
              <div
                onClick={handleParentClick}
                className="flex flex-1 cursor-pointer flex-col items-center justify-center px-8 py-12 text-center transition-colors hover:bg-gray-50 sm:px-10 sm:py-14 md:px-12 md:py-16"
              >
                <h2 className="md:text-lg text-base font-bold text-gray-700 mb-4 tracking-wide">PARENT</h2>
                <p className="text-gray-500 md:text-sm text-xs">Clock in your child.</p>
              </div>
            </div>
          </div>
        </div>
        {/* Spacer on mobile to push footer to bottom, not necessary on larger screens */}
        {/* <div className="flex-1 block sm:hidden" />s */}
      </div>

      {/* Footer */}
      <div className=" mb-3 flex flex-col items-center gap-2 text-center sm:mb-4 mt-auto">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="rounded-full border border-gray-200 bg-white px-8 py-2.5 text-sm font-medium text-red-500 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? <CircularProgress size={16} className="!text-white" /> : "Logout"}
        </button>
        <p className="text-sm text-gray-400">
          Powered by <span className="text-[#008080] font-semibold">WhitePenguin</span>
        </p>
      </div>
    </div>
  );
};

export default RoleSelection;
