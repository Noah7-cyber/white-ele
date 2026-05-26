"use client";

import { useState, useEffect, useRef } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import ClockIcon from "@/modules/shared/assets/svgs/clock-Icon.svg";
import CaretDown from "@/modules/shared/assets/svgs/caretDown.svg";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import useActivities from "./hook/useActivities";
import { PERIOD_OPTIONS } from "@/constants";
import TimeRangeFilterPopover from "@/modules/shared/component/FilterPopover/timeRangeFilterPopover";
import { CWPopover } from "@/modules/shared/component/Popover";
import { ActivityDetailsModal } from "@/modules/shared/component/ActivitiesPageComponent/components/ActivityDetailsModal";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer/MobileFilterDrawer";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import type { Activities as ActivityRecord } from "@/services/activities.service";

export const ActivitiesPage = () => {
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [periodAnchorEl, setPeriodAnchorEl] = useState<HTMLElement | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [pendingPeriodLabel, setPendingPeriodLabel] = useState("");
  const [pendingChildValue, setPendingChildValue] = useState<string>("All Children");
  const [scheduleCustomPeriodOpen, setScheduleCustomPeriodOpen] = useState(false);
  const customPeriodAnchorRef = useRef<HTMLButtonElement | null>(null);

  const {
    activities: recentActivities,
    isActivitiesLoading,
    children,
    currentPeriod,
    startDate,
    endDate,
    handlePeriodChange,
    handleCustomDateApply,
    childrenFilter,
    handleChildrenFilterChange,
    getChildName,
    getActivityDescription,
    getActivityTitle,
    renderActivityIcon,
    getActivityDateAndTime,
    getActivityTime,
  } = useActivities();

  const handleActivityClick = (activityId: number) => {
    setSelectedActivityId(activityId);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedActivityId(null);
  };

  const parentChildrenIds = children.map((c) => c.id);

  const periodLabel = currentPeriod ?? "This week";

  useEffect(() => {
    if (!mobileFilterOpen) return;
    setPendingPeriodLabel(periodLabel);
    setPendingChildValue(
      childrenFilter === "All Children" ? "All Children" : String(childrenFilter as number),
    );
  }, [mobileFilterOpen, periodLabel, childrenFilter]);

  useEffect(() => {
    if (!scheduleCustomPeriodOpen) return;
    const el = customPeriodAnchorRef.current;
    if (el) setPeriodAnchorEl(el);
    setScheduleCustomPeriodOpen(false);
  }, [scheduleCustomPeriodOpen]);

  const getMobileTime = (activity: ActivityRecord) => {
    const created = activity.createdAt ? new Date(activity.createdAt) : null;
    if (created && !isNaN(created.getTime())) {
      return created.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    return getActivityTime(activity);
  };

  return (
    <>
      <button
        type="button"
        ref={customPeriodAnchorRef}
        tabIndex={-1}
        aria-hidden
        className="fixed left-4 top-24 w-px h-px opacity-0 overflow-hidden pointer-events-none"
      />

      <Box className="flex flex-col gap-4 p-4 md:p-5 h-full">
        <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Typography className="hidden md:block !text-xl !font-semibold">Activities</Typography>
          <Box className="hidden md:flex flex-wrap sm:flex-nowrap items-center gap-2">
            <button
              type="button"
              onClick={(e) => setPeriodAnchorEl(e.currentTarget)}
              className="!rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm flex items-center gap-2 px-3 py-2 !cursor-pointer !min-w-fit !text-nowrap"
            >
              {periodLabel} <CaretDown className="ml-2" />
            </button>
            <TimeRangeFilterPopover
              open={Boolean(periodAnchorEl)}
              anchorEl={periodAnchorEl}
              onClose={() => setPeriodAnchorEl(null)}
              options={PERIOD_OPTIONS.map((o) => ({ label: o.name, value: o.name }))}
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
            />

            <CWPopover
              actionComponent={
                <>
                  {childrenFilter === "All Children"
                    ? "All Children"
                    : getChildName(childrenFilter as number)}{" "}
                  <CaretDown className="ml-2" />
                </>
              }
              buttonProps={{
                isRounded: false,
                variant: "outlined",
                className:
                  "!w-full !rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm !font-normal !text-nowrap !min-w-fit",
              }}
            >
              {(closePopover) => (
                <Box paddingY={1} className="flex flex-col gap-y-2 2xl:gap-y-3 p-4!">
                  <button
                    type="button"
                    className="text-sm! 2xl:text-base! p-1 flex flex-row gap-2 items-center cursor-pointer"
                    onClick={() => {
                      handleChildrenFilterChange("All Children");
                      closePopover();
                    }}
                  >
                    All Children
                  </button>
                  {children.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      className="text-sm! 2xl:text-base! p-1 flex flex-row gap-2 items-center cursor-pointer"
                      onClick={() => {
                        handleChildrenFilterChange(child.id);
                        closePopover();
                      }}
                    >
                      {child.fullName}
                    </button>
                  ))}
                </Box>
              )}
            </CWPopover>
          </Box>
        </Box>

        <button
          type="button"
          onClick={() => setMobileFilterOpen(true)}
          className="md:hidden w-full flex items-center justify-center gap-2 rounded-full border border-[#D0D5DD] py-2.5 px-4 text-sm font-medium text-[#022F2F] bg-white"
        >
          <FilterIcon className="text-gray-500" />
          Filters
        </button>

        <Box className="hidden md:block bg-white rounded-lg p-3 md:p-4 flex gap-4 flex-1 border border-brandColor-active/20">
          <Box className="flex-1 h-full">
            <Box className="mt-2 sm:max-h-[560px] overflow-y-scroll [scrollbar-width:1px] [&::-webkit-scrollbar]:hidden p-2 flex flex-col gap-4 ">
              {isActivitiesLoading ? (
                <CircularProgress />
              ) : recentActivities.length === 0 ? (
                <Typography className="text-sm! text-text-tertiary/70! px-4 py-6 text-center">
                  No activities logged yet.
                </Typography>
              ) : (
                recentActivities.map((activity) => (
                  <Box
                    key={activity.id}
                    onClick={() => handleActivityClick(activity.id)}
                    className="px-4 md:px-6 gap-3 py-4 flex flex-col sm:flex-row rounded-md bg-[#F8F9FA]! cursor-pointer hover:bg-[#F0F1F3]! transition-colors"
                  >
                    <Box className="bg-white p-3 rounded-lg flex items-center justify-center">
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
                      <Box className="flex flex-row items-center  gap-x-2 text-sm! font-medium! text-text-tertiary/70! whitespace-nowrap">
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

        <Box className="md:hidden rounded-md bg-white px-2 py-2 flex-1 border border-brandColor-active/20 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
          <Box className="flex flex-col gap-4 p-2">
            {isActivitiesLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 rounded-[18px] bg-[#F7F9FA] animate-pulse" />
              ))
            ) : recentActivities.length === 0 ? (
              <Typography className="text-sm! text-text-tertiary/70! px-4 py-6 text-center">
                No activities logged yet.
              </Typography>
            ) : (
              recentActivities.map((activity) => (
                <Box
                  key={activity.id}
                  onClick={() => handleActivityClick(activity.id)}
                  className="cursor-pointer rounded-[10px] bg-[#F7F9FA] px-2 py-2 transition-colors hover:bg-[#F0F4F5]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-white">
                      {renderActivityIcon(activity.activityType)}
                    </div>
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Typography className="!text-[16px] !font-medium !leading-6 !text-[#173B7A]">
                          {getActivityTitle(activity)}
                        </Typography>
                        <Typography className="!mt-2 !text-[12px] !leading-5 !text-[#556B73]">
                          {getActivityDescription(activity)}
                        </Typography>
                      </div>
                      <span className="whitespace-nowrap pt-1 text-[12px] font-medium text-[#556B73]">
                        {getMobileTime(activity)}
                      </span>
                    </div>
                  </div>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>

      <TimeRangeFilterPopover
        open={Boolean(periodAnchorEl)}
        anchorEl={periodAnchorEl}
        onClose={() => setPeriodAnchorEl(null)}
        options={PERIOD_OPTIONS.map((o) => ({ label: o.name, value: o.name }))}
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
      />

      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        onApply={() => {
          if (pendingPeriodLabel === "Custom") {
            setMobileFilterOpen(false);
            setScheduleCustomPeriodOpen(true);
            return;
          }
          if (pendingPeriodLabel && pendingPeriodLabel !== periodLabel) {
            handlePeriodChange(pendingPeriodLabel);
          }
          const currentChild =
            childrenFilter === "All Children" ? "All Children" : String(childrenFilter as number);
          if (pendingChildValue !== currentChild) {
            handleChildrenFilterChange(
              pendingChildValue === "All Children" ? "All Children" : Number(pendingChildValue),
            );
          }
          setMobileFilterOpen(false);
        }}
        onReset={() => {
          handlePeriodChange("This week");
          handleChildrenFilterChange("All Children");
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
              value={pendingPeriodLabel || periodLabel}
              onSelect={(value) => setPendingPeriodLabel(value as string)}
              textFieldProps={{ placeholder: "Date range", isRounded: true }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Typography className="!text-sm !font-medium !text-[#02273A]">Child</Typography>
            <Dropdown
              isForm
              options={[
                { value: "All Children", name: "All Children" },
                ...children.map((child) => ({ value: String(child.id), name: child.fullName })),
              ]}
              value={
                pendingChildValue ||
                (childrenFilter === "All Children" ? "All Children" : String(childrenFilter as number))
              }
              onSelect={(value) => setPendingChildValue(value as string)}
              textFieldProps={{ placeholder: "Filter by child", isRounded: true }}
            />
          </div>
        </div>
      </MobileFilterDrawer>

      <ActivityDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        activityId={selectedActivityId}
        parentChildrenIds={parentChildrenIds}
      />
    </>
  );
};
