"use client";
import { Suspense } from "react";
import Learning from "@/modules/admin/component/ReportsPageComponent/Children/Learnings/Learnings";
import { useReportParams } from "@/utils/hooks/useReportParams";

function ChildrenLearningsContent() {
  const { classroomId, startDate, endDate } = useReportParams();
  return <Learning classroomId={classroomId} startDate={startDate} endDate={endDate} />;
}

export default function ChildrenLearningsPage() {
  return <Suspense><ChildrenLearningsContent /></Suspense>;
}
