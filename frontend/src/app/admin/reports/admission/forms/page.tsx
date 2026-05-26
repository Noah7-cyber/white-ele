"use client";
import { Suspense } from "react";
import Forms from "@/modules/admin/component/ReportsPageComponent/Admission/Forms/Forms";
import { useReportParams } from "@/utils/hooks/useReportParams";

function AdmissionFormsContent() {
  const { classroomId, startDate, endDate } = useReportParams();
  return <Forms classroomId={classroomId} startDate={startDate} endDate={endDate} />;
}

export default function AdmissionFormsPage() {
  return <Suspense><AdmissionFormsContent /></Suspense>;
}
