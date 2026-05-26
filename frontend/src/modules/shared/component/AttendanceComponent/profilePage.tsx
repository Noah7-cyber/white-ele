/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { InsightCard } from "@/components/InsightCard";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import { Table } from "@/modules/shared/component/Table";
import ProfileInfoCard from "@/modules/shared/component/ProfileInfoCard/profileInfoCard";
import { useNavigation } from "@/utils/hooks/useNavigation";
import { Box } from "@mui/material";
import ExpandMoreIcon from "@/modules/shared/assets/svgs/downIcon.svg";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import useAttendance, { BaseRow } from "./hook/useAttendance";
import TimeRangeFilterPopover from "@/modules/shared/component/FilterPopover/timeRangeFilterPopover";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { IconButton } from "@mui/material";
import { DataRenderer } from "../DataRenderer";
import { AttendanceSkeleton } from "../AttendanceSkeleton";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { usePathname } from "next/navigation";
import { StaffRoutes } from "@/routes/staff.routes";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

type ProfilePageProps = {
  title?: string;
  selectedItem?: BaseRow;
  infoData: { name?: string; label?: string; value: string | number }[];
  tableHeaders?: string[];
  topCards?: ProfilePageProps["infoData"];
  tableData?: any[];
  isLoadingTableData?: boolean;
  isLoading?: boolean;
  name: string;
  status: string;
};

