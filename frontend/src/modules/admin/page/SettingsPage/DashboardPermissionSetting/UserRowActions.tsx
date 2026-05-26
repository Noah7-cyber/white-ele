"use client";

import type React from "react";
import { useState } from "react";
import Popover from "@mui/material/Popover";
import { Box, IconButton } from "@mui/material";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";

type UserActionProps = {
  onEdit?: () => void;
  onDeactivate?: () => void;
  onDelete?: () => void;
  onResendInvite?: () => void;
};

export const UserRowActions: React.FC<UserActionProps> = ({
  onEdit,
  onDeactivate,
  onDelete,
  onResendInvite,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleMenuAction = (action: () => void) => {
    handleClose();
    action();
  };

  return (
    <>
      {open && <Box onClick={handleClose} className="fixed inset-0 bg-black/40 z-1000" />}

      <Box className="p-0! relative z-1001" onClick={(e) => e.stopPropagation()}>
        <IconButton
          size="small"
          onClick={handleOpen}
          aria-haspopup="true"
          aria-expanded={open}
          className="text-dark!"
        >
          <EllipsesIcon />
        </IconButton>

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            className:
              "max-w-[240px] w-[150px] !p-4 !rounded-lg !shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
            style: { zIndex: 1100 },
          }}
          container={typeof document !== "undefined" ? document.body : undefined}
          disableRestoreFocus
        >
          <Box className="flex flex-col gap-3 w-full">
            {onEdit != null && (
              <button
                className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal text-secondary-text-gray"
                onClick={() => handleMenuAction(onEdit)}
              >
                Edit
              </button>
            )}

            {onResendInvite != null && (
              <button
                className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal text-secondary-text-gray"
                onClick={() => handleMenuAction(onResendInvite)}
              >
                Resend invitation
              </button>
            )}

            {onDeactivate != null && (
              <button
                className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal text-secondary-text-gray"
                onClick={() => handleMenuAction(onDeactivate)}
              >
                Deactivate
              </button>
            )}

            {onDelete != null && (
              <button
                className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal text-secondary-text-gray"
                onClick={() => handleMenuAction(onDelete)}
              >
                Delete
              </button>
            )}
          </Box>
        </Popover>
      </Box>
    </>
  );
};
