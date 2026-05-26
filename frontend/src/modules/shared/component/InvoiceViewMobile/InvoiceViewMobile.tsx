/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { Typography } from "@mui/material";
import ApartmentIcon from "@mui/icons-material/Apartment";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import CategoryIcon from "@mui/icons-material/Category";
import { dateFormatter } from "@/utils/helpers";
import { formatAmount } from "@/utils/hooks/formatNumber";
import { NAIRA } from "@/constants";
import { INVOICE_STATUS_STYLES } from "@/modules/shared/component/InvoicePreviewModal/InvoicePreviewContent";

const lineIcons = [ApartmentIcon, CheckroomIcon, CategoryIcon];

type InvoiceViewMobileProps = {
  invoice: any;
  status: string;
};

export function InvoiceViewMobile({ invoice, status }: InvoiceViewMobileProps) {
  const school = invoice?.student?.school;
  const items = (invoice?.items || []) as any[];
  const statusClass = INVOICE_STATUS_STYLES[status] || "bg-gray-100 text-gray-700";
  const invoiceNo = invoice?.invoiceNumber ?? "—";

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex flex-col items-center pt-2">
        <div className="h-16 w-40 flex items-center justify-center mb-2">
          {school?.schoolLogoUrl ? (
            <Image
              src={school.schoolLogoUrl}
              alt=""
              width={160}
              height={64}
              className="max-h-14 w-auto object-contain"
            />
          ) : (
            <Typography className="!text-center !text-lg !font-bold !text-[#022F2F]">
              {school?.schoolName || "School"}
            </Typography>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm px-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#667085]">
              Invoice number
            </p>
            <p className="text-xl font-bold text-[#022F2F] mt-1">{invoiceNo}</p>
          </div>
          <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
            {status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-xl bg-[#F2F4F7] px-3 py-3">
            <p className="text-[10px] font-medium uppercase text-[#667085]">Issued date</p>
            <p className="text-sm font-semibold text-[#022F2F] mt-1">
              {invoice?.issueDate ? dateFormatter(invoice.issueDate) : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-[#F2F4F7] px-3 py-3">
            <p className="text-[10px] font-medium uppercase text-[#667085]">Due date</p>
            <p className="text-sm font-semibold text-[#022F2F] mt-1">
              {invoice?.dueDate ? dateFormatter(invoice.dueDate) : "—"}
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#EAECF0]">
          <p className="text-xs text-[#667085]">Billed from:</p>
          <p className="text-sm font-bold text-[#022F2F] mt-1">{school?.schoolName || "School"}</p>
          <p className="text-xs text-[#667085] mt-2 leading-relaxed">
            {school?.address || "—"}
            <br />
            {school?.email || "—"}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between px-1 mb-3">
          <Typography className="!text-base !font-semibold !text-[#022F2F]">Items</Typography>
          <span className="text-xs text-[#667085]">
            {items.length} Item{items.length === 1 ? "" : "s"} total
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {items.map((item: any, idx: number) => {
            const Icon = lineIcons[idx % lineIcons.length];
            const desc = item?.description ?? "—";
            const qty = item?.quantity ?? "—";
            const total = item?.total ?? 0;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 bg-white rounded-xl border border-[#E4E7EC] px-3 py-3 shadow-sm"
              >
                <div className="w-11 h-11 rounded-lg bg-[#E8F6F4] flex items-center justify-center shrink-0">
                  <Icon className="!text-[#0A8A84]" fontSize="small" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#022F2F] truncate">{desc}</p>
                  <p className="text-xs text-[#667085] mt-0.5">Qty: {qty}</p>
                </div>
                <p className="text-sm font-bold text-[#022F2F] shrink-0">
                  {NAIRA.symbol}
                  {formatAmount(total)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] px-4 py-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#667085]">Subtotal</span>
          <span className="font-semibold text-[#022F2F]">
            {NAIRA.symbol}
            {formatAmount(invoice?.subTotal)}
          </span>
        </div>
        {Number(invoice?.discount || 0) > 0 && (
          <div className="flex justify-between">
            <span className="text-[#667085]">Discount</span>
            <span className="font-semibold text-red-500">
              -{NAIRA.symbol}
              {formatAmount(invoice?.discount)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-[#667085]">Tax</span>
          <span className="font-semibold text-[#022F2F]">
            {NAIRA.symbol}
            {formatAmount(invoice?.tax)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#667085]">Amount Paid</span>
          <span className="font-semibold text-[#022F2F]">
            {NAIRA.symbol}
            {formatAmount(invoice?.amountPaid)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#667085] text-base">Balance</span>
          <span className="font-semibold text-[#022F2F] text-base">
            {NAIRA.symbol}
            {formatAmount(invoice?.balance)}
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t border-[#EAECF0]">
          <span className="text-base font-bold text-[#0A8A84]">Total</span>
          <span className="text-base font-bold text-[#0A8A84]">
            {NAIRA.symbol}
            {formatAmount(invoice?.total)}
          </span>
        </div>
      </div>
    </div>
  );
}
