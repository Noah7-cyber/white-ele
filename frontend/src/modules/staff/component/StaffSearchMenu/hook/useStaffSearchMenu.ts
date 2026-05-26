
import { StaffRoutes } from "@/routes/staff.routes";

export default function useSearchMenu() {
  const searchMenuItems = [
    { name: 'View Classroom', route: StaffRoutes.classRooms },
    { name: 'View Attendance', route: StaffRoutes.attendance },
    { name: 'View Curriculum', route: StaffRoutes.curriculum },
    { name: 'View Announcements', route: StaffRoutes.announcement },
  ];
  return { searchMenuItems };
}
