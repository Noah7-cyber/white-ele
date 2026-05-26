"use client";
import React, { createContext, useContext } from "react";
import { Typography, Box } from "@mui/material";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import ExpandMoreIcon from "@/modules/shared/assets/svgs/downIcon.svg";
import DownloadIcon from "@/modules/shared/assets/svgs/download-icon.svg";
import { Button } from "@/modules/shared/component/Button";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import useAttendance from "@/modules/shared/component/AttendanceComponent/hook/useAttendance";
import FilterPopover from "@/modules/shared/component/FilterPopover/filterPopover";
import TimeRangeFilterPopover from "@/modules/shared/component/FilterPopover/timeRangeFilterPopover";
import ScrollableTabBar from "./ScrollableTabBar";
import { shouldHideMobileDashboardHeader } from "@/utils/dashboardMobileHeader";

type TimeFilterRow = { label: string; value: string; isActive?: boolean };
type GradeFilterRow = {
  label: string;
  value: string;
  isActive?: boolean;
  classroomId?: number;
};

interface AttendanceContextValue {
  staffId: number | null;
  selectedClassroomId: number | null;
  startDate: string;
  endDate: string;
  periodType: string;
  selectedReportFilter: string;
  selectedTimeFilter: string;
  selectedGradeFilter: string;
  timeFilters: TimeFilterRow[];
  gradeFilters: GradeFilterRow[];
  handleTimeFilterChange: (value: string) => void;
  handleGradeFilterChange: (value: string) => void;
  resetAttendanceFilters: () => void;
  openTimeFilterMobile: () => void;
  openGradeFilterMobile: () => void;
  /** Admin: load next page of classrooms when scrolling the class filter. Staff: no-op / false. */
  fetchMoreGradeClassrooms: () => Promise<void>;
  gradeClassroomHasMore: boolean;
}

const AttendanceContext = createContext<AttendanceContextValue>({
  staffId: null,
  selectedClassroomId: null,
  startDate: "",
  endDate: "",
  periodType: "This Month",
  selectedReportFilter: "",
  selectedTimeFilter: "",
  selectedGradeFilter: "",
  timeFilters: [],
  gradeFilters: [],
  handleTimeFilterChange: () => { },
  handleGradeFilterChange: () => { },
  resetAttendanceFilters: () => { },
  openTimeFilterMobile: () => { },
  openGradeFilterMobile: () => { },
  fetchMoreGradeClassrooms: async () => { },
  gradeClassroomHasMore: false,
});

export const useAttendanceContext = () => useContext(AttendanceContext);

interface AttendanceLayoutProps {
  children?: React.ReactNode;
  role: "admin" | "staff";
}

