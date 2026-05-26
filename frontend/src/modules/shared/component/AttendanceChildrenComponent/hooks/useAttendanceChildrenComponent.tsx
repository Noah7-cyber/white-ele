/* eslint-disable @typescript-eslint/no-explicit-any */
import { AttendanceDynamicEndpoints, AttendanceServices } from "@/services/attendance.service";
import { capitalizeFirstLetter } from "@/utils/helpers";
import { useQueryService } from "@/utils/hooks/useQueryService";
import TableActionMenu from "../../TableActionMenu/tableActionMenu";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { showToast } from "@/modules/shared/component/Toast";
import { simpleDateFormatter, timeFormatter } from "@/utils/helpers";
import { useAttendanceContext } from "@/layout/Shared/attendanceLayout";
import { useDebouncer } from "@/utils/hooks/useDebouncer";
import { ChangeEvent } from "react";

export interface BaseRow {
  id: number;
  date: string;
  status: string;
  timeIn: string;
  timeOut: string;
  notes: string | null;
  recordedBy: number | null;
  classroomId: number | null;
  studentId: number | null;
  teacherId: number | null;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  teacher: any | null;
  studentName: string | null;
  /** Present on children attendance list responses */
  classroomName?: string | null;
  parentName: string | null;
  admissionNumber: number | null;
  dateOfBirth: string | null;
}
interface UseAttendanceChildrenComponentOptions {
  overrideClassroomId?: number | null;
}

export function useAttendanceChildrenComponent(options?: UseAttendanceChildrenComponentOptions) {
  const { staffId, selectedClassroomId: contextClassroomId, startDate, endDate } = useAttendanceContext();
  // If an override classroom ID is provided (from component-level filter), use it instead of context
  const selectedClassroomId =
    options?.overrideClassroomId !== undefined ? options.overrideClassroomId : contextClassroomId;

  const { filters, applyFilters } = useFilter({
    search: "",
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });
  const { debouncedSearch, setSearch } = useDebouncer();

  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
  };

  const {
    data: { attendances = [], pagination = {} } = {} as any,
    isLoading,
    refetch,
  } = useQueryService({
    service: {
      ...AttendanceServices.getChildrenAttendance,
      data: {
        ...(filters?.search ? { search: filters?.search } : {}),
        ...(filters?.delta ? { delta: filters?.delta } : {}),
        ...(filters?.pos ? { pos: filters?.pos } : {}),
        ...(staffId ? { teacherId: staffId } : {}),
        ...(selectedClassroomId ? { classroomId: selectedClassroomId } : {}),
        // Include date range when available
        ...(startDate && endDate
          ? {
              startDate,
              endDate,
            }
          : {}),
        ...(debouncedSearch ? {search: debouncedSearch} : {}),
      },
    },
  });
  

  // Mutation for deleting child attendance
  const { mutate: deleteChildAttendance } = useMutationService<{ id: number }>({
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
      },
    },
  });

  const handleDelete = (id: number) => {
    deleteChildAttendance({ id });
  };

  const statusStyles: Record<string, string> = {
    Present: "bg-[#E6FFF3] text-[#0A8A4C]",
    Absent: "bg-[#FFE6E6] text-[#C74444]",
    Late: "bg-[#FFF6DD] text-[#A88400]",
  };

  const StatusPill = ({ status }: { status: string }) => (
    <span className={`px-3 py-1 rounded-full text-xs ${statusStyles[status] || ""}`}>
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
        row["Child Name"] = t?.studentName ?? "-";
        row["Date"] = simpleDateFormatter((t as any).date);
      }

      row["Time In"] = timeFormatter(t?.timeIn);
      row["Time Out"] = timeFormatter(t?.timeOut || "Not Clocked Out");
      row["Reason/Note"] = t?.notes ?? "N/A";
      row["Status"] = <StatusPill status={capitalizeFirstLetter(t?.status ?? "-")} />;

      row["Action"] = (
        <TableActionMenu t={t} type={type} options={options} onDelete={handleDelete} />
      );

      return row;
    });

  const currentPage =
    Math.floor((pagination?.pos || 0) / (pagination?.delta || ITEMS_PER_PAGE)) + 1;

  return {
    isLoading,
    attendances,
    attendancesTableData: attendancesTableData(attendances, { isChild: true }),
    currentPage,
    pagination,
    filters,
    applyFilters,
    handleSearch,
  };
}
