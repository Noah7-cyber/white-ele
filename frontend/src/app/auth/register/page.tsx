import RegisterForm from "@/modules/shared/page/Register/registerForm";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
};

const Page = () => {
  return <RegisterForm />;
};

export default Page;
