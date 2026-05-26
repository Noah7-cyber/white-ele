"use client";

import { useState, useEffect, useRef } from "react";
import { StaffClassAttendanceChart } from "@/modules/staff/component/ClassAttendanceChart";
import { DashboardDataCard } from "@/modules/admin/component/DashboardDataCard";
import { Box, Typography } from "@mui/material";
import ClockIcon from "@/modules/shared/assets/svgs/clock-Icon.svg";
import CaretDown from "@/modules/shared/assets/svgs/caretDown.svg";
import { CWPopover } from "@/modules/shared/component/Popover";
import { Button } from "@/modules/shared/component/Button";
import ResetIcon from "@/modules/shared/assets/svgs/resetWhite.svg";
import KeyIcon from "@/modules/shared/assets/svgs/keyLinear.svg";
import useStaffDashboard from "./hooks/useStaffDashboard";
import useStaffDashboardActivities from "./hooks/useStaffDashboardActivities";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { accountServices, GetProfileResponse } from "@/services/account.service";
import { PERIOD_OPTIONS } from "@/constants";
import TimeRangeFilterPopover from "@/modules/shared/component/FilterPopover/timeRangeFilterPopover";
import EyeIcon from "@/modules/shared/assets/svgs/eyeLinear.svg";
import EyeOffIcon from "@/modules/shared/assets/svgs/eyeOffLinear.svg";
import FilterPopover from "@/modules/shared/component/FilterPopover/filterPopover";
import ExpandMoreIcon from "@/modules/shared/assets/svgs/downIcon.svg";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer/MobileFilterDrawer";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield/searchTextfield";