export default function ProfilePage({
  selectedItem,
  title,
  infoData,
  isLoadingTableData,
  isLoading,
  name,
  status,
  tableHeaders = [],
  tableData = [],
  topCards = [],
}: ProfilePageProps) {
  const navigate = useNavigation();
  const isMobile = useMediaQuery("(max-width:768px)");
  const {
    currentPage,
    handlePageChange,
    rowsPerPage,
    selectedTimeFilter,
    TimeAnchorEl,
    timeFilters,
    setSelectedTimeFilter,
    handleTimeFilterChange,
    handleCustomDateRangeApply,
    setTimeAnchorEl,
    handleOpenTimeFilter,
    startDate,
    endDate,
    statusStyles,
  } = useAttendance();
  const pathname = usePathname();
  const isChildrenProfile = pathname?.includes("/child");
  const isTeacherProfile = pathname?.includes("/teacher");
  const isAdmin = pathname?.includes("/admin/attendance");
  const isStaff = pathname?.includes("/staff/attendance");
  const displayName = selectedItem?.studentName || name;

  const handleNavigateBack = () => {
    navigate.push(
      isAdmin && isChildrenProfile
        ? DashboardRoutes.attendanceChildren
        : isAdmin && isTeacherProfile
          ? DashboardRoutes.teachersAttendance
          : isStaff && isChildrenProfile
            ? StaffRoutes.attendanceChildren
            : StaffRoutes.attendance,
    );
  };
  const statusNorm = typeof status === "string" ? status.toLowerCase() : "";
  const statusClass =
    (statusStyles as Record<string, string>)[statusNorm] ?? "capitalize bg-gray-100 text-gray-600";
  const pageRows = tableData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const statsToShow = isMobile ? (topCards ?? []).slice(0, 5) : (topCards ?? []);

  return (
    <Box
      className={`w-full flex flex-col gap-4 md:gap-6 flex-1 min-h-0 ${
        isMobile ? "min-h-[100dvh] bg-[#F5F7F9] pb-4" : "md:min-h-screen"
      }`}
    >
      <div className="flex gap-2 justify-between items-center w-full shrink-0">
        <div className="flex items-center justify-start gap-2 md:gap-4 min-w-0 flex-1">
          <IconButton
            onClick={handleNavigateBack}
            size="small"
            className="!rounded-full !bg-[#E8F6F4] !border !border-brandColor-active/20 shrink-0"
          >
            <ChevronLeftIcon className="!text-brandColor-active" fontSize="small" />
          </IconButton>
          <span className="font-semibold text-base md:text-xl text-[#022F2F] truncate">
            {displayName}
          </span>
          <span className={`hidden md:inline-flex px-3 py-1 rounded-full text-xs ${statusClass}`}>
            {status}
          </span>
        </div>
        <IconButton
          size="small"
          onClick={handleOpenTimeFilter}
          className="md:!hidden shrink-0 !rounded-lg !border !border-gray-200 !bg-white"
          aria-label="Time filter"
        >
          <FilterIcon className="text-gray-600" />
        </IconButton>
        <button
          type="button"
          onClick={handleOpenTimeFilter}
          className="hidden md:flex items-center p-2 justify-around gap-2 h-10 !w-32 text-gray-700 rounded-lg cursor-pointer border border-gray-200 bg-white"
        >
          <span className="text-sm font-medium">{selectedTimeFilter}</span>
          <ExpandMoreIcon className="" />
        </button>
      </div>

      {isMobile ? (
        <div className="flex justify-center py-0.5" aria-hidden>
          <div className="h-0.5 w-10 rounded-full bg-brandColor-active" />
        </div>
      ) : null}

      <DataRenderer isLoading={isLoading} renderLoading={<AttendanceSkeleton />}>
        {() => (
          <>
            <ProfileInfoCard title={title} data={infoData} compact={Boolean(isMobile)} />
            <Box
              className={`flex md:grid md:grid-cols-5 gap-4 overflow-x-auto md:overflow-x-visible hide-scrollbar sm:min-h-35 *:shrink-0 md:*:shrink`}
            >
              {statsToShow.map(({ name: cardName, value }, index) => (
                <div key={`${cardName}-${index}`}>
                  <InsightCard
                    name={cardName ?? ""}
                    value={value}
                    percent=""
                    className={
                      isMobile
                        ? "!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg! "
                        : "!min-w-[160px]"
                    }
                    titleClassName={isMobile ? "!text-xs !text-[#5B6B88] !font-medium" : undefined}
                    valueClassName={isMobile ? "!text-2xl !text-[#022F2F]" : undefined}
                  />
                </div>
              ))}
            </Box>
          </>
        )}
      </DataRenderer>

      <div className="flex flex-col flex-1 gap-3 min-h-0 md:bg-white md:rounded-xl md:p-4 md:border md:border-gray-100">
        <div className="relative font-semibold text-[#022F2F] text-sm md:text-base px-0.5 hidden md:block">
          Attendance logs
        </div>
        <hr className="w-full border-gray-200 hidden md:block" />
        <div className="md:hidden flex flex-col gap-3">
          {pageRows.map((row, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#E4E7EC] bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex justify-between items-start gap-2">
                <span className="font-semibold text-sm text-[#022F2F]">{row["Date"]}</span>
                {row["Action"] != null ? (
                  <span className="shrink-0 -mr-1">{row["Action"]}</span>
                ) : null}
              </div>
              <div className="flex justify-between items-center mt-3 gap-2">
                <span className="text-xs text-[#667085]">{row["Time In"]}</span>
                <span className="shrink-0">{row["Status"]}</span>
              </div>
            </div>
          ))}
        </div>
        <Box className="mt-1 hidden md:block">
          <Table
            headers={tableHeaders}
            tableData={pageRows}
            tableClassName="text-sm"
            tableContainerClassName="border border-gray-200"
            centeredHeaderIndex={[4, 5, 6]}
            isLoading={isLoadingTableData}
          />
        </Box>

        <Box className="pb-4 md:pb-10 flex justify-between items-center">
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalItems={tableData.length}
            onPageChange={handlePageChange}
          />
        </Box>
      </div>

      <TimeRangeFilterPopover
        open={Boolean(TimeAnchorEl)}
        anchorEl={TimeAnchorEl}
        onClose={() => setTimeAnchorEl(null)}
        options={timeFilters}
        onSelect={(value) => {
          setSelectedTimeFilter(value);
          handleTimeFilterChange(value);
        }}
        onCustomApply={handleCustomDateRangeApply}
        currentStartDate={startDate}
        currentEndDate={endDate}
        width={180}
      />
    </Box>
  );
}
