/* eslint-disable @typescript-eslint/no-explicit-any */
import { dateFormatter } from "@/utils/helpers";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";
import { analyticsServices } from "@/services/analytics.service";
import { CashViewer } from "@/modules/shared/component/CashViewer";

interface SummaryRow {
  studentName: string;
  totalPresentHours: number;
  totalAbsentHours: number;
  [key: string]: any;
}

export function useSummary(classroomId?: number | null, startDate?: string, endDate?: string) {
  const { filters, applyFilters } = useFilter({
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });

  // Re-using student summary endpoint if appropriate, or check if there's a specific report endpoint
  const { data: response = {} as any, isLoading } = useQueryService({
    service: {
      ...analyticsServices.getBillingSummery,
      data: {
        ...(filters?.delta ? { delta: filters?.delta } : {}),
        ...(filters?.pos ? { pos: filters?.pos } : {}),
        ...(classroomId ? { classroomId } : {}),
        ...(startDate && endDate ? { startDate, endDate } : {}),
      },
    },
    options: {
      keys: ["attendance-hours", classroomId, startDate, endDate, filters.pos, filters.delta],
    },
  });

  // Handle both response structures: { data: [], pagination: {} } or just { data: [] }
  const summaryData = response?.data || [];
  const pagination = response?.pagination || {
    pos: filters?.pos || 0,
    delta: filters?.delta || ITEMS_PER_PAGE,
    count: summaryData.length,
  };

  const tableData = summaryData.map((item: SummaryRow) => ({
    name: item?.studentName,
    date: dateFormatter(item?.invoiceDates?.[0]),
    invoices: item?.invoicesIssued || 0,
    total: <CashViewer amount={item?.totalInvoiceAmount} />,
    balance: <CashViewer amount={item?.outstandingBalance} />,
    paid: <CashViewer amount={item?.paid} />,
  }));

  const currentPage =
    Math.floor((pagination?.pos || 0) / (pagination?.delta || ITEMS_PER_PAGE)) + 1;

  return {
    isLoading,
    tableData,
    currentPage,
    pagination,
    filters,
    applyFilters,
  };
}
