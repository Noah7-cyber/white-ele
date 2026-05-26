/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { activitiesServices, Activities as ActivityRecord } from "@/services/activities.service";
import MealIcon from "@/modules/shared/assets/svgs/mealIcon.svg";
import NapIcon from "@/modules/shared/assets/svgs/napIcon.svg";
import BottleIcon from "@/modules/shared/assets/svgs/waterIcon.svg";
import PhotoIcon from "@/modules/shared/assets/svgs/photoIcon.svg";
import MedicationIcon from "@/modules/shared/assets/svgs/medicationIcon.svg";
import BathroomIcon from "@/modules/shared/assets/svgs/bathroomIcon.svg";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { ParentDynamicEndpoints, KioskVerifyResponse } from "@/services/parent.service";
import client from "@/utils/client";
import { useUser } from "@/utils/hooks/useUser";
import { getDateRangeByPeriodType } from "@/utils/helpers";

interface Child {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
}
type ChildrenFilter = "All Children" | number; // number is child ID

export type UseActivitiesOptions = {
  startDate?: string;
  endDate?: string;
};

const DEFAULT_PERIOD_NAME = "This week";

const useActivities = (options?: UseActivitiesOptions) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [childrenFilter, setChildrenFilter] = useState<ChildrenFilter>("All Children");
  const { parentId } = useUser();

  const rangeFromParent = options?.startDate != null && options?.endDate != null;

  const [currentPeriod, setCurrentPeriod] = useState<string>(DEFAULT_PERIOD_NAME);
  const [customStart, setCustomStart] = useState<string>(() =>
    getDateRangeByPeriodType(DEFAULT_PERIOD_NAME).startDate,
  );
  const [customEnd, setCustomEnd] = useState<string>(() =>
    getDateRangeByPeriodType(DEFAULT_PERIOD_NAME).endDate,
  );

  const { startDate: rangeStart, endDate: rangeEnd } = getDateRangeByPeriodType(currentPeriod);
  const startDate: string = rangeFromParent
    ? options!.startDate!
    : currentPeriod === "Custom"
      ? customStart
      : rangeStart;
  const endDate: string = rangeFromParent
    ? options!.endDate!
    : currentPeriod === "Custom"
      ? customEnd
      : rangeEnd;

  // Build activities query with optional studentId or parentId
  const activitiesQuery = useMemo(() => {
    if (childrenFilter !== "All Children" && typeof childrenFilter === "number") {
      // Filter by specific child
      return {
        ...activitiesServices.getAllActivities,
        data: {
          studentId: childrenFilter,
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      };
    }
    // When "All Children" is selected, filter by parentId to get all children's activities
    if (parentId) {
      return {
        ...activitiesServices.getAllActivities,
        data: {
          parentId: parentId,
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      };
    }
    return activitiesServices.getAllActivities;
  }, [childrenFilter, parentId, startDate, endDate]);

  const { data: activitiesData, isLoading: isActivitiesLoading } = useQueryService<any, any>({
    service: activitiesQuery,
    options: {
      keys: [
        "activities",
        typeof childrenFilter === "number" ? String(childrenFilter) : childrenFilter,
        parentId ? String(parentId) : "no-parent",
        startDate,
        endDate,
      ],
      enabled: !!parentId, // Only fetch when parent ID is available
    },
  });
  // Extract activities from API response - handle both response structures
  const activitiesList: ActivityRecord[] = useMemo(() => {
    // Check if activities are directly in the response or nested in data
    if (activitiesData?.activities && Array.isArray(activitiesData.activities)) {
      return activitiesData.activities;
    }
    if (Array.isArray(activitiesData)) {
      return activitiesData;
    }
    if (activitiesData?.data?.activities && Array.isArray(activitiesData.data.activities)) {
      return activitiesData.data.activities;
    }
    // Handle case where response might be wrapped in a success object
    if (activitiesData?.data && Array.isArray(activitiesData.data)) {
      return activitiesData.data;
    }
    return [];
  }, [activitiesData]);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!parentId) {
        return;
      }

      try {
        const response = await client.request<void, KioskVerifyResponse>(
          ParentDynamicEndpoints.getParentById(parentId),
        );

        if (response.success && response.data?.children) {
          const childrenList: Child[] = response.data.children.map((child) => ({
            id: child.id,
            firstName: child.user.firstName,
            lastName: child.user.lastName,
            fullName: `${child.user.firstName} ${child.user.lastName}`.trim(),
          }));
          setChildren(childrenList);
        } else {
          setChildren([]);
        }
      } catch (error) {
        console.error("Error fetching children:", error);
        setChildren([]);
      }
    };

    fetchChildren();
  }, [parentId]);

  // Parent's children IDs - only show activities for these students
  const parentChildrenIds = useMemo(() => new Set(children.map((c) => c.id)), [children]);

  // Filter activities based on time and children filters; ensure parents only see their own children's activities
  const filteredActivities = useMemo(() => {
    let activities = [...activitiesList];

    // Restrict to this parent's children only (so parents never see another child's activity)
    if (parentChildrenIds.size > 0) {
      activities = activities.filter((activity) => {
        const activityStudentIds: number[] = [];
        if (activity.students && Array.isArray(activity.students)) {
          activity.students.forEach((s: any) => activityStudentIds.push(s.id));
        } else if (Array.isArray(activity.studentId)) {
          activityStudentIds.push(...activity.studentId);
        } else if (activity.studentId != null) {
          activityStudentIds.push(Number(activity.studentId));
        }
        return activityStudentIds.some((id) => parentChildrenIds.has(id));
      });
    }

    // Filter by selected child when not "All Children"
    if (childrenFilter !== "All Children" && typeof childrenFilter === "number") {
      activities = activities.filter((activity) => {
        if (activity.students && Array.isArray(activity.students)) {
          return activity.students.some((student: any) => student.id === childrenFilter);
        }
        if (Array.isArray(activity.studentId)) {
          return activity.studentId.includes(childrenFilter);
        }
        return activity.studentId === childrenFilter;
      });
    }

    return activities;
  }, [activitiesList, childrenFilter, parentChildrenIds]);

  const handlePeriodChange = (period: string) => {
    if (period === "Custom") return;
    setCurrentPeriod(period);
    const r = getDateRangeByPeriodType(period);
    setCustomStart(r.startDate);
    setCustomEnd(r.endDate);
  };

  const handleCustomDateApply = (s: string, e: string) => {
    setCurrentPeriod("Custom");
    setCustomStart(s);
    setCustomEnd(e);
  };
 

  // Handle children filter change
  const handleChildrenFilterChange = (filter: ChildrenFilter) => {
    setChildrenFilter(filter);
  };

  // Get child name by ID
  const getChildName = (childId: number) => {
    const child = children.find((c) => c.id === childId);
    return child ? child.fullName : `Child ${childId}`;
  };

  const renderActivityIcon = (type?: string) => {
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
      default:
        return `${capitalizedType} Activity`;
    }
  };

  const getActivityDescription = (activity: ActivityRecord) => {
    if (activity.notes) {
      return activity.notes;
    }

    // Handle both foodItem (singular) and foodItems (plural) from API
    const foodItem = (activity as any).foodItems || activity.foodItem;
    if (foodItem) {
      return `Food Item: ${foodItem}`;
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
      return `${activity.startTime} - ${activity.endTime}`;
    }
    const fallback = activity.timeGiven ?? activity.startTime ?? "—";
    return typeof fallback === "string" ? fallback : (fallback?.toString() ?? "—");
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

  return {
    activities: filteredActivities,
    isActivitiesLoading,
    children,
    childrenFilter,
    currentPeriod: rangeFromParent ? undefined : currentPeriod,
    startDate,
    endDate,
    handlePeriodChange,
    handleCustomDateApply,
    handleChildrenFilterChange,
    getChildName,
    renderActivityIcon,
    getActivityTitle,
    getActivityDescription,
    getActivityTime,
    getActivityDateAndTime,
  };
};

export default useActivities;
