"use client";

import React, { useEffect } from "react";
import { Box, Typography, IconButton } from "@mui/material";

import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import { Button } from "@/modules/shared/component/Button";
import ClearIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { Control } from "react-hook-form";
import { Modal } from "@/modules/shared/component/modal";
import { SubjectFormValues } from "@/modules/shared/component/Learning/manageCurriculum.constants";
import { DropdownOption } from "@/modules/shared/component/Dropdown";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import DocumentUpload from "@/modules/shared/component/DocumentUpload/documentUpload";

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  control: Control<SubjectFormValues>;
  isEditing?: boolean;
  staffOptions: DropdownOption<number>[];
}

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  control,
  isEditing = false,
  staffOptions,
}) => {
  useEffect(() => {
    control.register("attachments");
  }, [control]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-xl w-full !h-[80vh] rounded-xl !p-0 flex flex-col"
    >
      {/* MODAL CONTAINER */}
      <Box className="flex flex-col h-full">
        {/* HEADER - fixed */}
        <Box className="px-5 py-4 border-b border-border-input flex items-center justify-between sticky top-0 bg-white z-20">
          <Typography className="!text-lg !font-bold !text-primary-dark">
            {isEditing ? "Edit Subject" : "Add Subject"}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <ClearIcon />
          </IconButton>
        </Box>

        {/* SCROLLABLE BODY */}
        <Box className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          <CWTextField
            control={control}
            name="name"
            label="Subject Name"
            placeholder="Enter subject name"
            labelOnTop
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
            className="w-full"
          />

          <CWDropdown
            control={control}
            name="assignedStaff"
            options={staffOptions}
            hasSearch
            isForm
            textFieldProps={{
              label: "Assigned Staff (optional)",
              labelClassName: "!text-sm !font-medium !text-input-gray",
              placeholder: "Select teacher",
              inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
              labelOnTop: true,
              className: "!flex !justify-center ",
            }}
          />

          <CWTextArea
            control={control}
            name="description"
            label="Description"
            placeholder="Brief description of the subject..."
            rows={4}
            labelOnTop
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-xs !px-3.5 !pt-3 !pb-4 !text-input-gray !h-20"
            className="w-full"
          />

          {/* BETTER DOCUMENT UPLOAD SECTION */}
          <Box className="mt-2">
            <Typography className="!text-sm !font-medium !text-input-gray mb-2">
              Attachments
            </Typography>
            <DocumentUpload control={control} name="attachments" maxFiles={4} />
          </Box>
        </Box>

        {/* FOOTER - fixed */}
        <Box className="px-5 py-4 border-t border-border-input flex justify-end gap-2 sticky bottom-0 bg-white z-20">
          <Button
            variant="outlined"
            className="!rounded-lg !px-6 !bg-transparent !text-primary-dark !border !border-border-table"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button className="!rounded-lg !px-6" onClick={onSubmit}>
            {isEditing ? "Update" : "Save"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
