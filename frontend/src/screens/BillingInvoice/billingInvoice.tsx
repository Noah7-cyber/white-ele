/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { InsightCard } from "@/components/InsightCard";
import { Box, Typography } from "@mui/material";
import PlusIcon from "@/modules/shared/assets/svgs/add.svg";
import { Table } from "@/modules/shared/component/Table";
import { useBillingInvoice } from "./hooks/useBillingInvoice";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import FilterPopover from "@/modules/shared/component/FilterPopover/filterPopover";
import ExpandMoreIcon from "@/modules/shared/assets/svgs/downIcon.svg";
import { Button } from "@/modules/shared/component/Button";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import { RecordPaymentModal } from "@/modules/admin/component/RecordPaymentModal";
import { InvoicePdfDownloader } from "@/modules/shared/component/InvoicePreviewModal/InvoicePdfDownloader";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import AddIcon from "@mui/icons-material/Add";
import Drawer from "@mui/material/Drawer";
import { useEffect, useState } from "react";

import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer/MobileFilterDrawer";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { ModalRoute } from "@/routes/modalRoutes";
import { useModalRoute } from "@/utils/hooks/useModalRoute";

export const BillingInvoice = () => {
  const router = useRouter();
  const { openModal } = useModalRoute();

  // Mobile-specific state
  const [mobileActionInvoice, setMobileActionInvoice] = useState<any>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileAddOpen, setMobileAddOpen] = useState(false);

  // Listen for header plus icon dispatch event
  useEffect(() => {
    const handler = () => setMobileAddOpen(true);
    window.addEventListener("open-invoices-add", handler);
    return () => window.removeEventListener("open-invoices-add", handler);
  }, []);

  const {
    invoiceTableData,
    invoiceIds,
    createInvoiceAnchorEl,
    filterInvoiceAnchorEl,
    selectedInvoiceFilter,
    invoiceFilterOptions,
    isLoading,
    metadata,
    rowsPerPage,
    pagination,
    currentPage,
    invoiceToDelete,
    isDeletingInvoice,
    setInvoiceToDelete,
    recordPaymentInvoiceId,
    setRecordPaymentInvoiceId,
    downloadInvoiceId,
    handleDownloadComplete,
    refetch,
    handlePageChange,
    setSelectedInvoiceFilter,
    setFilterInvoiceAnchorEl,
    setCreateInvoiceAnchorEl,
    handleCreateInvoice,
    handleFilterInvoice,
    handleDelete,
    handleSearch,
    mobileInvoiceData,
  } = useBillingInvoice();

  const handleRowClick = (_rowData: unknown, rowIndex: number) => {
    const id = invoiceIds?.[rowIndex];
    if (id != null) openModal(ModalRoute.invoiceReceipt, { invoiceId: id });
  };

  const getStatusClassName = (status: string) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "paid") return "bg-[#E6FFF3] text-[#0A8A4C]";
    if (normalized === "overdue") return "bg-[#FFE6E6] text-[#C74444]";
    if (normalized === "partially paid") return "bg-[#FFF6DD] text-[#A88400]";
    return "bg-[#5988F726] text-[#5988F7]";
  };

  const headers = [
    "Invoice Number",
    "Child Name",
    "Invoice Type",
    "Due Date",
    "Balance",
    "Total Amount",
    "Status",
    "Action",
  ];
  return (
    <Box className="p-5 flex flex-col gap-6">
      <div className="hidden md:flex items-center justify-between">
        <Typography className="!text-xl !font-semibold">Invoicing</Typography>
      </div>
      <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto md:overflow-x-visible hide-scrollbar sm:min-h-35 *:shrink-0 md:*:shrink">
        <InsightCard name="Total Invoices" value={metadata?.totalInvoices || 0} 
          className="!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
        />
        <InsightCard name="Paid Invoices" value={metadata?.paidInvoices || 0} 
          className="!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
        />
        <InsightCard name="Pending Invoices" value={metadata?.pendingInvoices || 0} 
          className="!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
        />
        <InsightCard name="Overdue Invoices" value={metadata?.overdueInvoices || 0} 
          className="!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
        />
      </div>

      <Box className="w-full flex items-center justify-between gap-4">
        <div className="w-full lg:w-full max-w-md">
          <SearchTextfield
            onChange={handleSearch}
            placeholder="Search by invoice number, child name, status, etc"
            endIcon={
              <button
                className="md:hidden"
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Open filters"
              >
                <FilterIcon className="text-gray-500" />
              </button>
            }
            isRounded={true}
            fullWidth={true}
            className="max-w-full"
            inputClasses="max-w-full bg-white"
          />
        </div>
        <Button className="!hidden !rounded-lg !px-3 !min-w-10" onClick={(e) => setCreateInvoiceAnchorEl(e.currentTarget as HTMLElement)}>
          <AddIcon />
        </Button>

        <div className="hidden md:flex gap-3 items-center">
          <Box>
            <button
              onClick={handleFilterInvoice}
              className="flex items-center justify-around px-2 h-10 w-36 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
            >
              <span className="text-sm font-medium">{selectedInvoiceFilter}</span>
              <ExpandMoreIcon className="" />
            </button>
            <FilterPopover
              open={Boolean(filterInvoiceAnchorEl)}
              anchorEl={filterInvoiceAnchorEl}
              onClose={() => setFilterInvoiceAnchorEl(null)}
              options={invoiceFilterOptions}
              onSelect={(value) => {
                setSelectedInvoiceFilter(value);
              }}
              width={150}
            />
          </Box>
          <Box>
            <Button
              className="!rounded-lg !px-6"
              onClick={handleCreateInvoice}
              startIcon={<ExpandMoreIcon className="" />}
            >
              Create New
            </Button>
            <FilterPopover
              open={Boolean(createInvoiceAnchorEl)}
              anchorEl={createInvoiceAnchorEl}
              onClose={() => setCreateInvoiceAnchorEl(null)}
              options={[
                {
                  label: (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <PlusIcon /> <span>Create Invoice</span>
                    </div>
                  ),
                  value: "Create Invoice",
                },
                {
                  label: (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <PlusIcon /> <span>Create Recurring Invoice</span>
                    </div>
                  ),
                  value: "Create Recurring Invoice",
                },
              ]}
              onSelect={(value) => {
                switch (value) {
                  case "Create Invoice":
                    router.push("/admin/billing/invoices/create");
                    break;

                  case "Create Recurring Invoice":
                    router.push("/admin/billing/invoices/create?type=recurring");
                    break;

                  default:
                    break;
                }
              }}
              width={240}
            />
          </Box>
        </div>
      </Box>

      <FilterPopover
        open={Boolean(createInvoiceAnchorEl)}
        anchorEl={createInvoiceAnchorEl}
        onClose={() => setCreateInvoiceAnchorEl(null)}
        options={[
          {
            label: (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <PlusIcon /> <span>Create Invoice</span>
              </div>
            ),
            value: "Create Invoice",
          },
          {
            label: (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <PlusIcon /> <span>Create Recurring Invoice</span>
              </div>
            ),
            value: "Create Recurring Invoice",
          },
        ]}
        onSelect={(value) => {
          switch (value) {
            case "Create Invoice":
              router.push("/admin/billing/invoices/create");
              break;

            case "Create Recurring Invoice":
              router.push("/admin/billing/invoices/create?type=recurring");
              break;

            default:
              break;
          }
        }}
        width={240}
      />

      {/* Mobile: Add Invoice bottom sheet - triggered by header + or inline + button */}
      <Drawer
        anchor="bottom"
        open={mobileAddOpen}
        onClose={() => setMobileAddOpen(false)}
        PaperProps={{ className: "rounded-t-2xl", style: { maxHeight: "40vh" } }}
      >
        <div className="px-6 pt-3 pb-10">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
          <button
            className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
            onClick={() => { setMobileAddOpen(false); router.push("/admin/billing/invoices/create"); }}
          >
            + Create Invoice
          </button>
          <button
            className="w-full text-left py-4 text-sm font-medium text-[#022F2F]"
            onClick={() => { setMobileAddOpen(false); router.push("/admin/billing/invoices/create?type=recurring"); }}
          >
            + Create Recurring Invoice
          </button>
        </div>
      </Drawer>

      <div className="md:hidden flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-xl border border-[#E4E7EC] bg-white p-4 h-24 animate-pulse" />
            ))
          : mobileInvoiceData?.map(
              (invoice: {
                id: string;
                childName: string;
                invoiceType: string;
                status: string;
                totalAmount: number;
              }) => (
                <div
                  key={invoice.id}
                  className="w-full rounded-xl border border-[#E4E7EC] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-text-primary">{invoice.childName || "N/A"}</span>
                    <button
                      onClick={() => setMobileActionInvoice(invoice)}
                      className="p-1 rounded-full hover:bg-gray-100 shrink-0"
                      aria-label="More options"
                    >
                      <MoreHorizIcon className="text-gray-500" fontSize="small" />
                    </button>
                  </div>
                  <div className="mt-1">
                    <span className="text-xs text-text-secondary">{invoice.invoiceType || "Normal Invoice"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-text-secondary">₦{invoice.totalAmount?.toLocaleString() ?? "0"}.00</span>
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusClassName(invoice.status)}`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ),
            )}
        {!!mobileInvoiceData?.length && (
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalItems={pagination?.count || pagination?.total || 0}
            onPageChange={handlePageChange}
            isCondense
            bottomTableClasses="!text-xs"
          />
        )}
      </div>

      {/* Mobile bottom action sheet drawer */}
      <Drawer
        anchor="bottom"
        open={Boolean(mobileActionInvoice)}
        onClose={() => setMobileActionInvoice(null)}
        PaperProps={{
          className: "rounded-t-2xl",
          style: { maxHeight: "70vh" },
        }}
      >
        <div className="px-6 pt-3 pb-8">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
          {(() => {
            const normalizedStatus = String(mobileActionInvoice?.status || "").toLowerCase();
            const isPaid = normalizedStatus === "paid";
            const isPartiallyPaid = normalizedStatus === "partially paid";
            const isEditLocked = isPaid || isPartiallyPaid;
            const canDelete = !isPaid && !isPartiallyPaid;
            const isRecurringInvoice = Boolean(mobileActionInvoice?.isRecurringInvoice);

            const actions = [
              { label: "View", action: () => { router.push(`/admin/billing/invoices/${mobileActionInvoice?.id}/view?invoiceId=${mobileActionInvoice?.id}`); setMobileActionInvoice(null); } },
              ...(isEditLocked
                ? []
                : [{
                    label: "Edit",
                    action: () => {
                      const editRoute = `/admin/billing/invoices/${mobileActionInvoice?.id}/edit`;
                      router.push(
                        isRecurringInvoice
                          ? `${editRoute}?type=recurring&editRecurring=true`
                          : editRoute,
                      );
                      setMobileActionInvoice(null);
                    },
                  }]),
              ...(!isPaid
                ? [{ label: "Record Payment", action: () => { setRecordPaymentInvoiceId(String(mobileActionInvoice?.id)); setMobileActionInvoice(null); } }]
                : []),
              { label: "Duplicate", action: () => { router.push(`/admin/billing/invoices/create?fromInvoiceId=${mobileActionInvoice?.id}`); setMobileActionInvoice(null); } },
              ...(canDelete
                ? [{ label: "Delete", action: () => { setInvoiceToDelete(mobileActionInvoice); setMobileActionInvoice(null); }, className: "text-red-500" }]
                : []),
            ];

            return actions;
          })().map(({ label, action, className }) => (
            <button
              key={label}
              onClick={action}
              className={`w-full text-left py-4 text-sm font-medium border-b border-gray-100 last:border-0 ${className ?? "text-[#022F2F]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </Drawer>

      {/* Mobile filter drawer */}
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        onApply={() => setMobileFilterOpen(false)}
        onReset={() => { setSelectedInvoiceFilter(invoiceFilterOptions[0]?.label); setMobileFilterOpen(false); }}
      >
        <div className="flex flex-col gap-2">
          <Typography className="!text-sm !font-medium !text-[#02273A]">Status</Typography>
          <Dropdown
            isForm
            options={invoiceFilterOptions.map((f) => ({ value: f.value, name: f.label }))}
            value={selectedInvoiceFilter}
            onSelect={(value) => setSelectedInvoiceFilter(value as string)}
            textFieldProps={{ placeholder: "Filter by status", isRounded: true }}
          />
        </div>
      </MobileFilterDrawer>

      <div className="hidden md:block bg-white rounded-2xl px-4 py-4">
        <Box className="mt-4">
          <Table
            headers={headers}
            tableData={invoiceTableData}
            onRowClick={handleRowClick}
            preventRowClickColumnIndex={7}
            headerCellClassName="!font-medium !text-primary-tex-dark/8 !text-xs !text-table-text !py-3 text-left"
            tableClassName="text-sm"
            centeredHeaderIndex={[4, 5, 6, 7]}
            isLoading={isLoading}
            rightAlignedIndex={[7]}
          />
        </Box>

        {/* PAGINATION */}
        <Box className="pb-10 flex justify-between items-center">
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalItems={pagination?.count || pagination?.total || 0}
            onPageChange={handlePageChange}
          />
        </Box>
      </div>

      <ConfirmModal
        open={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={handleDelete}
        icon={<TrashIcon />}
        title="Are you sure you want to delete this invoice?"
        description="This action cannot be undone. Once deleted, all related data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={isDeletingInvoice}
      />

      <RecordPaymentModal
        open={!!recordPaymentInvoiceId}
        onClose={() => setRecordPaymentInvoiceId(null)}
        invoiceId={recordPaymentInvoiceId}
        onSuccess={refetch}
      />

      {downloadInvoiceId && (
        <InvoicePdfDownloader invoiceId={downloadInvoiceId} onComplete={handleDownloadComplete} />
      )}
    </Box>
  );
};
