"use client";

import { useState } from "react";
import EarningsChart from "@/components/Charts/EarningsChart/earningsChart";
import { ClassAttendanceChart } from "@/modules/admin/component/ClassAttendanceChart";
import { ClassStatsChart } from "@/components/ClassStatsChart";
import { DashboardDataCard } from "@/modules/admin/component/DashboardDataCard";
import { ActionCentreTable } from "@/modules/admin/component/ActionCentreTable";
import { AttendanceInsights } from "@/modules/admin/component/AttendanceInsights";
import { ImportantActivity } from "@/modules/admin/component/ImportantActivity";
import { FinancialOverviewCards } from "@/modules/admin/component/FinancialOverviewCards";

import { Box, Popover, Typography } from "@mui/material";
import useAdminDashboard from "./hook/adminDashboard";
import CaretDown from "@/modules/shared/assets/svgs/caretDown.svg";
import { PERIOD_OPTIONS } from "@/constants";
import TimeRangeFilterPopover from "@/modules/shared/component/FilterPopover/timeRangeFilterPopover";
import { Classroom } from "@/services/classroom.service";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer/MobileFilterDrawer";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield/searchTextfield";

export const AdminHome = ({ role }: { role: string }) => {
  const [periodAnchorEl, setPeriodAnchorEl] = useState<HTMLElement | null>(null);
  const [classroomAnchorEl, setClassroomAnchorEl] = useState<HTMLElement | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileCustomPeriodOpen, setMobileCustomPeriodOpen] = useState(false);

  const {
    earningsData,
    isLoading,
    isEarningsLoading,
    classStatsData,
    currentPeriod,
    handlePeriodChange,
    handleCustomDateApply,
    handleClassroomChange,
    selectedClassroomId,
    dashboardCards,
    classrooms,
    startDate,
    endDate,
    reportData,
    attendancePeriodType,
    isLoadingReport,
    FINANCIAL_ITEMS,
    actionCenter,
    isLoadingActionCenter,
  } = useAdminDashboard({ role });

  const periodOptions = PERIOD_OPTIONS.map((o) => ({ label: o.name, value: o.name }));
  const selectedClassroomLabel =
    selectedClassroomId && classrooms?.length
      ? (classrooms.find((c: Classroom) => String(c.id) === selectedClassroomId)?.classroomName ??
        "All Classrooms")
      : "All Classrooms";

  return (
    <Box className="h-auto flex gap-3 p-5 bg-dashboard-bg!">
      <Box className="h-auto flex pb-4 flex-col gap-6 overflow-auto hide-scrollbar w-full">
        {/* ── Page header ── */}
        <Box className="hidden md:flex justify-between items-center">
          <Typography className="!text-xl !text-text-primary !font-semibold">Dashboard</Typography>
          <Box className="gap-3 flex">
            <button
              type="button"
              onClick={(e) => setPeriodAnchorEl(e.currentTarget)}
              className="!rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm flex items-center gap-2 px-3 py-2 !cursor-pointer"
            >
              {currentPeriod} <CaretDown className="ml-2" />
            </button>
            <button
              type="button"
              onClick={(e) => setClassroomAnchorEl(e.currentTarget)}
              className="!rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm flex items-center gap-2 px-3 py-2 !cursor-pointer"
            >
              {selectedClassroomLabel} <CaretDown className="ml-2" />
            </button>
            <Popover
              open={Boolean(classroomAnchorEl)}
              anchorEl={classroomAnchorEl}
              onClose={() => setClassroomAnchorEl(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              slotProps={{
                paper: { className: "!mt-2 !rounded-lg !min-w-[160px]" },
              }}
            >
              <Box className="p-2 flex flex-col gap-y-0.5">
                <button
                  type="button"
                  className="text-sm! p-2 flex flex-row gap-2 w-full items-center cursor-pointer text-left rounded hover:bg-gray-100"
                  onClick={() => {
                    handleClassroomChange(null);
                    setClassroomAnchorEl(null);
                  }}
                >
                  All Classrooms
                </button>
                {classrooms?.map((c: Classroom) => (
                  <button
                    type="button"
                    key={c.id}
                    className="text-sm! p-2 flex flex-row gap-2 w-full items-center cursor-pointer text-left rounded hover:bg-gray-100"
                    onClick={() => {
                      handleClassroomChange(String(c.id));
                      setClassroomAnchorEl(null);
                    }}
                  >
                    {c.classroomName}
                  </button>
                ))}
              </Box>
            </Popover>
          </Box>
        </Box>
        <Box className="md:hidden flex items-center gap-2">
          <SearchTextfield
            role="admin"
            className="!w-full"
            fullWidth
            endAction={
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#022F2F] bg-transparent cursor-pointer"
                aria-label="Open filters"
              >
                <FilterIcon className="text-gray-500" />
              </button>
            }
          />
        </Box>

        <Box className="flex gap-4 overflow-x-auto lg:overflow-x-visible hide-scrollbar min-h-30 *:shrink-0 lg:*:shrink">
          {dashboardCards?.map(
            (
              {
                title,
                value,
                percentage,
                figure,
                activityText,
              }: {
                title: string;
                value: number;
                percentage?: string;
                figure?: number;
                activityText?: string;
              },
              index: number,
            ) => (
              <DashboardDataCard
                title={title}
                value={value}
                percentage={percentage}
                key={index}
                isLoading={isLoading}
                isDashboard
                figure={figure}
                activityText={activityText || "this month"}
              />
            ),
          )}
        </Box>

        <ActionCentreTable items={actionCenter} isLoading={isLoadingActionCenter} />

        {/* ── Section 2: Students donut + Attendance chart | Insights + Activity ── */}
        <Box className="flex flex-col lg:flex-row gap-4">
          {/* Left column: students donut + attendance bar chart */}
          <Box className="flex flex-col gap-4 w-full lg:w-[45%]">
            <ClassStatsChart
              className="w-full"
              data={classStatsData}
              role={"admin"}
              isLoading={isLoading}
            />
            <AttendanceInsights
              isLoading={isLoadingReport}
              bestDay={reportData?.attendanceInsight?.bestDay?.dayName}
              bestDayPercent={reportData?.attendanceInsight?.bestDay?.ratePercent}
              worstDay={reportData?.attendanceInsight?.worstDay?.dayName}
              worstDayPercent={reportData?.attendanceInsight?.worstDay?.ratePercent}
              weeklyTrendPercent={reportData?.attendanceInsight?.weeklyTrend?.changePercent}
              weeklyTrendDirection={reportData?.attendanceInsight?.weeklyTrend?.direction}
            />
          </Box>

          {/* Right column: attendance insights + important activity */}
          <Box className="flex flex-col gap-4 w-full lg:w-[55%]">
            <ClassAttendanceChart
              className="w-full"
              startDate={startDate}
              endDate={endDate}
              attendancePeriodType={attendancePeriodType}
              classrooms={classrooms}
            />{" "}
            <ImportantActivity />
          </Box>
        </Box>

        {/* ── Section 3: Financial Overview ── */}
        <Box className="flex flex-col gap-4">
          <FinancialOverviewCards isLoading={isEarningsLoading} items={FINANCIAL_ITEMS} />
          <EarningsChart
            data={earningsData}
            isLoading={isEarningsLoading}
            periodType={attendancePeriodType}
            startDate={startDate}
          />
        </Box>
      </Box>
      <TimeRangeFilterPopover
        open={Boolean(periodAnchorEl)}
        anchorEl={periodAnchorEl}
        onClose={() => setPeriodAnchorEl(null)}
        options={periodOptions}
        onSelect={(value) => {
          handlePeriodChange(value);
          setPeriodAnchorEl(null);
        }}
        onCustomApply={(s, e) => {
          handleCustomDateApply(s, e);
          setPeriodAnchorEl(null);
        }}
        currentStartDate={startDate}
        currentEndDate={endDate}
        customButtonLabel="OK"
        width={120}
        forceOpenCustomModal={mobileCustomPeriodOpen}
        onForceOpenCustomModalHandled={() => setMobileCustomPeriodOpen(false)}
      />
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        onApply={() => setMobileFilterOpen(false)}
        onReset={() => {
          handlePeriodChange("This week");
          handleClassroomChange(null);
          setMobileFilterOpen(false);
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Typography className="!text-sm !font-medium !text-[#02273A]">Period</Typography>
            <Dropdown
              isForm
              options={PERIOD_OPTIONS.map((o) => ({
                value: (o as { name: string }).name,
                name: (o as { name: string }).name,
              }))}
              value={currentPeriod}
              onSelect={(value) => {
                const selectedValue = value as string;
                if (selectedValue === "Custom") {
                  setMobileFilterOpen(false);
                  setMobileCustomPeriodOpen(true);
                  return;
                }
                handlePeriodChange(selectedValue);
              }}
              textFieldProps={{ placeholder: "Date range", isRounded: true }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Typography className="!text-sm !font-medium !text-[#02273A]">Classroom</Typography>
            <Dropdown
              isForm
              options={[
                { value: "all", name: "All Classrooms" },
                ...(classrooms ?? []).map((c: Classroom) => ({
                  value: String(c.id),
                  name: c.classroomName,
                })),
              ]}
              value={selectedClassroomId || "all"}
              onSelect={(value) =>
                handleClassroomChange((value as string) === "all" ? null : (value as string))
              }
              textFieldProps={{ placeholder: "Classroom", isRounded: true }}
            />
          </div>
        </div>
      </MobileFilterDrawer>
    </Box>
  );
};
