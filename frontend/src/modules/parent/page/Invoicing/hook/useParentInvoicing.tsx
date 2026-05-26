/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";

import { useState, useMemo, useEffect } from "react";
import { capitalizeFirstLetter, dateFormatter } from "@/utils/helpers";
import { showToast } from "@/modules/shared/component/Toast";
import { useModalRoute } from "@/utils/hooks/useModalRoute";
import { ModalRoute } from "@/routes/modalRoutes";
import { ITEMS_PER_PAGE } from "@/constants";
import { useFilter } from "@/utils/hooks/useFilter";
import ParentInvoiceRowAction from "@/modules/parent/component/ParentInvoiceRowActions/parentInvoiceRowAction";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { invoiceServices } from "@/services/invoice.service";
import { getInvoiceStatus } from "@/utils/helper";
import { ParentDynamicEndpoints, KioskVerifyResponse } from "@/services/parent.service";
import client from "@/utils/client";
import { useUser } from "@/utils/hooks/useUser";
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";
import { formatAmount } from "@/utils/hooks/formatNumber";
import { CashViewer } from "@/modules/shared/component/CashViewer";
import { useRouter } from "next/navigation";
interface Child {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
}

type ChildrenFilter = "All Children" | number; // number is child ID

const statusFilterOptions = [
  { label: "All Statuses", value: "All Statuses" },
  { label: "Paid", value: "Paid" },
  { label: "Partially Paid", value: "Partially Paid" },
  { label: "Pending", value: "Pending" },
  { label: "Overdue", value: "Overdue" },
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

export function useParentInvoicing() {
  const { openModal } = useModalRoute();
  const { parentId } = useUser();
  const router = useRouter();
  const [downloadInvoiceId, setDownloadInvoiceId] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [childrenFilter, setChildrenFilter] = useState<ChildrenFilter>("All Children");
  const { filters, applyFilters } = useFilter({
    search: "",
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });

  const invoiceFilterOptions = [
    { label: "All Invoices", value: "All Invoices" },
    { label: "Sent", value: "Sent" },
    { label: "Partially Paid", value: "Partially Paid" },
    { label: "Paid", value: "Paid" },
    { label: "Overdue", value: "Overdue" },
  ];

  const [isViewInvoice, setIsViewInvoice] = useState<any>(null);

  const [createInvoiceAnchorEl, setCreateInvoiceAnchorEl] = useState<HTMLElement | null>(null);
  const [filterInvoiceAnchorEl, setFilterInvoiceAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedInvoiceFilter, setSelectedInvoiceFilter] = useState<any>(
    invoiceFilterOptions[0]?.label,
  );
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>(
    statusFilterOptions[0]?.label,
  );

  // Fetch children list
  useEffect(() => {
    const fetchChildren = async () => {
      if (!parentId) {
        return;
      }

      try {
        const response = await client.request<void, KioskVerifyResponse>(
          ParentDynamicEndpoints.getParentById(parentId),
        );

        if (response.success && response.data?.children) {
          const childrenList: Child[] = response.data.children.map((child) => ({
            id: child.id,
            firstName: child.user.firstName,
            lastName: child.user.lastName,
            fullName: `${child.user.firstName} ${child.user.lastName}`.trim(),
          }));
          setChildren(childrenList);
        } else {
          setChildren([]);
        }
      } catch (error) {
        console.error("Error fetching children:", error);
        setChildren([]);
      }
    };

    fetchChildren();
  }, [parentId]);

  // Build invoice query with parentId, status, and studentId filters
  const invoiceQuery = useMemo(() => {
    const queryParams: any = {};

    if (parentId) {
      queryParams.parentId = parentId;
    }

    // Add status filter if not "All Statuses"
    if (selectedStatusFilter && selectedStatusFilter !== "All Statuses") {
      const statusMap: Record<string, string> = {
        Paid: "paid",
        "Partially Paid": "partially_paid",
        Pending: "pending",
        Overdue: "overdue",
      };
      queryParams.status = statusMap[selectedStatusFilter] || selectedStatusFilter.toLowerCase();
    }

    // Add studentId filter if specific child is selected
    if (childrenFilter !== "All Children" && typeof childrenFilter === "number") {
      queryParams.studentId = childrenFilter;
    }

    return {
      ...invoiceServices.getAllInvoice,
      data: queryParams,
    };
  }, [parentId, selectedStatusFilter, childrenFilter]);

  const { data: invoiceData = {} as any, isLoading } = useQueryService({
    service: invoiceQuery,
    options: {
      keys: [
        "invoices",
        parentId,
        selectedStatusFilter,
        typeof childrenFilter === "number" ? String(childrenFilter) : childrenFilter,
        filters.pos,
        filters.delta,
      ],
      enabled: !!parentId,
    },
  });

  const pagination = invoiceData?.pagination;
  const invoices = useMemo(() => invoiceData?.data || [], [invoiceData?.data]);

  const metadata = useMemo(() => {
    let pendingAmount = 0;
    let overdueAmount = 0;
    let totalPaid = 0;

    invoices.forEach((invoice: any) => {
      const balance = Number(invoice?.balance || 0);
      const total = Number(invoice?.total || 0);
      const amountPaid =
        invoice?.amountPaid !== undefined
          ? Number(invoice.amountPaid)
          : Math.max(0, total - balance);

      totalPaid += amountPaid;

      if (balance > 0) {
        if (invoice?.dueDate && new Date() > new Date(invoice.dueDate)) {
          overdueAmount += balance;
        } else {
          pendingAmount += balance;
        }
      }
    });

    return {
      totalInvoices: pagination?.count || invoices.length,
      pendingAmount: formatAmount(pendingAmount),
      overdueAmount: formatAmount(overdueAmount),
      totalPaid: formatAmount(totalPaid),
    };
  }, [invoices, pagination?.count]);

  const StatusPill = ({ status }: { status: string }) => (
    <span className={`px-3 py-1 whitespace-nowrap rounded-full text-xs ${statusStyles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  const renderRowActions = (invoice: any) => {
    return (
      <ParentInvoiceRowAction
        invoice={invoice}
        onView={() => {
          router.push(`/parent/invoicing/invoices/${invoice.id}/view`);
        }}
        onDownload={() => setDownloadInvoiceId(String(invoice.id))}
      />
    );
  };
  const handleDownloadComplete = () => setDownloadInvoiceId(null);

  const invoiceTableData = invoices.map((invoice: any) => {
    const row: any = {};
    const invoiceType = formatInvoiceTypeLabel(invoice?.invoiceType);

    row["Invoice Number"] = invoice?.invoiceNumber;
    const childFullName =
      `${invoice?.student?.user?.firstName || ""} ${invoice?.student?.user?.lastName || ""}`.trim();
    const childPhoto =
      invoice?.student?.photoUrl ||
      invoice?.student?.user?.photo ||
      invoice?.student?.user?.profile?.photo;
    row["Child Name"] = (
      <div className="flex items-center gap-2">
        {/* <InitialsAvatar
          src={childPhoto || ""}
          name={childFullName}
          className="w-10 h-10"
          initialsClassName="text-[10px]"
        /> */}
        <span>{childFullName || "N/A"}</span>
      </div>
    );
    row["Invoice Type"] = invoiceType;
    row["Due Date"] = (
      <span className="flex items-center gap-1">
        <span>{dateFormatter(invoice?.dueDate)}</span>
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

  const handleFilterInvoice = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterInvoiceAnchorEl(event.currentTarget);
  };

  // const posVal = Number(filters?.pos ?? pagination?.pos ?? 0) || 0;
  // const deltaVal = Number(filters?.delta ?? pagination?.delta ?? ITEMS_PER_PAGE) || ITEMS_PER_PAGE;

  // const currentPage = Math.floor(posVal / deltaVal) + 1;

  const handlePageChange = ({ page, rowsPerPage }: { page: number; rowsPerPage: number }) => {
    applyFilters({
      ...filters,
      delta: rowsPerPage,
      pos: (page - 1) * rowsPerPage,
    });
  };

  const statusStyles: Record<string, string> = {
    Paid: "bg-[#E6FFF3] text-[#0A8A4C]",
    Overdue: "bg-[#FFE6E6] text-[#C74444]",
    Pending: "bg-[#FFF6DD] text-[#A88400]",
    "Partially Paid": "bg-[#FFF6DD] text-[#A88400]",
    Sent: "bg-[#5988F726] text-[#5988F7]",
  };

  // const invoiceTableData = filteredInvoices.map((invoice: any) => {
  //   const row: any = {};

  //   row["Invoice Number"] = invoice?.invoiceNumber;
  //   row["Type"] = "Tuition";
  //   row["Due Date"] = dateFormatter(invoice?.dueDate);
  //   row["Balance"] = `₦${Number.parseFloat(invoice?.balance || 0).toLocaleString()}`;
  //   row["Total Amount"] = `₦${Number.parseFloat(invoice?.total || 0).toLocaleString()}`;
  //   row["Status"] = <StatusPill status={invoice?.status} />;

  //   row["Action"] = (
  //     <ParentInvoiceRowAction
  //       invoice={invoice}
  //       onView={() => onInvoiceView(invoice)}
  //       onDownload={() => onInvoiceDownload(invoice)}
  //       onDelete={() => onInvoiceDelete(invoice)}
  //     />
  //   );

  //   return row;
  // });

  const onInvoiceView = (invoice: any) => {
    router.push(`/parent/invoicing/invoices/${invoice?.id}/view`);
  };

  // Get child name by ID
  const getChildName = (childId: number) => {
    const child = children.find((c) => c.id === childId);
    return child ? child.fullName : `Child ${childId}`;
  };

  // Handle children filter change
  const handleChildrenFilterChange = (filter: ChildrenFilter) => {
    setChildrenFilter(filter);
  };

  const onInvoiceDownload = (invoice: any) => {
    showToast({
      message: "Download started for " + invoice?.invoiceNumber,
      severity: "info",
      duration: 3000,
    });
  };

  const onInvoiceDelete = async (invoice: any) => {
    try {
      showToast({
        message: `Invoice ${invoice?.invoiceNumber} deleted successfully`,
        severity: "success",
        duration: 3000,
      });
    } catch {
      showToast({
        message: "Failed to delete invoice",
        severity: "error",
        duration: 3000,
      });
    }
  };

  const posVal = Number(filters?.pos ?? 0) || 0;
  const deltaVal = Number(filters?.delta ?? ITEMS_PER_PAGE) || ITEMS_PER_PAGE;
  const currentPage = Math.floor(posVal / deltaVal) + 1;
  const mobileInvoiceData = invoices.map((invoice: any) => ({
    id: invoice?.id,
    invoiceNumber: invoice?.invoiceNumber,
    childName:
      `${invoice?.student?.user?.firstName || ""} ${invoice?.student?.user?.lastName || ""}`.trim() ||
      "N/A",
    invoiceType: formatInvoiceTypeLabel(invoice?.invoiceType),
    dueDate: dateFormatter(invoice?.dueDate),
    totalAmount: Number(invoice?.total || 0),
    status: capitalizeFirstLetter(
      getInvoiceStatus({
        total: +invoice?.total,
        balance: +invoice?.balance,
        dueDate: invoice?.dueDate,
      }),
    ),
  }));

  return {
    invoiceTableData,
    filterInvoiceAnchorEl,
    selectedStatusFilter,
    statusFilterOptions,
    isLoading,
    metadata,
    pagination,
    currentPage,
    rowsPerPage: filters.delta,
    applyFilters,
    setSelectedStatusFilter,
    setFilterInvoiceAnchorEl,
    handleFilterInvoice,
    onInvoiceView,
    onInvoiceDownload,
    onInvoiceDelete,
    createInvoiceAnchorEl,
    selectedInvoiceFilter,
    invoiceFilterOptions,
    isViewInvoice,
    handlePageChange,
    setIsViewInvoice,
    setSelectedInvoiceFilter,
    setCreateInvoiceAnchorEl,
    children,
    childrenFilter,
    handleChildrenFilterChange,
    getChildName,
    downloadInvoiceId,
    handleDownloadComplete,
    mobileInvoiceData,
  };
}
