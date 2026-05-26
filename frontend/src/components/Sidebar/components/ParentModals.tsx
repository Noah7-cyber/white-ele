"use client";

import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { Control, Controller } from "react-hook-form";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { TextField } from "@/modules/shared/component/TextField";
import { Button } from "@/modules/shared/component/Button";
import useParentModals from "./hooks/useParentModals";
import { Modal } from "@/modules/shared/component/modal";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";

interface ParentModalsProps {
  changePasswordModalOpen: boolean;
  resetKioskPinModalOpen: boolean;
  onCloseChangePassword: () => void;
  onCloseResetKioskPin: () => void;
}

export const ParentModals: React.FC<ParentModalsProps> = ({
  changePasswordModalOpen,
  resetKioskPinModalOpen,
  onCloseChangePassword,
  onCloseResetKioskPin,
}) => {
  const { changePassword, resetKioskPin } = useParentModals({
    onResetKioskPinSuccess: onCloseResetKioskPin,
  });
  const isMobile = useMediaQuery("(max-width:768px)");

  const changePasswordFormId = "parent-change-password-form";
  const resetKioskPinFormId = "parent-reset-kiosk-pin-form";

  const changePasswordFooter = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onCloseChangePassword}
        className="flex-1 py-3 rounded-lg md:rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form={changePasswordFormId}
        className="flex-1 py-3 rounded-lg md:rounded-full bg-brandColor-active text-white text-sm font-medium hover:opacity-90"
      >
        Change Password
      </button>
    </div>
  );

  const resetKioskFooter = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onCloseResetKioskPin}
        className="flex-1 py-3 rounded-lg md:rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form={resetKioskPinFormId}
        className="flex-1 py-3 rounded-lg md:rounded-full bg-brandColor-active text-white text-sm font-medium hover:opacity-90"
      >
        Reset PIN
      </button>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <MobileFormDrawer
          open={changePasswordModalOpen}
          onClose={onCloseChangePassword}
          title="Change Password"
          footer={changePasswordFooter}
        >
          <Box className="pt-4">
            <ChangePasswordModalContent
              onClose={onCloseChangePassword}
              control={changePassword.control}
              handleSubmit={changePassword.handleSubmit}
              isChangingPassword={changePassword.isChangingPassword}
              isMobile
              formId={changePasswordFormId}
            />
          </Box>
        </MobileFormDrawer>
      ) : (
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
              <ChangePasswordModalContent
                onClose={onCloseChangePassword}
                control={changePassword.control}
                handleSubmit={changePassword.handleSubmit}
                isChangingPassword={changePassword.isChangingPassword}
              />
            </Box>
          </Box>
        </Modal>
      )}

      {isMobile ? (
        <MobileFormDrawer
          open={resetKioskPinModalOpen}
          onClose={onCloseResetKioskPin}
          title="Reset Kiosk PIN"
          footer={resetKioskFooter}
        >
          <Box className="pt-4">
            <ResetKioskPinModalContent
              onClose={onCloseResetKioskPin}
              control={resetKioskPin.control}
              handleSubmit={resetKioskPin.handleSubmit}
              isResettingPin={resetKioskPin.isResettingPin}
              isMobile
              formId={resetKioskPinFormId}
            />
          </Box>
        </MobileFormDrawer>
      ) : (
        <Modal
          isOpen={resetKioskPinModalOpen}
          onClose={onCloseResetKioskPin}
          className="md:w-[600px] w-[90vw] p-6! rounded-md!"
          width="600px"
        >
          <Box className="flex flex-col gap-6">
            <Box className="flex justify-between items-center border-b pb-4 border-gray-200">
              <Box className="flex flex-col gap-1">
                <Typography className="text-xl! font-bold! text-textColor!">
                  Reset Kiosk PIN
                </Typography>
                <Typography className="text-sm! font-normal! text-primary-dark!">
                  Enter a new 4-digit PIN for kiosk clock-in/clock-out.
                </Typography>
              </Box>
              <IconButton onClick={onCloseResetKioskPin} className="p-1!" size="small">
                <CloseIcon className="text-gray-600!" />
              </IconButton>
            </Box>
            <Box className="">
              <ResetKioskPinModalContent
                onClose={onCloseResetKioskPin}
                control={resetKioskPin.control}
                handleSubmit={resetKioskPin.handleSubmit}
                isResettingPin={resetKioskPin.isResettingPin}
              />
            </Box>
          </Box>
        </Modal>
      )}
    </>
  );
};

interface ChangePasswordModalContentProps {
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isChangingPassword: boolean;
  isMobile?: boolean;
  formId?: string;
}

const ChangePasswordModalContent = ({
  onClose,
  control,
  handleSubmit,
  isChangingPassword,
  isMobile = false,
  formId,
}: ChangePasswordModalContentProps) => {
  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4 px-1">
      <CWTextField
        control={control}
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
        control={control}
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
        control={control}
        name="confirmPassword"
        label="Confirm Password"
        placeholder="Confirm new password"
        labelOnTop
        type="password"
        labelClassName="!text-sm !font-medium !text-input-gray"
        inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
        className="w-full"
      />
      {!isMobile && (
        <Box className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <Button
            variant="outlined"
            onClick={onClose}
            className="rounded-lg! px-6! bg-background-offwhite/50! text-primary-dark! border! border-border-table!"
          >
            Cancel
          </Button>
          <Button type="submit" className="px-6! py-2! rounded-lg!" loading={isChangingPassword}>
            Change Password
          </Button>
        </Box>
      )}
    </form>
  );
};

interface ResetKioskPinModalContentProps {
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isResettingPin: boolean;
  isMobile?: boolean;
  formId?: string;
}

const limitPinInput = (v: string) => v.replace(/\D/g, "").slice(0, 4);

const ResetKioskPinModalContent = ({
  onClose,
  control,
  handleSubmit,
  isResettingPin,
  isMobile = false,
  formId,
}: ResetKioskPinModalContentProps) => {
  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4 px-1">
      <Controller
        name="pin"
        control={control}
        render={({ field: { value, onChange, onBlur, ref }, fieldState: { error } }) => (
          <TextField
            value={value ?? ""}
            onChange={(e) => onChange(limitPinInput(e.target.value))}
            onBlur={onBlur}
            inputRef={ref}
            label="New PIN"
            placeholder="Enter 4-digit PIN"
            labelOnTop
            type="password"
            inputMode="numeric"
            inputProps={{ maxLength: 4 }}
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
            className="w-full"
            errorText={error?.message}
            isError={!!error}
          />
        )}
      />
      <Controller
        name="confirmPin"
        control={control}
        render={({ field: { value, onChange, onBlur, ref }, fieldState: { error } }) => (
          <TextField
            value={value ?? ""}
            onChange={(e) => onChange(limitPinInput(e.target.value))}
            onBlur={onBlur}
            inputRef={ref}
            label="Confirm New PIN"
            placeholder="Confirm 4-digit PIN"
            labelOnTop
            type="password"
            inputMode="numeric"
            inputProps={{ maxLength: 4 }}
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !text-input-gray placeholder:!text-input-gray"
            className="w-full"
            errorText={error?.message}
            isError={!!error}
          />
        )}
      />
      {!isMobile && (
        <Box className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <Button
            variant="outlined"
            onClick={onClose}
            className="rounded-lg! px-6! bg-background-offwhite/50! text-primary-dark! border! border-border-table!"
          >
            Cancel
          </Button>
          <Button type="submit" className="px-6! py-2! rounded-lg!" loading={isResettingPin}>
            Reset PIN
          </Button>
        </Box>
      )}
    </form>
  );
};
