import { ClassStatsChart } from "@/components/ClassStatsChart";
import { DashboardActivities } from "@/modules/admin/component/DashboardActivities";
import { DashboardDataCard } from "@/modules/admin/component/DashboardDataCard";
import { Box } from "@mui/material";

export const StaffDashboardPage = () => {
  return (
    <Box className="h-full flex flex-col gap-4 overflow-auto hide-scrollbar">
      <Box className="flex gap-4">
        <DashboardDataCard title="Enrolled" value={12} />
        <DashboardDataCard title="Signed In" value={9} />
        <DashboardDataCard title="Late" value={8} />
        <DashboardDataCard title="Out Sick" value={9} />
      </Box>

      <Box className="flex gap-4 h-[390px]">
        <ClassStatsChart className="w-[310px]" />
        {/* <ClassAttendanceChart className="flex-1" /> */}
      </Box>

      <DashboardActivities />
    </Box>
  );
};
