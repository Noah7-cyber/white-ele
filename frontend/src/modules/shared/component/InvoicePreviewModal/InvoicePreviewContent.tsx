/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { forwardRef } from "react";
import { Divider } from "@mui/material";
import { Box } from "@mui/system";
import { dateFormatter } from "@/utils/helpers";
import { formatAmount } from "@/utils/hooks/formatNumber";
import { NAIRA } from "@/constants";
import { CashViewer } from "../CashViewer";

export const INVOICE_STATUS_STYLES: Record<string, string> = {
  Paid: "bg-[#E6FFF3] text-[#0A8A4C]",
  Sent: "bg-[#5988F726] text-[#5988F7]",
  Overdue: "bg-[#FFE6E6] text-[#C74444]",
  "Partially Paid": "bg-[#FFF6DD] text-[#A88400]",
};

interface InvoicePreviewContentProps {
  invoice: any;
  status: string;
  statusStyles?: Record<string, string>;
}

export const InvoicePreviewContent = forwardRef<HTMLDivElement, InvoicePreviewContentProps>(
  function InvoicePreviewContent({ invoice, status, statusStyles = INVOICE_STATUS_STYLES }, ref) {
    const toNumber = (value: unknown) => {
      const parsed = Number(value ?? 0);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const school = invoice?.student?.school;
    const invoiceBankAccount = invoice?.bankAccount;
    const billedToParent = invoice?.student?.parents?.[0];
    const billedToChild =
      `${invoice?.student?.user?.firstName || ""} ${invoice?.student?.user?.lastName || ""}`.trim() || "N/A";
    const fullParentName =
      `${billedToParent?.user?.firstName || ""} ${billedToParent?.user?.lastName || ""}`.trim() ||
      "Valued Client";
    const schoolName = school?.schoolName || "School";
    const bankName = invoiceBankAccount?.bankName || school?.bankName || "Access Bank";
    const accountNumber = invoiceBankAccount?.accountNumber || school?.accountNumber || "N/A";
    const accountName = invoiceBankAccount?.accountName || school?.accountName || schoolName;
    const paymentMethod = String(invoice?.paymentMethod || "transfer").toLowerCase();
    const shouldShowBankDetails = !["cash", "other"].includes(paymentMethod);
    const paymentMethodLabel = paymentMethod
      ? paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)
      : "Cash";
    const brandColor = school?.brandColor || "#0A8A84";
    const invoiceItems = Array.isArray(invoice?.items) ? invoice.items : [];
    const subtotalAmount = toNumber(invoice?.subTotal);
    const discountAmount = toNumber(invoice?.discount);
    const invoiceTaxAmount = toNumber(invoice?.tax);
    const invoiceTotalAmount = toNumber(invoice?.total);

    const computedSubtotalFromItems = invoiceItems.reduce((sum: number, item: any) => {
      return sum + toNumber(item?.quantity) * toNumber(item?.rate);
    }, 0);

    const computedTaxFromItems = invoiceItems.reduce((sum: number, item: any) => {
      const lineSubtotal = toNumber(item?.quantity) * toNumber(item?.rate);
      const lineTotal = toNumber(item?.total);
      const lineTaxPercent = toNumber(item?.tax);

      if (lineTotal > 0 && lineTotal >= lineSubtotal) {
        return sum + (lineTotal - lineSubtotal);
      }

      return sum + (lineSubtotal * lineTaxPercent) / 100;
    }, 0);

    const taxAmount =
      invoiceTaxAmount > 0 || computedTaxFromItems === 0 ? invoiceTaxAmount : computedTaxFromItems;
    const totalAmount =
      invoiceTotalAmount > 0
        ? invoiceTotalAmount
        : (subtotalAmount || computedSubtotalFromItems) - discountAmount + taxAmount;

    const vatPercentFromInvoice = Number(invoice?.vatPercent);
    const hasVatPercentFromInvoice = Number.isFinite(vatPercentFromInvoice);
    const itemTaxPercents = invoiceItems
      .map((item: any) => toNumber(item?.tax))
      .filter((value: number) => value > 0);
    const hasUniformItemTax =
      itemTaxPercents.length > 0 && itemTaxPercents.every((value) => value === itemTaxPercents[0]);

    // Fallback when vatPercent is not persisted: infer from item-level tax or totals.
    const computedVatPercent =
      hasUniformItemTax
        ? itemTaxPercents[0]
        : subtotalAmount > 0 && taxAmount >= 0
          ? Number(((taxAmount / subtotalAmount) * 100).toFixed(1))
          : 0;
    const taxPercentToDisplay = hasVatPercentFromInvoice ? vatPercentFromInvoice : computedVatPercent;

    return (
      <Box ref={ref} className="px-3 py-6 bg-white ">
        <div className="flex items-start pt-6 justify-between gap-6">
          <div className="flex-1 max-w-sm">
            <Box className="h-16 w-16 mb-3">
              {school?.schoolLogoUrl && (
                <img
                  src={school?.schoolLogoUrl}
                  width={100}
                  height={100}
                  alt=""
                  className="h-full w-full object-contain"
                />
              )}
            </Box>
            <h2 className={`!text-2xl font-bold text-${brandColor} leading-tight`}>{schoolName}</h2>
            <p className="mt-3 text-sm text-[#667085]">
              {school?.address || "N/A"}
              <br />
              {school?.phoneNumber || "N/A"} | {school?.email || "N/A"}
            </p>
          </div>

          <div className="text-right min-w-[220px]">
            <p className="text-2xl font-bold tracking-wide text-[#111827]">INVOICE</p>
            <p className={`mt-3 text-lg font-semibold text-[#111827]`}>#{invoice?.invoiceNumber}</p>
            <span
              className={`inline-block mt-4 px-3 py-1 rounded-md text-xs font-semibold ${statusStyles[status] || ""}`}
            >
              {status}
            </span>
          </div>
        </div>

        <Divider className="!my-6 !border-[#008080]" />

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-lg font-semibold text-[#667085] uppercase">Bill To</p>
            <Divider className="!my-2 !w-40" />
            <p className="text-lg font-semibold text-[#111827]">{fullParentName}</p>
            <p className="text-base text-[#344054] mt-1">
              <span className="font-semibold">Child:</span> {billedToChild}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-[#667085] uppercase">Details</p>
            <Divider className="!my-2 !ml-auto !w-40" />
            <p className="text-base text-[#344054]">
              <span className="font-semibold">Date:</span> {dateFormatter(invoice?.issueDate)}
            </p>
            <p className="text-base text-[#344054] mt-1">
              <span className="font-semibold">Due:</span> {dateFormatter(invoice?.dueDate)}
            </p>
            <p className="text-base text-[#344054] mt-1">
              <span className="font-semibold">Payment method:</span> {paymentMethodLabel}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#E6F4F4] text-[#0A8A84] border-b-2 border-[#008080]">
                <th className="text-left py-3 px-4">DESCRIPTION</th>
                <th className="text-center py-3 px-4">QTY</th>
                <th className="text-right py-3 px-4">RATE</th>
                <th className="text-right py-3 px-4">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {(invoice?.items || []).map((item: any, idx: number) => (
                <tr key={idx} className="text-[#1D2939] border-b border-[#EAECF0]">
                  <td className="py-4 px-4">{item?.description}</td>
                  <td className="text-center py-4 px-4">{item?.quantity}</td>
                  <td className="text-right py-4 px-4">
                    <CashViewer amount={item?.rate} />
                  </td>
                  <td className="text-right py-4 px-4">
                    <CashViewer
                      amount={item?.total}
                      symbolClassName="font-semibold"
                      valueClassName="font-semibold"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="w-full max-w-[240px] space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#667085]">Subtotal</span>
              <span className="font-semibold">{`${NAIRA.symbol}${formatAmount(subtotalAmount || computedSubtotalFromItems)}`}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-[#667085]">Discount</span>
                <span className="font-semibold text-red-500">{`-${NAIRA.symbol}${formatAmount(discountAmount)}`}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#667085]">Tax ({`${taxPercentToDisplay}%`})</span>
              <span className="font-semibold">
                {NAIRA.symbol + '' + formatAmount(taxAmount)}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-lg font-bold text-[#0A8A84]">Total</span>
              <span className="text-lg font-bold text-[#0A8A84]">
                {`${NAIRA.symbol}${formatAmount(totalAmount)}`}
              </span>
            </div>
            {Number(invoice?.amountPaid || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-[#667085]">Amount Paid</span>
                <span className="font-semibold">{`${NAIRA.symbol}${formatAmount(invoice?.amountPaid)}`}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-[#EAECF0]">
              <span className="text-lg font-bold text-[#0A8A84]">Balance</span>
              <span className="text-lg font-bold text-[#0A8A84]">
                {`${NAIRA.symbol}${formatAmount(invoice?.balance)}`}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 border border-[#A88400]/80 rounded-xl bg-[#FFF6DD] px-6 py-5">
          <p className="text-[#A88400] font-semibold uppercase mb-3">Notes</p>
          <p className="text-[#1D2939]">
            <span className="font-semibold">{invoice?.notes || "No notes"}</span>
          </p>
        </div>

        <div className="mt-8 border border-[#00808080] rounded-xl bg-[#E6F4F4] px-6 py-5">
          <p className="text-[#0A8A84] font-semibold uppercase mb-3">Payment Details</p>
          <p className="text-[#1D2939]">
            <span className="font-semibold">Payment method:</span> {paymentMethodLabel}
          </p>
          {shouldShowBankDetails ? (
            <>
              <p className="text-[#1D2939] mt-1">
                <span className="font-semibold">Bank name:</span> {bankName}
              </p>
              <p className="text-[#1D2939] mt-1">
                <span className="font-semibold">Account number:</span> {accountNumber}
              </p>
              <p className="text-[#1D2939] mt-1">
                <span className="font-semibold">Account name:</span> {accountName}
              </p>
            </>
          ) : (
            <p className="text-[#1D2939] mt-1">Bank account details are not required for this method.</p>
          )}
        </div>

        <Divider className="!my-7" />
        <div className="text-center text-[#98A2B3] !text-sm  gap-1">
          <p>
            Thank you for choosing {schoolName}. <br />
            {new Date().getFullYear()}. All rights reserved.
          </p>
        </div>
      </Box>
    );
  },
);
