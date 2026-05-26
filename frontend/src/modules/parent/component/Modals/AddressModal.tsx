"use client";

import React from "react";
import { Box, Typography, IconButton, Drawer } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Modal } from "@/modules/shared/component/modal/modal";
import { Button } from "@/modules/shared/component/Button";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { UseFormReturn } from "react-hook-form";
import { AddressFormData } from "../../page/ParentProfile/hook/useParentProfile";
import LeftIcon from "@/modules/shared/assets/svgs/chevronLeft.svg";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: UseFormReturn<AddressFormData>;
  onSubmit: (data: AddressFormData) => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  form,
  onSubmit: handleSubmitForm,
}) => {
  const { control, handleSubmit } = form;
  const isMobile = useMediaQuery("(max-width: 767px)");

  const onSubmit = (data: AddressFormData) => {
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
            aria-label="Close address drawer"
          >
            <LeftIcon className="text-[#0A8EA0] -ml-2" />
          </button>
          <span className="text-[16px] font-semibold text-[#0B2F2F]">Edit Address</span>
        </div>

        <div className="flex-1 overflow-y-auto bg-white px-5 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
            <Box className="flex flex-col gap-4">
              <CWTextField
                control={control}
                name="address"
                label="Street Address"
                placeholder="Enter full address"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
                className="w-full"
              />
              <Box className="flex flex-col gap-4 sm:flex-row sm:gap-3">
                <CWTextField
                  control={control}
                  name="city"
                  label="City"
                  placeholder="Enter your city"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
                  className="w-full"
                />
                <CWTextField
                  control={control}
                  name="state"
                  label="State"
                  placeholder="Enter your state"
                  labelOnTop
                  labelClassName="!text-sm !font-medium !text-input-gray"
                  inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
                  className="w-full"
                />
              </Box>
              <CWTextField
                control={control}
                name="postalCode"
                label="Postal Code"
                placeholder="Enter your postal code"
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
                className="!rounded-lg !px-6 !bg-background-offwhite/50 !text-primary-dark !border !border-border-table "
              >
                Cancel
              </Button>
              <Button type="submit" className="!px-6 !py-2 !rounded-lg">
                Save Changes
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
          <Typography className="!text-xl !font-semibold !text-gray-800">Edit Address</Typography>
          <IconButton onClick={onClose} className="!p-1" size="small">
            <CloseIcon className="!text-gray-600" />
          </IconButton>
        </Box>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Box className="flex flex-col gap-4">
            <CWTextField
              control={control}
              name="address"
              label="Street Address"
              placeholder="Enter full address"
              labelOnTop
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
              className="w-full"
            />
            <Box className="flex flex-row gap-3">
              <CWTextField
                control={control}
                name="city"
                label="City"
                placeholder="Enter your city"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
                className="w-full"
              />
              <CWTextField
                control={control}
                name="state"
                label="State"
                placeholder="Enter your state"
                labelOnTop
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
                className="w-full"
              />
            </Box>
            <CWTextField
              control={control}
              name="postalCode"
              label="Postal Code"
              placeholder="Enter your postal code"
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
              className="!rounded-lg !px-6 !bg-background-offwhite/50 !text-primary-dark !border !border-border-table "
            >
              Cancel
            </Button>
            <Button type="submit" className="!px-6 !py-2 !rounded-lg">
              Save Changes
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};
