/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { CircularProgress } from "@mui/material";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { unwrapQueryDataBody } from "@/utils/unwrapQueryResponse";
import { invoiceDynamicEndpoints } from "@/services/invoice.service";
import { capitalizeFirstLetter, dateFormatter } from "@/utils/helpers";
import { getInvoiceStatus } from "@/utils/helper";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { Button } from "@/modules/shared/component/Button";
import DownloadIcon from "@/modules/shared/assets/svgs/download-icon-1.svg.svg";
import client from "@/utils/client";
import { NAIRA } from "@/constants";
import { formatAmount } from "@/utils/hooks/formatNumber";
import Image from "next/image";
import SchoolLogo from "@/modules/shared/assets/svgs/school-logo.svg";
import Notifications from "@/modules/admin/component/Notifications/notifications";

const MOBILE_STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  Paid: { bg: "bg-[#E6FFF3]", text: "text-[#0A8A4C]", dot: "bg-[#0A8A4C]" },
  Sent: { bg: "bg-[#5988F726]", text: "text-[#5988F7]", dot: "bg-[#5988F7]" },
  Overdue: { bg: "bg-[#FFE6E6]", text: "text-[#C74444]", dot: "bg-[#C74444]" },
  "Partially Paid": { bg: "bg-[#FFF6DD]", text: "text-[#A88400]", dot: "bg-[#A88400]" },
};

const DEFAULT_STATUS_STYLE = { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };

const ItemIcon = () => (
  <div className="w-9 h-9 rounded-lg bg-[#E6F4F4] flex items-center justify-center shrink-0">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z"
        fill="#0A8A84"
      />
    </svg>
  </div>
);

interface MobileInvoiceDetailProps {
  invoiceId: string | number;
  onBack: () => void;
}

