"use client";

import { createPortal } from "react-dom";
import { Box } from "@mui/material";

type ProfilePopoverBackdropProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Renders outside the sidebar (via portal) so `overflow-hidden` on `<aside>` does not clip
 * the dim layer. Full viewport on desktop; on mobile still covers the full screen while
 * the sidebar drawer remains above the main-content backdrop (z-index stack).
 */
export function ProfilePopoverBackdrop({ open, onClose }: ProfilePopoverBackdropProps) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <Box
      onClick={onClose}
      className="fixed inset-0 z-[1000] bg-black/50 md:bg-black/40"
      aria-hidden
      sx={{ position: "fixed" }}
    />,
    document.body,
  );
}
