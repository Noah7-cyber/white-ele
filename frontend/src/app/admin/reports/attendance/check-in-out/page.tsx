"use client";
import { Suspense } from "react";
import CheckInOut from "@/modules/admin/component/ReportsPageComponent/Attendance/CheckInOut/CheckInOut";
import { useReportParams } from "@/utils/hooks/useReportParams";

function AttendanceCheckInOutContent() {
  const { classroomId, startDate, endDate, attendanceStatus } = useReportParams();
  return <CheckInOut classroomId={classroomId} startDate={startDate} endDate={endDate} status={attendanceStatus} />;
}

export default function AttendanceCheckInOutPage() {
  return <Suspense><AttendanceCheckInOutContent /></Suspense>;
}
