import ResendResetPasswordForm from "@/modules/shared/page/ResendResetPassword/resendResetPasswordForm";
import { SchoolLogoLoading } from "@/components/Loading/SchoolLogoLoading";
import React, { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resend Reset Password",
};

const Page = () => {
  return (
    <Suspense fallback={<SchoolLogoLoading />}>
      <ResendResetPasswordForm />
    </Suspense>
  );
};

export default Page;

