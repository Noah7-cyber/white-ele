import AttendanceLayout from "@/layout/Shared/attendanceLayout";
import React, { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return <AttendanceLayout role="admin">{children}</AttendanceLayout>;
};

export default Layout;