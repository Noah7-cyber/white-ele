/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { Box, Typography, Drawer } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Table } from "@/modules/shared/component/Table/table";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";
import { useChildInvoices } from "./hooks/useChildInvoices";
import ChildInvoiceRowAction from "@/modules/admin/component/ChildInvoiceRowAction/childInvoiceRowAction";
import { CircularProgress } from "@mui/material";
import { useChildDateFilter } from "./ChildDetailComponent";
import { useModalRoute } from "@/utils/hooks/useModalRoute";
import { ModalRoute } from "@/routes/modalRoutes";
import { InvoicePdfDownloader } from "@/modules/shared/component/InvoicePreviewModal/InvoicePdfDownloader";
const statusStyles: Record<string, string> = {
  Paid: "bg-[#E6FFF3] text-[#0A8A4C]",
  Overdue: "bg-[#FFE6E6] text-[#C74444]",
  Unpaid: "bg-[#FFE6E6] text-[#C74444]",
  Pending: "bg-[#FFF6DD] text-[#A88400]",
  Sent: "bg-[#5988F726] text-[#5988F7]",
  "Partially Paid": "bg-[#FFF6DD] text-[#A88400]",
};

const invoiceTypes: Record<string, string> = {
  "oneTime": "One Time Invoice",
  "recurring": "Recurring Invoice",
};

const getStatusClassName = (status: string) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "paid") return "bg-[#E6FFF3] text-[#0A8A4C]";
  if (normalized === "overdue") return "bg-[#FFE6E6] text-[#C74444]";
  if (normalized === "partially paid") return "bg-[#FFF6DD] text-[#A88400]";
  if (normalized === "pending") return "bg-[#FFF6DD] text-[#A88400]";
  if (normalized === "unpaid") return "bg-[#FFE6E6] text-[#C74444]";
  return "bg-[#5988F726] text-[#5988F7]";
};

