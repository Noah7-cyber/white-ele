/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { JSX, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import { IconButton } from "@mui/material";
import { classroomServices } from "@/services/classroom.service";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { useUser } from "@/utils/hooks/useUser";
import { getDateRange } from "@/utils/helpers";
import { DATE_FILTER_PERIOD } from "@/constants";
import client from "@/utils/client";
import { analyticsServices } from "@/services/analytics.service";
import { showToast } from "../../Toast";

export type BaseRow = {
  id: 1;
  name: string;
  timeIn: string;
  timeOut: string;
  worked: string;
  reason: string;
  parentName: string;
  studentName: string;
  status: JSX.Element;
  action: JSX.Element;
};

export type GradeOption = {
  label: string;
  value: string;
  isActive: boolean;
  classroomId?: number; // For staff role, track classroom ID
};

export type GradeOptions = GradeOption[];
export type TeacherTableRow = BaseRow;
export type ChildrenTableRow = BaseRow;

export default function useAttendance(role: "admin" | "staff" = "admin") {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = role === "admin";
  const isStaff = role === "staff";

  const [isDownloading, setIsDownloading] = useState(false);

  // Staff-only: ID and assigned classrooms from profile (useUser)
  const { staffId: userStaffId, staffClassesAndSubject } = useUser();
  const staffId = role === "staff" ? (userStaffId ?? null) : null;
  const assignedClassrooms = useMemo(() => {
    if (role !== "staff" || !staffClassesAndSubject?.length) return [];
    return staffClassesAndSubject
      .filter((item) => item.classroom)
      .map((item) => ({
        id: item.classroom.id,
        classroomName: item.classroom.classroomName,
      }));
  }, [role, staffClassesAndSubject]);

  const [gradeAnchorEl, setGradeAnchorEl] = useState<HTMLElement | null>(null);
  const [depositStatusAnchorEl, setDepositStatusAnchorEl] = useState<HTMLElement | null>(null);
  const [attendanceStatusAnchorEl, setAttendanceStatusAnchorEl] = useState<HTMLElement | null>(
    null,
  );
  const [TimeAnchorEl, setTimeAnchorEl] = useState<HTMLElement | null>(null);
  const [ReportAnchorEl, setReportAnchorEl] = useState<HTMLElement | null>(null);
  const mobileTimeFilterAnchorRef = useRef<HTMLButtonElement>(null);
  const mobileGradeFilterAnchorRef = useRef<HTMLButtonElement>(null);

  const openTimeFilterMobile = useCallback(() => {
    const el = mobileTimeFilterAnchorRef.current;
    if (el) setTimeAnchorEl(el);
  }, []);

  const openGradeFilterMobile = useCallback(() => {
    const el = mobileGradeFilterAnchorRef.current;
    if (el) setGradeAnchorEl(el);
  }, []);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(null);

  // Fetch classrooms using infiniteQuery — fetches next batch when user scrolls dropdown
  const {
    data: classRoomData,
    hasNextPage: hasMoreRooms,
    fetchNextPage: fetchNextClassPage,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
    },
  });

  const allClassrooms = useMemo(() => {
    const list =
      classRoomData?.pages?.reduce<any[]>((acc, page) => {
        return acc.concat(page?.classrooms ?? page?.data ?? []);
      }, []) ?? [];
    return list.map((c: any) => ({
      id: c.id as number,
      classroomName: c.classroomName as string,
    }));
  }, [classRoomData]);

  const fetchMoreRooms = async (): Promise<void> => {
    if (!hasMoreRooms) return;
    fetchNextClassPage();
  };

  const handlePageChange = ({
    page,
    rowsPerPage: newRowsPerPage,
  }: {
    page: number;
    rowsPerPage: number;
  }) => {
    setCurrentPage(page);
    if (newRowsPerPage !== rowsPerPage) {
      setRowsPerPage(newRowsPerPage);
      setCurrentPage(1);
    }
  };

  const timeOptions = [
    { label: "Today", value: "Today" },
    { label: "This Week", value: "This Week" },
    { label: "This Month", value: "This Month" },
    { label: "Last Month", value: "Last Month" },
    { label: "This Year", value: "This Year" },
    { label: "Last Year", value: "Last Year" },
    { label: "Custom", value: "Custom" },
  ];

  // Get dates from URL or calculate default (Today)
  const startDateFromUrl = searchParams?.get("startDate");
  const endDateFromUrl = searchParams?.get("endDate");

  // Calculate date range - use URL dates if available, otherwise default to Today
  const dateRange = useMemo(() => {
    if (startDateFromUrl && endDateFromUrl) {
      return { startDate: startDateFromUrl, endDate: endDateFromUrl };
    }
    // Default to today if no dates in URL
    return getDateRange("This Month");
  }, [startDateFromUrl, endDateFromUrl]);

  const { startDate, endDate } = dateRange;

  // Build gradeOptions based on role
  const gradeOptions = useMemo<GradeOption[]>(() => {
    if (isStaff && assignedClassrooms.length > 0) {
      // For staff, use assigned classrooms
      return [
        {
          label: "All Classrooms",
          value: "All Classrooms",
          classroomId: undefined,
          isActive: false,
        },
        ...assignedClassrooms.map((classroom) => ({
          label: classroom.classroomName,
          value: classroom.classroomName,
          classroomId: classroom.id,
          isActive: false,
        })),
      ];
    }
    // For admin, use fetched classrooms
    if (isAdmin && allClassrooms.length > 0) {
      return [
        {
          label: "All Classrooms",
          value: "All Classrooms",
          classroomId: undefined,
          isActive: false,
        },
        ...allClassrooms.map((classroom) => ({
          label: classroom.classroomName,
          value: classroom.classroomName,
          classroomId: classroom.id,
          isActive: false,
        })),
      ];
    }
    // Fallback: empty options if classrooms haven't loaded yet
    return [
      { label: "All Classrooms", value: "All Classrooms", classroomId: undefined, isActive: false },
    ];
  }, [isStaff, isAdmin, assignedClassrooms, allClassrooms]);

  const reportOptions = [
    { label: "Children", value: "Children" },
    { label: "Teachers", value: "Teachers" },
  ];

  const [gradeFilters, setGradeFilters] = useState<GradeOption[]>([]);
  const [timeFilters, setTimeFilters] = useState(
    timeOptions.map((opt, index) => ({
      ...opt,
      isActive: index === 2,
    })),
  );

  const [reportFilters, setReportFilters] = useState(
    reportOptions.map((opt, index) => ({
      ...opt,
      isActive: index === 0,
    })),
  );

  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("All Classrooms");
  const [depositStatus, setDepositStatus] = useState<string>("");
  const [attendanceStatus, setAttendanceStatus] = useState<string>("");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState(timeOptions?.[2].label);
  const [selectedReportFilter, setSelectedReportFilter] = useState(reportOptions?.[0].label);

  // Determine which periodType matches the current dates (for UI display)
  const currentPeriodType = useMemo(() => {
    return DATE_FILTER_PERIOD?.[selectedTimeFilter || "This Month"] || "weekly";
  }, [selectedTimeFilter]);

  // Sync selectedTimeFilter with current periodType based on dates

  // useEffect(() => {
  //   const option = timeOptions.find((opt) => opt.value === currentPeriodType);
  //   const matchingLabel = option ? option.label : timeOptions[2].label;
  //   if (matchingLabel !== selectedTimeFilter) {
  //     setSelectedTimeFilter(matchingLabel);
  //     // Update timeFilters active state
  //     setTimeFilters((prev) =>
  //       prev.map((f) => ({
  //         ...f,
  //         isActive: f.value === currentPeriodType,
  //       })),
  //     );
  //   }
  // }, [currentPeriodType]);

  // Update gradeFilters when gradeOptions change
  useEffect(() => {
    if (gradeOptions.length > 0) {
      const newFilters = gradeOptions.map((opt, index) => ({
        ...opt,
        isActive: index === 0,
      }));
      setGradeFilters(newFilters);

      // Update selected filter if it's not in the new options
      const currentFilterExists = gradeOptions.some((opt) => opt.value === selectedGradeFilter);
      if (!currentFilterExists) {
        setSelectedGradeFilter(gradeOptions[0].value);
        setSelectedClassroomId(gradeOptions[0].classroomId ?? null);
      }
    }
  }, [gradeOptions, selectedGradeFilter]);

  const handleOpenGradeFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setGradeAnchorEl(event.currentTarget);
  };
  const handleOpenDepositStatusFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDepositStatusAnchorEl(event.currentTarget);
  };
  const handleOpenAttendanceStatusFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAttendanceStatusAnchorEl(event.currentTarget);
  };

  const handleOpenTimeFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setTimeAnchorEl(event.currentTarget);
  };

  const handleOpenReportFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setReportAnchorEl(event.currentTarget);
  };

  const handleGradeFilterChange = (value: string) => {
    setSelectedGradeFilter(value);
    const selectedOption = gradeOptions.find((opt) => opt.value === value) as
      | GradeOption
      | undefined;
    setSelectedClassroomId(selectedOption?.classroomId ?? null);
    setGradeFilters((prev) =>
      prev.map((f) => ({
        ...f,
        isActive: f.value === value,
      })),
    );
  };

  const handleReportFilterChange = (value: string) => {
    setSelectedReportFilter(value);
    setReportFilters((prev) => prev?.map((f) => ({ ...f, isActive: f.value === value })));
  };

  const handleTimeFilterChange = (value: string) => {
    setSelectedTimeFilter(value);
    setTimeFilters((prev) =>
      prev.map((f) => ({
        ...f,
        isActive: f.value === value,
      })),
    );

    // Find the periodType value for the selected label
    const selectedOption = timeOptions.find((opt) => opt.label === value);
    const periodTypeValue = selectedOption ? selectedOption.value : "This Month";

    // Calculate date range for the selected period type
    let dateRangeToUse: { startDate: string; endDate: string };
    if (periodTypeValue !== "Custom") {
      dateRangeToUse = getDateRange(periodTypeValue);
    } else {
      // For Custom, keep existing dates from URL or use today
      const startDateFromUrl = searchParams?.get("startDate");
      const endDateFromUrl = searchParams?.get("endDate");
      if (startDateFromUrl && endDateFromUrl) {
        dateRangeToUse = { startDate: startDateFromUrl, endDate: endDateFromUrl };
      } else {
        dateRangeToUse = getDateRange("This Month");
      }
    }

    // Update URL query parameters (only startDate and endDate, no periodType)
    if (searchParams && router && pathname) {
      const newParams = new URLSearchParams(searchParams.toString());
      // Remove periodType if it exists
      newParams.delete("periodType");
      newParams.set("startDate", dateRangeToUse.startDate);
      newParams.set("endDate", dateRangeToUse.endDate);
      router.push(`${pathname}?${newParams.toString()}`);
    }
  };

  const handleCustomDateRangeApply = (customStartDate: string, customEndDate: string) => {
    setSelectedTimeFilter("Custom");
    setTimeFilters((prev) =>
      prev.map((f) => ({
        ...f,
        isActive: f.value === "Custom",
      })),
    );
    if (searchParams && router && pathname) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("periodType");
      newParams.set("startDate", customStartDate);
      newParams.set("endDate", customEndDate);
      router.push(`${pathname}?${newParams.toString()}`);
    }
  };

  const statusStyles: Record<string, string> = {
    present: "capitalize bg-[#E6FFF3] text-[#0A8A4C]",
    absent: "capitalize bg-[#FFE6E6] text-[#C74444]",
    late: "capitalize bg-[#FFF6DD] text-[#A88400]",
  };

  const IconTrigger = React.forwardRef<
    HTMLButtonElement,
    { onClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void }
  >((props, ref) => (
    <IconButton ref={ref} onClick={props.onClick} size="small">
      <EllipsesIcon className="rotate-180 text-xs!" />
    </IconButton>
  ));
  IconTrigger.displayName = "IconTrigger";

  const resetAttendanceFilters = () => {
    handleTimeFilterChange("This Month");
    handleGradeFilterChange("All Classrooms");
  };

  async function downloadReport() {
    setIsDownloading(true);
    const getAttendanceReportDownload = analyticsServices.getAttendanceReportDownload;
    try {
      await client.request({
        ...getAttendanceReportDownload,
        data: {
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
          periodType: currentPeriodType || "weekly",
        },
        options: {
          isDownload: true,
          isPdf: true,
          fileName: `attendance-report-${startDate ? startDate : "start"}-to-${endDate ? endDate : "end"}.pdf`,
        },
      });
      showToast({
        severity: "success",
        message: "Report downloaded successfully",
      });
    } catch (error: any) {
      showToast({
        severity: "error",
        message: error.message || "Failed to download report",
      });
    }
    setIsDownloading(false);
  }

  return {
    currentPage,
    handlePageChange,
    gradeFilters,
    timeFilters,
    reportFilters,
    selectedGradeFilter,
    setSelectedGradeFilter,
    selectedReportFilter,
    setSelectedReportFilter,
    handleGradeFilterChange,
    selectedTimeFilter,
    setSelectedTimeFilter,
    handleTimeFilterChange,
    handleCustomDateRangeApply,
    handleOpenGradeFilter,
    handleReportFilterChange,
    handleOpenTimeFilter,
    handleOpenReportFilter,
    gradeAnchorEl,
    ReportAnchorEl,
    setReportAnchorEl,
    setGradeAnchorEl,
    handleOpenDepositStatusFilter,
    setTimeAnchorEl,
    TimeAnchorEl,
    rowsPerPage,
    statusStyles,
    reportOptions,
    IconTrigger,
    // Staff-specific values
    selectedClassroomId, // null when "All Classrooms" is selected, or specific classroom ID
    staffId, // Staff ID for staff role, null for admin
    fetchMoreRooms, // call when classroom dropdown scrolls to bottom
    hasMoreRooms, // admin classroom list pagination
    // Date range values
    startDate, // Start date in YYYY-MM-DD format
    endDate, // End date in YYYY-MM-DD format
    periodType: currentPeriodType, // Current periodType value (for internal use, not sent to API)
    depositStatus,
    setDepositStatus,
    depositStatusAnchorEl,
    setDepositStatusAnchorEl,
    attendanceStatusAnchorEl,
    setAttendanceStatusAnchorEl,
    handleOpenAttendanceStatusFilter,
    attendanceStatus,
    setAttendanceStatus,
    downloadReport,
    isDownloading,
    mobileTimeFilterAnchorRef,
    mobileGradeFilterAnchorRef,
    openTimeFilterMobile,
    openGradeFilterMobile,
    resetAttendanceFilters,
  };
}
