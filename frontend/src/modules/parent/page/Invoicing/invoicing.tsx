"use client";

import { Box, Typography } from "@mui/material";
import { Table } from "@/modules/shared/component/Table";
import { useParentInvoicing } from "./hook/useParentInvoicing";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import FilterPopover from "@/modules/shared/component/FilterPopover/filterPopover";
import ExpandMoreIcon from "@/modules/shared/assets/svgs/downIcon.svg";
import { InsightCard } from "@/components/InsightCard";
import { CWPopover } from "@/modules/shared/component/Popover";
import CaretDown from "@/modules/shared/assets/svgs/caretDown.svg";
import { formatAmount } from "@/utils/hooks/formatNumber";
import { InvoicePdfDownloader } from "@/modules/shared/component/InvoicePreviewModal/InvoicePdfDownloader";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Drawer from "@mui/material/Drawer";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import { SearchTextfield } from "@/modules/shared/component/SearchTextfield";
import { MobileFilterDrawer } from "@/modules/shared/component/MobileFilterDrawer/MobileFilterDrawer";
import { Dropdown } from "@/modules/shared/component/Dropdown";
import { useState } from "react";

const getStatusClassName = (status: string) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "paid") return "bg-[#E6FFF3] text-[#0A8A4C]";
  if (normalized === "overdue") return "bg-[#FFE6E6] text-[#C74444]";
  if (normalized === "partially paid") return "bg-[#FFF6DD] text-[#A88400]";
  if (normalized === "pending") return "bg-[#FFF6DD] text-[#A88400]";
  if (normalized === "sent") return "bg-[#5988F726] text-[#5988F7]";
  return "bg-[#5988F726] text-[#5988F7]";
};

