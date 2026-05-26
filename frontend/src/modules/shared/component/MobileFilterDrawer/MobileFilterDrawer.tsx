"use client";

import React from "react";
import Drawer from "@mui/material/Drawer";
import CloseIcon from "@mui/icons-material/Close";

interface MobileFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  children: React.ReactNode;
  title?: string;
  applyLabel?: string;
  resetLabel?: string;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  open,
  onClose,
  onApply,
  onReset,
  children,
  title = "Filter",
  applyLabel = "Apply",
  resetLabel = "Reset",
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        className: "w-full flex flex-col h-[100dvh] max-h-[100dvh]",
        style: { maxWidth: "100vw" },
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-white">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0"
          aria-label="Close filter"
        >
          <CloseIcon className="!text-base text-gray-600" />
        </button>
        <span className="text-base font-semibold text-blue-main">{title}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-dashboard-bg px-5 py-5">{children}</div>

      {/* Footer */}
      <div className="px-5 py-4 bg-white flex items-center gap-3">
        <button
          onClick={onReset}
          className="flex-1 py-3 rounded-lg md:rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {resetLabel}
        </button>
        <button
          onClick={onApply}
          className="flex-1 py-3 rounded-lg md:rounded-full bg-brandColor-active text-white text-sm font-medium hover:opacity-90"
        >
          {applyLabel}
        </button>
      </div>
    </Drawer>
  );
};
