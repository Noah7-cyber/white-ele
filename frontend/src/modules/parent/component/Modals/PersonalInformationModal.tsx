"use client";

import React from "react";
import { Box, Typography, IconButton, CircularProgress, Drawer } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Modal } from "@/modules/shared/component/modal/modal";
import { Button } from "@/modules/shared/component/Button";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import ImageUpload from "@/modules/shared/component/ImageUpload/imageUpload";
import { UseFormReturn } from "react-hook-form";
import { PersonalInfoFormData } from "../../page/ParentProfile/hook/useParentProfile";
import LeftIcon from "@/modules/shared/assets/svgs/chevronLeft.svg";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

interface PersonalInformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: UseFormReturn<PersonalInfoFormData>;
  onSubmit: (data: PersonalInfoFormData) => void;
  loading: boolean;
}

export const PersonalInformationModal: React.FC<PersonalInformationModalProps> = ({
  isOpen,
  onClose,
  form,
  onSubmit: handleSubmitForm,
  loading,
}) => {
  const { control, handleSubmit } = form;
  const isMobile = useMediaQuery("(max-width: 767px)");

  const onSubmit = (data: PersonalInfoFormData) => {
    handleSubmitForm(data);
  };

  if (isMobile) {
    return (
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        PaperProps={{
          className: "w-full flex flex-col",
          style: { maxWidth: "100vw" },
        }}
      >
        <div className="flex items-center gap-3 px-5 py-5 bg-white">
          <button
            onClick={onClose}
            className="w-8 min-w-8 h-8 rounded-full bg-[#EEF7F8] flex items-center justify-center shrink-0"
            aria-label="Close personal information drawer"
          >
            <LeftIcon className="text-[#0A8EA0] -ml-2" />
          </button>
          <span className="text-[16px] font-semibold text-[#0B2F2F]">
            Edit Personal Information
          </span>
        </div>

        <div className="flex-1 overflow-y-auto bg-white px-5 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
            <Box className="flex flex-col gap-4">
              <ImageUpload
                name="photo"
                control={control}
                label="Profile Photo"
                id="personal-info-photo"
              />
              <Box className="flex flex-col gap-4 sm:flex-row sm:gap-3">
                <CWTextField
                  control={control}
                  requiredAsterisk
                  name="firstName"
                  label="First Name"
                  placeholder="Enter first name"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
                  className="flex-1"
                />
                <CWTextField
                  control={control}
                  requiredAsterisk
                  name="lastName"
                  label="Last Name"
                  placeholder="Enter last name"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
                  className="flex-1"
                />
              </Box>

              <CWTextField
                control={control}
                name="email"
                label="Email Address"
                placeholder="Enter email address"
                labelOnTop
                type="email"
                disabled
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
                className="w-full"
              />

              <CWTextField
                control={control}
                name="phone"
                label="Phone Number"
                placeholder="Enter phone number"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
                className="w-full"
              />
            </Box>

            <Box className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outlined"
                onClick={onClose}
                className="!rounded-lg !px-6 !bg-background-offwhite/50 !text-primary-dark !border !border-border-table"
              >
                Cancel
              </Button>
              <Button type="submit" className="!px-6 !py-2 !rounded-lg" loading={loading}>
                {loading ? <CircularProgress size={20} thickness={6} disableShrink /> : "Save Changes"}
              </Button>
            </Box>
          </form>
        </div>
      </Drawer>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="md:w-[600px] w-[90vw] !p-6 !rounded-md"
      width="600px"
    >
      <Box className="flex flex-col gap-6">
        {/* Header */}
        <Box className="flex justify-between items-center border-b pb-4 border-gray-200">
          <Typography className="!text-xl !font-semibold !text-gray-800">
            Edit Personal Information
          </Typography>
          <IconButton onClick={onClose} className="!p-1" size="small">
            <CloseIcon className="!text-gray-600" />
          </IconButton>
        </Box>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Box className="flex flex-col gap-4">
            <ImageUpload name="photo" control={control} label="Profile Photo" id="personal-info-photo" />
            <Box className="flex flex-row gap-3">
              <CWTextField
                control={control}
                requiredAsterisk
                name="firstName"
                label="First Name"
                placeholder="Enter first name"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
                className="flex-1"
              />
              <CWTextField
                control={control}
                requiredAsterisk
                name="lastName"
                label="Last Name"
                placeholder="Enter last name"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
                className="flex-1"
              />
            </Box>

            <CWTextField
              control={control}
              name="email"
              label="Email Address"
              placeholder="Enter email address"
              labelOnTop
              type="email"
              disabled
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
              className="w-full"
            />

            <CWTextField
              control={control}
              name="phone"
              label="Phone Number"
              placeholder="Enter phone number"
              labelOnTop
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
              className="w-full"
            />
          </Box>

          {/* Actions */}
          <Box className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outlined"
              onClick={onClose}
              className="!rounded-lg !px-6 !bg-background-offwhite/50 !text-primary-dark !border !border-border-table"
            >
              Cancel
            </Button>
            <Button type="submit" className="!px-6 !py-2 !rounded-lg" loading={loading}>
              {loading ? <CircularProgress size={20} thickness={6} disableShrink /> : "Save Changes"}
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};
