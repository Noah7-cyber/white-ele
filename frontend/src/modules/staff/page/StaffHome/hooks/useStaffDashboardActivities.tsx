/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useUser } from "@/utils/hooks/useUser";
import { activitiesServices, Activities as ActivityRecord } from "@/services/activities.service";
import MealIcon from "@/modules/shared/assets/svgs/mealIcon.svg";
import NapIcon from "@/modules/shared/assets/svgs/napIcon.svg";
import BottleIcon from "@/modules/shared/assets/svgs/waterIcon.svg";
import PhotoIcon from "@/modules/shared/assets/svgs/photoIcon.svg";
import MedicationIcon from "@/modules/shared/assets/svgs/medicationIcon.svg";
import BathroomIcon from "@/modules/shared/assets/svgs/bathroomIcon.svg";

export type StaffTimeFilter = "Today" | "This Week" | "This Month";
type HookParams = {
  startDate?: string;
  endDate?: string;
  classroomId?: string | null;
};

function getDateRangeByFilter(filter: StaffTimeFilter) {
  const now = new Date();
  const toISO = (date: Date) => date.toISOString().split("T")[0];
  if (filter === "Today") {
    const today = toISO(now);
    return { startDate: today, endDate: today };
  }
  if (filter === "This Week") {
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { startDate: toISO(start), endDate: toISO(end) };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate: toISO(start), endDate: toISO(end) };
}

function getActivityTime(activity: ActivityRecord) {
  if (activity.startTime && activity.endTime) {
    return `${activity.startTime} - ${activity.endTime}`;
  }
  const fallback = activity.timeGiven ?? activity.startTime ?? "—";
  return typeof fallback === "string" ? fallback : (fallback?.toString() ?? "—");
}

export function getActivityDateAndTime(activity: ActivityRecord) {
  const created = activity.createdAt ? new Date(activity.createdAt) : null;
  // Always force AM/PM formatting for time label if present
  const timeLabel = getActivityTime(activity);

  // If timeLabel looks like a range (e.g., "9:00 - 10:00"), format both sides
  const formatTimeAMPM = (time: string) => {
    // Try to parse as "H:mm" or "HH:mm", fallback to original if parse fails
    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = minuteStr ? parseInt(minuteStr, 10) : 0;
    if (isNaN(hour)) return time;
    const ampm = hour >= 12 ? "PM" : "AM";
    let hour12 = hour % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  const processTimeLabel = (label: string) => {
    if (!label || label === "—") return label;
    // If it's a range: "H:mm - H:mm" or "HH:mm - HH:mm"
    const range = label.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
    if (range) {
      const [, t1, t2] = range;
      return `${formatTimeAMPM(t1)} - ${formatTimeAMPM(t2)}`;
    }
    // Single time maybe, try to format
    return formatTimeAMPM(label);
  };

  // If created is null or invalid, fallback
  if (!created || isNaN(created.getTime())) return processTimeLabel(timeLabel);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const createdDate = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const diffDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

  // Always format the time/label in AM/PM
  let timePart;
  if (timeLabel && timeLabel !== "—") {
    timePart = processTimeLabel(timeLabel);
  } else {
    timePart = created.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }

  if (diffDays === 0) return `Today, ${timePart}`;
  if (diffDays === 1) return `Yesterday, ${timePart}`;
  if (diffDays < 7 && diffDays > 1) {
    return `${created.toLocaleDateString("en-US", { weekday: "short" })}, ${timePart}`;
  }
  return (
    `${created.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: created.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })}, ${timePart}`
  );
}

export function getActivityTitle(activity: ActivityRecord) {
  const capitalizedType =
    activity.activityType.charAt(0).toUpperCase() + activity.activityType.slice(1);
  switch (activity.activityType) {
    case "meal":
      return activity.mealType
        ? `${activity.mealType.charAt(0).toUpperCase() + activity.mealType.slice(1)}: ${activity?.foodItems ?? "No food item provided"}`
        : "Meal Logged";
    case "water":
      return "Water Intake";
    case "medication":
      return activity.medicationName ? `Medication Administered: ${activity.medicationName}` : "Medication";
    case "bathroom":
      return activity.bathroomType
        ? `Bathroom • ${activity.bathroomType === "diaper_change" ? "Diaper Change" : activity.bathroomType.charAt(0).toUpperCase() + activity.bathroomType.slice(1)}`
        : "Bathroom Break";
    case "nap":
      return "Nap Time";
    default:
      return `${capitalizedType} Activity`;
  }
}

export function getActivityDescription(activity: ActivityRecord) {
  if (activity.notes) return activity.notes;
  const foodItem = (activity as any).foodItems || activity.foodItem;
  if (foodItem) return `Food Item: ${foodItem}`;
  if (activity.medicationName) return `Dosage: ${activity.dosage ?? "N/A"}`;
  if (activity.bathroomType) return `Bathroom type: ${activity.bathroomType}`;
  return "No additional notes provided.";
}

export function renderActivityIcon(type?: string) {
  switch (type) {
    case "nap":
      return <NapIcon />;
    case "water":
      return <BottleIcon />;
    case "photo":
      return <PhotoIcon />;
    case "medication":
      return <MedicationIcon />;
    case "bathroom":
      return <BathroomIcon />;
    case "meal":
    default:
      return <MealIcon />;
  }
}

export default function useStaffDashboardActivities(params?: HookParams) {
  const { staffId } = useUser();
  const [timeFilter, setTimeFilter] = useState<StaffTimeFilter>("This Month");
  const range = useMemo(() => getDateRangeByFilter(timeFilter), [timeFilter]);

  const activitiesQuery = useMemo(
    () =>
      staffId
        ? {
            ...activitiesServices.getAllActivities,
            data: {
              teacherId: staffId,
              ...(params?.classroomId ? { classroomId: Number(params.classroomId) } : {}),
              startDate: params?.startDate || range.startDate,
              endDate: params?.endDate || range.endDate,
            },
          }
        : null,
    [staffId, params?.classroomId, params?.startDate, params?.endDate, range.startDate, range.endDate],
  );

  const { data: activitiesData, isLoading } = useQueryService<any, any>({
    service: activitiesQuery ?? { path: "", method: "GET" },
    options: {
      keys: [
        "staffDashboardActivities",
        String(staffId ?? "none"),
        params?.classroomId ?? "all-classrooms",
        params?.startDate || range.startDate,
        params?.endDate || range.endDate,
      ],
      enabled: !!staffId && !!activitiesQuery,
    },
  });

  const activitiesList: ActivityRecord[] = useMemo(() => {
    if (activitiesData?.activities && Array.isArray(activitiesData.activities)) return activitiesData.activities;
    if (Array.isArray(activitiesData)) return activitiesData;
    if (activitiesData?.data?.activities && Array.isArray(activitiesData.data.activities)) return activitiesData.data.activities;
    if (activitiesData?.data && Array.isArray(activitiesData.data)) return activitiesData.data;
    return [];
  }, [activitiesData]);

  const filteredActivities = activitiesList;

  return {
    activities: filteredActivities,
    isActivitiesLoading: isLoading,
    timeFilter,
    setTimeFilter,
    getActivityTitle,
    getActivityDescription,
    getActivityDateAndTime,
    renderActivityIcon,
  };
}
