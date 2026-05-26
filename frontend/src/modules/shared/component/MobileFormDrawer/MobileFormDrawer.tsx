"use client";

import React from "react";
import Drawer from "@mui/material/Drawer";
import CloseIcon from "@/modules/shared/assets/svgs/leftIcons.svg";

interface MobileFormDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerRight?: React.ReactNode;
}

export const MobileFormDrawer: React.FC<MobileFormDrawerProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  headerRight,
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        className: "w-full flex flex-col px-5",
        style: { maxWidth: "100vw" },
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 py-4 bg-white border-b border-border-input">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-dashboard-bg border border-brandColor-active/20 flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <CloseIcon className="!text-base text-gray-600" />
          </button>
          <span className="text-base font-semibold text-blue-main truncate">{title}</span>
        </div>
        {headerRight}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white ">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="flex-shrink-0 py-6 bg-white border-t border-gray-100">
          {footer}
        </div>
      )}
    </Drawer>
  );
};