export const MobileInvoiceDetail: React.FC<MobileInvoiceDetailProps> = ({ invoiceId, onBack }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const invoiceQuery = useQueryService({
    service: invoiceDynamicEndpoints.getInvoiceById(String(invoiceId)),
    options: {
      keys: ["invoice", String(invoiceId)],
      enabled: !!invoiceId,
    },
  });
  const { isLoading } = invoiceQuery;
  const invoice = unwrapQueryDataBody<Record<string, any>>(invoiceQuery.data);

  const normalizeStatusLabel = (rawStatus?: string) => {
    if (!rawStatus) return "";
    const withSpaces = rawStatus.replace(/_/g, " ").toLowerCase();
    return withSpaces
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const status =
    normalizeStatusLabel(invoice?.status) ||
    capitalizeFirstLetter(
      getInvoiceStatus({
        total: +invoice?.total,
        balance: +invoice?.balance,
        dueDate: invoice?.dueDate,
      }),
    );

  const statusStyle = MOBILE_STATUS_STYLES[status] || DEFAULT_STATUS_STYLE;
  const school = invoice?.student?.school;
  const schoolName = school?.schoolName || "School";
  const billedToParent = invoice?.student?.parents?.[0];
  const fullParentName =
    `${billedToParent?.user?.firstName || ""} ${billedToParent?.user?.lastName || ""}`.trim() ||
    "Valued Client";
  const items: any[] = invoice?.items || [];
  const taxAmount = Number(invoice?.tax ?? 0);
  const subtotalAmount = Number(invoice?.subTotal ?? 0);
  const vatPercentFromInvoice = Number(invoice?.vatPercent);
  const hasVatPercentFromInvoice = Number.isFinite(vatPercentFromInvoice);
  const computedVatPercent =
    subtotalAmount > 0 && taxAmount >= 0
      ? Number(((taxAmount / subtotalAmount) * 100).toFixed(1))
      : 0;
  const taxPercentToDisplay = hasVatPercentFromInvoice ? vatPercentFromInvoice : computedVatPercent;

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const id = invoiceId || invoice?.id;
      if (!id) return;
      const blobUrl = await client.request({
        ...invoiceDynamicEndpoints.downloadInvoicePdf(id),
        options: { isPdf: true },
      });
      const a = document.createElement("a");
      a.href = blobUrl as string;
      a.download = `Invoice-${invoice?.invoiceNumber || id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(blobUrl as string);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F9F9]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-white">
        <button type="button" onClick={onBack} className="p-1 rounded-full" aria-label="Go back">
          <ArrowBackIosNewIcon className="text-lg! text-[#101828]" />
        </button>
        <Notifications />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-32 px-4 pt-4">
        <DataRenderer isLoading={isLoading} isEmpty={!invoice}>
          {() => (
            <>
              {/* School Logo */}
              <div className="flex justify-center mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white shrink-0">
                    {school?.schoolLogoUrl ? (
                      <Image
                        src={school.schoolLogoUrl}
                        alt={schoolName}
                        width={40}
                        height={40}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <SchoolLogo className="w-8 h-8" />
                    )}
                  </div>
                  <span className="text-base font-semibold text-[#008080]">{schoolName}</span>
                </div>
              </div>

              {/* Invoice Number + Status Card */}
              <div className="bg-white rounded-xl px-4 py-4 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-primary-text-light mb-1">Invoice Number</p>
                    <p className="text-base font-semibold text-[#101828]">
                      #{invoice?.invoiceNumber}
                    </p>
                  </div>
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    {status}
                  </span>
                </div>
              </div>

              {/* Date Cards */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white rounded-xl px-4 py-3">
                  <p className="text-xs text-primary-text-light mb-1">Issue Date</p>
                  <p className="text-sm font-semibold text-[#101828]">
                    {dateFormatter(invoice?.issueDate)}
                  </p>
                </div>
                <div className="bg-white rounded-xl px-4 py-3">
                  <p className="text-xs text-primary-text-light mb-1">Due Date</p>
                  <p className="text-sm font-semibold text-[#101828]">
                    {dateFormatter(invoice?.dueDate)}
                  </p>
                </div>
              </div>

              {/* Billed From / Billed To */}
              <div className="bg-white rounded-xl px-4 py-4 mb-3">
                <div className="mb-3">
                  <p className="text-xs text-primary-text-light mb-0.5">Billed From</p>
                  <p className="text-sm font-semibold text-[#101828]">{schoolName}</p>
                  <p className="text-xs text-primary-text-light mt-0.5">
                    {school?.address || "N/A"} &middot; {school?.phoneNumber || "N/A"}
                  </p>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-primary-text-light mb-0.5">Billed To</p>
                  <p className="text-sm font-semibold text-[#101828]">{fullParentName}</p>
                </div>
              </div>

              {/* Items Section */}
              <div className="bg-white rounded-xl px-4 py-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-[#101828]">Items</p>
                  <span className="text-xs text-primary-text-light">
                    {items.length} Item{items.length !== 1 ? "s" : ""} total
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-header-gray">
                      <ItemIcon />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#101828] truncate">
                          {item?.description}
                        </p>
                        <p className="text-xs text-primary-text-light">
                          Qty: {item?.quantity} &times; {NAIRA.symbol}
                          {formatAmount(item?.rate)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[#101828] shrink-0">
                        {NAIRA.symbol}
                        {formatAmount(item?.total)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-white rounded-xl px-4 py-4 mb-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-primary-text-light">Subtotal</span>
                    <span className="font-medium text-[#101828]">
                      {NAIRA.symbol}
                      {formatAmount(invoice?.subTotal)}
                    </span>
                  </div>
                  {Number(invoice?.discount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-primary-text-light">Discount</span>
                      <span className="font-medium text-red-500">
                        -{NAIRA.symbol}
                        {formatAmount(invoice?.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-primary-text-light">Tax ({taxPercentToDisplay}%)</span>
                    <span className="font-medium text-[#101828]">
                      {NAIRA.symbol}
                      {formatAmount(invoice?.tax || 0)}
                    </span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between">
                    <span className="text-base font-bold text-[#0A8A84]">Total</span>
                    <span className="text-base font-bold text-[#0A8A84]">
                      {NAIRA.symbol}
                      {formatAmount(invoice?.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice?.notes && (
                <div className="bg-[#FFF6DD] border border-[#A88400]/30 rounded-xl px-4 py-3 mb-3">
                  <p className="text-xs font-semibold text-[#A88400] uppercase mb-1">Notes</p>
                  <p className="text-sm text-[#1D2939]">{invoice.notes}</p>
                </div>
              )}

              {/* Payment Details */}
              <div className="bg-[#E6F4F4] border border-[#008080]/20 rounded-xl px-4 py-3 mb-3">
                <p className="text-xs font-semibold text-[#0A8A84] uppercase mb-1">
                  Payment Details
                </p>
                <p className="text-sm text-[#1D2939]">
                  <span className="font-semibold">Bank:</span> {school?.bankName || "Access Bank"}
                </p>
                <p className="text-sm text-[#1D2939] mt-0.5">
                  <span className="font-semibold">Account:</span> {school?.accountNumber || "N/A"}
                </p>
                <p className="text-sm text-[#1D2939] mt-0.5">
                  <span className="font-semibold">Name:</span> {school?.accountName || schoolName}
                </p>
              </div>

              {/* Thank You Footer */}
              <div className="text-center py-4">
                <p className="text-xs text-[#98A2B3]">
                  Thank you for choosing {schoolName}. Please keep this for your records.
                </p>
              </div>
            </>
          )}
        </DataRenderer>
      </div>

      {/* Sticky Footer Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 flex gap-3 z-10">
        <Button
          className="flex-1! bg-transparent! text-[#022F2F]! rounded-lg! border! border-border-input!"
          onClick={onBack}
        >
          Cancel
        </Button>
        <Button
          className="!flex-1 flex items-center justify-center gap-2 !rounded-lg"
          onClick={handleDownloadPDF}
          disabled={isDownloading}
        >
          <DownloadIcon />
          <span className="flex items-center gap-2">
            {isDownloading && <CircularProgress size={16} className="!text-white" />}
            Download PDF
          </span>
        </Button>
      </div>
    </div>
  );
};
