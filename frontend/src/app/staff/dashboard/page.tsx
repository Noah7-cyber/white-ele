import { Metadata } from "next";
import StaffDashboardClient from "./StaffDashboardClient";

export const metadata: Metadata = {
  title: "Staff Dashboard",
};

export default function Dashboard() {
  return <StaffDashboardClient />;
}
