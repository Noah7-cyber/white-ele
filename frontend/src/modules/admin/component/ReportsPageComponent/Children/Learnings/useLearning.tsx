/* eslint-disable @typescript-eslint/no-explicit-any */
import { AttendanceServices } from "@/services/attendance.service";
import { capitalizeFirstLetter, dateFormatter, formatHoursWorked } from "@/utils/helpers";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";
import { analyticsServices } from "@/services/analytics.service";
import { CashViewer } from "@/modules/shared/component/CashViewer";

interface SummaryRow {
  studentName: string;
  totalPresentHours: number;
  totalAbsentHours: number;
  [key: string]: any;
}
const getStatusBadge = (status: string) => {
  const baseStyle = "px-3 py-1 rounded-full text-xs font-medium inline-block w-26 text-center";
  switch (status) {
    case "Paid":
      return <span className={`${baseStyle} bg-green-100 text-green-700`}>{status}</span>;
    case "Overdue":
      return <span className={`${baseStyle} bg-red-100 text-red-700`}>{status}</span>;
    case "Partially paid":
      return (
        <span className={` ${baseStyle} bg-yellow-100 text-yellow-700 whitespace-nowrap`}>
          {status}
        </span>
      );
    default:
      return <span className={`${baseStyle} bg-gray-100 text-gray-700`}>{status}</span>;
  }
};

export function useLearning(classroomId?: number | null, startDate?: string, endDate?: string) {
  const { filters, applyFilters } = useFilter({
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });

  // Re-using student summary endpoint if appropriate, or check if there's a specific report endpoint
  const { data: response = {} as any, isLoading } = useQueryService({
    service: {
      ...analyticsServices.getStudentReport,
      data: {
        type: "learning",
        ...(filters?.delta ? { delta: filters?.delta } : {}),
        ...(filters?.pos ? { pos: filters?.pos } : {}),
        ...(classroomId ? { classroomId } : {}),
        ...(startDate && endDate ? { startDate, endDate } : {}),
      },
    },
    options: {
      keys: ["attendance-hours", classroomId, startDate, endDate, filters.pos, filters.delta],
    },
  });

  // Handle both response structures: { data: [], pagination: {} } or just { data: [] }
  const summaryData = response?.data || [];
  const pagination = response?.pagination || {
    pos: filters?.pos || 0,
    delta: filters?.delta || ITEMS_PER_PAGE,
    count: summaryData.length,
  };

  const tableData = summaryData.map((item: SummaryRow) => ({
    name: item?.childrenName,
    classroomName: item?.classroomName,
    performancePercentage: item?.performancePercentage || "N/A",
    lastAssessmentDate: dateFormatter(item?.lastAssessmentDate),
    lastObservationSummary: item?.lastObservationSummary || "N/A"
  }));
  const currentPage =
    Math.floor((pagination?.pos || 0) / (pagination?.delta || ITEMS_PER_PAGE)) + 1;

  return {
    isLoading,
    tableData,
    currentPage,
    pagination,
    filters,
    applyFilters,
  };
}
