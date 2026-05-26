import VerifyEmailForm from "@/modules/shared/page/VerifyEmail/verifyEmailForm";
import { SchoolLogoLoading } from "@/components/Loading/SchoolLogoLoading";
import React, { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email",
};

const Page = () => {
  return (
    <Suspense fallback={<SchoolLogoLoading />}>
      <VerifyEmailForm />
    </Suspense>
  );
};

export default Page;

