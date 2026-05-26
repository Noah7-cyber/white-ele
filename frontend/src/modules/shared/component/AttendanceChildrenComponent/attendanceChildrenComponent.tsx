"use client";
import { Box } from "@mui/material";
import { Table } from "../Table";
import { PaginationControls } from "../Pagination";
import {
  getHeaders,
  simpleDateFormatter,
  timeFormatter,
  capitalizeFirstLetter,
} from "@/utils/helpers";
import {
  useAttendanceChildrenComponent,
  type BaseRow,
} from "./hooks/useAttendanceChildrenComponent";
import ExpandMoreIcon from "@/modules/shared/assets/svgs/downIcon.svg";
import { SearchTextfield } from "../SearchTextfield";
import { useEffect, useState } from "react";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer/MobileFilterDrawer";
import { useAttendanceContext } from "@/layout/Shared/attendanceLayout";
import { AttendanceMobileFilterFields } from "@/modules/shared/component/AttendanceMobileFilterFields/AttendanceMobileFilterFields";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AttendanceChildrenComponentProps {
  role: "admin" | "staff";
}

export const AttendanceChildrenComponent = ({ role }: AttendanceChildrenComponentProps) => {
  const {
    openTimeFilterMobile,
    openGradeFilterMobile,
    selectedTimeFilter,
    selectedGradeFilter,
    handleTimeFilterChange,
    handleGradeFilterChange,
    resetAttendanceFilters,
  } = useAttendanceContext();

  const {
    isLoading,
    attendancesTableData,
    attendances,
    currentPage,
    pagination,
    filters,
    applyFilters,
    handleSearch,
  } = useAttendanceChildrenComponent();

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

  const childrenHeaders = getHeaders("child");

  const ageFromDob = (dob: string | null | undefined) => {
    if (!dob) return "—";
    const y = new Date().getFullYear() - new Date(dob).getFullYear();
    return Number.isFinite(y) ? `${y} years` : "—";
  };

  return (
    <Box>
      <div className="flex flex-col flex-1 gap-4 md:gap-6">
        <Box className="w-full flex items-center justify-between gap-4">
          <div className="w-full ">
            <SearchTextfield
              onChange={handleSearch}
              placeholder="Search by name, subject, etc..."
              isRounded={true}
              fullWidth
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
          </div>
          {role === "staff" && (
            <Box className="hidden md:flex items-center gap-4">
              <button
                type="button"
                onClick={openTimeFilterMobile}
                className="flex items-center p-2 justify-around gap-2 h-10 w-24 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
              >
                <span className="text-sm font-medium whitespace-nowrap">{selectedTimeFilter}</span>
                <ExpandMoreIcon className="" />
              </button>
              <button
                type="button"
                onClick={openGradeFilterMobile}
                className="flex items-center justify-around gap-2 h-10 w-36 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
              >
                <span className="text-sm font-medium">{selectedGradeFilter}</span>
                <ExpandMoreIcon className="" />
              </button>
            </Box>
          )}
        </Box>

        <div className="md:hidden flex flex-col gap-3">
          {attendances?.map((row: BaseRow) => {
            const sid = row?.studentId;
            const href = sid ? `${attendanceBase}/${sid}/child` : "#";
            const status = capitalizeFirstLetter(row?.status ?? "—");
            const pill =
              status === "Present"
                ? "bg-[#E6FFF3] text-[#0A8A4C]"
                : status === "Late"
                  ? "bg-[#FFF6DD] text-[#A88400]"
                  : status === "Absent"
                    ? "bg-[#FFE6E6] text-[#C74444]"
                    : "bg-gray-100 text-gray-600";
            return (
              <Link
                key={row.id}
                href={href}
                className="block bg-white rounded-xl border border-[#E4E7EC] shadow-sm px-4 py-3 active:opacity-90"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-semibold text-[#022F2F] text-sm truncate">
                    {row.studentName ?? "—"}
                  </span>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${pill}`}
                  >
                    {status}
                  </span>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>{ageFromDob(row.dateOfBirth)}</span>
                  <span className="truncate max-w-[50%]">{row.classroomName ?? "—"}</span>
                </div>
                <div className="mt-1 text-[11px] text-gray-400">
                  {simpleDateFormatter(row.date)} · In {timeFormatter(row.timeIn)}
                </div>
              </Link>
            );
          })}
        </div>

        <Box className="mt-2 hidden md:block">
          <Table
            isLoading={isLoading}
            headers={childrenHeaders}
            tableData={attendancesTableData}
            tableClassName="text-sm"
            centeredHeaderIndex={[1, 2, 3, 4, 5]}
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
            showGradeFilter
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
