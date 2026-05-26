"use client";

import React, { useState } from "react";
import Popover from "@mui/material/Popover";
import { ButtonIcon } from "../../../shared/component/ButtonIcon";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import { Box } from "@mui/material";

type CustomAction = {
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
};

type ActionProps = {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAccept?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
  isCompleting?: boolean;
  completeLabel?: string;
  onWithdraw?: () => void;
  onOfferSent?: () => void;
  status?: string;
  customActions?: CustomAction[]; // new prop to override default actions
};

const OwnerRowActions: React.FC<ActionProps> = ({
  onView,
  onEdit,
  onDelete,
  onAccept,
  onReschedule,
  onComplete,
  isCompleting = false,
  completeLabel = "Mark as Complete",
  onWithdraw,
  onOfferSent,
  onCancel,
  status,
  customActions,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [_showDeleteModal, setShowDeleteModal] = useState(false);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const _handleEdit = () => {
    handleClose();
    onEdit?.();
  };
  const handleOfferSent = () => {
    handleClose();
    onOfferSent?.();
  };

  const handleView = () => {
    handleClose();
    onView?.();
  };

  const _handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    onDelete?.();
  };

  return (
    <>
      {/* BACKDROP */}
      {open && <Box onClick={handleClose} className="fixed inset-0 bg-black/40 z-1000" />}

      <Box className="p-0! relative z-1001" onClick={(e) => e.stopPropagation()}>
        <ButtonIcon onClick={handleOpen} aria-haspopup="true" aria-expanded={open}>
          <EllipsesIcon />
        </ButtonIcon>

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            className:
              "max-w-[240px] w-[160px] !p-4 !rounded-lg !shadow-[0_8px_24px_rgba(0,0,0,0.1)]",
            style: { zIndex: 1100 },
          }}
          container={typeof document !== "undefined" ? document.body : undefined}
          disableRestoreFocus
        >
          <Box className="flex flex-col gap-3 w-full">
            {/* Render custom actions if provided */}
            {customActions ? (
              customActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  disabled={action.disabled}
                  className={`text-left rounded py-1 text-sm font-normal flex items-center gap-3 ${action.className ?? ""} ${
                    action.disabled
                      ? "text-gray-400 cursor-not-allowed"
                      : "cursor-pointer hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    if (action.disabled) return;
                    handleClose();
                    action.onClick();
                  }}
                >
                  {action.label}
                </button>
              ))
            ) : // Default actions based on status
              status && (status.toLowerCase().includes("tour booked") || status.toLowerCase().includes("active") || status.toLowerCase().includes("rescheduled")) ? (
                <>
                  <button
                    className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
                    onClick={() => {
                      handleClose();
                      (onView ?? onEdit)?.();
                    }}
                  >
                    View
                  </button>
                  {onAccept != null && (
                    <button
                      className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
                      onClick={() => {
                        handleClose();
                        onAccept();
                      }}
                    >
                      Accept
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isCompleting}
                    className={`text-left rounded py-1 text-sm font-normal flex items-center gap-3 ${
                      isCompleting
                        ? "text-gray-400 cursor-not-allowed"
                        : "cursor-pointer hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      if (isCompleting) return;
                      handleClose();
                      (onComplete ?? onEdit)?.();
                    }}
                  >
                    {completeLabel}
                  </button>
                  <button
                    className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
                    onClick={() => {
                      handleClose();
                      (onReschedule ?? onEdit)?.();
                    }}
                  >
                    Reschedule
                  </button>
                  <button
                    className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3 text-red-600"
                    onClick={() => {
                      handleClose();
                      (onCancel ?? onDelete)?.();
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : status &&
                (status.toLowerCase().includes("accepted") ||
                  status.toLowerCase().includes("submitted")) ? (
                <>
                  <button
                    className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
                    onClick={handleView}
                  >
                    View
                  </button>
                  {onWithdraw != null && (
                    <button
                      className="text-left rounded cursor-pointer text-red-600 hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
                      onClick={() => {
                        handleClose();
                        onWithdraw();
                      }}
                    >
                      Withdraw
                    </button>
                  )}
                </>
              ) : status && status.toLowerCase().includes("offer sent") ? (
                <>
                  <button
                    className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
                    onClick={handleView}
                  >
                    View
                  </button>
                  {onWithdraw != null && (
                    <button
                      className="text-left rounded cursor-pointer text-red-600 hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
                      onClick={() => {
                        handleClose();
                        onWithdraw();
                      }}
                    >
                      Withdraw
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
                    onClick={handleView}
                  >
                    View
                  </button>
                  <button
                    className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
                    onClick={handleOfferSent}
                  >
                    Send Offer
                  </button>
                </>
              )}
          </Box>
        </Popover>
      </Box>
    </>
  );
};

export default OwnerRowActions;
