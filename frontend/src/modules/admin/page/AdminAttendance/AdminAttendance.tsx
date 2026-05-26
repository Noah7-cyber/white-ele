"use client";
import {
  getHeaders,
  capitalizeFirstLetter,
  simpleDateFormatter,
  timeFormatter,
} from "@/utils/helpers";
import { Box } from "@mui/material";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import { useAdminAttendance, type AdminBaseRow } from "./hooks/useAdminAttendance";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import { useEffect, useState } from "react";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer/MobileFilterDrawer";
import { useAttendanceContext } from "@/layout/Shared/attendanceLayout";
import { AttendanceMobileFilterFields } from "@/modules/shared/component/AttendanceMobileFilterFields/AttendanceMobileFilterFields";
import { usePathname } from "next/navigation";

export const AdminAttendance = () => {
  const {
    openTimeFilterMobile,
    selectedTimeFilter,
    selectedGradeFilter,
    handleTimeFilterChange,
    handleGradeFilterChange,
    resetAttendanceFilters,
  } = useAttendanceContext();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [pendingTime, setPendingTime] = useState(selectedTimeFilter);
  const [pendingGrade, setPendingGrade] = useState(selectedGradeFilter);

  useEffect(() => {
    if (!mobileFilterOpen) return;
    setPendingTime(selectedTimeFilter);
    setPendingGrade(selectedGradeFilter);
  }, [mobileFilterOpen, selectedTimeFilter, selectedGradeFilter]);

  const pathname = usePathname();
  const attendanceBase = pathname?.includes("/staff") ? "/staff/attendance" : "/admin/attendance";

  const {
    isLoading,
    attendances,
    attendancesTableData,
    pagination,
    currentPage,
    filters,
    applyFilters,
    handleSearch,
  } = useAdminAttendance();
  const headers = getHeaders("admin");

  return (
    <Box>
      <div className="flex flex-col flex-1 gap-4 md:gap-6">
        <Box className="w-full flex items-center justify-between gap-4">
          <SearchTextfield
            onChange={handleSearch}
            placeholder="Search admins by name..."
            isRounded={true}
            fullWidth={true}
            className="max-w-full md:w-96 md:max-w-112.5 bg-white rounded-full"
            endIcon={
              <button
                type="button"
                className="md:hidden p-1"
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Open filters"
              >
                <FilterIcon className="text-gray-500" />
              </button>
            }
          />
        </Box>

        <div className="md:hidden flex flex-col gap-3">
          {(attendances ?? []).map((row: AdminBaseRow) => {
            const first = row?.admin?.user?.firstName ?? "";
            const last = row?.admin?.user?.lastName ?? "";
            const name = `${first} ${last}`.trim() || "—";
            const status = capitalizeFirstLetter(row?.status ?? "—");
            
            const statusLower = (row?.status || "").toLowerCase();
            const pill =
              statusLower === "present"
                ? "bg-[#E6FFF3] text-[#0A8A4C]"
                : statusLower === "late"
                  ? "bg-[#FFF6DD] text-[#A88400]"
                  : statusLower === "absent"
                    ? "bg-[#FFE6E6] text-[#C74444]"
                    : "bg-gray-100 text-gray-600";
            
            return (
              <div
                key={row.id}
                className="block bg-white rounded-xl border border-[#E4E7EC] shadow-sm px-4 py-3 active:opacity-90"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-semibold text-[#022F2F] text-sm truncate">{name}</span>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${pill}`}
                  >
                    {status}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-gray-400">
                  {simpleDateFormatter(row.date)} · In {timeFormatter(row.timeIn)}
                </div>
              </div>
            );
          })}
        </div>

        <Box className="mt-2 hidden md:block">
          <Table
            isLoading={isLoading}
            headers={headers}
            tableData={attendancesTableData}
            tableClassName="text-sm"
            centeredHeaderIndex={[1, 2, 3, 4, 5, 6]}
          />
        </Box>

        <Box className="pb-10 flex justify-between items-center">
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={filters?.delta}
            totalItems={pagination?.count}
            onPageChange={(event) => {
              applyFilters({
                pos: (event?.page - 1) * event?.rowsPerPage,
                delta: event?.rowsPerPage,
              });
            }}
          />
        </Box>

        <MobileFilterDrawer
          open={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          onApply={() => {
            if (pendingTime !== selectedTimeFilter) handleTimeFilterChange(pendingTime);
            if (pendingGrade !== selectedGradeFilter) handleGradeFilterChange(pendingGrade);
            setMobileFilterOpen(false);
            if (pendingTime === "Custom") {
              setTimeout(() => openTimeFilterMobile(), 0);
            }
          }}
          onReset={() => {
            resetAttendanceFilters();
            setMobileFilterOpen(false);
          }}
        >
          <AttendanceMobileFilterFields
            pendingTime={pendingTime}
            setPendingTime={setPendingTime}
            pendingGrade={pendingGrade}
            setPendingGrade={setPendingGrade}
            showGradeFilter={false} // No grade filter for admins
            onTapCustomDates={() => {
              setMobileFilterOpen(false);
              handleTimeFilterChange("Custom");
              setTimeout(() => openTimeFilterMobile(), 0);
            }}
          />
        </MobileFilterDrawer>
      </div>
    </Box>
  );
};