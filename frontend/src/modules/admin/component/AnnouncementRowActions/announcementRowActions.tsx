"use client";

import type React from "react";
import { useState } from "react";
import Popover from "@mui/material/Popover";
import { ButtonIcon } from "../../../shared/component/ButtonIcon";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import { Box } from "@mui/material";

type AnnouncementStatus = "published" | "draft" | "archived";

type ActionProps = {
  status: AnnouncementStatus;
  onView: () => void;
  onEdit: () => void;
  onPublish?: () => void;
  onRestore?: () => void;
  onArchive?: () => void;
  onDelete: () => void;
};

const AnnouncementRowActions: React.FC<ActionProps> = ({
  status,
  onView: _onView,
  onEdit: _onEdit,
  onPublish,
  onRestore,
  onArchive,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  type ActionItem = {
    label: string;
    action?: () => void;
    isActive?: boolean;
    isDanger?: boolean;
  };

  const getAvailableActions = (): ActionItem[] => {
    switch (status.toLowerCase()) {
      case "archived":
        return [
          { label: "View", action: _onView },
          // { label: "Edit", action: onEdit },
          { label: "Restore", action: onRestore, isActive: true },
          { label: "Delete", action: onDelete, isDanger: true },
        ];
      case "draft":
        return [
          { label: "View", action: _onView },
          // { label: "Edit", action: onEdit },
          { label: "Publish", action: onPublish, isActive: true },
          { label: "Delete", action: onDelete, isDanger: true },
        ];
      case "published":
      default:
        return [
          { label: "View", action: _onView },
          // { label: "Edit", action: onEdit },
          { label: "Archive", action: onArchive },
          { label: "Delete", action: onDelete, isDanger: true },
        ];
    }
  };

  const availableActions = getAvailableActions();

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
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
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
                  actionItem.isDanger ? "text-red-600" : ""
                } ${actionItem.isActive ? "" : ""}`}
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

export default AnnouncementRowActions;
