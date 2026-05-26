"use client";

import { AttendanceTab } from "@/modules/parent/component/ChildDetailComponent/AttendanceTab";
import { useChildDateFilter } from "@/modules/parent/component/ChildDetailComponent/ChildDetailComponent";

export default function ChildAttendancePage() {
  const { currentPeriod, startDate, endDate } = useChildDateFilter();
  const selectedLabel =
    currentPeriod.toLowerCase() === "today"
      ? "Today"
      : currentPeriod.toLowerCase() === "this week"
        ? "This Week"
        : "This Month";

  return <AttendanceTab selectedTime={selectedLabel} startDate={startDate} endDate={endDate} />;
}
