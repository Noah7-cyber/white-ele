import VerifyTokenForm from "@/modules/admin/page/VerifyToken/verifyTokenForm";
import { SchoolLogoLoading } from "@/components/Loading/SchoolLogoLoading";
import React, { Suspense } from "react";

const Page = () => {
  return (
    <Suspense fallback={<SchoolLogoLoading />}>
      <VerifyTokenForm />
    </Suspense>
  );
};

export default Page;

