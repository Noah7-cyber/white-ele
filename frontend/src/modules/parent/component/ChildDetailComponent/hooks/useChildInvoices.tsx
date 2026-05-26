/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQueryService } from "@/utils/hooks/useQueryService";
import { invoiceServices } from "@/services/invoice.service";
import { useParams } from "next/navigation";
import { capitalizeFirstLetter, dateFormatter } from "@/utils/helpers";
import { getInvoiceStatus } from "@/utils/helper";

export function useChildInvoices(filters?: { startDate?: string; endDate?: string }) {
  const { id } = useParams();

  const { data: invoiceData = {} as any, isLoading } = useQueryService({
    service: {
      ...invoiceServices.getAllInvoice,
      data: {
        studentId: id,
        ...(filters?.startDate ? { startDate: filters.startDate } : {}),
        ...(filters?.endDate ? { endDate: filters.endDate } : {}),
      },
    },
  });

  const invoices = (invoiceData?.data || []).map((invoice: any) => {
    const status = capitalizeFirstLetter(
      getInvoiceStatus({
        total: +invoice?.total,
        balance: +invoice?.balance,
        dueDate: invoice?.dueDate,
      }),
    );

    return {
      id: invoice.id,
      number: invoice.invoiceNumber,
      type: invoice.invoiceType,
      issuedDate: dateFormatter(invoice.issueDate),
      dueDate: dateFormatter(invoice.dueDate),
      dueDateRaw: invoice.dueDate,
      balance: `₦${Number(invoice.balance).toLocaleString()}`,
      total: `₦${Number(invoice.total).toLocaleString()}`,
      status: status,
    };
  });

  return {
    invoices,
    isLoading,
  };
}
