/* eslint-disable @typescript-eslint/no-explicit-any */
import { AttendanceServices, AttendanceDynamicEndpoints } from "@/services/attendance.service"
import { useQueryService } from "@/utils/hooks/useQueryService"
import { useParams, useSearchParams } from "next/navigation"
import { useMutationService } from "@/utils/hooks/useMutationService";
import { showToast } from "@/modules/shared/component/Toast";
import { getDateRangeByPeriodType } from "@/utils/helpers";

export function useChildAttendance() {
  const { id } = useParams() as { id: string }
  const searchParams = useSearchParams();
  
  // Get dates from URL
  const startDateFromUrl = searchParams?.get("startDate");
  const endDateFromUrl = searchParams?.get("endDate");
  
  // Calculate date range if not in URL, default to Today
  const dateRange = startDateFromUrl && endDateFromUrl 
    ? { startDate: startDateFromUrl, endDate: endDateFromUrl }
    : getDateRangeByPeriodType("Today");
  
  const { startDate, endDate } = dateRange;

  const { data, isLoading, refetch } = useQueryService<any, any>({
    service: {
      ...AttendanceServices.getChildAttendanceSummary,
      data: { 
        studentId: id,
        // Include date range when available
        ...(startDate && endDate ? { 
          startDate, 
          endDate
        } : {}),
      }
    }
  })

  // Mutation for deleting child attendance
  const { mutate: deleteChildAttendance } = useMutationService<{ id: number | string }>({
    service: (variables) => AttendanceDynamicEndpoints.deleteChildAttendance(variables.id),
    options: {
      onSuccess: () => {
        showToast({
          message: "Success",
          description: "Attendance record deleted successfully",
          severity: "success",
        });
        refetch();
      },
      onError: (error: any) => {
        showToast({
          message: "Error",
          description: error?.message || "Failed to delete attendance record",
          severity: "error",
        });
      }
    }
  });

  const handleDelete = (id: number | string) => {
    deleteChildAttendance({ id });
  }



  return {
    data,
    isLoading,
    handleDelete
  }
}