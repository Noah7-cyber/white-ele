import ForgotPasswordForm from "@/modules/admin/page/ForgotPassword/forgotPasswordForm";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
};

const Page = () => {
  return <ForgotPasswordForm />;
};

export default Page;

