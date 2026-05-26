import SettingsLayout from "@/layout/Shared/settingsLayout";
import React, { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return <SettingsLayout>{children}</SettingsLayout>;
};

export default Layout;