export const StaffHome = () => {
  const [periodAnchorEl, setPeriodAnchorEl] = useState<HTMLElement | null>(null);
  const [classroomAnchorEl, setClassroomAnchorEl] = useState<HTMLElement | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileCustomPeriodOpen, setMobileCustomPeriodOpen] = useState(false);

  const { data: profileData } = useQueryService<Record<string, never>, GetProfileResponse>({
    service: accountServices.getProfile,
    options: { keys: ["profile", "staffDashboard"] },
  });

  const {
    isLoading,
    studentCount,
    signedInCount,
    lateCount,
    absentCount,
    growth,
    attendanceChartData,
    analyticsData,
    currentPeriod,
    handlePeriodChange,
    handleCustomDateApply,
    handleClassroomChange,
    selectedClassroomId,
    classrooms,
    hasMoreStaffClassrooms,
    fetchMoreStaffClassrooms,
    startDate,
    endDate,
  } = useStaffDashboard();

  const {
    activities: recentActivities,
    isActivitiesLoading,
    timeFilter,
    setTimeFilter,
    getActivityTitle,
    getActivityDescription,
    getActivityDateAndTime,
    renderActivityIcon,
  } = useStaffDashboardActivities({
    classroomId: selectedClassroomId || null,
  });

  const userName = profileData?.data?.user?.firstName ?? "there";
  const kioskPin =
    (profileData?.data?.user?.roleDetails as { pin?: string } | null | undefined)?.pin ??
    analyticsData?.data?.kioskPin ??
    "";
  const [isPinHidden, setIsPinHidden] = useState(true);
  const hasTriggeredChangePasswordModal = useRef(false);

  useEffect(() => {
    const user = profileData?.data?.user as { isSystemGeneratedPassword?: boolean } | undefined;
    const shouldForceChange = Boolean(user?.isSystemGeneratedPassword);

    if (
      shouldForceChange &&
      !hasTriggeredChangePasswordModal.current &&
      typeof window !== "undefined"
    ) {
      hasTriggeredChangePasswordModal.current = true;
      window.dispatchEvent(new CustomEvent("openChangePasswordModal"));
    }
  }, [profileData?.data?.user]);

  const renderPinBoxes = () => {
    const pinLength = kioskPin ? kioskPin.length : 4;
    const pinDigits: string[] = kioskPin ? kioskPin.split("") : Array(pinLength).fill("-");

    return (
      <Box className="flex gap-2 items-center justify-center px-0.5">
        {pinDigits.map((digit: string, idx: number) => (
          <Box
            key={idx}
            className="w-16 h-16 flex items-center justify-center border text-center rounded-lg text-4xl font-semibold text-primary-text-dark bg-white"
          >
            {kioskPin ? (
              isPinHidden ? (
                <span className="mt-2.5 text-4xl">*</span>
              ) : (
                digit
              )
            ) : (
              <span className="mt-2.5 text-4xl text-text-tertiary/70">-</span>
            )}
          </Box>
        ))}
        {kioskPin && (
          <Box
            className="ml-3 cursor-pointer flex items-center"
            onClick={() => setIsPinHidden((prev) => !prev)}
            aria-label={isPinHidden ? "Show PIN" : "Hide PIN"}
          >
            {/* reuse the same eye icons via text since staff doesn't have dedicated SVGs here */}
            <span className="text-xs text-text-tertiary/70">
              {isPinHidden ? <EyeOffIcon /> : <EyeIcon />}
            </span>
          </Box>
        )}
      </Box>
    );
  };

  const periodOptions = PERIOD_OPTIONS.map((o) => ({ label: o.name, value: o.name }));
  const selectedClassroomLabel =
    selectedClassroomId && classrooms?.length
      ? (classrooms.find(
          (c: { id: number; classroomName: string }) => String(c.id) === selectedClassroomId,
        )?.classroomName ?? "All Classrooms")
      : "All Classrooms";

  const growthPercent = growth != null && String(growth).trim() !== "" ? String(growth) : "";

  const dynamicStaffCards = [
    { title: "Total Children", value: studentCount, percentage: growthPercent },
    { title: "Children Signed In", value: signedInCount },
    { title: "Children Late", value: lateCount },
    { title: "Children Absent", value: absentCount },
  ];

  return (
    <Box className="h-auto flex flex-col gap-5 p-4 md:p-5 !bg-dashboard-bg">
      <Box className="h-auto flex flex-col gap-3">
        <Box className="hidden md:flex justify-between items-center">
          <Typography className="!text-xl !text-text-primary !font-semibold">Dashboard</Typography>
          <Box className="gap-2 md:gap-3 flex flex-wrap md:flex-nowrap">
            <button
              type="button"
              onClick={(e) => setPeriodAnchorEl(e.currentTarget)}
              className="!rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm flex items-center gap-2 px-3 py-2"
            >
              {currentPeriod} <CaretDown className="ml-2" />
            </button>
            <button
              type="button"
              onClick={(e) => setClassroomAnchorEl(e.currentTarget)}
              className="flex items-center justify-around px-3 h-10 text-gray-700 rounded-lg cursor-pointer border border-gray-200 bg-transparent"
            >
              <span className="text-sm font-medium">{selectedClassroomLabel}</span>
              <ExpandMoreIcon className="ml-2" />
            </button>
            <FilterPopover
              open={Boolean(classroomAnchorEl)}
              anchorEl={classroomAnchorEl}
              onClose={() => setClassroomAnchorEl(null)}
              options={[
                { label: "All Classrooms", value: "all" },
                ...classrooms.map((c: { id: number; classroomName: string }) => ({
                  label: c.classroomName,
                  value: String(c.id),
                })),
              ]}
              onSelect={(value) => {
                handleClassroomChange(value === "all" ? null : value);
                setClassroomAnchorEl(null);
              }}
              onScrollEnd={fetchMoreStaffClassrooms}
              width={150}
            />
          </Box>
        </Box>
        <Box className="text-primary-text-dark flex flex-col md:hidden">
          <Typography className="!text-lg !font-semibold">Welcome back, {userName}!</Typography>
          <Typography className="!text-sm !font-normal">
            Here&apos;s what&apos;s happening in your classes today.
          </Typography>
        </Box>
        <Box className="md:hidden flex items-center gap-2">
          <SearchTextfield
            role="staff"
            className="!w-full bg-white rounded-xl max-sm:!border-none max-sm:!border-transparent"
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
      </Box>

      <DataRenderer isLoading={isLoading}>
        {() => (
          <>
            <Box className="hidden sm:flex gap-4 overflow-x-auto lg:grid lg:grid-cols-4 lg:overflow-x-visible hide-scrollbar min-h-24 md:min-h-30 *:shrink-0 lg:*:shrink">
              {dynamicStaffCards.map(
                (
                  {
                    title,
                    value,
                    percentage,
                  }: { title: string; value: number; percentage?: string },
                  index: number,
                ) => (
                  <DashboardDataCard
                    title={title}
                    value={value}
                    percentage={percentage}
                    isLoading={isLoading}
                    key={index}
                  />
                ),
              )}
            </Box>

            <Box className="flex flex-col lg:flex-row gap-4 lg:h-[360px]">
              <StaffClassAttendanceChart className="w-full lg:w-2/3" data={attendanceChartData} />
              <Box className="p-4 md:p-6 md:py-7 flex flex-col justify-between gap-6 md:gap-8 bg-white rounded-lg border border-brandColor-active/20 w-full lg:w-1/3">
                <Box className="flex gap-2.5 items-center">
                  <Box className="bg-white rounded-lg flex items-center ">
                    <KeyIcon />
                  </Box>
                  <Box className="flex flex-col">
                    <Typography className="text-primary-dark text-base! !font-bold">
                      Kiosk PIN
                    </Typography>
                    <Typography className="text-sm! !font-normal text-text-tertiary/70!">
                      Use this PIN to clock in/out for your class.
                    </Typography>
                  </Box>
                </Box>

                <Box className="overflow-x-auto">{renderPinBoxes()}</Box>

                <Box className="flex flex-col gap-1.5 items-center justify-center">
                  <Typography className="text-sm! text-center !font-light text-text-tertiary/70!">
                    Use this PIN at the kiosk to clock in/out.
                  </Typography>
                  <Button
                    startIcon={<ResetIcon />}
                    className="mt-4 !px-6 !rounded-lg !bg-brandColor-active !text-white !font-semibold w-full !text-sm!"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("openResetKioskPinModal"));
                      }
                    }}
                  >
                    Reset PIN
                  </Button>
                </Box>
              </Box>
            </Box>

            <Box className="bg-white rounded-lg p-3 md:p-4 flex flex-col gap-2 flex-1 border border-brandColor-active/20">
              <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <Typography className="!text-base p-2 pb-0 !font-bold">
                  Recent Activities
                </Typography>
                <CWPopover
                  actionComponent={
                    <>
                      {timeFilter} <CaretDown className="ml-2" />
                    </>
                  }
                  buttonProps={{
                    isRounded: false,
                    variant: "outlined",
                    className:
                      "!rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm !font-normal !min-w-fit",
                  }}
                >
                  {(closePopover) => (
                    <Box paddingY={1} className="flex flex-col gap-y-2 p-4!">
                      {(["Today", "This Week", "This Month"] as const).map((label) => (
                        <button
                          key={label}
                          type="button"
                          className="text-sm! p-1 flex flex-row gap-2 items-center cursor-pointer"
                          onClick={() => {
                            setTimeFilter(label);
                            closePopover();
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </Box>
                  )}
                </CWPopover>
              </Box>
              <Box className="flex-1 h-full">
                <Box className="sm:mt-2 sm:max-h-[560px] overflow-y-scroll [scrollbar-width:1px] [&::-webkit-scrollbar]:hidden sm:p-2 flex flex-col gap-4">
                  {isActivitiesLoading ? (
                    <Typography className="text-sm! text-text-tertiary/70! px-4 py-6 text-center">
                      Loading recent activities...
                    </Typography>
                  ) : recentActivities.length === 0 ? (
                    <Typography className="text-sm! text-text-tertiary/70! px-4 py-6 text-center">
                      No activities logged yet.
                    </Typography>
                  ) : (
                    recentActivities.map((activity) => (
                      <Box
                        key={activity.id}
                        className="px-4 md:px-6 gap-3 py-4 flex flex-row rounded-md bg-[#F8F9FA]!"
                      >
                        <Box className="bg-white p-1 sm:p-3 rounded-lg !h-fit flex items-center justify-center">
                          {renderActivityIcon(activity.activityType)}
                        </Box>
                        <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
                          <Box className="flex flex-col gap-2 sm:pr-4">
                            <Typography className="text-primary-dark text-base! !font-medium">
                              {getActivityTitle(activity)}
                            </Typography>
                            <Typography className="text-sm! text-text-tertiary/70!">
                              {getActivityDescription(activity)}
                            </Typography>
                          </Box>
                          <Box className="flex flex-row items-center gap-x-2 text-[10px] sm:text-sm! font-medium! text-text-tertiary/70! whitespace-nowrap">
                            <ClockIcon />
                            <span>{getActivityDateAndTime(activity)}</span>
                          </Box>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Box>
            </Box>
          </>
        )}
      </DataRenderer>

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
                ...classrooms.map((c: { id: number; classroomName: string }) => ({
                  value: String(c.id),
                  name: c.classroomName,
                })),
              ]}
              value={selectedClassroomId || "all"}
              onSelect={(value) =>
                handleClassroomChange((value as string) === "all" ? null : (value as string))
              }
              textFieldProps={{ placeholder: "Classroom", isRounded: true }}
              hasMore={Boolean(hasMoreStaffClassrooms)}
              onLoadMore={fetchMoreStaffClassrooms}
            />
          </div>
        </div>
      </MobileFilterDrawer>
    </Box>
  );
};
