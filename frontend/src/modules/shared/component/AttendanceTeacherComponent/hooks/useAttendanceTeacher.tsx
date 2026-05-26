/* eslint-disable @typescript-eslint/no-explicit-any */
import { AttendanceDynamicEndpoints, AttendanceServices } from "@/services/attendance.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import TableActionMenu from "../../TableActionMenu/tableActionMenu";
import {
  capitalizeFirstLetter,
  getHoursWorked,
  simpleDateFormatter,
  timeFormatter,
  formatHoursWorked,
} from "@/utils/helpers";
import { ITEMS_PER_PAGE } from "@/constants";
import { useFilter } from "@/utils/hooks/useFilter";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { showToast } from "@/modules/shared/component/Toast";
import { useAttendanceContext } from "@/layout/Shared/attendanceLayout";
import { useDebouncer } from "@/utils/hooks/useDebouncer";
import { ChangeEvent } from "react";

export interface BaseRow {
  id: number;
  date: string;
  status: string;
  timeIn: string;
  timeOut: string;
  reason: string | null;
  recordedBy: number | null;
  classroomId: number | null;
  studentId: number | null;
  teacherId: number | null;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  teacher: any | null;
  notes: string | null;
  studentName: string | null;
  parentName: string | null;
  admissionNumber: number | null;
  dateOfBirth: string | null;
}

export function useAttendanceTeacher() {
  const { selectedClassroomId, startDate, endDate } = useAttendanceContext();
  const { debouncedSearch, setSearch } = useDebouncer();

  const { filters, applyFilters } = useFilter({
    search: "",
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });

  const {
    data: { attendances = [], pagination = null } = {} as any,
    isLoading,
    refetch,
  } = useQueryService({
    service: {
      ...AttendanceServices.getStaffAttendance,
      data: {
        ...(filters?.search ? { search: filters?.search } : {}),
        ...(filters?.delta ? { delta: filters?.delta } : {}),
        ...(filters?.pos ? { pos: filters?.pos } : {}),
        // For admin: only pass classroomId when selected (no staffId)
        ...(selectedClassroomId ? { classroomId: selectedClassroomId } : {}),
        // Include date range when available
        ...(startDate && endDate
          ? {
              startDate,
              endDate,
            }
          : {}),
        ...(debouncedSearch ? {search: debouncedSearch}: {}),
      },
    },
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
      },
    },
  });

  const handleDelete = (id: number | string) => {
    deleteTeacherAttendance({ id });
  };

  const statusStyles: Record<string, string> = {
    Present: "bg-[#E6FFF3] text-[#0A8A4C]",
    Absent: "bg-[#FFE6E6] text-[#C74444]",
    Late: "bg-[#FFF6DD] text-[#A88400]",
  };

  const StatusPill = ({ status }: { status: string }) => (
    <span className={`px-3 py-1 rounded-full text-xs ${statusStyles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  const attendancesTableData = (
    data: BaseRow[],
    options?: {
      isChild?: boolean;
      isTeacher?: boolean;
      isChildDetail?: boolean;
      isTeacherDetail?: boolean;
    },
  ) =>
    data.map((t) => {
      const row: any = {};

      const type = options?.isChildDetail
        ? "childInfo"
        : options?.isTeacherDetail
          ? "teacherInfo"
          : options?.isChild
            ? "child"
            : "teacher";

      if (options?.isChildDetail || options?.isTeacherDetail) {
        row["Date"] = simpleDateFormatter((t as any).date);
      } else {
        row["Name"] = t?.teacher?.user
          ? `${t?.teacher?.user?.firstName || ""} ${t?.teacher?.user?.lastName || ""}`
          : "-";
        row["Date"] = simpleDateFormatter((t as any).date);
      }

      row["Time In"] = timeFormatter(t?.timeIn);
      row["Time Out"] = timeFormatter(t?.timeOut);
      if (!options?.isChild && !options?.isChildDetail) {
        row["Hours Worked"] =
          t?.timeIn && t?.timeOut ? formatHoursWorked(getHoursWorked(t.timeIn, t.timeOut)) : "-";
      }

      row["Reason/Note"] = t?.notes ?? "-";
      row["Status"] = <StatusPill status={capitalizeFirstLetter(t?.status ?? "-")} />;

      row["Action"] = (
        <TableActionMenu t={t} type={type} options={options} onDelete={handleDelete} />
      );

      return row;
    });

  const currentPage =
    Math.floor((pagination?.pos || 0) / (pagination?.delta || ITEMS_PER_PAGE)) + 1;

  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
  };

  return {
    isLoading,
    attendances,
    attendancesTableData: attendancesTableData(attendances, { isChild: false }),
    pagination,
    currentPage,
    filters,
    applyFilters,
    handleSearch,
  };
}