export function InvoicesTab() {
  const { openModal } = useModalRoute();
  const [downloadInvoiceId, setDownloadInvoiceId] = useState<string | null>(null);
  const [mobileActionInvoiceId, setMobileActionInvoiceId] = useState<string | number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const { startDate, endDate } = useChildDateFilter();
  const { invoices, isLoading } = useChildInvoices({ startDate, endDate });

  const headers = [
    "Invoice Number",
    "Type",
    "Due Date",
    "Balance",
    "Total Amount",
    "Status",
    "Action",
  ];

  const tableData = invoices.map((inv: any) => ({
    "Invoice Number": (
      <Typography className="!text-xs !font-medium !text-[#3D3D3D]">{inv.number}</Typography>
    ),
    Type: (
      <Typography className="!text-xs !font-medium !text-[#3D3D3D]">
        {invoiceTypes[inv.type]}
      </Typography>
    ),
    "Due Date": (
      <Typography className="!text-xs !font-medium !text-[#3D3D3D]">{inv.dueDate}</Typography>
    ),
    Balance: (
      <Typography className="!text-xs !font-medium !text-[#3D3D3D]">{inv.balance}</Typography>
    ),
    "Total Amount": (
      <Typography className="!text-xs !font-medium !text-[#3D3D3D]">{inv.total}</Typography>
    ),
    Status: (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[inv.status] || ""}`}
      >
        {inv.status}
      </span>
    ),
    Action: (
      <ChildInvoiceRowAction
        onView={() => {
          openModal(ModalRoute.invoiceReceipt, { invoiceId: inv.id });
        }}
        onDownload={() => setDownloadInvoiceId(String(inv.id))}
      />
    ),
  }));

  const handleDownloadComplete = () => setDownloadInvoiceId(null);

  const pageSlice = (currentPage - 1) * rowsPerPage;
  const paginatedInvoices = invoices.slice(pageSlice, pageSlice + rowsPerPage);
  const paginatedTableData = tableData.slice(pageSlice, pageSlice + rowsPerPage);

  return (
    <Box className="flex flex-col gap-6">
      <Box className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Mobile: invoice cards (aligned with BillingInvoice / parent invoicing) */}
        <div className="md:hidden flex flex-col gap-3 p-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#E4E7EC] bg-white p-4 h-24 animate-pulse"
                />
              ))
            : paginatedInvoices.map((inv: any) => (
                <div
                  key={inv.id}
                  className="w-full rounded-xl border border-[#E4E7EC] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Typography className="!text-sm !font-semibold !text-text-primary truncate">
                        {inv.number}
                      </Typography>
                      <Typography className="!text-xs !text-text-tertiary/70 mt-0.5 truncate">
                        {invoiceTypes[inv.type] ?? inv.type}
                      </Typography>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileActionInvoiceId(inv.id)}
                      className="p-1 rounded-full hover:bg-gray-100 shrink-0"
                      aria-label="More options"
                    >
                      <MoreHorizIcon className="text-gray-500" fontSize="small" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-sm text-text-secondary truncate">{inv.total}</span>
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full shrink-0 ${getStatusClassName(inv.status)}`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
        </div>

        <Box className="hidden md:block">
          {isLoading ? (
            <Box className="flex items-center justify-center py-20">
              <CircularProgress />
            </Box>
          ) : (
            <Table
              headers={headers}
              tableData={paginatedTableData}
              centeredHeaderIndex={[1, 2, 3, 4, 5]}
              tableClassName="!border-none"
              headerRowClassName="!bg-[#F9FAFB] border-b border-gray-100"
              bodyRowClassName="!h-16 border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors"
              bodyCellClassName="!py-0"
            />
          )}
        </Box>

        {!!invoices.length && !isLoading && (
          <Box className="p-4 md:p-6 border-t border-gray-100 flex justify-between items-center md:hidden">
            <PaginationControls
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              totalItems={invoices.length}
              onPageChange={({ page, rowsPerPage: newRowsPerPage }) => {
                setCurrentPage(page);
                setRowsPerPage(newRowsPerPage);
              }}
              isCondense
              bottomTableClasses="!text-xs"
            />
          </Box>
        )}
        {!!invoices.length && !isLoading && (
          <Box className="hidden md:flex p-6 border-t border-gray-100 justify-between items-center">
            <PaginationControls
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              totalItems={invoices.length}
              onPageChange={({ page, rowsPerPage: newRowsPerPage }) => {
                setCurrentPage(page);
                setRowsPerPage(newRowsPerPage);
              }}
            />
          </Box>
        )}

        {downloadInvoiceId && (
          <InvoicePdfDownloader invoiceId={downloadInvoiceId} onComplete={handleDownloadComplete} />
        )}
      </Box>

      <Drawer
        anchor="bottom"
        open={Boolean(mobileActionInvoiceId)}
        onClose={() => setMobileActionInvoiceId(null)}
        PaperProps={{ className: "rounded-t-2xl", style: { maxHeight: "40vh" } }}
      >
        <div className="px-6 pt-3 pb-8">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
          <button
            type="button"
            className="w-full text-left py-4 text-sm font-medium border-b border-gray-100 text-[#022F2F]"
            onClick={() => {
              const inv = invoices.find((i: any) => i.id === mobileActionInvoiceId);
              if (inv) openModal(ModalRoute.invoiceReceipt, { invoiceId: inv.id });
              setMobileActionInvoiceId(null);
            }}
          >
            View
          </button>
          <button
            type="button"
            className="w-full text-left py-4 text-sm font-medium text-[#022F2F]"
            onClick={() => {
              const inv = invoices.find((i: any) => i.id === mobileActionInvoiceId);
              if (inv) setDownloadInvoiceId(String(inv.id));
              setMobileActionInvoiceId(null);
            }}
          >
            Download
          </button>
        </div>
      </Drawer>
    </Box>
  );
}
