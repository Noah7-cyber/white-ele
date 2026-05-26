"use client";

import { useRouter } from "next/navigation";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { schoolDynamicEndpoints } from "@/services/school.service";
import type { GetSchoolResponse } from "@/services/school.service";
import SchoolLogo from "@/modules/shared/assets/svgs/school-logo.svg";
import LogoutIcon from "@/modules/shared/assets/svgs/logout.svg";
import KioskDateTime from "../../_components/KioskDateTime";
import { removeParentUid } from "@/modules/kiosk/hooks/useKioskVerify";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: schoolResponse } = useQueryService<Record<string, never>, GetSchoolResponse>({
    service: schoolDynamicEndpoints.getParticularSchool(),
    options: { refetchOnWindowFocus: false },
  });
  const schoolName = schoolResponse?.school?.schoolName ?? "";
  const schoolLogoUrl = schoolResponse?.school?.schoolLogoUrl ?? null;

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("kiosk_verify_data");
    }
    removeParentUid();
    router.push("/kiosk/parents/login");
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-dashboard-bg">
      {/* Header */}
      <div className="w-full bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              {schoolLogoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- dynamic API URL; add domain to next.config images if using next/image
                <img
                  src={schoolLogoUrl}
                  alt={schoolName || "School"}
                  className="h-10 w-10 shrink-0 object-contain"
                />
              )}
              {schoolName ? (
                <span className="truncate text-sm font-medium text-gray-800 sm:text-base">{schoolName}</span>
              ) : null}
            </div>
            <button
              onClick={handleLogout}
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-1 py-1 text-[#FC1824] hover:bg-red-50"
            >
              <LogoutIcon />
              <span className="hidden text-xs font-medium sm:inline">Log Out</span>
            </button>
          </div>
          <div className="self-end sm:self-auto">
            <KioskDateTime />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
