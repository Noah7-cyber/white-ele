import { Metadata } from "next";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function Dashboard() {
  return <AdminDashboardClient />;
}
