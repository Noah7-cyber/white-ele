/**
 * Lightweight hook to read report filter params from the URL.
 * Used by sub-pages so they do NOT trigger router.push on mount.
 * All filter state management lives in the ReportsLayout.
 */
import { useSearchParams } from "next/navigation";
import { getDateRange } from "@/utils/helpers";

export function useReportParams() {
  const searchParams = useSearchParams();

  const startDateFromUrl = searchParams?.get("startDate");
  const endDateFromUrl = searchParams?.get("endDate");
  const classroomIdFromUrl = searchParams?.get("classroomId");
  const attendanceStatus = searchParams?.get("attendanceStatus") || "";
  const depositStatus = searchParams?.get("depositStatus") || "";

  const { startDate, endDate } =
    startDateFromUrl && endDateFromUrl
      ? { startDate: startDateFromUrl, endDate: endDateFromUrl }
      : getDateRange("This Month");

  const classroomId = classroomIdFromUrl ? Number(classroomIdFromUrl) : null;

  return {
    startDate,
    endDate,
    classroomId,
    attendanceStatus,
    depositStatus,
  };
}
