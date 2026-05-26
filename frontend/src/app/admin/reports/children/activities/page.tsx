"use client";
import { Suspense } from "react";
import Activities from "@/modules/admin/component/ReportsPageComponent/Children/Activities/Activities";
import { useReportParams } from "@/utils/hooks/useReportParams";

function ChildrenActivitiesContent() {
  const { classroomId, startDate, endDate } = useReportParams();
  return <Activities classroomId={classroomId} startDate={startDate} endDate={endDate} />;
}

export default function ChildrenActivitiesPage() {
  return <Suspense><ChildrenActivitiesContent /></Suspense>;
}
