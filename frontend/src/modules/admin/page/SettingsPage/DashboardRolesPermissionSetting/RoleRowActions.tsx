"use client";

import type React from "react";
import { useState } from "react";
import Popover from "@mui/material/Popover";
import { Box, IconButton } from "@mui/material";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";

type RoleRowActionsProps = {
  onRename: () => void;
};

export const RoleRowActions: React.FC<RoleRowActionsProps> = ({ onRename }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleRename = () => {
    handleClose();
    onRename();
  };

  return (
    <>
      {open && <Box onClick={handleClose} className="fixed inset-0 bg-black/40 z-1000" />}

      <Box className="p-0! relative z-1001 shrink-0" onClick={(e) => e.stopPropagation()}>
        <IconButton
          size="small"
          onClick={handleOpen}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label="Role actions"
          className="text-dark! !p-1"
        >
          <EllipsesIcon className="rotate-90" />
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
            <button
              type="button"
              className="text-left rounded cursor-pointer hover:bg-slate-50 py-1 text-sm font-normal text-secondary-text-gray"
              onClick={handleRename}
            >
              Rename
            </button>
          </Box>
        </Popover>
      </Box>
    </>
  );
};
