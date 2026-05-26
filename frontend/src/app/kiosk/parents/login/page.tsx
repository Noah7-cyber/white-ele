import React from "react";
import ParentsLoginPage from "@/modules/kiosk/page/ParentsLogin/parentsLogin";
import KioskDateTime from "../../_components/KioskDateTime";

const page = () => {
  return (
    <div className="min-h-screen">
      <div className="flex w-full justify-end px-3 pt-2 sm:px-6 sm:pt-2">
        <KioskDateTime />
      </div>
      <ParentsLoginPage />
    </div>
  );
};

export default page;