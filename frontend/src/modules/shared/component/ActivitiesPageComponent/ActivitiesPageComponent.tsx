"use client";

import { useEffect, useMemo, useState } from "react";
import { InsightCard } from "@/components/InsightCard";
import { Box, CircularProgress, Typography } from "@mui/material";
import Drawer from "@mui/material/Drawer";
import ClockIcon from "@/modules/shared/assets/svgs/clock-Icon.svg";
import MealIcon from "@/modules/shared/assets/svgs/mealIcon.svg";
import NapIcon from "@/modules/shared/assets/svgs/napIcon.svg";
import BottleIcon from "@/modules/shared/assets/svgs/waterIcon.svg";
import PhotoIcon from "@/modules/shared/assets/svgs/photoIcon.svg";
import MedicationIcon from "@/modules/shared/assets/svgs/medicationIcon.svg";
import BathroomIcon from "@/modules/shared/assets/svgs/bathroomIcon.svg";
import useRoomActivities from "@/modules/shared/component/ActivitiesPageComponent/hooks/useRoomActivities";
import { ActivityModal } from "./components/ActivityModal";
import { ActivityDetailsModal } from "./components/ActivityDetailsModal";
import { Activities as ActivityRecord } from "@/services/activities.service";
import TimeRangeFilterPopover from "@/modules/shared/component/FilterPopover/timeRangeFilterPopover";
import CaretDown from "@/modules/shared/assets/svgs/caretDown.svg";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface ActivitiesPageComponentProps {
  role: "admin" | "staff";
}
export const renderActivityIcon = (type?: string) => {
  switch (type) {
    case "nap":
      return <NapIcon />;
    case "water":
      return <BottleIcon />;
    case "photo":
      return <PhotoIcon />;
    case "video":
      return <PhotoIcon />;
    case "medication":
      return <MedicationIcon />;
    case "bathroom":
      return <BathroomIcon />;
    case "meal":
    default:
      return <MealIcon />;
  }
};
export const ActivitiesPageComponent = ({ role }: ActivitiesPageComponentProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [timeAnchorEl, setTimeAnchorEl] = useState<HTMLElement | null>(null);
  const [mobileDrawerMode, setMobileDrawerMode] = useState<
    "main" | "activity" | "classroom" | "time" | "action" | null
  >(null);

  const {
    activityActions,
    activeActivityType,
    closeModal,
    isModalOpen,
    control,
    setValue,
    getValues,
    watch,
    reset,
    recentActivities,
    isActivitiesLoading,
    refreshActivities,
    activityStats,
    classroomOptions,
    studentOptions,
    isClassroomsLoading,
    selectedClassroomId,
    selectedActivityType,
    selectedClassroomFilter,
    selectedTimeFilter,
    handleTimeFilterChange,
    handleCustomDateRangeApply,
    timeOptions,
    startDate,
    endDate,
  } = useRoomActivities(role);

  const formatTimeTo12Hour = (timeValue?: string | null) => {
    if (!timeValue) return "—";

    const hhmmMatch = /^(\d{1,2}):(\d{2})/.exec(timeValue);
    if (hhmmMatch) {
      const hours24 = Number(hhmmMatch[1]);
      const minutes = Number(hhmmMatch[2]);
      if (!Number.isNaN(hours24) && !Number.isNaN(minutes)) {
        const period = hours24 >= 12 ? "PM" : "AM";
        const hours12 = hours24 % 12 || 12;
        return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
      }
    }

    const parsed = new Date(timeValue);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    return timeValue;
  };

  const handleActivityClick = (activityId: number) => {
    setSelectedActivityId(activityId);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedActivityId(null);
  };

  const getActivityTitle = (activity: ActivityRecord) => {
    const capitalizedType =
      activity.activityType.charAt(0).toUpperCase() + activity.activityType.slice(1);

    switch (activity.activityType) {
      case "meal":
        return activity.mealType
          ? `${activity.mealType.charAt(0).toUpperCase() + activity.mealType.slice(1)}: ${activity?.foodItems ? activity?.foodItems : "No food item provided"}`
          : "Meal Logged";
      case "water":
        return "Water Intake";
      case "medication":
        return activity.medicationName
          ? `Medication Administered: ${activity.medicationName}`
          : "Medication";
      case "bathroom":
        return activity.bathroomType
          ? `Bathroom • ${activity.bathroomType === "diaper_change" ? "Diaper Change" : activity.bathroomType.charAt(0).toUpperCase() + activity.bathroomType.slice(1)}`
          : "Bathroom Break";
      case "nap":
        return "Nap Time";
      case "photo":
        return "Media Activity";
      default:
        return `${capitalizedType} Activity`;
    }
  };

  const getActivityDescription = (activity: ActivityRecord) => {
    if (activity.notes) {
      return activity.notes;
    }

    if (activity.foodItem) {
      return `Food Item: ${activity.foodItem}`;
    }

    if (activity.medicationName) {
      return `Dosage: ${activity.dosage ?? "N/A"}`;
    }

    if (activity.bathroomType) {
      return `Bathroom type: ${activity.bathroomType}`;
    }

    return "No additional notes provided.";
  };

  const getActivityTime = (activity: ActivityRecord) => {
    if (activity.startTime && activity.endTime) {
      return `${formatTimeTo12Hour(activity.startTime)} - ${formatTimeTo12Hour(activity.endTime)}`;
    }
    const fallback = activity.timeGiven ?? activity.startTime ?? "—";
    return typeof fallback === "string"
      ? formatTimeTo12Hour(fallback)
      : formatTimeTo12Hour(fallback?.toString() ?? "—");
  };

  const getMobileDateAndTime = (activity: ActivityRecord) => {
    const created = activity.createdAt ? new Date(activity.createdAt) : null;
    if (created && !Number.isNaN(created.getTime())) {
      const dateLabel = created.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const timeLabel = created.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return `${dateLabel} • ${timeLabel}`;
    }
    return getActivityDateAndTime(activity);
  };

  /** Format activity date + time for display: "Today, 2:30 PM" | "Yesterday, 10:00 AM" | "Feb 18, 2:30 PM" */
  const getActivityDateAndTime = (activity: ActivityRecord) => {
    const created = activity.createdAt ? new Date(activity.createdAt) : null;
    const timeLabel = getActivityTime(activity);
    if (!created || isNaN(created.getTime())) {
      return timeLabel;
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const createdDate = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const diffDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const timePart =
      timeLabel !== "—"
        ? timeLabel
        : created.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
    if (diffDays === 0) return `Today, ${timePart}`;
    if (diffDays === 1) return `Yesterday, ${timePart}`;
    if (diffDays < 7 && diffDays > 1) {
      return `${created.toLocaleDateString("en-US", { weekday: "short" })}, ${timePart}`;
    }
    return `${created.toLocaleDateString("en-US", { month: "short", day: "numeric", year: created.getFullYear() !== now.getFullYear() ? "numeric" : undefined })}, ${timePart}`;
  };

  const selectedClassroomLabel = useMemo(() => {
    if (!selectedClassroomFilter) return "All Classroom";
    const matched = classroomOptions.find((option) => Number(option.value) === selectedClassroomFilter);
    return matched?.name || "All Classroom";
  }, [classroomOptions, selectedClassroomFilter]);

  const selectedActivityLabel = useMemo(() => {
    if (!selectedActivityType) return "All Activities";
    const match = activityActions.find((item) => item.type === selectedActivityType);
    return match?.name || "All Activities";
  }, [activityActions, selectedActivityType]);

  const setQueryParam = (key: string, value?: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const setActivityFilter = (activityType: string | null) => {
    setQueryParam("activity", activityType);
    setMobileDrawerMode(null);
  };

  const setClassroomFilter = (classroomName: string | null) => {
    setQueryParam("classroom", classroomName);
    setMobileDrawerMode(null);
  };

  const setTimeFilter = (value: string) => {
    if (value === "Custom") {
      setMobileDrawerMode(null);
      return;
    }
    handleTimeFilterChange(value);
    setMobileDrawerMode(null);
  };

  useEffect(() => {
    if (role !== "staff") return;

    const openFromHeader = () => setMobileDrawerMode("main");
    window.addEventListener("open-activities-filter", openFromHeader as EventListener);

    return () => {
      window.removeEventListener("open-activities-filter", openFromHeader as EventListener);
    };
  }, [role]);

  return (
    <>
      <Box className="flex flex-col gap-5 overflow-y-auto">
        <Box className="hidden md:flex overflow-x-auto gap-4 hide-scrollbar snap-x pb-2 w-full">
          <InsightCard
            name="Meals Today"
            value={!isActivitiesLoading ? activityStats.mealsToday : "..."}
          />
          <InsightCard
            name="Currently Napping"
            value={!isActivitiesLoading ? activityStats.currentlyNapping : "..."}
          />
          <InsightCard
            name="Logged Meals"
            value={!isActivitiesLoading ? activityStats.totalMealsLogged : "..."}
          />
          <InsightCard
            name="Media Shared"
            value={!isActivitiesLoading ? activityStats.mediaShared : "..."}
          />
        </Box>

        <div className="md:hidden space-y-4">
          <div className="flex gap-4 overflow-x-auto pb-1 hide-scrollbar snap-x snap-mandatory">
            {[
              { name: "Meals Today", value: activityStats.mealsToday },
              { name: "Currently Napping", value: activityStats.currentlyNapping },
              { name: "Logged Meals", value: activityStats.totalMealsLogged },
              { name: "Media Shared", value: activityStats.mediaShared },
            ].map((item) => (
              <InsightCard key={item.name} name={item.name} value={!isActivitiesLoading ? item.value : "..."} />))}
          </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-8 rounded-full bg-[#008C95]" />
              <span className="h-1.5 w-2 rounded-full bg-[#D9E7EA]" />
            </div>
          </div>
        </div>

        <Box className="flex overflow-x-auto gap-4 hide-scrollbar snap-x md:grid md:grid-cols-3 lg:grid-cols-6 pb-2 w-full">
          {activityActions.map((actionItem, index: number) => (
            <button
              key={index}
              className="bg-white border border-solid border-primary-text/20 text-primary-dark/80 rounded-md px-6 py-4 flex flex-row items-center justify-center gap-3 text-xs font-medium cursor-pointer shrink-0 snap-start whitespace-nowrap"
              onClick={actionItem.onClick}
            >
              {actionItem.icon} {actionItem.name}
            </button>
          ))}
        </Box>


        <Box className="hidden md:flex bg-white mb-10! rounded-lg p-4 gap-4 flex-1">
          <Box className="flex-1">
            <Box className="flex items-center justify-between gap-2 p-2 mb-1">
              <Typography className="text-lg! font-semibold!">Recent Activities</Typography>
              <button
                type="button"
                onClick={(e) => setTimeAnchorEl(e.currentTarget)}
                className="!rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm flex items-center gap-2 px-3 py-2 shrink-0"
              >
                {selectedTimeFilter} <CaretDown className="ml-1" />
              </button>
            </Box>
            <Box className="mt-2 max-h-[500px] overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-2 flex flex-col gap-4 ">
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
                    className="px-6 gap-3 py-4 flex flex-row rounded-md bg-[#F8F9FA]! cursor-pointer hover:bg-[#F0F1F3]! transition-colors"
                  >
                    <Box className="bg-white p-3 rounded-lg flex items-center justify-center">
                      {renderActivityIcon(activity.activityType)}
                    </Box>
                    <Box className="flex flex-row items-center justify-between w-full">
                      <Box className="flex flex-col gap-2 pr-4">
                        <Typography className="text-primary-dark text-sm!">
                          {getActivityTitle(activity)}
                        </Typography>
                        <Typography className="text-xs! text-text-tertiary/70!">
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

        <Box className="md:hidden rounded-md bg-white px-2 py-2 h-full shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex flex-row items-center gap-2">
            <Typography className="!text-base sm:!text-[20px] !font-medium !text-[#4A4A4A]">
              Recent Activities
            </Typography>
          </div>

          <Box className="flex flex-col gap-4">
            {isActivitiesLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 rounded-[18px] bg-[#F7F9FA] animate-pulse"
                />
              ))
            ) : recentActivities.length === 0 ? (
              <Typography className="text-sm! text-text-tertiary/70! px-4 py-6 text-center">
                No activities logged yet.
              </Typography>
            ) : (
              recentActivities?.map((activity) => (
                <Box
                  key={activity.id}
                  onClick={() => handleActivityClick(activity.id)}
                  className="cursor-pointer rounded-[10px] bg-[#F7F9FA] px-2 py-2 transition-colors hover:bg-[#F0F4F5]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-white">
                      {renderActivityIcon(activity.activityType)}
                    </div>
                    <div className="flex flex-col sm:flex-row min-w-0 flex-1 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Typography className="!text-[16px] !font-medium !leading-6 !text-primary-dark/80">
                          {getActivityTitle(activity)}
                        </Typography>
                        <Typography className="!mt-2 !text-[12px] !leading-5 !text-[#556B73]">
                          {getActivityDescription(activity)}
                        </Typography>
                      </div>
                      <span className="whitespace-nowrap pt-1 text-[12px] font-medium text-[#556B73]">
                        {getMobileDateAndTime(activity)}
                      </span>
                    </div>
                  </div>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>

      <Drawer
        anchor="bottom"
        open={Boolean(mobileDrawerMode)}
        onClose={() => setMobileDrawerMode(null)}
        PaperProps={{
          className: "rounded-t-[32px]",
          style: { minHeight: "42vh" },
        }}
      >
        <div className="px-6 pt-3 pb-8">
          <div className="w-20 h-2 bg-[#D9D9D9] rounded-full mx-auto mb-6" />
          {mobileDrawerMode === "main" && (
            <div className="space-y-2">
              <button
                type="button"
                className="w-full rounded-2xl bg-[#F7F7F8] px-5 py-4 text-left text-sm font-medium text-primary-dark/80"
                onClick={() => setMobileDrawerMode("action")}
              >
                Action
              </button>
              <button
                type="button"
                className="w-full px-5 py-4 text-left text-sm font-medium text-primary-dark/80"
                onClick={() => setMobileDrawerMode("activity")}
              >
                {selectedActivityLabel}
              </button>
              <button
                type="button"
                className="w-full px-5 py-4 text-left text-sm font-medium text-primary-dark/80"
                onClick={() => setMobileDrawerMode("classroom")}
              >
                {selectedClassroomLabel}
              </button>
              <button
                type="button"
                className="w-full px-5 py-4 text-left text-sm font-medium text-primary-dark/80"
                onClick={() => setMobileDrawerMode("time")}
              >
                {selectedTimeFilter}
              </button>
              <button
                type="button"
                className="w-full px-5 py-4 text-left text-sm font-medium text-primary-dark/80"
                onClick={() => setMobileDrawerMode("action")}
              >
                Create Activities
              </button>
            </div>
          )}

          {mobileDrawerMode === "activity" && (
            <div className="space-y-2">
              <button
                type="button"
                className="w-full rounded-2xl bg-[#F7F7F8] px-5 py-4 text-left text-sm font-medium text-primary-dark/80"
                onClick={() => setActivityFilter(null)}
              >
                All Activities
              </button>
              {activityActions.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  className="w-full px-5 py-4 text-left text-sm font-medium text-[#022F2F]"
                  onClick={() => setActivityFilter(item.type)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}

          {mobileDrawerMode === "action" && (
            <div className="space-y-2">
              <button
                type="button"
                className="w-full rounded-2xl bg-[#F7F7F8] px-5 py-4 text-left text-sm font-medium text-primary-dark/80"
                onClick={() => setMobileDrawerMode("action")}
              >
                Create Activities
              </button>
              {activityActions.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  className="w-full px-5 py-4 text-left text-sm font-medium text-[#022F2F]"
                  onClick={() => {
                    item.onClick();
                    setMobileDrawerMode(null);
                  }}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}

          {mobileDrawerMode === "classroom" && (
            <div className="space-y-2">
              <button
                type="button"
                className="w-full rounded-2xl bg-[#F7F7F8] px-5 py-4 text-left text-sm font-medium text-primary-dark/80"
                onClick={() => setClassroomFilter(null)}
              >
                All Classroom
              </button>
              {classroomOptions.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  className="w-full px-5 py-4 text-left text-sm font-medium text-[#022F2F]"
                  onClick={() => setClassroomFilter(option.name)}
                >
                  {option.name}
                </button>
              ))}
            </div>
          )}

          {mobileDrawerMode === "time" && (
            <div className="space-y-2">
              <button
                type="button"
                className="w-full rounded-2xl bg-[#F7F7F8] px-5 py-4 text-left text-sm font-medium text-primary-dark/80"
                onClick={() => setTimeFilter(selectedTimeFilter)}
              >
                {selectedTimeFilter}
              </button>
              {timeOptions
                .filter((option) => option.value !== "Custom")
                .map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="w-full px-5 py-4 text-left text-sm font-medium text-[#022F2F]"
                    onClick={() => setTimeFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
            </div>
          )}
        </div>
      </Drawer>

      <TimeRangeFilterPopover
        open={Boolean(timeAnchorEl)}
        anchorEl={timeAnchorEl}
        onClose={() => setTimeAnchorEl(null)}
        options={timeOptions.map((o) => ({ label: o.label, value: o.value }))}
        onSelect={(value) => {
          handleTimeFilterChange(value);
          setTimeAnchorEl(null);
        }}
        onCustomApply={(s, e) => {
          handleCustomDateRangeApply(s, e);
          setTimeAnchorEl(null);
        }}
        currentStartDate={startDate}
        currentEndDate={endDate}
        width={180}
      />

      <ActivityModal
        isOpen={isModalOpen}
        onClose={closeModal}
        activityType={activeActivityType.toLowerCase()}
        formControl={control}
        formSetValue={setValue}
        formGetValues={getValues}
        formWatch={watch}
        formReset={reset}
        onActivityCreated={refreshActivities}
        classroomOptions={classroomOptions}
        studentOptions={studentOptions}
        isClassroomsLoading={isClassroomsLoading}
        selectedClassroomId={selectedClassroomId}
      />
      <ActivityDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        activityId={selectedActivityId}
      />
    </>
  );
};
