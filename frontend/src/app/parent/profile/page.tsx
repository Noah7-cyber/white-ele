import { Suspense } from "react";
import { ParentProfilePage } from "@/modules/parent/page/ParentProfile/parentProfile";

const Page = () => {
  return (
    <Suspense fallback={<div className="p-5 text-center text-sm text-gray-600">Loading profile…</div>}>
      <ParentProfilePage />
    </Suspense>
  );
};

export default Page;
