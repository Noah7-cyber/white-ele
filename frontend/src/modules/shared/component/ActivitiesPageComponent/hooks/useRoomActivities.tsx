/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NapIcon from "@/modules/shared/assets/svgs/napIcon.svg";
import MealIcon from "@/modules/shared/assets/svgs/mealIcon.svg";
import BottleIcon from "@/modules/shared/assets/svgs/waterIcon.svg";
import PhotoIcon from "@/modules/shared/assets/svgs/photoIcon.svg";
import MedicationIcon from "@/modules/shared/assets/svgs/medicationIcon.svg";
import BathroomIcon from "@/modules/shared/assets/svgs/bathroomIcon.svg";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { StaffRoutes } from "@/routes/staff.routes";
import { getDateRange } from "@/utils/helpers";
import {
  AllActivityFormData,
  SelectOption,
  initialValue,
  validationSchema,
} from "../activities.constants";

export type ClassroomWithStudents = GetAllClassroomsResponse["data"][number] & {
  studentsCurrentClass?: Array<{
    id: number;
    userId?: number;
    admissionNumber?: string | null;
    user?: {
      firstName?: string | null;
      middleName?: string | null;
      lastName?: string | null;
    };
  }>;
};

import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { useUser } from "@/utils/hooks/useUser";
import {
  activitiesDynamicEndpoints,
  Activities,
  GetAllActivitiesResponse,
  ActivitiesFilterParams,
} from "@/services/activities.service";
import { classroomServices, GetAllClassroomsResponse } from "@/services/classroom.service";
import client from "@/utils/client";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { getDateRangeByPeriodType } from "@/utils/helpers";
// import { client } from "@/utils/client";

export type ActivityTypeString =
  | "nap"
  | "meal"
  | "water"
  | "photo"
  | "video"
  | "medication"
  | "bathroom"
  | "";

