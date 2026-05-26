/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { ReactNode, useEffect, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { CWPopover } from "@/modules/shared/component/Popover";
import CaretDown from "@/modules/shared/assets/svgs/caretDown.svg";
import { ACTIVITIES_OPTIONS, PERIOD_OPTIONS } from "@/constants";
import { appendQueryParams, getDateRangeByPeriodType } from "@/utils/helpers";
import { StaffRoutes } from "@/routes/staff.routes";
import PlusIcon from "@/modules/shared/assets/svgs/plus-icon.svg";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/utils/hooks/useUser";
import { classroomServices } from "@/services/classroom.service";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";

export default function ActivitiesLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { staffClassesAndSubject, staffId } = useUser();
  const assignedClassIds = useMemo(() => {
    if (!staffClassesAndSubject?.length) return [];
    return staffClassesAndSubject
      .filter((item) => item.classroom)
      .map((item) => item.classroom.id);
  }, [staffClassesAndSubject]);

  const {
    data: classRoomPages,
    hasNextPage: hasMoreClassrooms,
    fetchNextPage: fetchNextClassroomPage,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
      data: {
        ...(staffId ? { staffId } : {}),
      },
    },
    options: {
      enabled: !!staffId,
    },
  });

  useEffect(() => {
    let isCancelled = false;

    const fetchAllClassrooms = async () => {
      if (!hasMoreClassrooms) return;
      let hasMore = true;
      while (hasMore && !isCancelled) {
        const nextResult = await fetchNextClassroomPage();
        hasMore = Boolean(nextResult?.hasNextPage);
      }
    };

    void fetchAllClassrooms();

    return () => {
      isCancelled = true;
    };
  }, [hasMoreClassrooms, fetchNextClassroomPage]);

  const classrooms = useMemo(() => {
    const pages = classRoomPages?.pages ?? [];
    const merged = pages.flatMap((page: any) => page?.classrooms ?? page?.data ?? []);
    if (!assignedClassIds.length) return merged;
    const assignedSet = new Set(assignedClassIds);
    return merged.filter((classroom: { id: number }) => assignedSet.has(classroom.id));
  }, [classRoomPages, assignedClassIds]);

  const classroomOptions = useMemo(() => {
    return classrooms.map((classroom: { classroomName: string; id: number }) => ({
      name: classroom.classroomName,
      value: classroom.id,
    }));
  }, [classrooms]);

  const handleFilterChange = (value: number) => {
    // Find the classroom name by ID
    const classroom = classroomOptions.find((opt) => opt.value === value);
    if (classroom) {
      router.push(
        appendQueryParams(StaffRoutes.activities, { classroom: classroom.name }, searchParams),
      );
    }
  };
  const handleActivityChange = (name: string) => {
    router.push(appendQueryParams(StaffRoutes.activities, { activity: name }, searchParams));
  };
  const handleCreateActivityChange = (name: string) => {
    router.push(appendQueryParams(StaffRoutes.activities, { modal: name }));
  };

  // Get current period from URL dates
  const currentPeriod = useMemo(() => {
    const startDateFromUrl = searchParams?.get("startDate");
    const endDateFromUrl = searchParams?.get("endDate");

    if (!startDateFromUrl || !endDateFromUrl) {
      return "This Week"; // Default
    }

    const todayRange = getDateRangeByPeriodType("Today");
    const weeklyRange = getDateRangeByPeriodType("Weekly");
    const monthlyRange = getDateRangeByPeriodType("Monthly");
    const lastMonthRange = getDateRangeByPeriodType("Last month");
    const thisYearRange = getDateRangeByPeriodType("This year");
    const lastYearRange = getDateRangeByPeriodType("Last year");

    if (startDateFromUrl === todayRange.startDate && endDateFromUrl === todayRange.endDate) {
      return "Today";
    }
    if (startDateFromUrl === weeklyRange.startDate && endDateFromUrl === weeklyRange.endDate) {
      return "This Week";
    }
    if (startDateFromUrl === monthlyRange.startDate && endDateFromUrl === monthlyRange.endDate) {
      return "This Month";
    }
    if (
      startDateFromUrl === lastMonthRange.startDate &&
      endDateFromUrl === lastMonthRange.endDate
    ) {
      return "Last Month";
    }
    if (startDateFromUrl === thisYearRange.startDate && endDateFromUrl === thisYearRange.endDate) {
      return "This Year";
    }
    if (startDateFromUrl === lastYearRange.startDate && endDateFromUrl === lastYearRange.endDate) {
      return "Last Year";
    }
    return "Custom";
  }, [searchParams]);

  const handlePeriodChange = (period: string) => {
    const { startDate, endDate } = getDateRangeByPeriodType(period);

    // Update URL with startDate and endDate, remove periodType param
    const params = new URLSearchParams(searchParams.toString());
    params.delete("periodType");
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    router.push(`${StaffRoutes.activities}?${params.toString()}`);
  };

  return (
    <Box className="space-y-6 flex flex-col h-full p-5">
      <Box className="w-full hidden md:flex items-center justify-between">
        <Typography className="!hidden md:block font-semibold! text-xl! text-text-primary!">Activities</Typography>
        <Box className="hidden md:flex items-center gap-2">
          <CWPopover
            actionComponent={
              <>
                {searchParams.get("activity") || "All Activities"} <CaretDown className="ml-2" />
              </>
            }
            buttonProps={{
              isRounded: false,
              variant: "outlined",
              className:
                "!w-full !rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm !text-nowrap !min-w-fit",
            }}
          >
            <Box paddingY={1} className="flex flex-col gap-y-2 2xl:gap-y-3 p-4!">
              <button
                className="text-sm! 2xl:text-base! p-1 flex flex-row gap-2 items-center cursor-pointer"
                onClick={() => {
                  // Remove activity filter but keep other filters
                  const params = new URLSearchParams(searchParams);
                  params.delete("activity");
                  const queryString = params.toString();
                  router.push(
                    queryString
                      ? `${StaffRoutes.activities}?${queryString}`
                      : StaffRoutes.activities,
                  );
                }}
              >
                All Activities
              </button>
              {ACTIVITIES_OPTIONS.map(({ name }: { name: string }, index: number) => (
                <button
                  className="text-xs! 2xl:text-base! p-1 flex flex-row gap-2 items-center cursor-pointer"
                  key={index}
                  onClick={() => handleActivityChange(name)}
                >
                  {name}
                </button>
              ))}
            </Box>
          </CWPopover>
          {classroomOptions.length > 1 && (
            <CWPopover
              actionComponent={
                <>
                  {searchParams.get("classroom") || "All Classroom"}
                  <CaretDown className="ml-2" />
                </>
              }
              buttonProps={{
                isRounded: false,
                variant: "outlined",
                className:
                  "!w-full !rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm !text-nowrap !min-w-fit",
              }}
            >
              <Box paddingY={1}>
                <Box className="flex flex-col gap-y-2 2xl:gap-y-3 p-4!">
                  <button
                    className="text-sm! 2xl:text-base! p-1 flex flex-row gap-2 items-center cursor-pointer"
                    onClick={() => {
                      // Remove classroom filter but keep other filters
                      const params = new URLSearchParams(searchParams);
                      params.delete("classroom");
                      const queryString = params.toString();
                      router.push(
                        queryString
                          ? `${StaffRoutes.activities}?${queryString}`
                          : StaffRoutes.activities,
                      );
                    }}
                  >
                    All Classroom
                  </button>
                  {classroomOptions.map(
                    ({ name, value }: { name: string; value: number }, index: number) => (
                      <button
                        className="text-sm! 2xl:text-base! p-1 flex flex-row gap-2 items-center cursor-pointer"
                        key={index}
                        onClick={() => handleFilterChange(value)}
                      >
                        {name}
                      </button>
                    ),
                  )}
                </Box>
              </Box>
            </CWPopover>
          )}
          <CWPopover
            actionComponent={
              <>
                {currentPeriod} <CaretDown className="ml-2" />
              </>
            }
            buttonProps={{
              isRounded: false,
              variant: "outlined",
              className:
                "!rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm w-full",
            }}
          >
            <Box paddingY={1} className="flex flex-col gap-y-2 2xl:gap-y-3 p-4!">
              {PERIOD_OPTIONS.map(({ name }: { name: string }, index: number) => (
                <button
                  className="text-sm! 2xl:text-base! p-1 flex flex-row gap-2 items-center cursor-pointer"
                  key={index}
                  onClick={() => handlePeriodChange(name)}
                >
                  {name}
                </button>
              ))}
            </Box>
          </CWPopover>
          <CWPopover
            actionComponent={
              <>
                Create Activities <PlusIcon className="ml-2" />
              </>
            }
            buttonProps={{
              isRounded: false,
              className: "!rounded-lg! text-sm w-full min-w-fit!",
            }}
          >
            <Box paddingY={1} className="flex flex-col w-43 gap-y-2 2xl:gap-y-3 p-4!">
              {ACTIVITIES_OPTIONS.map(
                ({ name }: { name: string; isActive: boolean }, index: number) => (
                  <button
                    className="text-xs! 2xl:text-base! p-1 flex flex-row gap-2 items-center cursor-pointer"
                    key={index}
                    onClick={() => handleCreateActivityChange(name)}
                  >
                    {name}
                  </button>
                ),
              )}
            </Box>
          </CWPopover>
        </Box>
      </Box>
      {children}
    </Box>
  );
}
