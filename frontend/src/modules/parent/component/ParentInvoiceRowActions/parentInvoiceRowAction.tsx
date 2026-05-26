/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { useState } from "react";
import Popover from "@mui/material/Popover";
import { ButtonIcon } from "../../../shared/component/ButtonIcon";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import { Box, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Button } from "@/modules/shared/component/Button";

type ActionProps = {
  invoice: any;
  onView: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
};

const ParentInvoiceRowAction: React.FC<ActionProps> = ({
  invoice,
  onView,
  onDownload,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  // const handleDeleteClick = () => {
  //   handleClose();
  //   setIsDeleteModalOpen(true);
  // };

  // const handleConfirmDelete = () => {
  //   setIsDeleteModalOpen(false);
  //   onDelete?.();
  // };

  const availableActions = [
    { label: "View", action: onView },
    { label: "Download", action: onDownload },
    // { label: "Delete", action: handleDeleteClick },
  ];

  const handleAction = (callback: () => void) => {
    handleClose();
    callback();
  };

  return (
    <>
      {/* BACKDROP */}
      {open && <Box onClick={handleClose} className="fixed inset-0 bg-black/40 z-[1000]" />}

      <Box className="!p-0 relative z-[1001]" onClick={(e) => e.stopPropagation()}>
        <ButtonIcon onClick={handleOpen} aria-haspopup="true" aria-expanded={open}>
          <EllipsesIcon />
        </ButtonIcon>

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
          PaperProps={{
            className:
              "max-w-[240px] w-[160px] !p-4 !rounded-lg !shadow-[0_8px_24px_rgba(0,0,0,0.4)]",
            style: { zIndex: 1100 },
          }}
          container={typeof document !== "undefined" ? document.body : undefined}
          disableRestoreFocus
        >
          <Box className="flex flex-col gap-3 w-full">
            {availableActions.map((actionItem, idx) => (
              <button
                key={idx}
                className={`text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3 ${
                  actionItem.label === "Delete" ? "text-red-600" : ""
                }`}
                onClick={() => actionItem.action && handleAction(actionItem.action)}
              >
                {actionItem.label}
              </button>
            ))}
          </Box>
        </Popover>
      </Box>

      {/* Delete Confirmation Modal */}
      {/* <Dialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <DialogTitle>Delete Invoice</DialogTitle>
        <DialogContent>
          <p className="mt-4">
            Are you sure you want to delete invoice <strong>{invoice?.invoiceNumber}</strong>? This
            action cannot be undone.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            className="!bg-red-600 !text-white hover:!bg-red-700"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog> */}
    </>
  );
};

export default ParentInvoiceRowAction;
