"use client";

import SchoolLogo from "@/modules/shared/assets/svgs/school-logo.svg";

export function SchoolLogoLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse">
          <SchoolLogo className="w-44 h-44" />
        </div>
        {/* <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008080]"></div> */}
      </div>
    </div>
  );
}

