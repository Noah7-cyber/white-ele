"use client";

import React, { useState } from "react";
import Popover from "@mui/material/Popover";
import { Box } from "@mui/material";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import { MilestoneRow } from "../learning.constants";

type MilestoneRowActionsProps = {
  milestone: MilestoneRow;
  onView?: (milestone: MilestoneRow) => void;
  onEdit: (milestone: MilestoneRow) => void;
  onDeactivate?: () => void
  onDelete?: (milestone: MilestoneRow) => void;
  deactivateLabel?: string;
  hideDeactivate?: boolean;
};

export default function MilestoneRowActions({
  milestone,
  onView,
  onEdit,
  onDeactivate,
  onDelete,
  deactivateLabel = "Make Draft",
  hideDeactivate = false,
}: MilestoneRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleAction = (callback: () => void) => {
    handleClose();
    callback();
  };

  const actions = [
    onView ? { label: "View", action: () => onView(milestone) } : null,
    { label: "Edit", action: () => onEdit(milestone) },
    !hideDeactivate && onDeactivate ? { label: deactivateLabel, action: onDeactivate } : null,
    onDelete ? { label: "Delete", action: () => onDelete(milestone), isDanger: true } : null,
  ].filter(Boolean) as { label: string; action: () => void; isDanger?: boolean }[];

  const wrap = (fn?: () => void) => () => {
    handleClose();
    fn?.();
  };

  return (
    <>
      {open && <Box onClick={handleClose} className="fixed inset-0 bg-black/40 z-[1000]" />}
      <Box className="!p-0" onClick={(e) => e.stopPropagation()}>
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
              "max-w-[240px] w-[150px] !p-4 !rounded-lg !shadow-[0_8px_24px_rgba(0,0,0,0.12)] ml-4",
          }}
          container={typeof document !== "undefined" ? document.body : undefined}
          disableRestoreFocus
        >
          <Box className="flex flex-col gap-3 w-full">
            {actions.map((actionItem, idx) => (
              <button
                key={idx}
                className={`text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3 ${
                  actionItem.isDanger ? "text-red-600" : ""
                }`}
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
}
