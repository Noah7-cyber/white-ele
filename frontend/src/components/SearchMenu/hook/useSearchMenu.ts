import { DashboardRoutes } from "@/routes/dashboard.routes";

export default function useSearchMenu() {
  const searchMenuItems = [
    { name: "View Children", route: DashboardRoutes.children },
    { name: "View Attendance ", route: DashboardRoutes.attendance },
    { name: "View Curriculum", route: DashboardRoutes.curriculum },
    { name: "Create Announcement", route: DashboardRoutes.createAnnouncement },
  ];
  return { searchMenuItems };
}
