/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useParams } from "next/navigation";
import { AttendanceServices } from "@/services/attendance.service";
import { dateFormatter, getDateRangeByPeriodType } from "@/utils/helpers";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";

export type AttendancePeriodType = "daily" | "weekly" | "monthly";

export function useChildAttendance(
  periodType: AttendancePeriodType = "monthly",
  overrideRange?: { startDate?: string; endDate?: string },
) {
  const { id } = useParams();

  const { filters, applyFilters } = useFilter({
    search: "",
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });

  // Calculate date range based on selected period
  const { startDate, endDate } = getDateRangeByPeriodType(periodType);
  const effectiveStartDate = overrideRange?.startDate ?? startDate;
  const effectiveEndDate = overrideRange?.endDate ?? endDate;

  const { data: attendanceData, isLoading } = useQueryService<any, any>({
    service: {
      ...AttendanceServices.getChildAttendanceSummary,
      data: {
        studentId: id,
        ...(effectiveStartDate && effectiveEndDate
          ? {
              startDate: effectiveStartDate,
              endDate: effectiveEndDate,
            }
          : {}),
      },
    },
    // Refetch when period or id changes
  });

  const summaryStats = attendanceData?.data
    ? [
        { name: "Total School Days", value: attendanceData.data.potentialSchoolDays || 0 },
        { name: "Present Days", value: attendanceData.data.presentDays || 0 },
        { name: "Absent Days", value: attendanceData.data.absentDays || 0 },
        { name: "Late Days", value: attendanceData.data.lateDays || 0 },
        { name: "Excused Days", value: attendanceData.data.excusedDays || 0 },
      ]
    : [];

  const {
    data: { attendances = [], pagination = {} } = {} as any,
    isLoading: isLoadingAttendance,
  } = useQueryService({
    service: {
      ...AttendanceServices.getChildrenAttendance,
      data: {
         studentId: id,
        ...(filters?.search ? { search: filters?.search } : {}),
        ...(filters?.delta ? { delta: filters?.delta } : {}),
        ...(filters?.pos ? { pos: filters?.pos } : {}),
        // Include date range when available
        ...(startDate && endDate
          ? {
              startDate,
              endDate,
            }
          : {}),
      },
    },
  });

  const formattedLogs = (attendances || []).map((log: any) => ({
    date: dateFormatter(log.date),
    timeIn: log.timeIn || "N/A",
    timeOut: log.timeOut || "N/A",
    reason: log.notes || "--",
    status: log.status?.toLowerCase() || "absent",
  }));

  const currentPage =
    Math.floor((pagination?.pos || 0) / (pagination?.delta || ITEMS_PER_PAGE)) + 1;

  return {
    summaryStats,
    logs: formattedLogs,
    isLoading,
    currentPage,
    isLoadingAttendance,
    pagination,
    filters,
   formattedLogs,
    applyFilters,
  };
}
