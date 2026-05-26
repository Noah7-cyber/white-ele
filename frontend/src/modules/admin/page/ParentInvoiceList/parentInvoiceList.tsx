import { PaginationControls } from "@/modules/shared/component/Pagination";
import { Table } from "@/modules/shared/component/Table";
import { Box } from "@mui/system";
import { useParentInvoiceList } from "./hooks/useParentInvoiceList";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import TrashIcon from "@/modules/shared/assets/svgs/trashicon.svg";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import {
  MobileInvoiceCard,
  MobileInvoiceCardSkeleton,
} from "@/modules/admin/component/MobileInvoiceCard";
import { capitalizeFirstLetter } from "@/utils/helpers";
import { getInvoiceStatus } from "@/utils/helper";
import { useParams, useRouter } from "next/navigation";
import { DashboardRoutes } from "@/routes/dashboard.routes";

interface ParentInvoiceListProps {
  statusFilter?: string;
}

export const ParentInvoiceList = ({ statusFilter }: ParentInvoiceListProps) => {
  const {
    invoiceTableData,
    invoices,
    isLoading,
    invoiceToDelete,
    isDeletingInvoice,
    setInvoiceToDelete,
    handleDelete,
  } = useParentInvoiceList({ statusFilter });

  const isMobile = useMediaQuery("(max-width: 767px)");
  const router = useRouter();
  const { id: parentId } = useParams();

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
    <Box className="w-full">
      {isMobile ? (
        <Box className="flex flex-col gap-3 mt-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <MobileInvoiceCardSkeleton key={i} />)
            : // eslint-disable-next-line @typescript-eslint/no-explicit-any
              invoices.map((invoice: any) => {
                const status = capitalizeFirstLetter(
                  getInvoiceStatus({
                    total: +invoice?.total,
                    balance: +invoice?.balance,
                    dueDate: invoice?.dueDate,
                  }),
                );
                const isPaid = status === "Paid";
                return (
                  <MobileInvoiceCard
                    key={invoice?.id}
                    type={invoice?.invoiceNumber || "N/A"}
                    amount={invoice?.total}
                    status={status}
                    onView={() =>
                      router.push(
                        DashboardRoutes.parentInvoiceDetail
                          .replace(":id", String(parentId))
                          .replace(":invoiceId", String(invoice?.id)),
                      )
                    }
                    onEdit={
                      isPaid
                        ? undefined
                        : () =>
                            router.push(
                              DashboardRoutes?.editInvoices?.replace(":invoiceId", invoice?.id),
                            )
                    }
                    onDelete={() => setInvoiceToDelete(invoice)}
                  />
                );
              })}
        </Box>
      ) : (
        <Box className="mt-4">
          <Table
            headers={headers}
            tableData={invoiceTableData}
            tableClassName="text-sm"
            centeredHeaderIndex={[6]}
            isLoading={isLoading}
          />
        </Box>
      )}

      {/* PAGINATION */}
      <Box className="pb-10 flex justify-between items-center">
        <PaginationControls
          currentPage={1}
          rowsPerPage={50}
          totalItems={10}
          onPageChange={(event) => {
            // applyFilters({pos: (event?.page - 1) * event?.rowsPerPage, delta: event?.rowsPerPage })
          }}
        />
      </Box>
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
    </Box>
  );
};
