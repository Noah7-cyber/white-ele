"use client";

import type React from "react";
import { useState } from "react";
import Popover from "@mui/material/Popover";
import { ButtonIcon } from "../../../shared/component/ButtonIcon";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import { Box } from "@mui/material";

type TeacherActionProps = {
  onView?: () => void;
  onEdit?: () => void;
  onDeactivate?: () => void;
  onDelete?: () => void;
  onResendInvite?: () => void;
  showResendInvite?: boolean;
  deactivateActionLabel?: string;
};

const TeacherRowActions: React.FC<TeacherActionProps> = ({
  onView,
  onEdit,
  onDeactivate,
  onDelete,
  onResendInvite,
  showResendInvite = false,
  deactivateActionLabel = "Deactivate",
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
      {open && <Box onClick={handleClose} className="fixed inset-0 bg-black/40 z-[1000]" />}

      <Box className="!p-0 relative z-[1001]" onClick={(e) => e.stopPropagation()}>
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
              "max-w-[240px] w-[150px] !p-4 !rounded-lg !shadow-[0_8px_24px_rgba(0,0,0,0.4)] ml-4",
            style: { zIndex: 1100 },
          }}
          container={typeof document !== "undefined" ? document.body : undefined}
          disableRestoreFocus
        >
          <Box className="flex flex-col gap-3 w-full">
            {onView ? (
              <button
                className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal"
                onClick={() => handleMenuAction(onView)}
              >
                View
              </button>
            ) : null}

            {onEdit ? (
              <button
                className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal"
                onClick={() => handleMenuAction(onEdit)}
              >
                Edit
              </button>
            ) : null}

            {onDeactivate ? (
              <button
                className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal "
                onClick={() => handleMenuAction(onDeactivate)}
              >
                {deactivateActionLabel}
              </button>
            ) : null}
            {showResendInvite && onResendInvite ? (
              <button
                className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal "
                onClick={() => handleMenuAction(onResendInvite)}
              >
                Resend Invite
              </button>
            ) : null}

            {onDelete ? (
              <button
                className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal "
                onClick={() => handleMenuAction(onDelete)}
              >
                Delete
              </button>
            ) : null}
          </Box>
        </Popover>
      </Box>
    </>
  );
};

export default TeacherRowActions;
