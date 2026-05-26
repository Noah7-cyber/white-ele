/* eslint-disable @typescript-eslint/no-explicit-any */
import { AttendanceDynamicEndpoints } from "@/services/attendance.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import TableActionMenu from "@/modules/shared/component/TableActionMenu/tableActionMenu";
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
import { ChangeEvent, useState } from "react";
import { useUser } from "@/utils/hooks/useUser";
import { CircularProgress } from "@mui/material";

export interface AdminBaseRow {
  id: number;
  date: string;
  status: string;
  timeIn: string;
  timeOut: string;
  notes: string | null;
  adminId: number;
  recordedBy: number | null;
  createdAt: string;
  updatedAt: string;
  admin: {
    id: number;
    userId: number;
    role: string;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      profile?: {
        photo: string | null;
      } | null;
    };
  };
}

export function useAdminAttendance() {
  const { startDate, endDate } = useAttendanceContext();
  const { debouncedSearch, setSearch } = useDebouncer();
  const { user } = useUser();
  const schoolId = user?.schoolId;
  const [attendanceId, setAttendanceId] = useState<number | string>("");

  const { filters, applyFilters } = useFilter({
    search: "",
    delta: ITEMS_PER_PAGE,
    pos: 0,
    status: "",
  });

  const {
    data: { attendances = [], pagination = null } = {} as any,
    isLoading,
    refetch,
  } = useQueryService({
    service: {
      ...AttendanceDynamicEndpoints.getAdminAttendanceList(''),
      data: {
        ...(filters?.search ? { search: filters?.search } : {}),
        ...(filters?.delta ? { delta: filters?.delta } : {}),
        ...(filters?.pos ? { pos: filters?.pos } : {}),
        ...(filters?.status ? { status: filters?.status } : {}),
        ...(startDate && endDate
          ? {
            startDate,
            endDate,
          }
          : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      },
    },
    options: {
      enabled: !!schoolId,
    },
  });

  // Mutation for deleting admin attendance
  const { mutate: deleteAdminAttendance, isPending: isDeleting } = useMutationService<{ id: number | string }>({
    service: (variables) => AttendanceDynamicEndpoints.deleteAdminAttendance(variables.id),
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
    setAttendanceId(id);
    deleteAdminAttendance({ id });
  };

  const statusStyles: Record<string, string> = {
    present: "bg-[#E6FFF3] text-[#0A8A4C]",
    absent: "bg-[#FFE6E6] text-[#C74444]",
    late: "bg-[#FFF6DD] text-[#A88400]",
    excused: "bg-blue-100 text-blue-600",
    leave: "bg-purple-100 text-purple-600",
  };

  const StatusPill = ({ status }: { status: string }) => {
    const normalizedStatus = status.toLowerCase();
    return (
      <span className={`px-3 py-1 rounded-full text-xs ${statusStyles[normalizedStatus] || "bg-gray-100 text-gray-600"}`}>
        {capitalizeFirstLetter(status)}
      </span>
    );
  };

  const attendancesTableData = (data: AdminBaseRow[]) =>
    data.map((t) => {
      const row: any = {};

      row["Name"] = t?.admin?.user
        ? `${t?.admin?.user?.firstName || ""} ${t?.admin?.user?.lastName || ""}`
        : "-";
      row["Date"] = simpleDateFormatter(t.date);

      row["Time In"] = timeFormatter(t?.timeIn);
      row["Time Out"] = timeFormatter(t?.timeOut);
      row["Hours Worked"] =
        t?.timeIn && t?.timeOut ? formatHoursWorked(getHoursWorked(t.timeIn, t.timeOut)) : "-";

      row["Reason/Note"] = t?.notes ?? "-";
      row["Status"] = <StatusPill status={t?.status ?? "-"} />;

      row["Action"] = isDeleting && t.id === attendanceId ? (
        <CircularProgress size={20} />
      ) : (
        <TableActionMenu t={t} type="admin" options={{ isAdmin: true }} onDelete={handleDelete} />
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
    isDeleting,
    attendanceId,
    attendances,
    attendancesTableData: attendancesTableData(attendances),
    pagination,
    currentPage,
    filters,
    applyFilters,
    handleSearch,
  };
}
