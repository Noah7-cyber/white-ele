/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Typography, Box } from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PlusIcon from "@/modules/shared/assets/svgs/plus-icon.svg";
import CaretDown from "@/modules/shared/assets/svgs/caretDown.svg";
import { CWPopover } from "@/modules/shared/component/Popover";
import { ACTIVITIES_OPTIONS, PERIOD_OPTIONS } from "@/constants";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { appendQueryParams, getDateRangeByPeriodType } from "@/utils/helpers";
import { classroomServices } from "@/services/classroom.service";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { ClassroomWithStudents } from "@/modules/shared/component/ActivitiesPageComponent/hooks/useRoomActivities";
import ScrollableTabBar from "@/layout/Shared/ScrollableTabBar";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer/MobileFilterDrawer";
import { Dropdown } from "@/modules/shared/component/Dropdown";

interface RoomLayoutProps {
  children?: React.ReactNode;
}

interface SelectOption {
  name: string;
  value: number;
}

export default function RoomLayout({ children }: RoomLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const {
    data: classRoomPages,
    hasNextPage: hasMoreClassrooms,
    fetchNextPage: fetchNextClassroomPage,
  } = useInfiniteQueryService<any, any>({
    service: { ...classroomServices.getAllClassrooms },
  });

  const classrooms = useMemo<ClassroomWithStudents[]>(() => {
    const pages = classRoomPages?.pages ?? [];
    return pages.flatMap(
      (page: any) => page?.classrooms ?? page?.data ?? [],
    ) as ClassroomWithStudents[];
  }, [classRoomPages]);

  const fetchMoreClassrooms = useCallback(async () => {
    if (!hasMoreClassrooms) return;
    await fetchNextClassroomPage();
  }, [hasMoreClassrooms, fetchNextClassroomPage]);

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

  useEffect(() => {
    const handleOpen = () => setMobileFilterOpen(true);
    window.addEventListener("open-activities-filter", handleOpen);
    return () => window.removeEventListener("open-activities-filter", handleOpen);
  }, []);

  const classroomOptions: SelectOption[] = useMemo(
    () =>
      classrooms.map((classroom) => ({
        name: classroom.classroomName ?? `Classroom ${classroom.id}`,
        value: classroom.id,
      })),
    [classrooms],
  );

  const isAddClass = pathname?.includes("/admin/rooms/classes/add");
  const isEditClass = pathname?.includes("/admin/rooms/classes/") && pathname?.includes("/edit");
  const isViewClass = pathname?.includes("/admin/rooms/classes/") && !isEditClass;
  const isActivities = pathname?.includes("/admin/rooms/activities");

  // Get current period from URL dates (must be before early return)
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

  if (isAddClass || isEditClass || isViewClass) {
    // Render page without the Rooms layout (no header/tabs)
    return <>{children}</>;
  }
  const handleFilterChange = (value: number) => {
    // Find the classroom name by ID
    const classroom = classroomOptions.find((opt) => opt.value === value);
    if (classroom) {
      router.push(
        appendQueryParams(
          DashboardRoutes.roomsActivities,
          { classroom: classroom.name },
          searchParams,
        ),
      );
    }
  };
  const handleCreateActivityChange = (name: string) => {
    router.push(appendQueryParams(DashboardRoutes.roomsActivities, { modal: name }));
  };
  const handleActivityChange = (name: string) => {
    // Uses `activity` query param; lowercased so it matches expected service values (e.g. 'nap', 'meal')
    // const activityValue = name?.toLowerCase?.() ?? name;
    router.push(
      appendQueryParams(DashboardRoutes.roomsActivities, { activity: name }, searchParams),
    );
  };

  const handlePeriodChange = (period: string) => {
    const { startDate, endDate } = getDateRangeByPeriodType(period);

    // Update URL with startDate and endDate, remove period param
    const params = new URLSearchParams(searchParams.toString());
    params.delete("period");
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    router.push(`${DashboardRoutes.roomsActivities}?${params.toString()}`);
  };

  const handleMobileActivityChange = (name: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!name) {
      params.delete("activity");
    } else {
      params.set("activity", name);
    }
    const queryString = params.toString();
    router.push(
      queryString ? `${DashboardRoutes.roomsActivities}?${queryString}` : DashboardRoutes.roomsActivities,
    );
  };

  const handleMobileClassroomChange = (name: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!name) {
      params.delete("classroom");
    } else {
      params.set("classroom", name);
    }
    const queryString = params.toString();
    router.push(
      queryString ? `${DashboardRoutes.roomsActivities}?${queryString}` : DashboardRoutes.roomsActivities,
    );
  };

  const resetMobileFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("activity");
    params.delete("classroom");
    const weeklyRange = getDateRangeByPeriodType("Weekly");
    params.set("startDate", weeklyRange.startDate);
    params.set("endDate", weeklyRange.endDate);
    router.push(`${DashboardRoutes.roomsActivities}?${params.toString()}`);
    setMobileFilterOpen(false);
  };

  return (
    <Box className="h-full p-5 space-y-6">
      {/* Header with dynamic right-side controls */}
      <Box className="flex items-center justify-between">
        <Typography className="text-xl! font-semibold! text-primary-gray! md:block hidden">Classroom</Typography>
        {/* {isClasses && (
          <Box className="flex items-center gap-2">
            <Button
              className="rounded-lg!"
              startIcon={<PlusIcon />}
              onClick={() => router.push("/admin/rooms/classes/add")}
            >
              Add Classroom
            </Button>
          </Box>
        )} */}
        {isActivities ? (
          <>
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
                    "!w-full !rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm !text-nowrap !min-w-fit !whitespace-nowrap",
                }}
              >
                {(closePopover) => (
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
                            ? `${DashboardRoutes.roomsActivities}?${queryString}`
                            : DashboardRoutes.roomsActivities,
                        );
                        closePopover();
                      }}
                    >
                      All Activities
                    </button>
                    {ACTIVITIES_OPTIONS.map(({ name }: { name: string }, index: number) => (
                      <button
                        className="text-xs! 2xl:text-base! p-1 flex flex-row gap-2 items-center cursor-pointer"
                        key={index}
                        onClick={() => {
                          handleActivityChange(name);
                          closePopover();
                        }}
                      >
                        {name === "Photo" ? "Media" : name}
                      </button>
                    ))}
                  </Box>
                )}
              </CWPopover>

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
                    "!w-full !rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm !text-nowrap !min-w-fit !whitespace-nowrap",
                }}
              >
                {(closePopover) => (
                  <Box paddingY={1}>
                    <Box className="flex flex-col gap-y-2 2xl:gap-y-3 p-4!">
                      <button
                        className="text-sm! 2xl:text-base! p-1 !w-full! flex flex-row gap-2 items-center !cursor-pointer"
                        onClick={() => {
                          // Remove classroom filter but keep other filters
                          const params = new URLSearchParams(searchParams);
                          params.delete("classroom");
                          const queryString = params.toString();
                          router.push(
                            queryString
                              ? `${DashboardRoutes.roomsActivities}?${queryString}`
                              : DashboardRoutes.roomsActivities,
                          );
                          closePopover();
                        }}
                      >
                        All Classroom
                      </button>
                      {classroomOptions.map(
                        ({ name, value }: { name: string; value: number }, index: number) => (
                          <button
                            className="text-sm! 2xl:text-base! p-1 flex flex-row gap-2 items-center cursor-pointer"
                            key={index}
                            onClick={() => {
                              handleFilterChange(value);
                              closePopover();
                            }}
                          >
                            {name}
                          </button>
                        ),
                      )}
                    </Box>
                  </Box>
                )}
              </CWPopover>
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
                    "!rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm w-full !whitespace-nowrap",
                }}
              >
                {(closePopover) => (
                  <Box paddingY={1} className="flex flex-col gap-y-2 2xl:gap-y-3 p-4!">
                    {PERIOD_OPTIONS.map(({ name }: { name: string }, index: number) => (
                      <button
                        className="text-sm! 2xl:text-base! p-1 flex flex-row gap-2 items-center cursor-pointer"
                        key={index}
                        onClick={() => {
                          handlePeriodChange(name);
                          closePopover();
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </Box>
                )}
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
                {(closePopover) => (
                  <Box paddingY={1} className="flex flex-col w-43 gap-y-2 2xl:gap-y-3 p-4!">
                    {ACTIVITIES_OPTIONS.map(({ name }: { name: string }, index: number) => (
                      <button
                        className="text-xs! 2xl:text-base! p-1 flex flex-row gap-2 items-center cursor-pointer"
                        key={index}
                        onClick={() => {
                          handleCreateActivityChange(name);
                          closePopover();
                        }}
                      >
                        {name === "Photo" ? "Media" : name}
                      </button>
                    ))}
                  </Box>
                )}
              </CWPopover>
            </Box>
          </>
        ) : null}
      </Box>

      {/* Tabs */}
      <ScrollableTabBar className="border-b! border-border-lighten!">
        {[
          { href: "/admin/rooms/classes", label: "Classes" },
          { href: "/admin/rooms/activities", label: "Activities" },
        ].map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`shrink-0 whitespace-nowrap text-sm! font-normal! pb-2 px-3 ${active
                ? "font-medium! border-b! border-brandColor-active! text-brandColor-active!"
                : "text-[#475467]"
                }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </ScrollableTabBar>

      {children}

      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        onApply={() => setMobileFilterOpen(false)}
        onReset={resetMobileFilters}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Typography className="!text-sm !font-medium !text-[#02273A]">Activity</Typography>
            <Dropdown
              isForm
              options={[
                { value: "", name: "All Activities" },
                ...ACTIVITIES_OPTIONS.map((option) => ({
                  value: option.name,
                  name: option.name === "Photo" ? "Media" : option.name,
                })),
              ]}
              value={searchParams.get("activity") || ""}
              onSelect={(value) => handleMobileActivityChange(String(value))}
              textFieldProps={{ placeholder: "Select activity", isRounded: true }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Typography className="!text-sm !font-medium !text-[#02273A]">Classroom</Typography>
            <Dropdown
              isForm
              options={[
                { value: "", name: "All Classroom" },
                ...classroomOptions.map((option) => ({
                  value: option.name,
                  name: option.name,
                })),
              ]}
              value={searchParams.get("classroom") || ""}
              onSelect={(value) => handleMobileClassroomChange(String(value))}
              textFieldProps={{ placeholder: "Select classroom", isRounded: true }}
              hasMore={Boolean(hasMoreClassrooms)}
              onLoadMore={fetchMoreClassrooms}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Typography className="!text-sm !font-medium !text-[#02273A]">Period</Typography>
            <Dropdown
              isForm
              options={PERIOD_OPTIONS.map((option) => ({
                value: option.name,
                name: option.name,
              }))}
              value={currentPeriod}
              onSelect={(value) => handlePeriodChange(String(value))}
              textFieldProps={{ placeholder: "Select period", isRounded: true }}
            />
          </div>
        </div>
      </MobileFilterDrawer>
    </Box>
  );
}
