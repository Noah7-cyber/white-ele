/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Box, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { PaymentMethod, type InvoiceFormData, type InvoiceItemForm } from "./manageInvoice.constants";
import {
  InvoicePreviewContent,
  INVOICE_STATUS_STYLES,
} from "@/modules/shared/component/InvoicePreviewModal/InvoicePreviewContent";
import type { School } from "@/services/school.service";

interface InvoicePreviewFormModalProps {
  open: boolean;
  onClose: () => void;
  formValues: Partial<InvoiceFormData>;
  invoiceStatus?: string;
  items: InvoiceItemForm[];
  getLineAmount: (i: { quantity: string; rate: string; vat: string }) => number;
  subtotal: number;
  discount?: number;
  vatTotal?: number;
  students?: any[];
  classroomList?: any[];
  bankAccounts?: any[];
  schoolDetails?: School | null;
}

export function InvoicePreviewFormModal({
  open,
  onClose,
  formValues,
  invoiceStatus,
  items,
  getLineAmount,
  subtotal,
  discount = 0,
  vatTotal: vatTotalProp = 0,
  students = [],
  classroomList = [],
  bankAccounts = [],
  schoolDetails = null,
}: InvoicePreviewFormModalProps) {
  const normalizeStatusLabel = (rawStatus?: string) => {
    if (!rawStatus) return "";
    const withSpaces = rawStatus.replace(/_/g, " ").toLowerCase();
    return withSpaces
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  if (!open) return null;

  const vatTotal = vatTotalProp ?? 0;
  const totalAfterDiscount = Math.max(0, subtotal + vatTotal - discount);

  const selectedStudentIds = formValues.studentId || [];
  const studentNames =
    selectedStudentIds
      .map((id) => {
        const s = students?.find((st) => String(st?.id) === String(id));
        return s ? `${s?.user?.firstName || ""} ${s?.user?.lastName || ""}`.trim() : null;
      })
      .filter(Boolean)
      .join(", ") || "—";

  const classroomName =
    classroomList?.find((c) => String(c?.id) === String(formValues.classroomId))?.classroomName ||
    "—";

  const firstStudent = (formValues.studentId || []).length
    ? students?.find((st) => String(st?.id) === String((formValues.studentId || [])[0]))
    : null;

  const schoolInfo = {
    schoolName: schoolDetails?.schoolName || "—",
    schoolLogoUrl: schoolDetails?.schoolLogoUrl || null,
    address: schoolDetails?.address || "",
    phoneNumber: schoolDetails?.phoneNumber || "",
    email: schoolDetails?.email || "",
  };

  const selectedPaymentMethod = formValues.paymentMethod || PaymentMethod.TRANSFER;
  const selectedBankAccount = bankAccounts?.find(
    (account) => String(account?.id) === String(formValues.bankAccountId),
  );

  const previewInvoice = {
    invoiceNumber: formValues.invoiceNumber || "—",
    issueDate: formValues.issueDate || "",
    dueDate: formValues.dueDate || "",
    paymentMethod: selectedPaymentMethod,
    subTotal: subtotal,
    discount,
    notes: formValues.notes || "",
    tax: vatTotal,
    total: totalAfterDiscount,
    amountPaid: 0,
    balance: totalAfterDiscount,
    classroom: {
      classroomName,
    },
    student: {
      school: schoolInfo,
      user: {
        firstName: studentNames,
        lastName: "",
      },
      parents: firstStudent?.parents || [],
    },
    bankAccount: selectedBankAccount
      ? {
          bankName: selectedBankAccount?.bankName,
          accountNumber: selectedBankAccount?.accountNumber,
          accountName: selectedBankAccount?.accountName,
        }
      : null,
    items: items.map((item) => ({
      description: item?.description || "—",
      quantity: Number(item?.quantity || 0),
      rate: Number(String(item?.rate || "0").replace(/,/g, "")),
      total: getLineAmount({
        quantity: item?.quantity || "0",
        rate: item?.rate || "0",
        vat: item?.vat || "0",
      }),
    })),
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <Box
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex !justify-between !items-center !p-2 !border-b !border-border-light">
          <Typography className="!text-lg !font-semibold ">Invoice Preview</Typography>
          <IconButton size="small" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <InvoicePreviewContent
            invoice={previewInvoice}
            status={normalizeStatusLabel(invoiceStatus)}
            statusStyles={INVOICE_STATUS_STYLES}
          />
        </div>
      </Box>
    </div>
  );
}
