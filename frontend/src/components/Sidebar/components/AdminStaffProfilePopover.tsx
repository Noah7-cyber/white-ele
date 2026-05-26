"use client";

import React from "react";
import { Box, Popover, CircularProgress } from "@mui/material";

interface AdminStaffProfilePopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onLogout: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isLoggingOut?: boolean;
}

export const AdminStaffProfilePopover: React.FC<AdminStaffProfilePopoverProps> = ({
  open,
  anchorEl,
  onClose,
  onLogout,
  isLoggingOut = false,
}) => {
  return (
    <>
      {/* Dark overlay backdrop */}
      {open && <Box onClick={onClose} className="fixed inset-0 bg-black/40 z-[1000]" />}

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        PaperProps={{
          className: "!mt-2 !rounded-lg !shadow-lg !min-w-[200px]",
          style: { zIndex: 1100 },
        }}
      >
        <Box className="p-2">
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className={`w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center gap-2 ${
              isLoggingOut ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {isLoggingOut && <CircularProgress size={16} className="!text-red-600" />}
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </Box>
      </Popover>
    </>
  );
};
