"use client";

import { StaffHome } from "@/modules/staff/page/StaffHome/staffHome";
import { AdminHome } from "@/modules/admin/page/AdminHome/adminHome";
import { useUser } from "@/utils/hooks/useUser";

export default function AdminDashboardClient() {
  const { role } = useUser();
  if (role === "admin") return <AdminHome role={role} />;
  if (role === "staff") return <StaffHome />;
  return <></>;
}
