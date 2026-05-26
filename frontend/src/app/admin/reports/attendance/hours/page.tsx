"use client";
import { Suspense } from "react";
import AttendanceHours from "@/modules/admin/component/ReportsPageComponent/Attendance/AttendanceHours/AttendanceHours";
import { useReportParams } from "@/utils/hooks/useReportParams";

function AttendanceHoursContent() {
  const { classroomId, startDate, endDate } = useReportParams();
  return <AttendanceHours classroomId={classroomId} startDate={startDate} endDate={endDate} />;
}

export default function AttendanceHoursPage() {
  return <Suspense><AttendanceHoursContent /></Suspense>;
}
