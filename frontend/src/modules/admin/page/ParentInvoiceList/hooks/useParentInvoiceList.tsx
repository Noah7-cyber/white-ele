/* eslint-disable @typescript-eslint/no-explicit-any */
import { capitalizeFirstLetter, dateFormatter } from "@/utils/helpers";
import ChildInvoiceRowAction from "@/modules/admin/component/ChildInvoiceRowAction/childInvoiceRowAction";
import { useState } from "react";
import { useModalRoute } from "@/utils/hooks/useModalRoute";
import { ModalRoute } from "@/routes/modalRoutes";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { invoiceDynamicEndpoints, invoiceServices } from "@/services/invoice.service";
import { useParams, useRouter } from "next/navigation";
import { getInvoiceStatus } from "@/utils/helper";
import { CashViewer } from "@/modules/shared/component/CashViewer";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { usePermissionGuide } from "@/utils/hooks/usePermissionGuide";

const invoiceTypes: Record<string, string> = {
  "oneTime": "One Time Invoice",
  "recurring": "Recurring Invoice",
};

export function useParentInvoiceList({ statusFilter }: { statusFilter?: string } = {}) {
  const [isViewInvoice, setIsViewInvoice] = useState<any>(null);
  const { hasPermission} = usePermissionGuide({ enabled: true });
  const { id } = useParams()
  const router = useRouter()
  const [invoiceToDelete, setInvoiceToDelete] = useState<any | null>(null)
  const statusStyles: Record<string, string> = {
    Paid: "bg-[#E6FFF3] text-[#0A8A4C]",
    Sent: "bg-[#5988F726] text-[#5988F7]",
    Overdue: "bg-[#FFE6E6] text-[#C74444]",
    "Partially Paid": "bg-[#FFF6DD] text-[#A88400]",
  };
const { openModal } = useModalRoute()
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
    return (
      <ChildInvoiceRowAction
        status={status}
        onView={() => {
          openModal(ModalRoute.invoiceReceipt, {invoiceId: invoice?.id})
        }}
        onEdit={
          isPaid
            ? undefined
            : hasPermission("invoice", "update") ? () => {
                router.push(DashboardRoutes?.editInvoices?.replace(":invoiceId", invoice?.id))
              } : undefined
        }
        onDelete={hasPermission("invoice", "delete") ? () => {
          setInvoiceToDelete(invoice)
        } : undefined}
      />
    );
  };

   const { data: invoiceData = {} as any, isLoading, refetch} = useQueryService({
      service: {...invoiceServices.getAllInvoice, data: {
        parentId: id
      }}
    })


  const filteredInvoices = (invoiceData?.data || []).filter((invoice: any) => {
    if (!statusFilter) return true;
    const status = capitalizeFirstLetter(
      getInvoiceStatus({ total: +invoice?.total, balance: +invoice?.balance, dueDate: invoice?.dueDate }),
    );
    return status === statusFilter;
  });

  const invoiceTableData = filteredInvoices?.map((invoice: any) => {
    const row: any = {};

    row["Invoice Number"] = invoice?.invoiceNumber;
    row["Type"] = invoiceTypes?.[invoice?.invoiceType] || invoice?.invoiceType || 'N/A';
    row["Issued Date"] = dateFormatter(invoice?.issueDate);
    row["Due Date"] = dateFormatter(invoice?.dueDate);
    row["Amount"] = <CashViewer amount={invoice?.total} />;
    row["Balance"] = <CashViewer amount={invoice?.balance} />;

    row["Status"] = <StatusPill status={capitalizeFirstLetter(getInvoiceStatus({
      total: +invoice?.total,
      balance: +invoice?.balance,
      dueDate: invoice?.dueDate,
    }))} />;

    row["Action"] = renderRowActions(invoice);

    return row;
  });

    const { mutateAsync: deleteMutation, isPending: isDeletingInvoice } = useMutationService({
      service: invoiceDynamicEndpoints.deleteInvoice(invoiceToDelete?.id),
      options: {
        successTitle:'Deleted Successfully',
        successMessage: 'Invoice Deleted Successfully'
      }
    })
  
    async function handleDelete(){
     try {
       await deleteMutation({})
       refetch()
       setInvoiceToDelete(null)
     } catch (error) {
      
     }
    }

  return { invoiceTableData, invoices: filteredInvoices, isViewInvoice, isLoading, invoiceToDelete, isDeletingInvoice, setInvoiceToDelete, handleDelete, setIsViewInvoice };
}
