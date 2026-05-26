/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAttendanceContext } from "@/layout/Shared/attendanceLayout";
import { analyticsServices } from "@/services/analytics.service";
import { useQueryService } from "@/utils/hooks/useQueryService";

export function useReportsPageComponent() {

  const { startDate, endDate, periodType, selectedReportFilter } = useAttendanceContext();

    const isTeachers = /Teachers/i.test(selectedReportFilter)


  const { data: reportData = {} as any, isLoading: isLoadingReport } = useQueryService({
    service: {
      ...(isTeachers ? analyticsServices?.getStaffAttendanceReport : analyticsServices.getAttendanceReport),
      data: {
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        periodType: periodType || "weekly",
      },
    },
  });
  return {
    isLoadingReport,
    reportData,
    selectedReportFilter,
    isTeachers
  };
}
