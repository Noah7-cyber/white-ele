import ResendEmailVerificationForm from "@/modules/shared/page/ResendEmailVerification/resendEmailVerificationForm";
import { SchoolLogoLoading } from "@/components/Loading/SchoolLogoLoading";
import React, { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resend Email Verification",
};

const Page = () => {
  return (
    <Suspense fallback={<SchoolLogoLoading />}>
      <ResendEmailVerificationForm />
    </Suspense>
  );
};

export default Page;

