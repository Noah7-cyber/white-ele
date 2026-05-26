"use client";
import { Suspense } from "react";
import Tours from "@/modules/admin/component/ReportsPageComponent/Admission/Tours/Tours";
import { useReportParams } from "@/utils/hooks/useReportParams";

function AdmissionToursContent() {
  const { classroomId, startDate, endDate } = useReportParams();
  return <Tours classroomId={classroomId} startDate={startDate} endDate={endDate} />;
}

export default function AdmissionToursPage() {
  return <Suspense><AdmissionToursContent /></Suspense>;
}
