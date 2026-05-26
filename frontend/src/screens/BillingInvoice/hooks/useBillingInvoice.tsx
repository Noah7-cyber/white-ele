import { ITEMS_PER_PAGE } from "@/constants";
import ChildInvoiceRowAction from "@/modules/admin/component/ChildInvoiceRowAction/childInvoiceRowAction";
import { CashViewer } from "@/modules/shared/component/CashViewer";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { invoiceDynamicEndpoints, invoiceServices } from "@/services/invoice.service";
import { getInvoiceStatus } from "@/utils/helper";
import { capitalizeFirstLetter, dateFormatter } from "@/utils/helpers";
import { useFilter } from "@/utils/hooks/useFilter";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useRouter } from "next/navigation";
import { useState, useCallback, ChangeEvent } from "react";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { useDebouncer } from "@/utils/hooks/useDebouncer";
import { useModalRoute } from "@/utils/hooks/useModalRoute";
import { ModalRoute } from "@/routes/modalRoutes";

/* eslint-disable @typescript-eslint/no-explicit-any */

const invoiceFilterOptions = [
  { label: "All Invoices", id: "", value: "All Invoices" },
  { label: "Sent", id: "sent", value: "Sent" },
  { label: "Partially Paid", id: "partially_paid", value: "Partially Paid" },
  { label: "Paid", id: "paid", value: "Paid" },
  { label: "Overdue", id: "overdue", value: "Overdue" },
];

const formatInvoiceTypeLabel = (type?: string | null) => {
  const normalized = String(type || "").trim().toLowerCase();
  if (!normalized) return "Normal Invoice";
  if (normalized === "onetime" || normalized === "one_time" || normalized === "one time") {
    return "One Time";
  }
  if (normalized === "recurring") return "Recurring";
  return type as string;
};

