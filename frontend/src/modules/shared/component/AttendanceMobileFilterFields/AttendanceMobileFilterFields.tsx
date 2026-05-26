"use client";

import { Typography } from "@mui/material";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { useAttendanceContext } from "@/layout/Shared/attendanceLayout";

type Props = {
  pendingTime: string;
  setPendingTime: (v: string) => void;
  pendingGrade: string;
  setPendingGrade: (v: string) => void;
  showGradeFilter: boolean;
  onTapCustomDates: () => void;
};

export function AttendanceMobileFilterFields({
  pendingTime,
  setPendingTime,
  pendingGrade,
  setPendingGrade,
  showGradeFilter,
  onTapCustomDates,
}: Props) {
  const { timeFilters, gradeFilters, fetchMoreGradeClassrooms, gradeClassroomHasMore } =
    useAttendanceContext();

  const timeOptions =
    timeFilters.length > 0
      ? timeFilters.map((t) => ({ value: t.label, name: t.label }))
      : [{ value: "This Month", name: "This Month" }];
  const gradeOptions =
    gradeFilters.length > 0
      ? gradeFilters.map((g) => ({ value: g.value, name: g.label }))
      : [{ value: "All Classrooms", name: "All Classrooms" }];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Typography className="!text-sm !font-medium !text-[#02273A]">Time range</Typography>
        <Dropdown
          isForm
          options={timeOptions}
          value={pendingTime}
          onSelect={(value) => setPendingTime(String(value))}
          textFieldProps={{ placeholder: "Filter by time", isRounded: true }}
        />
        {pendingTime === "Custom" ? (
          <button
            type="button"
            className="text-sm font-medium text-brandColor-active text-left py-1"
            onClick={onTapCustomDates}
          >
            Pick custom dates…
          </button>
        ) : null}
      </div>
      {showGradeFilter ? (
        <div className="flex flex-col gap-2">
          <Typography className="!text-sm !font-medium !text-[#02273A]">Class / grade</Typography>
          <Dropdown
            isForm
            options={gradeOptions}
            value={pendingGrade}
            onSelect={(value) => setPendingGrade(String(value))}
            textFieldProps={{ placeholder: "Filter by class", isRounded: true }}
            hasMore={gradeClassroomHasMore}
            onLoadMore={fetchMoreGradeClassrooms}
          />
        </div>
      ) : null}
    </div>
  );
}
