"use client";

import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  // Modal,
} from "@mui/material";
import { Button } from "@/modules/shared/component/Button";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { Modal } from "@/modules/shared/component/modal";

interface EditObservationModalProps {
  open: boolean;
  onClose: () => void;
  studentName: string;
  initialObservation: string;
  onSave: (observation: string) => void;
  isLoading?: boolean;
}

export default function EditObservationModal({
  open,
  onClose,
  studentName,
  initialObservation,
  onSave,
  isLoading,
}: EditObservationModalProps) {
  const { control, handleSubmit, reset } = useForm<{ observation: string }>({
    defaultValues: { observation: initialObservation },
  });

  React.useEffect(() => {
    if (open) reset({ observation: initialObservation });
  }, [open, initialObservation, reset]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="md:w-[600px] w-[90vw] !p-6 !rounded-md"
      width="600px"
    >
      <Box className="flex flex-col gap-3">
        <Box className="flex items-center justify-between">
          <Typography className="!text-lg !font-bold !text-text-primary">
            Edit Observation for {studentName}
          </Typography>
          <IconButton onClick={onClose} size="small" className="!p-0">
            <CloseIcon />
          </IconButton>
        </Box>
        <form onSubmit={handleSubmit((data) => onSave(data.observation))}>
          <Box className="flex flex-col gap-4 py-4 border-t border-border-light">
            <CWTextArea
              control={control}
              name="observation"
              label="Observation"
              placeholder="Enter observation..."
              rows={5}
              labelOnTop
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-xs !px-3.5 !pt-3 !pb-4"
              className="w-full"
            />
          </Box>
          <Box className="flex justify-end gap-3 pt-4 border-t border-border-light">
            <Button
              variant="outlined"
              onClick={onClose}
              className="!rounded-lg !border !border-border-table !bg-transparent !text-primary-dark"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="!rounded-lg !bg-brandColor-active !px-6 !py-2"
              disabled={isLoading}
            >
              Save
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
}
