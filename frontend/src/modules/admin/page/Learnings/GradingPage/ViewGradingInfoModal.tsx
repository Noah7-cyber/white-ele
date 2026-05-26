"use client";

import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { Modal } from "@/modules/shared/component/modal/modal";
import type { GradingRow } from "../learning.constants";
import UserIcon from "@/modules/shared/assets/svgs/userOutline.svg";

interface ViewGradingInfoModalProps {
  open: boolean;
  onClose: () => void;
  row: GradingRow | null;
}

export default function ViewGradingInfoModal({ open, onClose, row }: ViewGradingInfoModalProps) {
  if (!row) return null;

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-[#EDFFF7] text-success-green";
      case "in progress":
        return "bg-brandColor-yellow/15 text-brandColor-yellow";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="md:w-[600px] w-[90vw] !p-6 !rounded-md"
      width="600px"
    >
      <Box className="flex flex-col gap-5">
        {/* Header */}
        <Box className="flex items-start justify-between">
          <Box className="flex items-center gap-3">
            <Typography className="!text-xl !font-bold !text-text-primary">
              {row.milestoneTitle}
            </Typography>
            <span
              className={`px-3 py-0.5 text-xs font-medium rounded-full capitalize ${statusBadge(row.status)}`}
            >
              {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
            </span>
          </Box>
          <IconButton onClick={onClose} size="small" className="!p-0">
            <CloseIcon />
          </IconButton>
        </Box>

        <Typography className="!text-sm !text-input-gray -mt-2">
          Overview of this milestone grading information.
        </Typography>

        <Box className="border-t border-border-light" />

        {/* Grading Details */}
        <Box>
          <Typography className="!text-base !font-semibold !text-text-primary !mb-3">
            Grading Details
          </Typography>
          <Box className="border border-border-light rounded-lg overflow-hidden">
            <Box className="flex items-center px-5 py-3 border-b border-border-light">
              <Typography className="!text-sm !text-input-gray w-[180px]">Class:</Typography>
              <Typography className="!text-sm !font-medium !text-text-primary">
                {row.class}
              </Typography>
            </Box>
            <Box className="flex items-center px-5 py-3 border-b border-border-light">
              <Typography className="!text-sm !text-input-gray w-[180px]">
                Number of Students:
              </Typography>
              <Typography className="!text-sm !font-medium !text-text-primary">
                12 Students
              </Typography>
            </Box>
            <Box className="flex items-center px-5 py-3 border-b border-border-light">
              <Typography className="!text-sm !text-input-gray w-[180px]">
                Grading Scale:
              </Typography>
              <Typography className="!text-sm !font-medium !text-text-primary">0 - 3</Typography>
            </Box>
            <Box className="flex items-center px-5 py-3 border-b border-border-light">
              <Typography className="!text-sm !text-input-gray w-[180px]">
                Passing Threshold:
              </Typography>
              <Typography className="!text-sm !font-medium !text-text-primary">2</Typography>
            </Box>
            <Box className="flex items-center px-5 py-3">
              <Typography className="!text-sm !text-input-gray w-[180px]">Created On:</Typography>
              <Typography className="!text-sm !font-medium !text-text-primary">
                {row.duration}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Assigned Teacher */}
        <Box>
          <Box className="flex items-center gap-2 mb-3">
            <UserIcon className="!w-5 !h-5 !text-input-gray" />
            <Typography className="!text-base !font-semibold !text-text-primary">
              Assigned Teacher
            </Typography>
          </Box>
          <Box className="bg-gray-50 rounded-lg px-5 py-3 flex items-center gap-3">
            <Box className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center text-sm font-semibold text-pink-700">
              AT
            </Box>
            <Box>
              <Typography className="!text-sm !font-medium !text-text-primary">
                Assigned Teacher
              </Typography>
              <Typography className="!text-xs !text-input-gray">Teacher</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
