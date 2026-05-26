/* eslint-disable @typescript-eslint/no-explicit-any */
import { AttendanceDynamicEndpoints, AttendanceServices, TeacherAttendanceSummaryResponse } from "@/services/attendance.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useParams, useSearchParams } from "next/navigation";
import TableActionMenu from "../../TableActionMenu/tableActionMenu";
import { JSX } from "react";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { showToast } from "../../Toast";
import { getDateRangeByPeriodType } from "@/utils/helpers";

export type BaseRow = {
  id: 1;
  name: string;
  timeIn: string;
  timeOut: string;
  worked: string;
  reason: string;
  parentName: string;
  admissionNumber: string;
  dateOfBirth: string;
  studentName: string;
  status: JSX.Element;
  action: JSX.Element;
};

export function useTeacherAttendance() {
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  
  // Get dates from URL
  const startDateFromUrl = searchParams?.get("startDate");
  const endDateFromUrl = searchParams?.get("endDate");
  
  // Calculate date range if not in URL, default to Today
  const dateRange = startDateFromUrl && endDateFromUrl 
    ? { startDate: startDateFromUrl, endDate: endDateFromUrl }
    : getDateRangeByPeriodType("Today");
  
  const { startDate, endDate } = dateRange;
  
  const { data: teacherAttendance } = useQueryService({
    service: AttendanceDynamicEndpoints.getTeacherAttendanceById(id),
  });
  const { data: teacherAttendanceSummary, isLoading, refetch } = useQueryService<any, TeacherAttendanceSummaryResponse>({
    service: { 
      ...AttendanceServices.getStaffAttendanceSummary, 
      data: { 
        teacherId: id,
        // Include date range when available
        ...(startDate && endDate ? { 
          startDate, 
          endDate
        } : {}),
      } 
    }
  });

  // Mutation for deleting teacher attendance
  const { mutate: deleteTeacherAttendance } = useMutationService<{ id: number | string }>({
    service: (variables) => AttendanceDynamicEndpoints.deleteTeacherAttendance(variables.id),
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
    deleteTeacherAttendance({ id });
  }

  return {
    isLoading,
    teacherAttendance,
    teacherAttendanceSummary,
    handleDelete
  };
}
