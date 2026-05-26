"use client";
import { Suspense } from "react";
import StaffReport from "@/modules/admin/component/ReportsPageComponent/Staff/StaffReport/StaffReport";
import { useReportParams } from "@/utils/hooks/useReportParams";

function StaffReportContent() {
  const { classroomId, startDate, endDate } = useReportParams();
  return <StaffReport classroomId={classroomId} startDate={startDate} endDate={endDate} />;
}

export default function StaffReportPage() {
  return <Suspense><StaffReportContent /></Suspense>;
}
