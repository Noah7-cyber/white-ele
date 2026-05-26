"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useEffect, useState } from "react";
import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useQueryService } from "@/utils/hooks/useQueryService";
import {
  analyticsDynamicEndpoints,
  type ParentDashboardResponse,
} from "@/services/analytics.service";
import {
  getDateRangeByPeriodType,
  getAttendancePeriodTypeFromRange,
  mapAttendanceTrendToChartData,
} from "@/utils/helpers";
import { PERIOD_OPTIONS } from "@/constants";
import { Box, Typography } from "@mui/material";
import EyeIcon from "@/modules/shared/assets/svgs/eyeLinear.svg";
import EyeOffIcon from "@/modules/shared/assets/svgs/eyeOffLinear.svg";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";

const PARENT_DASHBOARD_PATH = "/parent/dashboard";
const DEFAULT_PERIOD_NAME = "This week";

export default function useParentDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlStart = searchParams?.get("startDate") ?? null;
  const urlEnd = searchParams?.get("endDate") ?? null;
  const hasDateParams = Boolean(urlStart && urlEnd);

  useEffect(() => {
    if (hasDateParams) return;
    const { startDate, endDate } = getDateRangeByPeriodType(DEFAULT_PERIOD_NAME);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    router.replace(`${PARENT_DASHBOARD_PATH}?${params.toString()}`);
  }, [hasDateParams, router, searchParams]);

  const startDate = urlStart || getDateRangeByPeriodType(DEFAULT_PERIOD_NAME).startDate;
  const endDate = urlEnd || getDateRangeByPeriodType(DEFAULT_PERIOD_NAME).endDate;

  const attendancePeriodType = useMemo(() => {
    const t = getAttendancePeriodTypeFromRange(startDate, endDate);
    return t === "yearly" ? "monthly" : t;
  }, [startDate, endDate]);

  const dashboardParams = useMemo(
    () => ({
      startDate,
      endDate,
      periodType: attendancePeriodType,
    }),
    [startDate, endDate, attendancePeriodType],
  );

  const service = useMemo(
    () => analyticsDynamicEndpoints.getParentDashboardAnalytics(dashboardParams),
    [dashboardParams],
  );

  const { data: parentDashboardData, isLoading: isDashboardLoading } = useQueryService<
    any,
    ParentDashboardResponse
  >({
    service,
    options: {
      keys: ["parentDashboard", startDate, endDate],
      staleTime: 2 * 60 * 1000,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  });

  const [isPinHidden, setIsPinHidden] = useState<boolean>(true);
  const pin = parentDashboardData?.data?.kioskPin || "";
  const kioskLink =
    parentDashboardData?.data?.kioskLink ||
    parentDashboardData?.data?.kioskUrl ||
    parentDashboardData?.data?.attendanceKioskLink ||
    "";
  const kioskQrCodeUrl =
    parentDashboardData?.data?.kioskQrCode ||
    parentDashboardData?.data?.kioskQrCodeUrl ||
    parentDashboardData?.data?.attendanceKioskQrCode ||
    "";
  const handleTogglePin = () => setIsPinHidden((prev) => !prev);

  const getAttendanceChartData = () => {
    if (!parentDashboardData?.data?.attendance) return [];
    const raw = parentDashboardData.data.attendance;
    const present = Array.isArray(raw.present) ? raw.present : [];
    const absent = Array.isArray(raw.absent) ? raw.absent : [];
    const late = Array.isArray(raw.late) ? raw.late : [];

    // Use shared helper so the parent chart matches admin:
    // - For month ranges: weekly buckets
    // - For year ranges: monthly buckets
    const trendChart = mapAttendanceTrendToChartData(
      { present, absent, late },
      attendancePeriodType,
      false,
    );

    const normalizedTrendChart =
      attendancePeriodType === "daily" && startDate
        ? trendChart.map((item, idx) => ({
            ...item,
            name: dayjs(startDate).add(idx, "day").format("ddd"),
          }))
        : trendChart;

    const now = new Date();
    const today = dayjs(now).startOf("day").valueOf();
    const rangeStart = startDate ? dayjs(startDate).startOf("day").valueOf() : null;
    const rangeEnd = endDate ? dayjs(endDate).endOf("day").valueOf() : null;
    const isCurrentRange =
      rangeStart != null && rangeEnd != null && today >= rangeStart && today <= rangeEnd;
    const currentMonth = now.getMonth();
    const currentDayOfWeek = now.getDay();
    const currentWeekOfMonth = Math.min(Math.ceil(now.getDate() / 7), 5);

    return normalizedTrendChart.map((item, index) => {
      let isFuture = false;
      if (!isCurrentRange) {
        isFuture = false;
      } else if (attendancePeriodType === "monthly") {
        isFuture = index > currentMonth;
      } else if (attendancePeriodType === "weekly") {
        isFuture = index + 1 > currentWeekOfMonth;
      } else if (attendancePeriodType === "daily") {
        if (startDate) {
          const slotDate = dayjs(startDate).add(index, "day").startOf("day");
          isFuture = slotDate.isAfter(dayjs(now).startOf("day"));
        } else {
          const dayOrder = [1, 2, 3, 4, 5, 6, 0];
          const todaySlot = dayOrder[currentDayOfWeek] ?? 0;
          isFuture = index > todaySlot;
        }
      }
      const totalPresent = (item.present ?? 0) + (item.late ?? 0);
      return {
        name: item.name,
        present: isFuture ? 0 : totalPresent,
        absent: isFuture ? 0 : item.absent,
        late: 0,
      };
    });
  };

  const sumSeries = (arr: unknown) =>
    Array.isArray(arr) ? arr.reduce((sum: number, val: number) => sum + (Number(val) || 0), 0) : 0;

  const getAttendanceRate = () => {
    const data = parentDashboardData?.data?.attendance;
    if (!data) return 0;
    const totalPresent = sumSeries(data.present);
    const totalAbsent = sumSeries(data.absent);
    const total = totalPresent + totalAbsent;
    return total > 0 ? Math.round((totalPresent / total) * 100) : 0;
  };

  const attendanceSums = useMemo(() => {
    const data = parentDashboardData?.data?.attendance;
    if (!data) {
      return { present: 0, absent: 0, late: 0 };
    }
    return {
      present: sumSeries(data.present),
      absent: sumSeries(data.absent),
      late: sumSeries(data.late),
    };
  }, [parentDashboardData?.data?.attendance]);

  const totalStudents = parentDashboardData?.metadata?.totalStudents ?? 0;

  const renderPinBoxes = () => {
    if (isDashboardLoading) {
      return (
        <DataRenderer isLoading={isDashboardLoading}>
          {() => (
            <Box className="flex gap-2 items-center justify-center px-0.5">
              <Typography className="text-sm text-text-tertiary/70">Loading PIN</Typography>
            </Box>
          )}
        </DataRenderer>
      );
    }
    const pinLength = pin ? pin.length : 4;
    const pinDigits = pin ? pin.split("") : Array(pinLength).fill("-");
    return (
      <Box className="flex gap-2 items-center justify-center px-0.5">
        {pinDigits.map((digit, idx) => (
          <Box
            key={idx}
            className="w-16 h-16 flex items-center justify-center border text-center rounded-lg text-4xl font-semibold text-primary-text-dark bg-white"
          >
            {pin ? (
              isPinHidden ? (
                <span className="mt-2.5 text-4xl">*</span>
              ) : (
                digit
              )
            ) : (
              <span className="mt-2.5 text-4xl text-text-tertiary/70">-</span>
            )}
          </Box>
        ))}
        {pin && (
          <Box
            className="ml-3 cursor-pointer flex items-center"
            onClick={handleTogglePin}
            aria-label={isPinHidden ? "Show PIN" : "Hide PIN"}
          >
            {isPinHidden ? <EyeOffIcon /> : <EyeIcon />}
          </Box>
        )}
      </Box>
    );
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

  const handlePeriodChange = (period: string) => {
    if (period === "Custom") return;
    const { startDate: s, endDate: e } = getDateRangeByPeriodType(period);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("startDate", s);
    params.set("endDate", e);
    router.push(`${PARENT_DASHBOARD_PATH}?${params.toString()}`);
  };

  const handleCustomDateApply = (customStart: string, customEnd: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("startDate", customStart);
    params.set("endDate", customEnd);
    router.push(`${PARENT_DASHBOARD_PATH}?${params.toString()}`);
  };

  const dashboardActivities = parentDashboardData?.data?.activities;
  const activitiesList = Array.isArray(dashboardActivities) ? dashboardActivities : [];

  return {
    attendanceChartData: getAttendanceChartData(),
    attendanceRate: getAttendanceRate(),
    attendancePresentSum: attendanceSums.present,
    attendanceAbsentSum: attendanceSums.absent,
    attendanceLateSum: attendanceSums.late,
    totalStudents,
    activities: activitiesList,
    isLoading: isDashboardLoading,
    currentPeriod,
    handlePeriodChange,
    handleCustomDateApply,
    startDate,
    endDate,
    percentageGrowth: parentDashboardData?.data?.attendance?.percentageGrowth ?? 0,
    renderPinBoxes,
    kioskPin: pin,
    kioskLink,
    kioskQrCodeUrl,
  };
}
