"use client";

import React, { useState } from "react";
import Popover from "@mui/material/Popover";
import { Box } from "@mui/material";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import { GradingRow } from "../learning.constants";

type GradingRowActionsProps = {
  row: GradingRow;
  onView: () => void;
  onGrade: () => void;
  onDeleteGrade: () => void;
};

export default function GradingRowActions({
  row,
  onView,
  onGrade,
  onDeleteGrade,
}: GradingRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const wrap = (fn: () => void) => () => {
    handleClose();
    fn();
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
              "max-w-[240px] w-[150px] !p-2 !px-4 !rounded-lg !shadow-[0_8px_24px_rgba(0,0,0,0.12)] ml-4",
          }}
          container={typeof document !== "undefined" ? document.body : undefined}
          disableRestoreFocus
        >
          <Box className="flex flex-col gap-3 py-1.5 !text-base w-full">
            <button
              className="cursor-pointer text-left rounded hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
              onClick={wrap(onView)}
            >
              View
            </button>
            <button
              className="cursor-pointer text-left rounded hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
              onClick={wrap(onGrade)}
            >
              Grade
            </button>
            <button
              className="cursor-pointer text-left text-red-500 rounded hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
              onClick={wrap(onDeleteGrade)}
            >
              Delete
            </button>
          </Box>
        </Popover>
      </Box>
    </>
  );
}