const useRoomActivities = (role: "admin" | "staff" = "admin") => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isRouteModalOpen = searchParams.get("modal") as ActivityTypeString;
  const pathname = usePathname();
  // allow role param to override pathname detection
  const isAdmin = role === "admin" || pathname?.includes("/admin/");

  // Staff-only: ID and assigned classes from profile (useUser calls profile endpoint)
  const { staffId: userStaffId, staffClassesAndSubject } = useUser();
  const staffId = role === "staff" ? (userStaffId ?? null) : null;
  const assignedClassIds = useMemo(() => {
    if (role !== "staff" || !staffClassesAndSubject?.length) return [];
    return staffClassesAndSubject
      .filter((item) => item.subjectId === null && item.classroom)
      .map((item) => item.classroom.id)
      .filter(Boolean);
  }, [role, staffClassesAndSubject]);

  // derive the specific query params we care about so effects don't run
  // when unrelated params (eg. `modal`) change
  const activityQueryParam = searchParams.get("activity");
  const classroomQueryParam = searchParams.get("classroom");

  // Get dates from URL or calculate default (Today/Weekly)
  const startDateFromUrl = searchParams.get("startDate");
  const endDateFromUrl = searchParams.get("endDate");

  // Calculate date range - use URL dates if available, otherwise default to Weekly
  const dateRange = useMemo(() => {
    if (startDateFromUrl && endDateFromUrl) {
      return { startDate: startDateFromUrl, endDate: endDateFromUrl };
    }
    // Default to weekly if no dates in URL
    return getDateRangeByPeriodType("Weekly");
  }, [startDateFromUrl, endDateFromUrl]);

  const { startDate, endDate } = dateRange;

  // ---------------------------------------------------------------------------
  // Time filter: derive the label from the current URL dates and expose handlers
  // so ActivitiesPageComponent can show and change the active time filter.
  // ---------------------------------------------------------------------------
  const TIME_OPTIONS = [
    { label: "Today", value: "Today" },
    { label: "This Week", value: "This Week" },
    { label: "This Month", value: "This Month" },
    { label: "Last Month", value: "Last Month" },
    { label: "This Year", value: "This Year" },
    { label: "Custom", value: "Custom" },
  ];

  // Derive human-readable label from current URL dates
  const selectedTimeFilter = useMemo(() => {
    if (!startDateFromUrl || !endDateFromUrl) return "This Week";
    for (const opt of TIME_OPTIONS) {
      if (opt.value === "Custom") continue;
      const range = getDateRange(opt.value);
      if (range.startDate === startDateFromUrl && range.endDate === endDateFromUrl) {
        return opt.label;
      }
    }
    return "Custom";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDateFromUrl, endDateFromUrl]);

  const handleTimeFilterChange = useCallback(
    (value: string) => {
      if (value === "Custom") return;
      const range = getDateRange(value);
      const newParams = new URLSearchParams(Array.from(searchParams.entries()) as [string, string][]);
      newParams.delete("periodType");
      newParams.set("startDate", range.startDate);
      newParams.set("endDate", range.endDate);
      router.push(`${pathname}?${newParams.toString()}`);
    },
    [searchParams, router, pathname],
  );

  const handleCustomDateRangeApply = useCallback(
    (customStart: string, customEnd: string) => {
      const newParams = new URLSearchParams(Array.from(searchParams.entries()) as [string, string][]);
      newParams.delete("periodType");
      newParams.set("startDate", customStart);
      newParams.set("endDate", customEnd);
      router.push(`${pathname}?${newParams.toString()}`);
    },
    [searchParams, router, pathname],
  );

  const formInstance = useFormValidator<AllActivityFormData>({
    validationSchema,
    defaultValues: initialValue as AllActivityFormData,
    reValidateMode: "onChange",
  });

  const [isActivitiesLoading, setIsActivitiesLoading] = useState<boolean>(false);

  const { control, setValue, getValues, reset, watch } = formInstance;

  const {
    data: classroomsResponse,
    isLoading: isClassroomsLoading,
    hasNextPage: hasMoreClassrooms,
    fetchNextPage: fetchNextClassroomPage,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
      data: { delta: 50 },
    },
  });

  const allClassroomsRaw = useMemo(
    () =>
      classroomsResponse?.pages?.flatMap((page: any) => page?.classrooms ?? page?.data ?? []) ?? [],
    [classroomsResponse?.pages],
  );

  useEffect(() => {
    let isCancelled = false;

    const fetchAllClassroomPages = async () => {
      if (!hasMoreClassrooms) return;
      let hasMore = true;
      while (hasMore && !isCancelled) {
        const nextResult = await fetchNextClassroomPage();
        hasMore = Boolean(nextResult?.hasNextPage);
      }
    };

    void fetchAllClassroomPages();

    return () => {
      isCancelled = true;
    };
  }, [hasMoreClassrooms, fetchNextClassroomPage]);

  const classrooms: ClassroomWithStudents[] = useMemo(() => {
    if (role !== "staff" || assignedClassIds.length === 0) {
      return allClassroomsRaw as ClassroomWithStudents[];
    }
    return allClassroomsRaw.filter((c) =>
      assignedClassIds.includes(c.id),
    ) as ClassroomWithStudents[];
  }, [role, assignedClassIds, allClassroomsRaw]);

  // 1. UNIFIED STATE: Replaces all six boolean states
  const [activeActivityType, setActiveActivityType] = useState<ActivityTypeString>("");

  // State for selected activity type filter
  const [selectedActivityType, setSelectedActivityType] = useState<string | null>(null);

  // State for selected classroom filter (from query params)
  const [selectedClassroomFilter, setSelectedClassroomFilter] = useState<number | null>(null);

  // Helper to determine the redirect path
  const redirectPath = isAdmin ? DashboardRoutes.roomsActivities : StaffRoutes.activities;

  // 2. UNIFIED OPEN/CLOSE FUNCTIONS

  // Function to open the modal and set the specific activity type
  const openModal = (type: ActivityTypeString) => {
    setActiveActivityType(type);
    try {
      const rawEntries = Array.from(searchParams.entries()) as [string, string | string[]][];
      const entries = rawEntries.map(([k, v]) => [
        k,
        typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : "",
      ]) as [string, string][];
      const params = new URLSearchParams(entries);
      params.set("modal", type || "");
      const url = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      router.replace(url);
    } catch (e) {
      console.log(e);
    }
  };

  // Function to close the modal and reset the URL state
  const closeModal = () => {
    setActiveActivityType("");
    // Remove only the `modal` param and preserve other filters (activity/classroom)
    try {
      const rawEntries = Array.from(searchParams.entries()) as [string, string | string[]][];
      const entries = rawEntries
        .filter(([k]) => k !== "modal")
        .map(([k, v]) => [k, typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : ""]) as [
        string,
        string,
      ][];
      const params = new URLSearchParams(entries);
      const url = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      router.replace(url);
    } catch (e) {
      console.log(e);
      router.replace(redirectPath);
    }
  };

  // 3. UPDATED activityActions ARRAY
  // The onClick handler now calls the unified openModal function with the specific type
  const activityActions = [
    {
      name: "Nap",
      type: "nap",
      icon: <NapIcon className="text-primary-text" />,
      onClick: () => openModal("nap"),
    },
    {
      name: "Meal",
      type: "meal",
      icon: <MealIcon className="text-primary-text" />,
      onClick: () => openModal("meal"),
    },
    {
      name: "Water",
      type: "water",
      icon: <BottleIcon className="text-primary-text" />,
      onClick: () => openModal("water"),
    },
    {
      name: "Media",
      type: "photo",
      icon: <PhotoIcon className="text-primary-text" />,
      onClick: () => openModal("photo"),
    },
    {
      name: "Medication",
      type: "medication",
      icon: <MedicationIcon className="text-primary-text" />,
      onClick: () => openModal("medication"),
    },
    {
      name: "Bathroom",
      type: "bathroom",
      icon: <BathroomIcon className="text-primary-text" />,
      onClick: () => openModal("bathroom"),
    },
  ];

  const [recentActivities, setRecentActivities] = useState<Activities[]>([]);
  const [allActivities, setAllActivities] = useState<Activities[]>([]); // For stats calculation

  // Fetch ALL activities (unfiltered) for stats calculation
  const fetchAllActivitiesForStats = useCallback(async () => {
    try {
      // For staff: require staffId
      if (role === "staff" && !staffId) return;

      setIsActivitiesLoading(true);
      const DELTA = 100;
      let allActivitiesList: Activities[] = [];

      // Build filter params - unified for both roles
      const filterParams: ActivitiesFilterParams = {
        delta: DELTA,
        pos: 0,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        // For staff: include teacherId as primary filter
        ...(role === "staff" && staffId ? { teacherId: staffId } : {}),
      };

      // Fetch first page
      const endpoint = activitiesDynamicEndpoints.getActivitiesWithFilters(filterParams);
      const firstRes = (await client.request<ActivitiesFilterParams, GetAllActivitiesResponse>({
        path: endpoint.path,
        method: endpoint.method,
        data: endpoint.filters,
      })) as GetAllActivitiesResponse;

      const firstPageActivities = firstRes?.activities || [];
      const paginationInfo = (firstRes as any)?.pagination || {};
      const totalCount =
        paginationInfo?.count || paginationInfo?.total || firstPageActivities.length;
      allActivitiesList = [...firstPageActivities];

      // Fetch remaining pages if needed
      if (totalCount > DELTA) {
        const totalPages = Math.ceil(totalCount / DELTA);
        const remainingPromises = [];
        for (let page = 2; page <= totalPages; page++) {
          const pos = (page - 1) * DELTA;
          const pageEndpoint = activitiesDynamicEndpoints.getActivitiesWithFilters({
            ...filterParams,
            pos,
          });
          remainingPromises.push(
            client.request<ActivitiesFilterParams, GetAllActivitiesResponse>({
              path: pageEndpoint.path,
              method: pageEndpoint.method,
              data: pageEndpoint.filters,
            }),
          );
        }
        const remainingPages = await Promise.all(remainingPromises);
        remainingPages.forEach((res: any) => {
          const activities = res?.activities || [];
          if (Array.isArray(activities)) {
            allActivitiesList = [...allActivitiesList, ...activities];
          }
        });
      }

      setAllActivities(allActivitiesList);
    } catch (error) {
      console.error("Failed to fetch all activities for stats", error);
      setAllActivities([]);
    } finally {
      setIsActivitiesLoading(false);
    }
  }, [role, staffId, startDate, endDate]);

  // Fetch filtered activities for recent activities list
  const fetchFilteredActivities = useCallback(
    async (classroomId?: number | null, activityType?: string | null) => {
      try {
        // For staff: require staffId
        if (role === "staff" && !staffId) {
          setRecentActivities([]);
          return;
        }

        const isMediaFilter = activityType === "photo";

        // Build filter params - single unified approach for both roles
        const filterParams: ActivitiesFilterParams = {
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
          ...(classroomId ? { classroomId } : {}),
          ...(!isMediaFilter && activityType ? { activityType } : {}),
          // For staff: include teacherId as primary filter
          ...(role === "staff" && staffId ? { teacherId: staffId } : {}),
        };

        const endpoint = activitiesDynamicEndpoints.getActivitiesWithFilters(filterParams);
        const response = (await client.request<ActivitiesFilterParams, GetAllActivitiesResponse>({
          path: endpoint.path,
          method: endpoint.method,
          data: endpoint.filters,
        })) as GetAllActivitiesResponse;

        const activities = response?.activities || [];
        const filteredActivities = isMediaFilter
          ? activities.filter(
            (activity) => activity.activityType === "photo" || activity.activityType === "video",
          )
          : activities;
        setRecentActivities(filteredActivities);
      } catch (error) {
        console.error("Failed to fetch filtered activities", error);
      }
    },
    [role, staffId, startDate, endDate],
  );

  // Fetch all activities for stats on mount and when role/assigned classes change
  useEffect(() => {
    void fetchAllActivitiesForStats();
  }, [fetchAllActivitiesForStats]);

  // Fetch filtered activities based on query params
  useEffect(() => {
    const activityQuery = activityQueryParam;
    const classroomQuery = classroomQueryParam;

    // Find classroom ID by name from query param
    let classroomId: number | null = null;
    if (classroomQuery && classrooms.length > 0) {
      const classroom = classrooms.find((c) => c.classroomName === classroomQuery);
      classroomId = classroom?.id ?? null;
      setSelectedClassroomFilter(classroomId);
    } else {
      setSelectedClassroomFilter(null);
    }

    const activityType = activityQuery?.toLowerCase() || null;
    setSelectedActivityType(activityType);

    void fetchFilteredActivities(classroomId, activityType);
    // Re-run when activity, classroom, dates, or classrooms list change
  }, [
    activityQueryParam,
    classroomQueryParam,
    classrooms,
    startDate,
    endDate,
    fetchFilteredActivities,
  ]);

  const classroomOptions: SelectOption[] = useMemo(
    () =>
      classrooms.map((classroom) => {
        const baseName = classroom.classroomName ?? `Classroom ${classroom.id}`;
        const hasStudents =
          Array.isArray(classroom.studentsCurrentClass) &&
          classroom.studentsCurrentClass.length > 0;
        return {
          name: hasStudents ? baseName : `${baseName} (Not enrolled)`,
          value: classroom.id,
        };
      }),
    [classrooms],
  );

  const selectedClassroomId = watch("classroomId");

  const studentOptions: SelectOption[] = useMemo(() => {
    const selectedClassroom = classrooms.find((classroom) => classroom.id === selectedClassroomId);
    if (!selectedClassroom || !Array.isArray(selectedClassroom.studentsCurrentClass)) {
      return [];
    }

    return selectedClassroom.studentsCurrentClass.map((student) => {
      const fullName = [student.user?.firstName, student.user?.middleName, student.user?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      return {
        name: fullName || student.admissionNumber || `Student ${student.id}`,
        value: student.id,
      };
    });
  }, [classrooms, selectedClassroomId]);

  // useEffect(() => {
  //   setValue("activityType", activeActivityType, { shouldDirty: false, shouldValidate: false });
  // }, [activeActivityType, setValue]);

  useEffect(() => {
    if (!studentOptions.length) {
      const currentSelections = getValues("studentIds");
      if (Array.isArray(currentSelections) && currentSelections.length) {
        setValue("studentIds", [], { shouldValidate: true });
      }
      return;
    }

    const currentSelections = getValues("studentIds");
    if (!Array.isArray(currentSelections) || !currentSelections.length) {
      return;
    }

    const allowedIds = new Set(studentOptions.map((option) => option.value));
    const hasInvalidSelection = currentSelections.some((id) => !allowedIds.has(id));

    if (hasInvalidSelection) {
      setValue("studentIds", [], { shouldValidate: true });
    }
  }, [studentOptions, getValues, setValue]);

  const activityStats = useMemo(() => {
    const today = new Date().toDateString();
    const isToday = (dateString?: string) =>
      !!dateString && new Date(dateString).toDateString() === today;

    // Filter activities by classroom if a classroom filter is active
    const filteredActivities = selectedClassroomFilter
      ? allActivities.filter((activity) => activity.classroom?.id === selectedClassroomFilter)
      : allActivities;
    const mealsToday = filteredActivities.filter(
      (activity) => activity.activityType === "meal" && isToday(activity.createdAt),
    ).length;

    const now = new Date();
    const currentHHmm = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const currentlyNapping = filteredActivities.filter((activity) => {
      if (activity.activityType !== "nap" || !isToday(activity.createdAt)) {
        return false;
      }

      const { startTime, endTime } = activity;

      // If startTime exists, it should have started already (HH:mm comparison)
      if (startTime && startTime > currentHHmm) return false;

      // If endTime exists, it should NOT have passed yet (HH:mm comparison)
      if (endTime && endTime <= currentHHmm) return false;

      return true;
    }).length;

    const totalMealsLogged = filteredActivities.filter(
      (activity) => activity.activityType === "meal",
    ).length;

    const mediaShared = filteredActivities.filter(
      (activity) => activity.activityType === "photo" || activity.activityType === "video",
    ).length;

    return {
      mealsToday,
      currentlyNapping,
      totalMealsLogged,
      mediaShared,
    };
  }, [allActivities, selectedClassroomFilter]);

  // 4. SIMPLIFIED useEffect for URL Sync
  useEffect(() => {
    if (isRouteModalOpen) {
      // 1. Reset the form when opening a new activity type
      reset(initialValue as AllActivityFormData); // Reset form values
      setActiveActivityType(isRouteModalOpen);
    }
  }, [isRouteModalOpen, reset]); // Add 'reset' to dependency array

  // 5. Cleanup useEffect (Optional but Recommended)
  useEffect(() => {
    // When the modal closes, ensure the form data is reset
    if (!activeActivityType) {
      reset(initialValue as AllActivityFormData);
    }
  }, [activeActivityType, reset]);

  // Combined refresh function that updates both stats and filtered activities
  const refreshActivities = useCallback(() => {
    // Refresh all activities for stats
    void fetchAllActivitiesForStats();

    // Refresh filtered activities based on current filters
    const activityQuery = activityQueryParam;
    const classroomQuery = classroomQueryParam;

    let classroomId: number | null = null;
    if (classroomQuery && classrooms.length > 0) {
      const classroom = classrooms.find((c) => c.classroomName === classroomQuery);
      classroomId = classroom?.id ?? null;
    }

    const activityType = activityQuery?.toLowerCase() || null;
    void fetchFilteredActivities(classroomId, activityType);
  }, [
    fetchAllActivitiesForStats,
    fetchFilteredActivities,
    activityQueryParam,
    classroomQueryParam,
    classrooms,
  ]);
  return {
    activityActions,
    // EXPOSE THE UNIFIED STATE
    activeActivityType,
    // EXPOSE THE UNIFIED CLOSING FUNCTION
    closeModal,
    // isModalOpen is a derived value now
    isModalOpen: !!activeActivityType,
    control,
    setValue,
    getValues,
    reset,
    watch,
    formInstance,
    recentActivities,
    isActivitiesLoading,
    refreshActivities,
    activityStats,
    classroomOptions,
    studentOptions,
    isClassroomsLoading,
    selectedClassroomId,
    // Activity type filtering
    selectedActivityType,
    // Classroom filtering
    selectedClassroomFilter,
    // Time filter
    selectedTimeFilter,
    handleTimeFilterChange,
    handleCustomDateRangeApply,
    timeOptions: TIME_OPTIONS,
    startDate,
    endDate,
  };
};

export default useRoomActivities;
