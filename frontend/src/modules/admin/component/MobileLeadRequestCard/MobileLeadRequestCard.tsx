"use client";

import React, { ReactNode } from "react";

interface MobileLeadRequestCardProps {
  parents: string;
  source: string;
  date: string;
  statusBadge: ReactNode;
  actionComponent: ReactNode;
}

export const MobileLeadRequestCard = ({
  parents,
  source,
  date,
  statusBadge,
  actionComponent,
}: MobileLeadRequestCardProps) => {
  return (
    <div className="rounded-xl border border-[#E4E7EC] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-semibold text-text-primary">{parents || "—"}</p>
          {/* <p className="text-xs text-text-secondary">{source || "N/A"}</p> */}
        </div>
        <div className="shrink-0">{actionComponent}</div>
      </div>

      <div className="mt-4 flex justify-between items-end gap-3">
        <div className="space-y-1">
          {/* <p className="text-[11px] text-text-secondary">Application Date</p> */}
          <p className="text-xs font-medium text-text-primary">{date}</p>
        </div>
        <div className="flex flex-col items-start gap-1">
          {/* <p className="text-[11px] text-text-secondary">Status</p> */}
          {statusBadge}
        </div>
      </div>
    </div>
  );
};
