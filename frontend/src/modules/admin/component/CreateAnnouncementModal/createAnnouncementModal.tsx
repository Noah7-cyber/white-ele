"use client";

import type React from "react";
import { useEffect } from "react";
// import { useRouter } from "next/navigation";

import { Box, Typography, IconButton } from "@mui/material";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Button } from "@/modules/shared/component/Button";
import ClearIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import type { Control } from "react-hook-form";
import { Modal } from "@/modules/shared/component/modal";
import { SubjectFormValues } from "@/modules/shared/component/Learning/manageCurriculum.constants";


interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  control: Control<SubjectFormValues>;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  control,
}) => {
  // const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter();

  useEffect(() => {
    if (control && control.register) {
      control.register("name");
    }
  }, [control]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="!max-w-xl w-full rounded-xl !p-5">
      <Box className="flex flex-col gap-4">
        <Box className="flex items-center border-b border-border-input pb-3 justify-between">
          <Box>
            <Typography className="!text-lg !font-bold !text-primary-dark">
              Add Announcement Title
            </Typography>
            <Typography className="!text-xs !font-bold !text-primary-dark/30">
              Write a brief title to let parents know what the announcement is about.
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <ClearIcon />
          </IconButton>
        </Box>

        <Box className="flex flex-col gap-5">
          <CWTextField
            control={control}
            name="name"
            label="Announcement Title"
            placeholder="Enter a brief headline for the announcement"
            labelOnTop
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
            className="w-full"
          />
        </Box>
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outlined"
            className="!rounded-lg !px-6 !bg-transparent !text-primary-dark !border !border-border-table"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button className="!rounded-lg !px-6" onClick={onSubmit}>
            Save
          </Button>
        </div>
      </Box>
    </Modal>
  );
};
