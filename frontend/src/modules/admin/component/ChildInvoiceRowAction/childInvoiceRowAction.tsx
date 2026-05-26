"use client";

import type React from "react";
import { useState } from "react";
import Popover from "@mui/material/Popover";
import { ButtonIcon } from "../../../shared/component/ButtonIcon";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import { Box } from "@mui/material";

type ActionProps = {
  onView: () => void;
  onEdit?: () => void;
  onRecordPayment?: () => void;
  onSetRecurring?: () => void;
  onDownload?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  status?: string;
};

const ChildInvoiceRowAction: React.FC<ActionProps> = ({
  onView,
  onEdit,
  onRecordPayment,
  onSetRecurring,
  onDownload,
  onDuplicate,
  onDelete,
  status,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const normalizedStatus = status?.toLowerCase();
  const isPaid = normalizedStatus === "paid";
  const isPartiallyPaid = normalizedStatus === "partially paid";
  const canDelete = !isPaid && !isPartiallyPaid;

  const availableActions = [
    { label: "View", action: onView },
    { label: "Edit", action: onEdit },
    ...(!isPaid
      ? [{ label: "Record Payment", action: onRecordPayment }]
      : [{ label: "Set Recurring", action: onSetRecurring }]),
    { label: "Download", action: onDownload },
    { label: "Duplicate", action: onDuplicate },
    ...(canDelete ? [{ label: "Delete", action: onDelete }] : []),
  ].filter((item) => item.action != null);

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
                className={`text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3 `}
                onClick={() => actionItem.action && handleAction(actionItem.action)}
              >
                {actionItem.label}
              </button>
            ))}
          </Box>
        </Popover>
      </Box>
    </>
  );
};

export default ChildInvoiceRowAction;
