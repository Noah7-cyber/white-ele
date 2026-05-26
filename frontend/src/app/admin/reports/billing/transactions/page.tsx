"use client";
import { Suspense } from "react";
import BillingTransactions from "@/modules/admin/component/ReportsPageComponent/Billings/Transactions/Transactions";
import { useReportParams } from "@/utils/hooks/useReportParams";

function BillingTransactionsContent() {
  const { classroomId, startDate, endDate } = useReportParams();
  return <BillingTransactions classroomId={classroomId} startDate={startDate} endDate={endDate} />;
}

export default function BillingTransactionsPage() {
  return <Suspense><BillingTransactionsContent /></Suspense>;
}
