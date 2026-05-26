/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import PlusIcon from "@/modules/shared/assets/svgs/plus-icon.svg";
import ExpandMoreIcon from "@/modules/shared/assets/svgs/downIcon.svg";
import FilterPopover from "@/modules/shared/component/FilterPopover/filterPopover";
import { useLearningActions } from "./LearningActionsContext";
import { STATUS_FILTER_OPTIONS } from "@/modules/admin/page/Learnings/learning.constants";
import { Button } from "@/modules/shared/component/Button";
import { CWPopover } from "@/modules/shared/component/Popover";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { useUser } from "@/utils/hooks/useUser";
import { classroomServices } from "@/services/classroom.service";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer/MobileFilterDrawer";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { Typography } from "@mui/material";
import { PERIOD_OPTIONS } from "@/constants";
import TimeRangeFilterPopover from "@/modules/shared/component/FilterPopover/timeRangeFilterPopover";
import { getDateRangeByPeriodType } from "@/utils/helpers";
import { DatePicker } from "@/modules/shared/component/DatePicker";

const DEFAULT_CLASSROOM_LABEL = "All Classroom";

const statusFilterOptions = STATUS_FILTER_OPTIONS.map((o) => ({
  label: o.label,
  value: o.value,
}));

function statusFilterLabel(value: string): string {
  return STATUS_FILTER_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export default function LearningPageActions({
  basePath,
  mobileFilterOpen,
  setMobileFilterOpen,
}: {
  basePath?: string;
  mobileFilterOpen?: boolean;
  setMobileFilterOpen?: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const [classroomAnchor, setClassroomAnchor] = useState<HTMLElement | null>(null);
  const [statusAnchor, setStatusAnchor] = useState<HTMLElement | null>(null);
  const [periodAnchor, setPeriodAnchor] = useState<HTMLElement | null>(null);

  const {
    filterState,
    setFilterState,
    milestoneActions,
    subjectActions,
    curriculumActions,
    portfolioActions,
  } = useLearningActions();

  const resolvedBasePath = useMemo(() => {
    if (basePath) return basePath;
    if (pathname?.startsWith("/staff/learning")) return "/staff/learning";
    return "/admin/learning";
  }, [basePath, pathname]);

  const activeTab = useMemo(() => {
    const tabs = ["milestones", "subjects", "curriculum", "grading", "report"] as const;
    const match = tabs.find(
      (key) =>
        pathname === `${resolvedBasePath}/${key}` ||
        pathname?.startsWith(`${resolvedBasePath}/${key}/`),
    );
    return match ?? null;
  }, [pathname, resolvedBasePath]);

  const showFilters =
    activeTab === "milestones" ||
    activeTab === "subjects" ||
    activeTab === "curriculum" ||
    activeTab === "grading" ||
    activeTab === "report";

  const showStatusFilter = activeTab === "milestones";
  const showAddMilestone = activeTab === "milestones";
  const showAddSubject = activeTab === "subjects";
  const showAddCurriculum = activeTab === "curriculum";
  const showAddReport = activeTab === "report";
  const showPeriodFilter = activeTab === "report";
  const periodOptions = PERIOD_OPTIONS.map((o) => ({ label: o.name, value: o.name }));

  const { role, staffId } = useUser();
  const isStaff = pathname?.startsWith("/staff/learning") || role === "staff";

  const {
    data: classRoomData,
    hasNextPage: hasMoreClassRoom,
    fetchNextPage: fetchNextClassPage,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
      data: isStaff ? { staffId, status: "active" } : { status: "active" },
    },
  });

  const classroomFilterOptions = useMemo(() => {
    const list =
      classRoomData?.pages?.reduce<any[]>((acc, page) => {
        return acc.concat(page?.classrooms ?? page?.data ?? []);
      }, []) ?? [];
    return [
      { label: DEFAULT_CLASSROOM_LABEL, value: "" },
      ...list.map((c: any) => ({
        label: (c.classroomName ?? c.name ?? String(c.id)) as string,
        value: String(c.id),
      })),
    ];
  }, [classRoomData]);

  const fetchMoreClassRoom = async (): Promise<void> => {
    if (!hasMoreClassRoom) return;
    fetchNextClassPage();
  };

  if (!activeTab) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleMobileAddFromEvent = useCallback(() => {
    if (showAddMilestone) milestoneActions?.openAdd?.();
    else if (showAddSubject) subjectActions?.openAdd?.();
    else if (showAddCurriculum) curriculumActions?.openAdd?.();
    else if (showAddReport) portfolioActions?.openCreate?.();
  }, [
    showAddMilestone,
    milestoneActions,
    showAddSubject,
    subjectActions,
    showAddCurriculum,
    curriculumActions,
    showAddReport,
    portfolioActions,
  ]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    window.addEventListener("open-learning-add", handleMobileAddFromEvent);
    return () => window.removeEventListener("open-learning-add", handleMobileAddFromEvent);
  }, [handleMobileAddFromEvent]);

  return (
    <Box className="flex items-center gap-2">
      {showFilters && (
        <>
          <button
            onClick={(e) => setClassroomAnchor(e.currentTarget)}
            className="hidden md:flex items-center justify-around gap-2 px-2 h-10 !min-w-36 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
          >
            <span className="text-sm font-medium">{filterState.classroom}</span>
            <ExpandMoreIcon className="" />
          </button>
          <FilterPopover
            open={Boolean(classroomAnchor)}
            anchorEl={classroomAnchor}
            onClose={() => setClassroomAnchor(null)}
            options={classroomFilterOptions}
            onSelect={(v) => {
              const selected = classroomFilterOptions.find((o) => o.value === v);
              setFilterState((prev) => ({
                ...prev,
                classroom: selected?.label ?? DEFAULT_CLASSROOM_LABEL,
                classroomId: v,
              }));
              setClassroomAnchor(null);
            }}
            onScrollEnd={fetchMoreClassRoom}
            width={150}
          />
        </>
      )}
      {showPeriodFilter && (
        <>
          <button
            onClick={(e) => setPeriodAnchor(e.currentTarget)}
            className="hidden md:flex items-center justify-around gap-2 px-2 h-10 !min-w-36 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
          >
            <span className="text-sm font-medium">{filterState.period || "This year"}</span>
            <ExpandMoreIcon className="" />
          </button>
          <TimeRangeFilterPopover
            open={Boolean(periodAnchor)}
            anchorEl={periodAnchor}
            onClose={() => setPeriodAnchor(null)}
            options={periodOptions}
            onSelect={(value) => {
              const { startDate, endDate } = getDateRangeByPeriodType(value);
              setFilterState((prev) => ({ ...prev, period: value, startDate, endDate }));
              setPeriodAnchor(null);
            }}
            onCustomApply={(startDate, endDate) => {
              setFilterState((prev) => ({
                ...prev,
                period: "Custom",
                startDate,
                endDate,
              }));
              setPeriodAnchor(null);
            }}
            currentStartDate={filterState.startDate}
            currentEndDate={filterState.endDate}
            customButtonLabel="OK"
            width={120}
          />
        </>
      )}

      {showStatusFilter && (
        <>
          <button
            onClick={(e) => setStatusAnchor(e.currentTarget)}
            className="hidden md:flex items-center justify-around gap-2 px-2 h-10 !min-w-28 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
          >
            <span className="text-sm font-medium">{statusFilterLabel(filterState.status)}</span>
            <ExpandMoreIcon className="" />
          </button>
          <FilterPopover
            open={Boolean(statusAnchor)}
            anchorEl={statusAnchor}
            onClose={() => setStatusAnchor(null)}
            options={statusFilterOptions}
            onSelect={(v) => {
              setFilterState((prev) => ({ ...prev, status: v }));
              setStatusAnchor(null);
            }}
            width={150}
          />
        </>
      )}

      {showAddMilestone && (
        <CWPopover
          buttonProps={{
            className:
              "!rounded-lg !bg-brandColor-active !p-2 md:!px-4 !hidden md:!flex items-center",
          }}
          actionComponent={
            <>
              <PlusIcon />
              <span className="hidden md:inline ml-2">Add Milestone</span>
            </>
          }
        >
          <Box paddingY={1} className="flex flex-col gap-y-2 2xl:gap-y-3 p-4!">
            <button
              className="text-left !text-sm px-3 py-1.5 !cursor-pointer hover:bg-gray-100 rounded transition-colors"
              onClick={() => milestoneActions?.openAdd()}
            >
              + Add Milestone
            </button>
            <button
              className="text-left !text-sm px-3 py-1.5 !cursor-pointer hover:bg-gray-100 rounded transition-colors"
              onClick={() => milestoneActions?.openFromLibrary()}
            >
              + Add from library
            </button>
          </Box>
        </CWPopover>
      )}

      {showAddSubject && (
        <Button
          className="!rounded-lg !bg-brandColor-active !p-2 md:!px-4 !hidden md:!flex items-center justify-center min-w-[40px]"
          onClick={() => subjectActions?.openAdd()}
        >
          <div className="flex items-center">
            <PlusIcon />
            <span className="hidden md:inline ml-2">Add Subject</span>
          </div>
        </Button>
      )}

      {showAddCurriculum && (
        <Button
          className="!rounded-lg !bg-brandColor-active !p-2 md:!px-4 !hidden md:!flex items-center justify-center min-w-[40px]"
          onClick={() => curriculumActions?.openAdd()}
        >
          <div className="flex items-center">
            <PlusIcon />
            <span className="hidden md:inline ml-2">Add Curriculum</span>
          </div>
        </Button>
      )}

      {showAddReport && (
        <Button
          className="!rounded-lg !bg-brandColor-active !p-2 md:!px-4 !hidden md:!flex items-center justify-center min-w-[40px]"
          onClick={() => portfolioActions?.openCreate()}
        >
          <div className="flex items-center">
            <PlusIcon />
            <span className="hidden md:inline ml-2">Create Report</span>
          </div>
        </Button>
      )}

      <MobileFilterDrawer
        open={Boolean(mobileFilterOpen)}
        onClose={() => setMobileFilterOpen?.(false)}
        onApply={() => setMobileFilterOpen?.(false)}
        onReset={() => {
          setFilterState((prev: any) => ({
            ...prev,
            classroom: DEFAULT_CLASSROOM_LABEL,
            classroomId: "",
            status: "",
            period: "This year",
            ...getDateRangeByPeriodType("This year"),
          }));
          setMobileFilterOpen?.(false);
        }}
      >
        <div className="flex flex-col gap-4">
          {showFilters && (
            <div className="flex flex-col gap-2">
              <Typography className="!text-sm !font-medium !text-[#02273A]">All Classes</Typography>
              <Dropdown
                isForm
                options={classroomFilterOptions.map((f: any) => ({
                  value: f.value,
                  name: f.label,
                }))}
                value={filterState.classroomId || ""}
                onSelect={(value) => {
                  const selected = classroomFilterOptions.find((o: any) => o.value === value);
                  setFilterState((prev: any) => ({
                    ...prev,
                    classroom: selected?.label ?? DEFAULT_CLASSROOM_LABEL,
                    classroomId: value as string,
                  }));
                }}
                textFieldProps={{ placeholder: "Select classes", isRounded: true }}
                hasMore={Boolean(hasMoreClassRoom)}
                onLoadMore={fetchMoreClassRoom}
              />
            </div>
          )}
          {showStatusFilter && (
            <div className="flex flex-col gap-2 mt-2">
              <Typography className="!text-sm !font-medium !text-[#02273A]">Status</Typography>
              <Dropdown
                isForm
                options={statusFilterOptions.map((f: any) => ({ value: f.value, name: f.label }))}
                value={filterState.status || ""}
                onSelect={(value) => {
                  setFilterState((prev: any) => ({ ...prev, status: value as string }));
                }}
                textFieldProps={{ placeholder: "Select status", isRounded: true }}
              />
            </div>
          )}
          {showPeriodFilter && (
            <div className="flex flex-col gap-2 mt-2">
              <Typography className="!text-sm !font-medium !text-[#02273A]">Time Range</Typography>
              <Dropdown
                isForm
                options={periodOptions.map((p: any) => ({ value: p.value, name: p.label }))}
                value={filterState.period || "This year"}
                onSelect={(value) => {
                  const selectedPeriod = String(value);
                  if (selectedPeriod === "Custom") {
                    setFilterState((prev: any) => ({ ...prev, period: "Custom" }));
                    return;
                  }
                  const { startDate, endDate } = getDateRangeByPeriodType(selectedPeriod);
                  setFilterState((prev: any) => ({
                    ...prev,
                    period: selectedPeriod,
                    startDate,
                    endDate,
                  }));
                }}
                textFieldProps={{ placeholder: "Select range", isRounded: true }}
              />
              {filterState.period === "Custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    label="Start Date"
                    labelOnTop
                    value={filterState.startDate}
                    onChange={(value) =>
                      setFilterState((prev: any) => ({ ...prev, period: "Custom", startDate: value }))
                    }
                  />
                  <DatePicker
                    label="End Date"
                    labelOnTop
                    value={filterState.endDate}
                    onChange={(value) =>
                      setFilterState((prev: any) => ({ ...prev, period: "Custom", endDate: value }))
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </MobileFilterDrawer>
    </Box>
  );
}
