import ResetPasswordForm from "@/modules/admin/page/ResetPassword/resetPasswordForm";
import { SchoolLogoLoading } from "@/components/Loading/SchoolLogoLoading";
import React, { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
};

const Page = () => {
  return (
    <Suspense fallback={<SchoolLogoLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default Page;

