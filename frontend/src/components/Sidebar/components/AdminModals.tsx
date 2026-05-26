"use client";

import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Button } from "@/modules/shared/component/Button";
import useChangePassword from "@/modules/admin/page/SettingsPage/hooks/useChangePassword";
import { Modal } from "@/modules/shared/component/modal";

interface AdminModalsProps {
  changePasswordModalOpen: boolean;
  onCloseChangePassword: () => void;
}

export const AdminModals: React.FC<AdminModalsProps> = ({
  changePasswordModalOpen,
  onCloseChangePassword,
}) => {
  const changePassword = useChangePassword();

  return (
    <Modal
      isOpen={changePasswordModalOpen}
      onClose={onCloseChangePassword}
      className="md:w-[600px] w-[90vw] p-6! rounded-md!"
      width="600px"
    >
      <Box className="flex flex-col gap-6">
        <Box className="flex justify-between items-center border-b pb-4 border-gray-200">
          <Box className="flex flex-col gap-1">
            <Typography className="text-xl! font-bold! text-textColor!">
              Change Password
            </Typography>
            <Typography className="text-sm! font-normal! text-primary-dark!">
              Enter your current password and choose a new one.
            </Typography>
          </Box>
          <IconButton onClick={onCloseChangePassword} className="p-1!" size="small">
            <CloseIcon className="text-gray-600!" />
          </IconButton>
        </Box>
        <Box className="">
          <form onSubmit={changePassword.handleSubmit} className="flex flex-col gap-4">
            <CWTextField
              control={changePassword.control}
              name="currentPassword"
              label="Current Password"
              placeholder="Enter current password"
              labelOnTop
              type="password"
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
              className="w-full"
            />
            <CWTextField
              control={changePassword.control}
              name="newPassword"
              label="New Password"
              placeholder="Enter new password"
              labelOnTop
              type="password"
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
              className="w-full"
            />
            <CWTextField
              control={changePassword.control}
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm new password"
              labelOnTop
              type="password"
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
              className="w-full"
            />
            <Box className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button
                variant="outlined"
                onClick={onCloseChangePassword}
                className="rounded-lg! px-6! bg-background-offwhite/50! text-primary-dark! border! border-border-table!"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-6! py-2! rounded-lg!"
                loading={changePassword.isChangingPassword}
              >
                Change Password
              </Button>
            </Box>
          </form>
        </Box>
      </Box>
    </Modal>
  );
};