export const ParentInvoicingPage = () => {
  const [mobileActionInvoiceId, setMobileActionInvoiceId] = useState<string | number | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const {
    invoiceTableData,
    filterInvoiceAnchorEl,
    selectedStatusFilter,
    statusFilterOptions,
    isLoading,
    metadata,
    rowsPerPage,
    pagination,
    currentPage,
    applyFilters,
    setSelectedStatusFilter,
    setFilterInvoiceAnchorEl,
    handleFilterInvoice,
    children,
    childrenFilter,
    handleChildrenFilterChange,
    getChildName,
    downloadInvoiceId,
    handleDownloadComplete,
    mobileInvoiceData,
    onInvoiceView,
    onInvoiceDownload,
  } = useParentInvoicing();

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
    <Box className="p-4 md:p-5 space-y-6 flex flex-col">
      <Box className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <Typography className="hidden md:block !text-xl !text-text-primary !font-semibold">Invoicing</Typography>
        <Box className="hidden md:flex flex-wrap md:flex-nowrap items-center gap-2">
          {" "}
          <button
            onClick={handleFilterInvoice}
            className="flex items-center justify-around px-4 text-nowrap h-10 w-36 gap-1.5 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
          >
            <span className="text-sm font-medium">{selectedStatusFilter}</span>
            <ExpandMoreIcon className="" />
          </button>
          <CWPopover
            actionComponent={
              <>
                {childrenFilter === "All Children"
                  ? "All Children"
                  : getChildName(childrenFilter as number)}{" "}
                <CaretDown className="ml-2" />
              </>
            }
            buttonProps={{
              isRounded: false,
              variant: "outlined",
              className:
                "!w-full !rounded-lg !border !px-2 !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm !font-normal !text-nowrap !min-w-fit",
            }}
          >
            <Box paddingY={1} className="flex flex-col gap-y-2 2xl:gap-y-3 p-4!">
              <button
                className="text-sm! 2xl:text-base! p-1 flex flex-row gap-2 items-center cursor-pointer"
                onClick={() => handleChildrenFilterChange("All Children")}
              >
                All Children
              </button>
              {children.map((child) => (
                <button
                  key={child.id}
                  className="text-sm! 2xl:text-base! py-1 px-2 flex flex-row gap-2 items-center cursor-pointer"
                  onClick={() => handleChildrenFilterChange(child.id)}
                >
                  {child.fullName}
                </button>
              ))}
            </Box>
          </CWPopover>
          <FilterPopover
            open={Boolean(filterInvoiceAnchorEl)}
            anchorEl={filterInvoiceAnchorEl}
            onClose={() => setFilterInvoiceAnchorEl(null)}
            options={statusFilterOptions}
            onSelect={(value) => {
              setSelectedStatusFilter(value);
            }}
            width={150}
          />
        </Box>
      </Box>
      <div className="md:hidden w-full">
        <SearchTextfield
          placeholder="Search by invoice number, child name, status"
          endIcon={
            <button type="button" onClick={() => setMobileFilterOpen(true)} aria-label="Open filters">
              <FilterIcon className="text-gray-500" />
            </button>
          }
          isRounded
          fullWidth
          className="max-w-full"
          inputClasses="max-w-full bg-white"
        />
      </div>

      <div className="flex md:grid md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto md:overflow-x-visible hide-scrollbar sm:min-h-35 *:shrink-0 md:*:shrink">
        <InsightCard
          name="Total Invoices"
          value={`${formatAmount(metadata?.totalInvoices, 0) || 0}`}
          className="!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
        />
        <InsightCard
          name="Pending"
          value={`₦${formatAmount(metadata?.pendingAmount) || 0}`}
          className="!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
        />
        <InsightCard
          name="Overdue"
          value={`₦${formatAmount(metadata?.overdueAmount) || 0}`}
          className="!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
        />
        <InsightCard
          name="Total Paid"
          value={`₦${formatAmount(metadata?.totalPaid) || 0}`}
          className="!h-20 md:h-35 !min-w-52 md:min-w-0 border! border-[#00808033]! rounded-lg!"
        />
      </div>

      <Box className="hidden md:block bg-white rounded-2xl overflow-hidden flex-1">
        <Box className="">
          <Table
            headers={headers}
            tableData={invoiceTableData}
            tableClassName="text-sm"
            centeredHeaderIndex={[6]}
            rightAlignedIndex={[7]}
            isLoading={isLoading}
          />
        </Box>

        {/* PAGINATION */}
        <Box className="pb-10 flex justify-between items-center overflow-x-auto">
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalItems={pagination?.count}
            onPageChange={(event) => {
              applyFilters({
                pos: (event?.page - 1) * event?.rowsPerPage,
                delta: event?.rowsPerPage,
              });
            }}
          />
        </Box>

         {downloadInvoiceId && (
          <InvoicePdfDownloader invoiceId={downloadInvoiceId} onComplete={handleDownloadComplete} />
        )}
      </Box>
      <div className="md:hidden flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-xl border border-[#E4E7EC] bg-white p-4 h-24 animate-pulse" />
            ))
          : mobileInvoiceData?.map((invoice: {
              id: string | number;
              childName: string;
              invoiceType: string;
              invoiceNumber: string;
              dueDate: string;
              totalAmount: number;
              status: string;
            }) => (
              <div key={invoice.id} className="w-full rounded-xl border border-[#E4E7EC] bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-sm text-text-primary">{invoice.childName || "N/A"}</span>
                  <button
                    type="button"
                    onClick={() => setMobileActionInvoiceId(invoice.id)}
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
                  <span className="text-sm text-text-secondary">₦{formatAmount(invoice.totalAmount)}</span>
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusClassName(invoice.status)}`}
                  >
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
        {!!mobileInvoiceData?.length && (
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalItems={pagination?.count || 0}
            onPageChange={(event) => {
              applyFilters({
                pos: (event?.page - 1) * event?.rowsPerPage,
                delta: event?.rowsPerPage,
              });
            }}
            isCondense
            bottomTableClasses="!text-xs"
          />
        )}
      </div>

      <Drawer
        anchor="bottom"
        open={Boolean(mobileActionInvoiceId)}
        onClose={() => setMobileActionInvoiceId(null)}
        PaperProps={{ className: "rounded-t-2xl", style: { maxHeight: "40vh" } }}
      >
        <div className="px-6 pt-3 pb-8">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
          <button
            className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
            onClick={() => {
              const invoice = mobileInvoiceData?.find(
                (item: { id: string | number }) => item.id === mobileActionInvoiceId,
              );
              if (invoice) onInvoiceView({ id: invoice.id });
              setMobileActionInvoiceId(null);
            }}
          >
            View
          </button>
          <button
            className="w-full text-left py-4 text-sm font-medium text-[#022F2F]"
            onClick={() => {
              const invoice = mobileInvoiceData?.find(
                (item: { id: string | number; invoiceNumber: string }) => item.id === mobileActionInvoiceId,
              );
              if (invoice) onInvoiceDownload({ id: invoice.id, invoiceNumber: invoice.invoiceNumber });
              setMobileActionInvoiceId(null);
            }}
          >
            Download
          </button>
        </div>
      </Drawer>

      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        onApply={() => setMobileFilterOpen(false)}
        onReset={() => {
          setSelectedStatusFilter(statusFilterOptions[0]?.label);
          handleChildrenFilterChange("All Children");
          setMobileFilterOpen(false);
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Typography className="!text-sm !font-medium !text-[#02273A]">Status</Typography>
            <Dropdown
              isForm
              options={statusFilterOptions.map((f) => ({ value: f.value, name: f.label }))}
              value={selectedStatusFilter}
              onSelect={(value) => setSelectedStatusFilter(value as string)}
              textFieldProps={{ placeholder: "Filter by status", isRounded: true }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Typography className="!text-sm !font-medium !text-[#02273A]">Child</Typography>
            <Dropdown
              isForm
              options={[
                { value: "All Children", name: "All Children" },
                ...children.map((child) => ({ value: child.id, name: child.fullName })),
              ]}
              value={childrenFilter}
              onSelect={(value) =>
                handleChildrenFilterChange(value === "All Children" ? "All Children" : Number(value))
              }
              textFieldProps={{ placeholder: "Filter by child", isRounded: true }}
            />
          </div>
        </div>
      </MobileFilterDrawer>
    </Box>
  );
};
