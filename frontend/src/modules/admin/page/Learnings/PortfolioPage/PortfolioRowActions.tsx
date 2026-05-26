"use client";

import React, { useState } from "react";
import Popover from "@mui/material/Popover";
import { Box } from "@mui/material";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import { PortfolioRow } from "../learning.constants";

type PortfolioRowActionsProps = {
  portfolio: PortfolioRow;
  onView?: () => void;
  onEdit?: () => void;
  onPublishDraftToggle?: () => void;
  onDelete?: () => void;
};

export default function PortfolioRowActions({
  portfolio,
  onView,
  onEdit,
  onPublishDraftToggle,
  onDelete,
}: PortfolioRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

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
              "max-w-[240px] w-[150px] !p-2 !px-3 !rounded-lg !shadow-[0_8px_24px_rgba(0,0,0,0.12)] ml-4",
          }}
          container={typeof document !== "undefined" ? document.body : undefined}
          disableRestoreFocus
        >
          <Box className="flex flex-col gap-3 p-1 !text-base w-full">
            {onView && (
              <button
                className="cursor-pointer text-left rounded hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
                onClick={wrap(onView)}
              >
                View
              </button>
            )}
            {onEdit && (
              <button
                className="cursor-pointer rounded hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3 text-left w-full"
                onClick={wrap(onEdit)}
              >
                Edit
              </button>
            )}
            {onPublishDraftToggle && (
              <button
                className="cursor-pointer rounded hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3 text-left w-full"
                onClick={wrap(onPublishDraftToggle)}
              >
                {portfolio.status === "Published" ? "Make Draft" : "Make Publish"}
              </button>
            )}
            {onDelete && (
              <button
                className="cursor-pointer rounded hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3 text-left w-full text-red-600"
                onClick={wrap(onDelete)}
              >
                Delete
              </button>
            )}
          </Box>
        </Popover>
      </Box>
    </>
  );
}
