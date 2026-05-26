"use client";
import { Suspense } from "react";
import BillingDeposit from "@/modules/admin/component/ReportsPageComponent/Billings/Deposit/Deposit";
import { useReportParams } from "@/utils/hooks/useReportParams";

function BillingDepositContent() {
  const { classroomId, startDate, endDate, depositStatus } = useReportParams();
  return <BillingDeposit classroomId={classroomId} startDate={startDate} endDate={endDate} status={depositStatus} />;
}

export default function BillingDepositPage() {
  return <Suspense><BillingDepositContent /></Suspense>;
}
