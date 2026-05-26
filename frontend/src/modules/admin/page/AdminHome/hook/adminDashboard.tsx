/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { schoolDynamicEndpoints } from "@/services/school.service";
import { GetSchoolResponse } from "@/services/school.service";
import {
  DashboardAnalyticsResponse,
  analyticsDynamicEndpoints,
  EarningsAnalyticsResponse,
  analyticsServices,
} from "@/services/analytics.service";
import { dashboardParentDataCards, dashboardStaffDataCards, PERIOD_OPTIONS } from "@/constants";
import { useEffect, useMemo, useState } from "react";
import { getDateRangeByPeriodType, getAttendancePeriodTypeFromRange } from "@/utils/helpers";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { classroomServices, Classroom } from "@/services/classroom.service";
import { scheduleTourServices } from "@/services/tour.service";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { invoiceServices } from "@/services/invoice.service";
import { CashViewer } from "@/modules/shared/component/CashViewer";
import { activitiesServices } from "@/services/activities.service";
import { unwrapQueryDataBody } from "@/utils/unwrapQueryResponse";
import type { ActionCentreItem } from "@/modules/admin/component/ActionCentreTable/actionCentreTable";

const DEFAULT_PERIOD_NAME = "This week";

export default function useAdminDashboard({ role }: { role: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

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
    router.replace(`${DashboardRoutes.dashboard}?${params.toString()}`);
  }, [hasDateParams, router, searchParams]);

  const startDate = urlStart || getDateRangeByPeriodType(DEFAULT_PERIOD_NAME).startDate;
  const endDate = urlEnd || getDateRangeByPeriodType(DEFAULT_PERIOD_NAME).endDate;
  const selectedClassroomId = urlClassroomId ?? "";

  const attendancePeriodType = useMemo(
    () => getAttendancePeriodTypeFromRange(startDate, endDate),
    [startDate, endDate],
  );

  const dashboardParams = useMemo(
    () => ({
      startDate,
      endDate,
      attendancePeriodType,
      attendanceTrendType: "student" as const,
      ...(selectedClassroomId ? { classroomId: selectedClassroomId } : {}),
    }),
    [startDate, endDate, attendancePeriodType, selectedClassroomId],
  );

  const { data: schoolData, isLoading: isSchoolLoading } = useQueryService<GetSchoolResponse, any>({
    service: schoolDynamicEndpoints.getParticularSchool(),
    options: {
      keys: ["schoolData"],
      staleTime: 2 * 60 * 1000,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  });

  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQueryService<
    DashboardAnalyticsResponse,
    any
  >({
    service: analyticsDynamicEndpoints.getAdminDashboardAnalytics(dashboardParams),
    options: {
      keys: ["adminDashboard", startDate, endDate],
      staleTime: 2 * 60 * 1000,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  });

  const { data: earningsApiData, isLoading: isEarningsLoading } = useQueryService<
    EarningsAnalyticsResponse,
    any
  >({
    service: analyticsDynamicEndpoints.getAdminEarningAnalytics({
      startDate,
      endDate,
      periodType: attendancePeriodType,
    }),
    options: {
      keys: ["adminEarnings", startDate, endDate, attendancePeriodType],
      staleTime: 2 * 60 * 1000,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  });

  const { data: classroomsInfinityData } = useInfiniteQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
      data: {
        delta: 100,
        status: "active",
      },
    },
  });

  const classrooms: Classroom[] = useMemo(
    () =>
      classroomsInfinityData?.pages?.flatMap((page: any) => page?.data ?? page?.classrooms ?? []) ??
      [],
    [classroomsInfinityData],
  );

  const studentCount = analyticsData?.data?.students?.total ?? 0;
  const teacherCount = analyticsData?.data?.staff?.total ?? 0;
  const classroomCount = analyticsData?.data?.classrooms?.total ?? 0;
  const classroomUtilization = analyticsData?.data?.classrooms?.utilizationRate ?? 0;
  const admissionsCount = analyticsData?.data?.admissions?.total ?? 0;
  const admissionsGrowth = analyticsData?.data?.admissions?.percentageGrowth ?? 0;
  const studentGrowth = analyticsData?.data?.students?.percentageGrowth ?? 0;
  const staffGrowth = analyticsData?.data?.staff?.percentageGrowth ?? 0;
  const classroomGrowth = analyticsData?.data?.classrooms?.percentageGrowth ?? 0;

  const maleCount = analyticsData?.data?.students?.male ?? 0;
  const femaleCount = analyticsData?.data?.students?.female ?? 0;
  const totalStudents = analyticsData?.data?.students?.total ?? 0;

  const classStatsData = [
    { label: "Boys", value: maleCount },
    { label: "Girls", value: femaleCount },
    { label: "Total", value: totalStudents },
  ];
  const classroomUtilizationData = [
    { label: "Utilization Rate", value: classroomUtilization },
    { label: "Active", value: analyticsData?.data?.classrooms?.active ?? 0 },
    { label: "Total", value: classroomCount },
  ];

  const attendanceData = [
    { label: "Student Present", value: analyticsData?.data?.attendance?.student?.present ?? 0 },
    { label: "Student Absent", value: analyticsData?.data?.attendance?.student?.absent ?? 0 },
    { label: "Student Late", value: analyticsData?.data?.attendance?.student?.late ?? 0 },
    { label: "Staff Present", value: analyticsData?.data?.attendance?.staff?.present ?? 0 },
    { label: "Staff Absent", value: analyticsData?.data?.attendance?.staff?.absent ?? 0 },
    { label: "Staff Late", value: analyticsData?.data?.attendance?.staff?.late ?? 0 },
  ];

  const admissionsData = [
    { label: "Total Admissions", value: admissionsCount },
    { label: "This Month", value: analyticsData?.data?.admissions?.thisMonth ?? 0 },
    { label: "Growth %", value: admissionsGrowth },
  ];

  const earningsData = useMemo(() => {
    const xAxis = earningsApiData?.data?.xAxis ?? [];
    const yAxis = earningsApiData?.data?.yAxis ?? [];
    return xAxis.map((month: string, i: number) => ({
      month,
      value: yAxis[i] ?? 0,
    }));
  }, [earningsApiData]);

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
    if (selectedClassroomId) params.set("classroomId", selectedClassroomId);
    router.push(`${DashboardRoutes.dashboard}?${params.toString()}`);
  };

  const handleCustomDateApply = (customStart: string, customEnd: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("startDate", customStart);
    params.set("endDate", customEnd);
    if (selectedClassroomId) params.set("classroomId", selectedClassroomId);
    router.push(`${DashboardRoutes.dashboard}?${params.toString()}`);
  };

  const handleClassroomChange = (classroomId: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    if (classroomId) params.set("classroomId", classroomId);
    else params.delete("classroomId");
    router.push(`${DashboardRoutes.dashboard}?${params.toString()}`);
  };

  const dynamicAdminCards = [
    { title: "Students", value: studentCount, percentage: studentGrowth, figure: Math.round(0) },
    { title: "Teachers", value: teacherCount, percentage: staffGrowth, figure: Math.round(0) },
    {
      title: "Open Enquiries",
      value: classroomCount,
      percentage: classroomGrowth,
      figure: Math.round(0),
      activityText: " tour booked",
    },
    {
      title: "Waitlist",
      value: admissionsData?.[0]?.value ?? 0,
      percentage: admissionsGrowth,
      figure: Math.round(0),
    },
  ];

  const dashboardCards =
    role === "admin"
      ? dynamicAdminCards
      : role === "staff"
        ? dashboardStaffDataCards
        : dashboardParentDataCards;

  const reportQuery = useQueryService({
    service: {
      ...analyticsServices.getAttendanceReport,
      data: {
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        periodType: attendancePeriodType || "weekly",
      },
    },
  });
  const { isLoading: isLoadingReport } = reportQuery;
  const reportData = unwrapQueryDataBody<Record<string, any>>(reportQuery.data);

  const billingQuery = useQueryService({
    service: {
      ...analyticsServices.getBillingSummery,
      data: {
        ...(startDate && endDate ? { startDate, endDate } : {}),
      },
    },
    options: {
      keys: ["attendance-hours", startDate, endDate],
    },
  });
  const billingSummeryData = (unwrapQueryDataBody<Record<string, any>>(billingQuery.data) ??
    {}) as Record<string, any>;

  const [bookedToursActionItems, setBookedToursActionItems] = useState<ActionCentreItem[]>([]);

  const { mutateAsync: getBookedTours, isPending: isLoadingBookedTours } = useMutationService<
    { delta?: number; pos?: number },
    { bookings?: unknown[]; data?: unknown[]; count?: number; pagination?: { count?: number; total?: number } }
  >({
    service: scheduleTourServices.getBookedTours,
    options: {
      disableToast: true,
    },
  });

  const invoiceListQuery = useQueryService({
    service: { ...invoiceServices.getAllInvoice, data: { delta: 1 } },
  });
  const invoiceData = (invoiceListQuery.data ?? {}) as Record<string, any>;

  useQueryService({
    service: activitiesServices.getAllActivityLogs,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchBookedToursForActionCenter = async () => {
      try {
        const response = await getBookedTours({
          delta: 10,
          pos: 0,
        });

        if (!isMounted) return;

        const bookings = response?.bookings || response?.data || [];
        const totalBookedTours =
          response?.pagination?.count ??
          response?.pagination?.total ??
          response?.count ??
          (Array.isArray(bookings) ? bookings.length : 0);

        setBookedToursActionItems([
          {
            id: "booked-tours-total",
            context: "Booked tours",
            message: `${totalBookedTours} total booked tours`,
            priority: "medium",
          },
        ]);
      } catch {
        if (isMounted) setBookedToursActionItems([]);
      }
    };

    fetchBookedToursForActionCenter();

    return () => {
      isMounted = false;
    };
  }, [getBookedTours]);

  const actionCenterQuery = useQueryService({
    service: analyticsServices.actionCenter,
  });
  const { isLoading: isLoadingActionCenterQuery } = actionCenterQuery;
  const actionCenterRaw = unwrapQueryDataBody<unknown[] | Record<string, unknown>>(
    actionCenterQuery.data,
  );
  const analyticsActionItems = (
    Array.isArray(actionCenterRaw)
      ? actionCenterRaw
      : (actionCenterRaw as { data?: unknown[] })?.data ?? []
  ) as ActionCentreItem[];
  const actionCenter = [...analyticsActionItems, ...bookedToursActionItems];
  const isLoadingActionCenter = isLoadingActionCenterQuery || isLoadingBookedTours;

  function getOutstandingBalancePercentage({
    totalOutstandingBalanceAmount = 0,
    totalAmount = 0,
  }: {
    totalOutstandingBalanceAmount: any;
    totalAmount: any;
  }): number {
    if (!totalAmount || totalAmount === 0) return 0;

    return Number(((totalOutstandingBalanceAmount / totalAmount) * 100).toFixed(2));
  }

  function getOverduePercentage({
    overdueInvoiceAmount,
    totalInvoiceAmount,
  }: {
    overdueInvoiceAmount: any;
    totalInvoiceAmount: any;
  }): number {
    if (!totalInvoiceAmount || totalInvoiceAmount === 0) return 0;

    return Number(((overdueInvoiceAmount / totalInvoiceAmount) * 100).toFixed(2));
  }
  function getPaidPercentage({
    paidInvoiceAmount,
    totalInvoiceAmount,
  }: {
    paidInvoiceAmount: any;
    totalInvoiceAmount: any;
  }): number {
    if (!totalInvoiceAmount || totalInvoiceAmount === 0) return 0;

    return Number(((paidInvoiceAmount / totalInvoiceAmount) * 100).toFixed(2));
  }

  const FINANCIAL_ITEMS: any[] = [
    {
      label: "Revenue ",
      value: <CashViewer amount={earningsApiData?.metadata?.total} />,
      progressPercent: 100,
    },
    {
      label: "Outstanding Fees",
      value: <CashViewer amount={billingSummeryData?.metadata?.totalOutstandingBalanceAmount} />,
      progressPercent: getOutstandingBalancePercentage({
        totalOutstandingBalanceAmount: billingSummeryData?.metadata?.totalOutstandingBalanceAmount,
        totalAmount: billingSummeryData?.metadata?.totalAmount,
      }),
    },
    { label: "Paid vs Unpaid", value: `${
      getPaidPercentage({
        paidInvoiceAmount: invoiceData?.metadata?.paidInvoiceAmount,
        totalInvoiceAmount: invoiceData?.metadata?.totalInvoiceAmount,
      })
    }% Paid`, progressPercent: getPaidPercentage({
        paidInvoiceAmount: invoiceData?.metadata?.paidInvoiceAmount,
        totalInvoiceAmount: invoiceData?.metadata?.totalInvoiceAmount,
      }) },
    {
      label: "Overdue Invoices",
      value: <CashViewer amount={invoiceData?.metadata?.overdueInvoiceAmount || 0} />,
      progressPercent: getOverduePercentage({
        overdueInvoiceAmount: invoiceData?.metadata?.overdueInvoiceAmount,
        totalInvoiceAmount: invoiceData?.metadata?.totalInvoiceAmount,
      }),
    },
  ];

  return {
    earningsData,
    isLoading: isSchoolLoading || isAnalyticsLoading,
    isEarningsLoading,
    isAnalyticsLoading,
    schoolData,
    analyticsData,
    studentCount,
    teacherCount,
    classroomCount,
    classroomUtilizationData,
    attendanceData,
    admissionsData,
    studentGrowth,
    staffGrowth,
    classroomGrowth,
    admissionsGrowth,
    classStatsData,
    currentPeriod,
    reportData,
    isLoadingReport,
    handlePeriodChange,
    handleCustomDateApply,
    handleClassroomChange,
    selectedClassroomId,
    dashboardCards,
    classrooms,
    startDate,
    endDate,
    attendancePeriodType,
    FINANCIAL_ITEMS,
    actionCenter,
    isLoadingActionCenter
  };
}
