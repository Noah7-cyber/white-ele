/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import type { Control } from "react-hook-form";
import { Box, Typography, IconButton } from "@mui/material";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Button } from "@/modules/shared/component/Button";
import ClearIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { Modal } from "@/modules/shared/component/modal";
import { calculateGrade } from "@/modules/shared/component/Learning/grading.utils";

interface EditScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  control: Control<any>;
  childName: string;
  score: number;
  totalMarks?: number;
}

export const EditScoreModal: React.FC<EditScoreModalProps> = ({
  isOpen,
  onClose,
  onSave,
  control,
  childName,
  score,
  totalMarks = 100,
}) => {
  const watchScore = control._formValues?.score || score;
  const autoGrade = calculateGrade(totalMarks);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="!max-w-xl w-full rounded-xl !p-6">
      <Box className="flex flex-col gap-4">
        {/* Header */}
        <Box className="flex items-center justify-between border-b border-border-input pb-4">
          <Box>
            <Typography className="!text-xl !font-bold !text-primary-dark">Edit Score</Typography>
            <Typography className="!text-sm !font-normal !text-gray-500 mt-1 max-w-sm">
              Update the score for {childName}. The grade will be auto-calculated.
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" className="!p-0">
            <ClearIcon />
          </IconButton>
        </Box>

        <Box className="flex flex-col gap-4">
          <Box>
            <Typography className="!text-sm !font-medium !text-input-gray !mb-1">Name</Typography>
            <Box className="px-4 py-3 border border-border-input rounded-lg bg-gray-50">
              <Typography className="!text-xs !font-normal !text-primary-dark">
                {childName}
              </Typography>
            </Box>
          </Box>

          <CWTextField
            control={control}
            name="score"
            label="Score"
            placeholder="Enter score"
            type="number"
            labelOnTop
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
            className="w-full"
          />

          <Box>
            <Typography className="!text-sm !font-medium !text-input-gray !mb-1">
              Auto Grade
            </Typography>
            <Box className="px-4 py-3 border border-border-input rounded-lg bg-gray-50">
              <Typography className="!text-xs !text-primary-dark">{autoGrade}</Typography>
            </Box>
          </Box>

          <Box>
            <CWTextField
              control={control}
              name="comment"
              placeholder="Type your message...."
              label="Comment"
              labelOnTop
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="!text-sm mt-1 !h-28 !text-input-gray"
              className="w-full"
              multiline
              rows={6}
            />
          </Box>
        </Box>

        <Box className="border-b border-border-input" />

        <Box className="flex justify-end gap-3 pt-2">
          <Button
            variant="outlined"
            className="!rounded-lg !px-6 !bg-transparent !text-primary-dark !border !border-border-table"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button className="!rounded-lg !px-6" onClick={onSave}>
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
