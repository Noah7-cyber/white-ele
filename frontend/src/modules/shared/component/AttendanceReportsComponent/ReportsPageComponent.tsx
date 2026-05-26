/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { AttendanceBarChart } from "@/components/AttendanceBarChart";
import { AttendanceStatusChart } from "@/components/AttendanceStatusChart";
import AttendanceTrendChart from "@/components/Charts/AttendanceTrendChart/AttendanceTrendChart";
import { InsightCard } from "@/components/InsightCard";
import { attendanceTrendData } from "@/modules/admin/page/AttendanceReports/AttendanceReports.constants";
import { Box } from "@mui/material";
import { useReportsPageComponent } from "./hooks/useReportsPageComponent";

interface ReportsPageComponentProps {
  role: "admin" | "staff";
}
type DataPoint = {
  label: string;
  present: number;
  absent: number;
  late: number;
};

type AttendanceDataPoint = {
  name: string;
  present: number;
  absent: number;
  late: number;
};

export const ReportsPageComponent = ({ role: _role }: ReportsPageComponentProps) => {
  const { reportData, isLoadingReport, selectedReportFilter, isTeachers } =
    useReportsPageComponent();

  const transformAttendanceData = (data: any): DataPoint[] => {
    return data?.xAxis?.map((label: string, index: number) => ({
      label,
      present: data.present[index] || 0,
      absent: data.absent[index] || 0,
      late: data.late[index] || 0,
    }));
  };

  const transformClassAttendance = (data: any): DataPoint[] => {
    return data?.xAxis?.map((name: string, index: number) => ({
      name,
      present: data.present[index] ?? 0,
      absent: data.absent[index] ?? 0,
      late: data.late[index] ?? 0,
    }));
  };

  const transformData = (data: any) => {
  const colors: any = {
    Present: "#008080",
    Absent: "#FFB020",
    Late: "#FF7C80",
    Excused: "#A0AEC0"
  };

  return data?.xAxis?.map((item: any, index: number) => ({
    name: item,
    value: data?.yAxis?.[index],
    pct: data?.percentages?.[index],
    color: colors[item] || "#A0AEC0"
  }));
};

  return (
    <Box className="p-2 space-y-6 flex flex-col h-full">
      <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto md:overflow-x-visible hide-scrollbar min-h-20 md:min-h-35 *:shrink-0 md:*:shrink">
        <InsightCard
          name="Overall Attendance Rate"
          value={`${reportData?.data?.overallAttendanceRate || 0}%`}
          className="!h-20 md:!h-35 !min-w-52 md:!min-w-0 border! border-[#00808033]! rounded-lg!"
        />
        {isTeachers ? (
          <>
            <InsightCard
              name="Most Present Staff"
              value={reportData?.data?.mostPresentStaff?.staffName || "N/A"}
              className="!h-20 md:!h-35 !min-w-52 md:!min-w-0 border! border-[#00808033]! rounded-lg!"
            />
            <InsightCard
              name="Highest Absentee Staff"
              value={reportData?.data?.highestAbsenteeStaff?.staffName || "N/A"}
              className="!h-20 md:!h-35 !min-w-52 md:!min-w-0 border! border-[#00808033]! rounded-lg!"
            />
          </>
        ) : (
          <>
            <InsightCard
              name="Most Present Class"
              value={reportData?.data?.mostPresentClass?.className || "N/A"}
              className="!h-20 md:!h-35 !min-w-52 md:!min-w-0 border! border-[#00808033]! rounded-lg!"
            />
            <InsightCard
              name="Highest Absentee Class"
              value={reportData?.data?.highestAbsenteeClass?.className || "N/A"}
              className="!h-20 md:!h-35 !min-w-52 md:!min-w-0 border! border-[#00808033]! rounded-lg!"
            />
          </>
        )}
        <InsightCard
          name="Lateness Rate"
          value={`${reportData?.data?.latenessRate || 0}%`}
          className="!h-20 md:!h-35 !min-w-52 md:!min-w-0 border! border-[#00808033]! rounded-lg!"
        />
      </div>

      <div>
        <AttendanceTrendChart
          isLoading={isLoadingReport}
          data={transformAttendanceData(reportData?.data?.attendanceTrend || {})}
        />
      </div>
      <div>
        <AttendanceBarChart
          isLoading={isLoadingReport}
          data={isTeachers ? transformClassAttendance(reportData?.data?.attendanceByStaff || {}) : transformClassAttendance(reportData?.data?.attendanceByStudent || {})}
        />
      </div>
      <div>
        <AttendanceStatusChart isLoading={isLoadingReport} pieData={transformData(reportData?.data?.statusDistribution || {})} />
      </div>
    </Box>
  );
};
export default ReportsPageComponent;
