import React from "react";
import { Metadata } from "next";
import ParentGetStarted from "@/modules/shared/page/ParentGetStarted/parentGetStarted";

export const metadata: Metadata = {
  title: "Get Started",
};

const Page = () => {
  return <ParentGetStarted />;
};

export default Page;
