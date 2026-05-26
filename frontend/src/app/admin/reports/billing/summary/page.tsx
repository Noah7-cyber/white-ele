"use client";
import { Suspense } from "react";
import BillingSummary from "@/modules/admin/component/ReportsPageComponent/Billings/Summary/Summary";
import { useReportParams } from "@/utils/hooks/useReportParams";

function BillingSummaryContent() {
  const { classroomId, startDate, endDate } = useReportParams();
  return <BillingSummary classroomId={classroomId} startDate={startDate} endDate={endDate} />;
}

export default function BillingSummaryPage() {
  return <Suspense><BillingSummaryContent /></Suspense>;
}
