import AttendanceLayout from "@/layout/Shared/attendanceLayout";
import React, { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return <AttendanceLayout role="staff">{children}</AttendanceLayout>;
};

export default Layout;