export function useBillingInvoice() {
  const [isViewInvoice, setIsViewInvoice] = useState<any>(null);
  const router = useRouter();
  const { openModal } = useModalRoute();

  const [createInvoiceAnchorEl, setCreateInvoiceAnchorEl] = useState<HTMLElement | null>(null);
  const [filterInvoiceAnchorEl, setFilterInvoiceAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedInvoiceFilter, setSelectedInvoiceFilter] = useState<any>(
    invoiceFilterOptions[0]?.label,
  );

  const { debouncedSearch, setSearch } = useDebouncer();
  const { filters, applyFilters } = useFilter({
    search: debouncedSearch,
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });

  const activeStatus = invoiceFilterOptions.find((item) => item?.value === selectedInvoiceFilter);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any | null>(null);
  const [recordPaymentInvoiceId, setRecordPaymentInvoiceId] = useState<string | null>(null);
  const [downloadInvoiceId, setDownloadInvoiceId] = useState<string | null>(null);
  const {
    data: invoiceData = {} as any,
    isLoading,
    refetch,
  } = useQueryService({
    service: {
      ...invoiceServices.getAllInvoice,
      data: {
        pos: filters?.pos ?? 0,
        delta: filters?.delta ?? ITEMS_PER_PAGE,
        ...(activeStatus?.id ? { status: activeStatus?.id } : {}),
        search: debouncedSearch,
      },
    },
  });

  const metadata = invoiceData?.metadata;
  const pagination = invoiceData?.pagination;

  const statusStyles: Record<string, string> = {
    Paid: "bg-[#E6FFF3] text-[#0A8A4C]",
    Sent: "bg-[#5988F726] text-[#5988F7]",
    Overdue: "bg-[#FFE6E6] text-[#C74444]",
    "Partially Paid": "bg-[#FFF6DD] text-[#A88400]",
  };

  const StatusPill = ({ status }: { status: string }) => (
    <span className={`px-6 py-1 whitespace-nowrap rounded-full text-xs ${statusStyles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  const handleDownloadComplete = useCallback(() => setDownloadInvoiceId(null), []);

  const renderRowActions = (invoice: any) => {
    const isRecurringInvoice = invoice?.invoiceType === "recurring";
    const status = capitalizeFirstLetter(
      getInvoiceStatus({
        total: +invoice?.total,
        balance: +invoice?.balance,
        dueDate: invoice?.dueDate,
      }),
    );
    const isPaid = status === "Paid";
    const isPartiallyPaid = status === "Partially Paid";
    const isEditLocked = isPaid || isPartiallyPaid;
    const canDelete = !isPaid && !isPartiallyPaid;
    return (
      <ChildInvoiceRowAction
        status={status}
        onView={() => {
          openModal(ModalRoute.invoiceReceipt, { invoiceId: invoice?.id });
        }}
        onEdit={
          isEditLocked
            ? undefined
            : () => {
                const baseEditRoute = DashboardRoutes?.editInvoices?.replace(":invoiceId", invoice?.id);
                router.push(
                  isRecurringInvoice
                    ? `${baseEditRoute}?type=recurring&editRecurring=true`
                    : baseEditRoute,
                );
              }
        }
        onRecordPayment={isPaid ? undefined : () => setRecordPaymentInvoiceId(String(invoice?.id))}
        onSetRecurring={
          isPaid && !isRecurringInvoice
            ? () =>
                router.push(
                  `/admin/billing/invoices/${invoice?.id}/edit?type=recurring`,
                )
            : undefined
        }
        onDownload={() => setDownloadInvoiceId(String(invoice?.id))}
        onDelete={canDelete ? () => setInvoiceToDelete(invoice) : undefined}
      />
    );
  };

  const invoices = invoiceData?.data || [];
  const invoiceTableData = invoices.map((invoice: any) => {
    const row: any = {};
    const invoiceType = formatInvoiceTypeLabel(invoice?.invoiceType);

    row["Invoice Number"] = invoice?.invoiceNumber;
    row["Child Name"] =
      `${invoice?.student?.user?.firstName || ""} ${invoice?.student?.user?.lastName || ""}`;
    row["Invoice Type"] = invoiceType;
    row["Due Date"] = (
      <span className="flex items-center gap-1">
        <span>{dateFormatter(invoice?.dueDate)}</span>
        {invoice?.billingPeriod != null && (
          <AutorenewIcon style={{ fontSize: 14 }} className="text-black" titleAccess="Recurring" />
        )}
      </span>
    );
    row["Balance"] = (
      <CashViewer
        className="!font-medium !text-primary-tex-dark/8 !text-sm !text-table-text !py-3 text-left"
        amount={+invoice?.balance}
        decimal={2}
      />
    );
    row["Total Amount"] = (
      <CashViewer
        className="!font-medium !text-primary-tex-dark/8 !text-sm !text-table-text !py-3 text-left"
        amount={+invoice?.total}
        decimal={2}
      />
    );

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

  const handleCreateInvoice = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCreateInvoiceAnchorEl(event.currentTarget);
  };
  const handleFilterInvoice = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterInvoiceAnchorEl(event.currentTarget);
  };

  const posVal = Number(filters?.pos ?? pagination?.pos ?? 0) || 0;
  const deltaVal = Number(filters?.delta ?? pagination?.delta ?? ITEMS_PER_PAGE) || ITEMS_PER_PAGE;

  const currentPage = Math.floor(posVal / deltaVal) + 1;

  const handlePageChange = ({ page, rowsPerPage }: { page: number; rowsPerPage: number }) => {
    applyFilters({
      ...filters,
      delta: rowsPerPage,
      pos: (page - 1) * rowsPerPage,
    });
  };

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
    } catch {}
  }

  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
  };

  const invoiceIds = (invoices || []).map((inv: any) => inv?.id);
  const mobileInvoiceData = (invoices || []).map((invoice: any) => {
    const status = capitalizeFirstLetter(
      getInvoiceStatus({
        total: +invoice?.total,
        balance: +invoice?.balance,
        dueDate: invoice?.dueDate,
      }),
    );

    return {
      id: invoice?.id,
      childName: `${invoice?.student?.user?.firstName || ""} ${invoice?.student?.user?.lastName || ""}`.trim(),
      invoiceType: formatInvoiceTypeLabel(invoice?.invoiceType),
      status,
      totalAmount: +invoice?.total || 0,
      isRecurringInvoice: invoice?.invoiceType === "recurring",
    };
  });

  return {
    invoiceTableData,
    invoiceIds,
    mobileInvoiceData,
    createInvoiceAnchorEl,
    filterInvoiceAnchorEl,
    selectedInvoiceFilter,
    invoiceFilterOptions,
    isViewInvoice,
    isLoading,
    metadata,
    pagination,
    currentPage,
    rowsPerPage: filters.delta,
    invoiceToDelete,
    isDeletingInvoice,
    setInvoiceToDelete,
    recordPaymentInvoiceId,
    setRecordPaymentInvoiceId,
    downloadInvoiceId,
    setDownloadInvoiceId,
    handleDownloadComplete,
    refetch,
    handlePageChange,
    applyFilters,
    setIsViewInvoice,
    setSelectedInvoiceFilter,
    setFilterInvoiceAnchorEl,
    setCreateInvoiceAnchorEl,
    handleCreateInvoice,
    handleFilterInvoice,
    handleDelete,
    handleSearch,
  };
}
