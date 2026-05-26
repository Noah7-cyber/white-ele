"use client";
import { Suspense } from "react";
import AttendanceClassrooms from "@/modules/admin/component/ReportsPageComponent/Attendance/Classrooms/Classrooms";
import { useReportParams } from "@/utils/hooks/useReportParams";

function AttendanceClassroomsContent() {
  const { startDate, endDate } = useReportParams();
  return <AttendanceClassrooms startDate={startDate} endDate={endDate} />;
}

export default function AttendanceClassroomsPage() {
  return <Suspense><AttendanceClassroomsContent /></Suspense>;
}
