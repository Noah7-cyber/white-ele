import { PaginationControls } from "@/modules/shared/component/Pagination";
import { Table } from "@/modules/shared/component/Table";
import { Box } from "@mui/system";
import { useChildInvoiceList } from "./hooks/useChildInvoiceList";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import { RecordPaymentModal } from "@/modules/admin/component/RecordPaymentModal";
import { InvoicePdfDownloader } from "@/modules/shared/component/InvoicePreviewModal/InvoicePdfDownloader";
import { ChildInvoiceCard } from "./ChildInvoiceCard";

interface ChildInvoiceListProps {
  role?: "admin" | "staff" | "parent";
}

export const ChildInvoiceList = ({ role = "admin" }: ChildInvoiceListProps) => {
  const {
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
  } = useChildInvoiceList(role);

  const isAdmin = role === "admin";

  const headers = [
    "Invoice Number",
    "Type",
    "Issued Date",
    "Due Date",
    "Amount",
    "Balance",
    "Status",
    "Action",
  ];

  return (
    <Box className="w-full px-3 sm:px-5 bg-dashboard-bg md:bg-transparent min-w-0">
      {/* Small screens: card list */}
      <Box className="flex flex-col gap-3 mt-4 md:hidden">
        {invoiceListRaw.map((invoice) => (
          <ChildInvoiceCard
            key={invoice?.id}
            invoice={invoice}
            onView={() => handleCardView(invoice)}
            onDuplicate={() => handleCardDuplicate(invoice)}
            onDownload={() => handleCardDownload(invoice)}
            onDelete={() => handleCardDelete(invoice)}
          />
        ))}
      </Box>

      {/* md+: horizontal scroll table (avoids cramped / clipped columns on tablets) */}
      <Box className="mt-4 hidden md:block w-full min-w-0 overflow-x-auto [scrollbar-width:thin] pb-2">
        <Box className="min-w-[720px]">
          <Table
            headers={headers}
            tableData={invoiceTableData}
            tableClassName="text-sm"
            centeredHeaderIndex={[6]}
            isLoading={isLoading}
          />
        </Box>
      </Box>

      {/* PAGINATION */}
      <Box className="hidden pb-10 md:flex justify-between items-center">
        <PaginationControls
          currentPage={currentPage}
          rowsPerPage={filters?.delta}
          totalItems={totalItems}
          onPageChange={(event) => {
            applyFilters({
              pos: (event?.page - 1) * event?.rowsPerPage,
              delta: event?.rowsPerPage,
            });
          }}
        />
      </Box>

      {isAdmin && (
        <>
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
        </>
      )}

      {downloadInvoiceId && (
        <InvoicePdfDownloader invoiceId={downloadInvoiceId} onComplete={handleDownloadComplete} />
      )}
    </Box>
  );
};
