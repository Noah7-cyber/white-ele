/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { CashViewer } from "@/modules/shared/component/CashViewer";
import { capitalizeFirstLetter } from "@/utils/helpers";
import { getInvoiceStatus } from "@/utils/helper";

interface ChildInvoiceCardProps {
  invoice: any;
  onView: () => void;
  onDuplicate: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

const statusStyles: Record<string, string> = {
  Paid: "bg-[#E6FFF3] text-[#0A8A4C]",
  Sent: "bg-[#5988F726] text-[#5988F7]",
  Overdue: "bg-[#FFE6E6] text-[#C74444]",
  "Partially Paid": "bg-[#FFF6DD] text-[#A88400]",
};

const invoiceTypes: Record<string, string> = {
  oneTime: "One Time Invoice",
  recurring: "Recurring Invoice",
};

const actions = [
  { label: "View", key: "view" },
  { label: "Duplicate", key: "duplicate" },
  { label: "Download", key: "download" },
  { label: "Delete", key: "delete", danger: true },
];

export const ChildInvoiceCard = ({
  invoice,
  onView,
  onDuplicate,
  onDownload,
  onDelete,
}: ChildInvoiceCardProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  const status = capitalizeFirstLetter(
    getInvoiceStatus({
      total: +invoice?.total,
      balance: +invoice?.balance,
      dueDate: invoice?.dueDate,
    }),
  );

  const type = invoiceTypes[invoice?.invoiceType] || invoice?.invoiceType || "N/A";

  const handleAction = (key: string) => {
    setSheetOpen(false);
    if (key === "view") onView();
    else if (key === "duplicate") onDuplicate();
    else if (key === "download") onDownload();
    else if (key === "delete") onDelete();
  };

  return (
    <>
      <div className="bg-white rounded-lg p-4 flex items-center justify-between">
        <div className="flex flex-col gap-5">
          <p className="text-sm font-semibold text-[#101828]">{type}</p>
          <p className="text-sm text-primary-text-light">
            <CashViewer amount={invoice?.total} />
          </p>
        </div>
        <div className="flex flex-col items-start gap-5">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="p-1 text-primary-text-light text-end text-lg leading-none w-full"
            aria-label="More actions"
          >
            •••
          </button>
          <span
            className={`px-3 py-1 rounded-full text-xs ${statusStyles[status] || "bg-gray-100 text-gray-600"}`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Backdrop */}
      {sheetOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSheetOpen(false)} />
      )}

      {/* Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 transition-transform duration-300 ${
          sheetOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />
        <div className="flex flex-col pb-8">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => handleAction(action.key)}
              className={`w-full text-left px-6 py-4 text-sm font-medium border-b border-gray-100 last:border-0 ${
                action.danger ? "text-red-500" : "text-[#101828]"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
