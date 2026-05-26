/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useEffect } from "react";
import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { useUser } from "@/utils/hooks/useUser";
import {
  StaffDashboardAnalyticsResponse,
  analyticsDynamicEndpoints,
  StaffDashboardAnalyticsParams,
} from "@/services/analytics.service";
import { getDateRangeByPeriodType, mapAttendanceTrendToChartData } from "@/utils/helpers";
import { PERIOD_OPTIONS } from "@/constants";
import { StaffRoutes } from "@/routes/staff.routes";
import { classroomServices } from "@/services/classroom.service";

const DEFAULT_PERIOD_NAME = "This week";

type PeriodType = "daily" | "weekly" | "monthly" | "yearly";

function periodTypeFromPresetName(name: string): PeriodType | null {
  const normalized = name.toLowerCase().trim();
  if (normalized === "today") return "daily";
  if (normalized === "this week" || normalized === "last week" || normalized === "weekly") return "daily";
  if (normalized === "this month" || normalized === "last month" || normalized === "monthly") return "weekly";
  if (normalized === "this year" || normalized === "last year" || normalized === "yearly") return "monthly";
  return null;
}

function diffDaysInclusive(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const ms = end.getTime() - start.getTime();
  if (!Number.isFinite(ms)) return 1;
  return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)) + 1);
}

function periodTypeFromRange(startDate: string, endDate: string): PeriodType {
  const days = diffDaysInclusive(startDate, endDate);
  if (days <= 1) return "daily";
  if (days <= 7) return "weekly";
  // treat full-year-ish selections as yearly
  if (days >= 300) return "yearly";
  if (days <= 61) return "weekly";
  return "monthly";
}

function getStaffAttendanceLabels(periodType: PeriodType, startDate: string, endDate: string): string[] {
  // If the user truly selected a single day, keep the x-axis to just that day regardless of periodType.
  if (diffDaysInclusive(startDate, endDate) <= 1) {
    try {
      const d = new Date(startDate);
      return [
        d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
      ];
    } catch {
      return [startDate];
    }
  }

  // In this dashboard, periodType reflects aggregation granularity:
  // - daily: days of week (Mon-Sun)
  // - weekly: weeks of month (Week 1-4/5)
  // - monthly: months of year (Jan-Dec)
  if (periodType === "monthly") {
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  }
  if (periodType === "weekly") {
    const weekCount = Math.max(4, Math.min(5, Math.ceil(diffDaysInclusive(startDate, endDate) / 7)));
    return Array.from({ length: weekCount }, (_, i) => `Week ${i + 1}`);
  }
  if (periodType === "daily") {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }

  // yearly: fall back to calendar years across the selected range (capped for sanity)
  try {
    const startYear = new Date(startDate).getFullYear();
    const endYear = new Date(endDate).getFullYear();
    if (Number.isFinite(startYear) && Number.isFinite(endYear)) {
      const years: string[] = [];
      for (let y = startYear; y <= endYear && years.length < 12; y++) years.push(String(y));
      if (years.length) return years;
    }
  } catch {
    // ignore
  }
  return ["Year"];
}