export const AttendanceLayout: React.FC<AttendanceLayoutProps> = ({ role, children }) => {
  const pathname = usePathname();
  const { id } = useParams();

  const {
    gradeAnchorEl,
    setGradeAnchorEl,
    setTimeAnchorEl,
    ReportAnchorEl,
    setReportAnchorEl,
    TimeAnchorEl,
    gradeFilters,
    timeFilters,
    reportFilters,
    selectedGradeFilter,
    selectedReportFilter,
    selectedTimeFilter,
    handleOpenReportFilter,
    setSelectedReportFilter,
    setSelectedTimeFilter,
    setSelectedGradeFilter,
    handleTimeFilterChange,
    handleCustomDateRangeApply,
    handleGradeFilterChange,
    handleReportFilterChange,
    handleOpenGradeFilter,
    handleOpenTimeFilter,
    selectedClassroomId,
    staffId,
    startDate,
    endDate,
    periodType,
    fetchMoreRooms,
    downloadReport,
    isDownloading,
    mobileTimeFilterAnchorRef,
    mobileGradeFilterAnchorRef,
    openTimeFilterMobile,
    openGradeFilterMobile,
    resetAttendanceFilters,
    hasMoreRooms,
  } = useAttendance(role);

  const isReports = pathname?.includes("/attendance/reports");
  const isChildren = pathname?.includes("/attendance/children");
  const isTeacher = pathname?.includes("/admin/attendance/teachers");
  const isAdminAttendance = pathname?.includes("/admin/attendance/admins");

  const tabs =
    role === "admin"
      ? [
        { href: "/admin/attendance/children", label: "Children" },
        { href: DashboardRoutes.teachersAttendance, label: "Teachers" },
        { href: DashboardRoutes.adminAttendance, label: "Admins" },
        { href: "/admin/attendance/reports", label: "Reports" },
      ]
      : [
        { href: "/staff/attendance/children", label: "Children" },
        { href: "/staff/attendance/reports", label: "Reports" },
      ];
  const edgeToEdgeMobile = Boolean(id) && shouldHideMobileDashboardHeader(pathname);

  return (
    <AttendanceContext.Provider
      value={{
        staffId: staffId ?? null,
        selectedClassroomId: selectedClassroomId ?? null,
        startDate,
        endDate,
        periodType,
        selectedReportFilter,
        selectedTimeFilter,
        selectedGradeFilter,
        timeFilters,
        gradeFilters,
        handleTimeFilterChange,
        handleGradeFilterChange,
        resetAttendanceFilters,
        openTimeFilterMobile,
        openGradeFilterMobile,
        fetchMoreGradeClassrooms:
          role === "staff" ? async () => { } : async () => {
            await fetchMoreRooms();
          },
        gradeClassroomHasMore: role === "staff" ? false : Boolean(hasMoreRooms),
      }}
    >
      <button
        type="button"
        ref={mobileTimeFilterAnchorRef}
        tabIndex={-1}
        aria-hidden
        className="fixed w-px h-px opacity-0 pointer-events-none bottom-8 left-1/2 -translate-x-1/2"
      />
      <button
        type="button"
        ref={mobileGradeFilterAnchorRef}
        tabIndex={-1}
        aria-hidden
        className="fixed w-px h-px opacity-0 pointer-events-none bottom-8 left-1/2 -translate-x-1/2"
      />
      <Box
        className={
          edgeToEdgeMobile
            ? "flex flex-col min-h-0 h-[100dvh] max-h-[100dvh] md:h-auto md:max-h-none md:min-h-0 px-4 py-3 md:p-5 space-y-4 md:space-y-6 bg-[#F5F7F9] md:bg-transparent"
            : "h-full p-5 space-y-6"
        }
      >
        {/* Header with dynamic right-side controls */}
        {!id && (
          <Box className="hidden md:flex items-center justify-between">
            <Typography className="text-xl! font-semibold!">Attendance</Typography>

            <Box className="hidden md:flex items-center gap-3">
              {isReports && (
                <>
                  {" "}
                  <button
                    onClick={handleOpenTimeFilter}
                    className="flex items-center p-2 justify-around gap-2 h-10 w-24 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
                  >
                    <span className="text-sm font-medium whitespace-nowrap">
                      {selectedTimeFilter}
                    </span>
                    <ExpandMoreIcon className="" />
                  </button>
                  {role === "admin" && (
                    <button
                      onClick={handleOpenReportFilter}
                      className="flex items-center justify-around gap-2 h-10 w-32 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
                    >
                      <span className="text-sm font-medium">{selectedReportFilter}</span>
                      <ExpandMoreIcon className="" />
                    </button>
                  )}
                  <Button
                    className="rounded-lg!"
                    startIcon={<DownloadIcon />}
                    onClick={downloadReport}
                    loading={isDownloading}
                  >
                    Download Report (PDF)
                  </Button>
                </>
              )}

              {/* children */}
              {role === "admin" && isChildren && (
                <>
                  {" "}
                  <button
                    onClick={handleOpenTimeFilter}
                    className="flex items-center p-2 justify-around gap-2 h-10 w-24 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
                  >
                    <span className="text-sm font-medium whitespace-nowrap">
                      {selectedTimeFilter}
                    </span>
                    <ExpandMoreIcon className="" />
                  </button>
                  <button
                    onClick={handleOpenGradeFilter}
                    className="flex items-center justify-around gap-2 h-10 w-36 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
                  >
                    <span className="text-sm font-medium">{selectedGradeFilter}</span>
                    <ExpandMoreIcon className="" />
                  </button>
                </>
              )}
              {(isTeacher || isAdminAttendance) && (
                <>
                  {" "}
                  <button
                    onClick={handleOpenTimeFilter}
                    className="flex items-center p-2 justify-around gap-2 h-10 w-24 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
                  >
                    <span className="text-sm font-medium whitespace-nowrap">
                      {selectedTimeFilter}
                    </span>
                    <ExpandMoreIcon className="" />
                  </button>
                  {isTeacher && (
                    <button
                      onClick={handleOpenGradeFilter}
                      className="flex items-center justify-around gap-2 h-10 w-36 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
                    >
                      <span className="text-sm font-medium">{selectedGradeFilter}</span>
                      <ExpandMoreIcon className="" />
                    </button>
                  )}
                </>
              )}
            </Box>
          </Box>
        )}
        <FilterPopover
          open={Boolean(gradeAnchorEl)}
          anchorEl={gradeAnchorEl}
          onClose={() => setGradeAnchorEl(null)}
          options={gradeFilters}
          onSelect={(value) => {
            setSelectedGradeFilter(value);
            handleGradeFilterChange(value);
          }}
          onScrollEnd={fetchMoreRooms}
          width={150}
        />

        <FilterPopover
          open={Boolean(ReportAnchorEl)}
          anchorEl={ReportAnchorEl}
          onClose={() => setReportAnchorEl(null)}
          options={reportFilters}
          onSelect={(value) => {
            setSelectedReportFilter(value);
            handleReportFilterChange(value);
          }}
          width={130}
        />
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

        {/* Tabs */}
        {!id && (
          <ScrollableTabBar className="!border-b !border-border-lighten">
            {tabs.map((tab) => {
              const active = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`shrink-0 whitespace-nowrap !text-sm !font-normal pb-2 px-3 ${active
                      ? " !font-medium !border-b !border-brandColor-active !text-brandColor-active"
                      : "text-[#475467]"
                    }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </ScrollableTabBar>
        )}

        {children}
      </Box>
    </AttendanceContext.Provider>
  );
};

export default AttendanceLayout;
