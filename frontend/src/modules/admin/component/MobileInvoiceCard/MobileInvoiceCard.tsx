"use client";

import React, { useState } from "react";
import { CashViewer } from "@/modules/shared/component/CashViewer";

const STATUS_STYLES: Record<string, string> = {
  Paid: "bg-[#E6FFF3] text-[#0A8A4C]",
  Sent: "bg-[#5988F726] text-[#5988F7]",
  Overdue: "bg-[#FFE6E6] text-[#C74444]",
  "Partially Paid": "bg-[#FFF6DD] text-[#A88400]",
};

interface MobileInvoiceCardProps {
  type: string;
  amount: number | string;
  status: string;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const MobileInvoiceCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-4 w-32 bg-gray-200 rounded" />
      <div className="h-4 w-6 bg-gray-200 rounded" />
    </div>
    <div className="flex items-center justify-between">
      <div className="h-4 w-28 bg-gray-200 rounded" />
      <div className="h-6 w-16 bg-gray-200 rounded-full" />
    </div>
  </div>
);

export const MobileInvoiceCard: React.FC<MobileInvoiceCardProps> = ({
  type,
  amount,
  status,
  onView,
  onEdit,
  onDelete,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const statusStyle = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";

  return (
    <>
      <div className="bg-white rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-blue-main">{type || "N/A"}</span>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="p-1 text-primary-text-light text-end text-lg leading-none"
            aria-label="More actions"
          >
            &bull;&bull;&bull;
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 font-medium">
            <CashViewer amount={amount} />
          </span>
          <span className={`text-xs font-medium rounded-full px-3 py-1 ${statusStyle}`}>
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
          <button
            type="button"
            className="w-full text-left px-6 py-4 text-sm font-medium text-[#101828] border-b border-gray-100"
            onClick={() => {
              setSheetOpen(false);
              onView();
            }}
          >
            View
          </button>
          {onEdit && (
            <button
              type="button"
              className="w-full text-left px-6 py-4 text-sm font-medium text-[#101828] border-b border-gray-100"
              onClick={() => {
                setSheetOpen(false);
                onEdit();
              }}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="w-full text-left px-6 py-4 text-sm font-medium text-red-500"
              onClick={() => {
                setSheetOpen(false);
                onDelete();
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </>
  );
};
