"use client";

import React from "react";
import * as yup from "yup";
import dayjs from "dayjs";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { invoiceDynamicEndpoints } from "@/services/invoice.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";

const formatWholeWithCommas = (whole: string) => {
  const normalized = whole.replace(/^0+(?=\d)/, "") || "0";
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const sanitizeDecimalInput = (value: string, maxDecimalPlaces = 2) => {
  const cleaned = value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
  const [whole, decimal] = cleaned.split(".");
  if (decimal == null) return whole;
  return `${whole}.${decimal.slice(0, maxDecimalPlaces)}`;
};

const formatCurrencyWhileTyping = (value: string, maxDecimalPlaces = 2) => {
  const sanitized = sanitizeDecimalInput(value, maxDecimalPlaces);
  if (!sanitized) return "";
  const hasDot = sanitized.includes(".");
  const [wholePart, decimalPart = ""] = sanitized.split(".");
  const formattedWhole = formatWholeWithCommas(wholePart || "0");
  if (!hasDot) return formattedWhole;
  if (sanitized.endsWith(".")) return `${formattedWhole}.`;
  return `${formattedWhole}.${decimalPart}`;
};

const parseAmount = (value: string | number | null | undefined) => {
  const numeric = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(numeric) ? numeric : 0;
};

interface InvoiceForPayment {
  balance?: number | string;
  issueDate?: string;
}

interface UseRecordPaymentModalArgs {
  open: boolean;
  invoiceId: string | number | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function useRecordPaymentModal({
  open,
  invoiceId,
  onClose,
  onSuccess,
}: UseRecordPaymentModalArgs) {
  const [hasInitializedDefaults, setHasInitializedDefaults] = React.useState(false);

  const { data: invoiceResponse } = useQueryService<object, { data: InvoiceForPayment }>({
    service: invoiceDynamicEndpoints.getInvoiceById(invoiceId as string),
    options: {
      enabled: open && !!invoiceId,
    },
  });
  const invoice = invoiceResponse?.data;

  const amountDue = React.useMemo(() => {
    const dueAmount = Number(invoice?.balance ?? 0);
    return Number.isFinite(dueAmount) ? Math.max(dueAmount, 0) : 0;
  }, [invoice?.balance]);

  const issueDate = invoice?.issueDate ? String(invoice.issueDate) : "";

  const schema = React.useMemo(
    () =>
      yup.object().shape({
        amountPaid: yup
          .string()
          .required("Amount paid is required")
          .test("amount-format", "Enter a valid amount with up to 2 decimal places", (value) => {
            if (!value) return false;
            const normalized = String(value).replace(/,/g, "").trim();
            return /^\d+(\.\d{1,2})?$/.test(normalized);
          })
          .test("max-amount-due", "Amount paid cannot be greater than amount due", (value) => {
            if (!value) return false;
            const amount = parseAmount(value);
            return amount <= amountDue;
          }),
        paymentDate: yup
          .string()
          .nullable()
          .required("Payment date is required")
          .test(
            "payment-date-not-before-issue",
            "Payment date cannot be earlier than issue date",
            (value) => {
              if (!value || !issueDate) return true;
              const paymentDay = dayjs(value);
              const issueDay = dayjs(issueDate);
              if (!paymentDay.isValid() || !issueDay.isValid()) return false;
              return !paymentDay.startOf("day").isBefore(issueDay.startOf("day"));
            },
          ),
        paymentMethod: yup.string().required("Payment method is required"),
      }),
    [amountDue, issueDate],
  );

  const form = useFormValidator({
    validationSchema: schema,
    defaultValues: {
      amountPaid: "",
      paymentDate: "",
      paymentMethod: "",
    },
  });

  React.useEffect(() => {
    if (!open || !invoiceId) return;
    if (!hasInitializedDefaults) {
      form.reset({
        amountPaid: "",
        paymentDate: "",
        paymentMethod: "",
      });
      setHasInitializedDefaults(true);
    }
  }, [open, invoiceId, hasInitializedDefaults, form]);

  React.useEffect(() => {
    if (!open) {
      setHasInitializedDefaults(false);
    }
  }, [open]);

  const { mutateAsync: recordPayment, isPending } = useMutationService({
    service: invoiceDynamicEndpoints.recordPayment(invoiceId as string),
    options: {
      successTitle: "Payment recorded",
      successMessage: "Payment recorded successfully",
    },
  });

  const onAmountPaidChange = (value: string) => {
    const formattedValue = formatCurrencyWhileTyping(value, 2);
    const amount = parseAmount(formattedValue);
    if (amount > amountDue) {
      form.setError("amountPaid", {
        type: "manual",
        message: "Amount paid cannot be greater than amount due",
      });
    } else {
      form.clearErrors("amountPaid");
    }
    return formattedValue;
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!invoiceId) return;
    const amount = parseAmount(values.amountPaid);
    if (amount > amountDue) {
      form.setError("amountPaid", {
        type: "manual",
        message: "Amount paid cannot be greater than amount due",
      });
      return;
    }
    await recordPayment({
      amountPaid: amount,
      paymentDate: values.paymentDate,
      paymentMethod: values.paymentMethod,
    });
    form.reset();
    onSuccess?.();
    onClose();
  });

  return {
    form,
    isPending,
    issueDate,
    handleSubmit,
    onAmountPaidChange,
  };
}
