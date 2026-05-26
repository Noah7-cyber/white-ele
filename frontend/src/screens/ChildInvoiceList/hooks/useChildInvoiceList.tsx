/* eslint-disable @typescript-eslint/no-explicit-any */
import { capitalizeFirstLetter, dateFormatter } from "@/utils/helpers";
import ChildInvoiceRowAction from "@/modules/admin/component/ChildInvoiceRowAction/childInvoiceRowAction";
import { useState } from "react";
import { ModalRoute } from "@/routes/modalRoutes";
import { useModalRoute } from "@/utils/hooks/useModalRoute";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { invoiceDynamicEndpoints, invoiceServices } from "@/services/invoice.service";
import { useParams, useRouter } from "next/navigation";
import { getInvoiceStatus } from "@/utils/helper";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { CashViewer } from "@/modules/shared/component/CashViewer";
import { ITEMS_PER_PAGE } from "@/constants";
import { useFilter } from "@/utils/hooks/useFilter";

const invoiceTypes: Record<string, string> = {
  oneTime: "One Time Invoice",
  recurring: "Recurring Invoice",
};

export function useChildInvoiceList(role: "admin" | "staff" | "parent" = "admin") {
  const { id } = useParams();
  const { openModal } = useModalRoute();
  const { filters, applyFilters } = useFilter({
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });
  const [invoiceToDelete, setInvoiceToDelete] = useState<any | null>(null);
  const [recordPaymentInvoiceId, setRecordPaymentInvoiceId] = useState<string | null>(null);
  const [downloadInvoiceId, setDownloadInvoiceId] = useState<string | null>(null);
  const router = useRouter();
  const isStaff = role === "staff";
  const isParent = role === "parent";
  const statusStyles: Record<string, string> = {
    Paid: "bg-[#E6FFF3] text-[#0A8A4C]",
    Sent: "bg-[#5988F726] text-[#5988F7]",
    Overdue: "bg-[#FFE6E6] text-[#C74444]",
    "Partially Paid": "bg-[#FFF6DD] text-[#A88400]",
  };

  const StatusPill = ({ status }: { status: string }) => (
    <span className={`px-5 py-1 rounded-full text-xs ${statusStyles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  const renderRowActions = (invoice: any) => {
    const status = capitalizeFirstLetter(
      getInvoiceStatus({
        total: +invoice?.total,
        balance: +invoice?.balance,
        dueDate: invoice?.dueDate,
      }),
    );
    const isPaid = status === "Paid";

    // Staff: view-only
    if (isStaff || isParent) {
      return (
        <>
          <button
            type="button"
            className="text-sm text-brandColor-active font-medium cursor-pointer px-3 py-1 rounded-lg border border-brandColor-active/30 hover:bg-brandColor-active/5"
            onClick={() => openModal(ModalRoute.invoiceReceipt, { invoiceId: invoice?.id })}
          >
            View
          </button>
          <button
            type="button"
            className="text-sm text-brandColor-active font-medium cursor-pointer px-3 py-1 rounded-lg border border-brandColor-active/30 hover:bg-brandColor-active/5"
            onClick={() => setDownloadInvoiceId(String(invoice?.id))}
          >
            Download
          </button>
        </>
      );
    }

    return (
      <ChildInvoiceRowAction
        status={status}
        onView={() => {
          openModal(ModalRoute.invoiceReceipt, { invoiceId: invoice?.id });
        }}
        onEdit={
          isPaid
            ? undefined
            : () => {
                router.push(DashboardRoutes?.editInvoices?.replace(":invoiceId", invoice?.id));
              }
        }
        onRecordPayment={isPaid ? undefined : () => setRecordPaymentInvoiceId(String(invoice?.id))}
        onSetRecurring={
          isPaid
            ? () =>
                router.push(
                  `/admin/billing/invoices/create?type=recurring&fromInvoiceId=${invoice?.id}`,
                )
            : undefined
        }
        onDownload={() => setDownloadInvoiceId(String(invoice?.id))}
        onDelete={() => {
          setInvoiceToDelete(invoice);
        }}
      />
    );
  };

  const {
    data: invoiceData = {} as any,
    isLoading,
    refetch,
  } = useQueryService({
    service: {
      ...invoiceServices.getAllInvoice,
      data: {
        studentId: id,
        ...(filters?.delta ? { delta: filters?.delta } : {}),
        ...(filters?.pos ? { pos: filters?.pos } : {}),
      },
    },
  });

  const invoiceTableData = (invoiceData?.data || [])?.map((invoice: any) => {
    const row: any = {};

    row["Invoice Number"] = invoice?.invoiceNumber;
    row["Type"] = invoiceTypes?.[invoice?.invoiceType] || invoice?.invoiceType || "N/A";
    row["Issued Date"] = dateFormatter(invoice?.issueDate);
    row["Due Date"] = dateFormatter(invoice?.dueDate);
    row["Amount"] = <CashViewer amount={invoice?.total} />;
    row["Balance"] = <CashViewer amount={invoice?.balance} />;

    row["Status"] = (
      <StatusPill
        status={capitalizeFirstLetter(
          getInvoiceStatus({
            total: +invoice?.total,
            balance: +invoice?.balance,
            dueDate: invoice?.dueDate,
          }),
        )}
      />
    );

    row["Action"] = renderRowActions(invoice);

    return row;
  });

  const { mutateAsync: deleteMutation, isPending: isDeletingInvoice } = useMutationService({
    service: invoiceDynamicEndpoints.deleteInvoice(invoiceToDelete?.id),
    options: {
      successTitle: "Deleted Successfully",
      successMessage: "Invoice Deleted Successfully",
    },
  });

  async function handleDelete() {
    try {
      await deleteMutation({});
      refetch();
      setInvoiceToDelete(null);
    } catch (error) {}
  }

  const handleDownloadComplete = () => setDownloadInvoiceId(null);

  const invoiceListRaw: any[] = invoiceData?.data || [];

  const handleCardView = (invoice: any) =>
    openModal(ModalRoute.invoiceReceipt, { invoiceId: invoice?.id });

  const handleCardDuplicate = (invoice: any) =>
    router.push(`/admin/billing/invoices/create?fromInvoiceId=${invoice?.id}`);

  const handleCardDownload = (invoice: any) => setDownloadInvoiceId(String(invoice?.id));

  const handleCardDelete = (invoice: any) => setInvoiceToDelete(invoice);

  const pagination = invoiceData?.pagination || {};
  const totalItems = invoiceData?.pagination?.count;
  const currentPage =
    Math.floor(
      (pagination?.pos || filters?.pos || 0) /
        (pagination?.delta || filters?.delta || ITEMS_PER_PAGE),
    ) + 1;

  return {
    invoiceTableData,
    invoiceListRaw,
    isLoading,
    invoiceToDelete,
    isDeletingInvoice,
    setInvoiceToDelete,
    recordPaymentInvoiceId,
    setRecordPaymentInvoiceId,
    downloadInvoiceId,
    handleDownloadComplete,
    handleDelete,
    handleCardView,
    handleCardDuplicate,
    handleCardDownload,
    handleCardDelete,
    refetch,
    currentPage,
    totalItems,
    filters,
    applyFilters,
  };
}
