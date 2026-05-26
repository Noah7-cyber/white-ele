"use client";

import React, { useState } from "react";
import Popover from "@mui/material/Popover";
import { Box } from "@mui/material";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";

type ClassroomActionProps = {
  onView?: () => void;
  onEdit?: () => void;
  onManageStudents?: () => void;
  onManageStaffs?: () => void;
  onToggleStatus?: () => void;
  statusActionLabel?: string;
  onDelete?: () => void;
};

const ClassroomRowActions: React.FC<ClassroomActionProps> = ({
  onView,
  onEdit,
  onToggleStatus,
  statusActionLabel = "Deactivate",
  onDelete,
}) => {
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
              "max-w-[240px] w-[150px] !p-4 !rounded-lg !shadow-[0_8px_24px_rgba(0,0,0,0.12)] ml-4",
          }}
          // force portal to body so it won't be clipped by table containers
          container={typeof document !== "undefined" ? document.body : undefined}
          disableRestoreFocus
        >
          <Box className="flex flex-col gap-3 p- !text-base w-full">
            {onView ? (
              <button
                className="cursor-pointer text-left  rounded hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
                onClick={wrap(onView)}
              >
                View
              </button>
            ) : null}

            {onEdit ? (
              <button
                className="cursor-pointer   rounded hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
                onClick={wrap(onEdit)}
              >
                <span>Edit </span>
              </button>
            ) : null}
            {/* <button
              className="cursor-pointer text-left  rounded hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
              onClick={wrap(onManageStudents)}
            >
              Manage Students
            </button>

            <button
              className="cursor-pointer   rounded hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
              onClick={wrap(onManageStaffs)}
            >
              <span>Manage Staffs</span>
            </button> */}

            {onToggleStatus ? (
              <button
                className="cursor-pointer   rounded hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
                onClick={wrap(onToggleStatus)}
              >
                <span>{statusActionLabel}</span>
              </button>
            ) : null}

            {onDelete ? (
              <button
                className="cursor-pointer   rounded hover:bg-slate-50 py-1 text-sm font-normal flex items-center gap-3"
                onClick={wrap(onDelete)}
              >
                <span>Delete</span>
              </button>
            ) : null}
          </Box>
        </Popover>
      </Box>
    </>
  );
};

export default ClassroomRowActions;