export default function useStaffDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { staffId, staffClassesAndSubject } = useUser();

  const urlStart = searchParams?.get("startDate") ?? null;
  const urlEnd = searchParams?.get("endDate") ?? null;
  const urlClassroomId = searchParams?.get("classroomId") ?? null;
  const hasDateParams = Boolean(urlStart && urlEnd);

  useEffect(() => {
    if (hasDateParams) return;
    const { startDate, endDate } = getDateRangeByPeriodType(DEFAULT_PERIOD_NAME);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    router.replace(`${StaffRoutes.dashboard}?${params.toString()}`);
  }, [hasDateParams, router, searchParams]);

  const startDate = urlStart || getDateRangeByPeriodType(DEFAULT_PERIOD_NAME).startDate;
  const endDate = urlEnd || getDateRangeByPeriodType(DEFAULT_PERIOD_NAME).endDate;
  const selectedClassroomId = urlClassroomId ?? "";

  const {
    data: staffClassroomPages,
    hasNextPage: hasMoreStaffClassrooms,
    fetchNextPage: fetchNextStaffClassroomPage,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
      data: staffId != null ? { staffId } : {},
    },
    options: {
      enabled: staffId != null,
      keys: ["staff-classrooms", staffId != null ? String(staffId) : "no-staff"],
    },
  });

  const fetchMoreStaffClassrooms = async () => {
    if (!hasMoreStaffClassrooms) return;
    await fetchNextStaffClassroomPage();
  };

  const currentPeriod = useMemo(() => {
    if (!urlStart || !urlEnd) return DEFAULT_PERIOD_NAME;
    for (let i = 0; i < PERIOD_OPTIONS.length; i++) {
      const option = PERIOD_OPTIONS[i];
      const name = (option as { name: string }).name;
      if (name === "Custom") continue;
      const { startDate: s, endDate: e } = getDateRangeByPeriodType(name);
      if (urlStart === s && urlEnd === e) return name;
    }
    return "Custom";
  }, [urlStart, urlEnd]);

  const resolvedPeriodType = useMemo((): PeriodType => {
    // Prefer the active UI preset where possible; fall back to range-derived for Custom/range selections.
    const preset = periodTypeFromPresetName(currentPeriod);
    if (preset) return preset;
    return periodTypeFromRange(startDate, endDate);
  }, [currentPeriod, startDate, endDate]);

  const dashboardParams = useMemo((): StaffDashboardAnalyticsParams => {
    const p: StaffDashboardAnalyticsParams = { startDate, endDate, periodType: resolvedPeriodType };
    if (selectedClassroomId) p.classroomId = selectedClassroomId;
    if (staffId != null) p.staffId = staffId;
    return p;
  }, [startDate, endDate, resolvedPeriodType, selectedClassroomId, staffId]);

  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQueryService<
    StaffDashboardAnalyticsResponse,
    any
  >({
    service: analyticsDynamicEndpoints.getStaffDashboardAnalytics(dashboardParams),
    options: {
      keys: ["staffDashboard", startDate, endDate, selectedClassroomId, String(staffId ?? "none")],
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });

  const studentCount = analyticsData?.data?.totalStudents ?? 0;
  const signedInCount = analyticsData?.data?.totalSignedIn ?? 0;
  const lateCount = analyticsData?.data?.totalLate ?? 0;
  const absentCount = analyticsData?.data?.totalAbsent ?? 0;
  const growth = analyticsData?.data?.percentageGrowth ?? 0;

  const attendanceChartData = useMemo(() => {
    const present = analyticsData?.data?.attendance?.present ?? [];
    const absent = analyticsData?.data?.attendance?.absent ?? [];
    const late = analyticsData?.data?.attendance?.late ?? [];
    const chartPeriodType: "daily" | "weekly" | "monthly" =
      resolvedPeriodType === "yearly" ? "monthly" : resolvedPeriodType;

    const mappedData = mapAttendanceTrendToChartData(
      { present, absent, late },
      chartPeriodType,
      false,
    );

    const normalizedMappedData =
      chartPeriodType === "daily" && startDate
        ? mappedData.map((item, idx) => ({
            ...item,
            name: dayjs(startDate).add(idx, "day").format("ddd"),
          }))
        : mappedData;

    const now = new Date();
    const today = dayjs(now).startOf("day").valueOf();
    const rangeStart = startDate ? dayjs(startDate).startOf("day").valueOf() : null;
    const rangeEnd = endDate ? dayjs(endDate).endOf("day").valueOf() : null;
    const isCurrentRange =
      rangeStart != null && rangeEnd != null && today >= rangeStart && today <= rangeEnd;
    const currentMonth = now.getMonth();
    const currentDayOfWeek = now.getDay();
    const currentWeekOfMonth = Math.min(Math.ceil(now.getDate() / 7), 5);

    return normalizedMappedData.map((item, index) => {
      let isFuture = false;
      if (!isCurrentRange) {
        isFuture = false;
      } else if (chartPeriodType === "monthly") {
        isFuture = index > currentMonth;
      } else if (chartPeriodType === "weekly") {
        isFuture = index + 1 > currentWeekOfMonth;
      } else if (chartPeriodType === "daily") {
        if (startDate) {
          const slotDate = dayjs(startDate).add(index, "day").startOf("day");
          isFuture = slotDate.isAfter(dayjs(now).startOf("day"));
        } else {
          const dayOrder = [1, 2, 3, 4, 5, 6, 0];
          const todaySlot = dayOrder[currentDayOfWeek] ?? 0;
          isFuture = index > todaySlot;
        }
      }

      return {
        name: item.name,
        present: isFuture ? 0 : (item.present ?? 0) + (item.late ?? 0),
        absent: isFuture ? 0 : (item.absent ?? 0),
      };
    });
  }, [analyticsData?.data?.attendance, resolvedPeriodType, startDate, endDate]);

  const handlePeriodChange = (period: string) => {
    if (period === "Custom") return;
    const { startDate: s, endDate: e } = getDateRangeByPeriodType(period);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("startDate", s);
    params.set("endDate", e);
    if (selectedClassroomId) params.set("classroomId", selectedClassroomId);
    router.push(`${StaffRoutes.dashboard}?${params.toString()}`);
  };

  const handleCustomDateApply = (customStart: string, customEnd: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("startDate", customStart);
    params.set("endDate", customEnd);
    if (selectedClassroomId) params.set("classroomId", selectedClassroomId);
    router.push(`${StaffRoutes.dashboard}?${params.toString()}`);
  };

  const handleClassroomChange = (classroomId: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    if (classroomId) params.set("classroomId", classroomId);
    else params.delete("classroomId");
    router.push(`${StaffRoutes.dashboard}?${params.toString()}`);
  };

  const classrooms = useMemo(() => {
    const pages = staffClassroomPages?.pages ?? [];
    const fromApi = pages.flatMap((page: any) => page?.classrooms ?? page?.data ?? []);
    if (Array.isArray(fromApi) && fromApi.length > 0) {
      return fromApi.map((c: any) => ({
        id: c.id,
        classroomName: c.classroomName ?? c.name ?? "Classroom",
      }));
    }
    if (!staffClassesAndSubject?.length) return [];
    return staffClassesAndSubject
      .filter((item) => item.classroom)
      .map((item) => ({
        id: item.classroom.id,
        classroomName: item.classroom.classroomName,
      }));
  }, [staffClassesAndSubject, staffClassroomPages]);

  return {
    isLoading: isAnalyticsLoading,
    analyticsData,
    studentCount,
    signedInCount,
    lateCount,
    absentCount,
    growth,
    attendanceChartData,
    startDate,
    endDate,
    attendancePeriodType: resolvedPeriodType,
    classrooms,
    currentPeriod,
    handlePeriodChange,
    handleCustomDateApply,
    handleClassroomChange,
    selectedClassroomId,
    hasMoreStaffClassrooms,
    fetchMoreStaffClassrooms,
  };
}
