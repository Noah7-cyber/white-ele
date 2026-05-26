import SelectLoginRole from "@/modules/admin/page/SelectLoginRole/selectLoginRole";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Select Role",
};

const Page = () => {
  return <SelectLoginRole />;
};

export default Page;