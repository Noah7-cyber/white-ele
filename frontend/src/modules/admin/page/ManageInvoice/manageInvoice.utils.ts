import { InvoiceFormData, PaymentMethod } from "./manageInvoice.constants";

type InvoicePayloadOptions = {
  includeInvoiceNumber?: boolean;
  bankAccountIdFallback?: number | null;
};

export const createEmptyInvoiceItem = () => ({
  description: "",
  quantity: "",
  rate: "",
  vat: "0",
  displayAmount: "",
});

export const toNumber = (value: unknown) => Number(String(value ?? "").replace(/,/g, "")) || 0;

export const computeInvoiceTotals = (values: Pick<InvoiceFormData, "items" | "discount">) => {
  const subtotal = (values?.items ?? []).reduce((sum, item) => {
    const quantity = toNumber(item?.quantity);
    const rate = toNumber(item?.rate);
    return sum + quantity * rate;
  }, 0);

  const vatAmount = (values?.items ?? []).reduce((sum, item) => {
    const quantity = toNumber(item?.quantity);
    const rate = toNumber(item?.rate);
    const vat = Number(item?.vat) || 0;
    return sum + (quantity * rate * vat) / 100;
  }, 0);

  const parsedDiscount = toNumber(values?.discount ?? 0);
  const discount = Math.min(parsedDiscount, subtotal);

  return { subtotal, vatAmount, discount };
};

export const buildInvoicePayload = (
  values: InvoiceFormData,
  options?: InvoicePayloadOptions,
) => {
  const includeInvoiceNumber = options?.includeInvoiceNumber ?? false;
  const bankAccountFallback = options?.bankAccountIdFallback ?? null;
  const selectedPaymentMethod = values?.paymentMethod || PaymentMethod.TRANSFER;
  const shouldIncludeBankAccount = ![PaymentMethod.CASH, PaymentMethod.OTHER].includes(
    selectedPaymentMethod,
  );
  const selectedBankAccountId = Number(values?.bankAccountId);
  const bankAccountId = selectedBankAccountId || bankAccountFallback;
  const { vatAmount, discount } = computeInvoiceTotals(values);

  return {
    ...(includeInvoiceNumber ? { invoiceNumber: values.invoiceNumber } : {}),
    classroomId: Number(values.classroomId),
    studentsIds: (values.studentId || []).map((id: string | number) => Number(id)),
    ...(values.billingPeriod ? { billingPeriod: values.billingPeriod } : {}),
    ...(values.invoiceType ? { invoiceType: values.invoiceType } : {}),
    paymentMethod: selectedPaymentMethod,
    notes: values?.notes,
    issueDate: values.issueDate,
    dueDate: values.dueDate,
    discount,
    amountPaid: 0.0,
    vatAmount,
    ...(shouldIncludeBankAccount && bankAccountId ? { bankAccountId } : {}),
    items: (values?.items ?? []).map((item) => ({
      description: item?.description,
      quantity: toNumber(item?.quantity),
      rate: toNumber(item?.rate),
      vat: Number(item?.vat) || 0,
    })),
    vatPercent: values?.vatPercent,
  };
};
