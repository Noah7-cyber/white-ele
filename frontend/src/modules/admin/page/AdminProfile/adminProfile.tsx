/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { Box, Typography, Avatar, IconButton, Drawer } from "@mui/material";
import { Controller, type Control } from "react-hook-form";
import { Button } from "@/modules/shared/component/Button";
import ProfileIcon from "@/modules/shared/assets/svgs/Profile.svg";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { useAdminProfile } from "./hook/useAdminProfile";
import { PersonalInformationModal } from "@/modules/parent/component/Modals/PersonalInformationModal";
import { AddressModal } from "@/modules/parent/component/Modals/AddressModal";
import CalendarIcon from "@/modules/shared/assets/svgs/calendarOutline.svg";
import EmailIcon from "@/modules/shared/assets/svgs/emailOutline.svg";
import PhoneIcon from "@/modules/shared/assets/svgs/phoneOutline.svg";
import LocationIcon from "@/modules/shared/assets/svgs/locationOutline.svg";
import { Modal } from "@/modules/shared/component/modal";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { TextField } from "@/modules/shared/component/TextField";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import LeftIcon from "@/modules/shared/assets/svgs/chevronLeft.svg";
import KeyIcon from "@/modules/shared/assets/svgs/keyLinear.svg";
import ResetIcon from "@/modules/shared/assets/svgs/resetWhite.svg";
import EyeIcon from "@/modules/shared/assets/svgs/eyeLinear.svg";
import EyeOffIcon from "@/modules/shared/assets/svgs/eyeOffLinear.svg";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";
import useResetAdminKioskPin from "./hook/useResetAdminKioskPin";

export const AdminProfilePage = () => {
  const {
    roleDetails,
    isLoading,
    adminName,
    adminEmail,
    adminPhone,
    adminAddress,
    adminPhoto,
    memberSince,
    isPersonalInfoModalOpen,
    isAddressModalOpen,
    isChangePasswordModalOpen,
    isResetKioskPinModalOpen,
    setIsPersonalInfoModalOpen,
    setIsAddressModalOpen,
    setIsChangePasswordModalOpen,
    setIsResetKioskPinModalOpen,
    openPersonalInfoModal,
    openAddressModal,
    openChangePasswordModal,
    openResetKioskPinModal,
    personalInfoForm,
    addressForm,
    handleUpdatePersonalInfo,
    handleUpdateAddress,
    isUpdatingPersonalInfo,
    changePassword,
    isUploadingImage,
  } = useAdminProfile();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [isPinHidden, setIsPinHidden] = useState(true);
  const resetKioskPin = useResetAdminKioskPin({
    onSuccess: () => setIsResetKioskPinModalOpen(false),
  });
  const canResetKioskPin = Boolean(roleDetails?.id);
  const adminKioskPin = ((roleDetails as { pin?: string } | null | undefined)?.pin ?? "").toString();

  const settingsItems = [
    {
      title: "Personal Information",
      description: "Update your name, email, and phone",
      onClick: openPersonalInfoModal,
    },
    {
      title: "Address",
      description: "Update your residential address",
      onClick: openAddressModal,
    },
    {
      title: "Password",
      description: "Update your current password",
      onClick: openChangePasswordModal,
    },
  ];

  const renderPinBoxes = () => {
    const pinLength = adminKioskPin ? adminKioskPin.length : 4;
    const pinDigits = adminKioskPin ? adminKioskPin.split("") : Array(pinLength).fill("-");

    return (
      <Box className="flex gap-2 items-center justify-center px-0.5">
        {pinDigits.map((digit, idx) => (
          <Box
            key={`${digit}-${idx}`}
            className="w-16 h-16 md:w-[7.25rem] md:h-[7.25rem] flex items-center justify-center border border-primary-dark rounded-[18px] text-4xl md:text-[4rem] font-semibold text-primary-dark bg-white"
          >
            {adminKioskPin ? (
              isPinHidden ? (
                <span className="mt-2.5 text-4xl md:text-[4rem]">*</span>
              ) : (
                digit
              )
            ) : (
              <span className="mt-2.5 text-4xl text-text-tertiary/70">-</span>
            )}
          </Box>
        ))}
        {adminKioskPin && (
          <button
            type="button"
            className="ml-3 cursor-pointer flex items-center text-brandColor-active"
            onClick={() => setIsPinHidden((prev) => !prev)}
            aria-label={isPinHidden ? "Show PIN" : "Hide PIN"}
          >
            {isPinHidden ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </Box>
    );
  };

  return (
    <Box className="min-h-screen h-full space-y-6 bg-white p-5 md:!bg-dashboard-bg">
      <Box className="hidden md:block">
        <Typography className="!text-xl !text-text-primary !font-semibold mb-6">Profile</Typography>
      </Box>
      <DataRenderer isLoading={isLoading}>
        {() => (
          <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* First Card - 1/3 width */}

            <Box className="col-span-1 flex flex-col justify-between bg-white min-h-[120px] px-0 py-2 md:p-7 rounded-none border-0 md:rounded-md md:border md:border-brandColor-active/20">
              <Box className="flex flex-col items-center gap-4 w-full">
                <Box className="flex flex-col items-center gap-2 w-full pb-6 border-b border-[#D9E6E8]">
                  <Box className="relative">
                    <Avatar
                      src={adminPhoto}
                      alt={adminName}
                      sx={{
                        width: isMobile ? 88 : 100,
                        height: isMobile ? 88 : 100,
                      }}
                    >
                      {!adminPhoto && <ProfileIcon className="w-[100px] h-[100px]" />}
                    </Avatar>
                  </Box>
                  <Typography className="!text-[18px] sm:!text-[20px] md:!text-xl !font-semibold !text-primary-dark !text-center !leading-[1.25]">
                    {adminName}
                  </Typography>
                  <Typography className="!text-[13px] sm:!text-sm !font-normal !text-[#667085] !text-center !leading-5">
                    {adminEmail || "Not provided"}
                  </Typography>
                  <Typography className="hidden md:block !text-[10px] !font-semibold py-1 px-3 !bg-brandColor-active/15 !text-primary-dark rounded-2xl">
                    Admin
                  </Typography>
                </Box>

                <Box className="w-full space-y-5 mt-2 border-b border-[#D9E6E8] pb-6">
                  {!isMobile && (
                    <Box className="flex items-center gap-3">
                      <Box className="p-1 rounded-lg bg-brandColor-active/20 flex w-10 h-10 items-center justify-center">
                        <EmailIcon className="!text-text-tertiary/70 !text-lg " />
                      </Box>
                      <Box className="flex-1">
                        <Typography className="!text-[10px] !font-normal !text-text-tertiary/70 mb-1">
                          Email
                        </Typography>
                        <Typography className="!text-xs !font-medium !text-primary-dark">
                          {adminEmail || "Not provided"}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Box className="flex items-center gap-3">
                    <Box className="p-1 rounded-lg bg-brandColor-active/20 flex w-10 h-10 items-center justify-center md:w-10 md:h-10 w-9 h-9">
                      <PhoneIcon className="!text-text-tertiary/70 !text-lg " />
                    </Box>
                    <Box className="flex-1">
                      <Typography className="!text-[13px] md:!text-[10px] !font-normal !text-text-tertiary/70 mb-1 !leading-4">
                        Phone
                      </Typography>
                      <Typography className="!text-[14px] sm:!text-[15px] md:!text-xs !font-medium !text-primary-dark !leading-5">
                        {adminPhone || "Not provided"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box className="flex items-center gap-3">
                    <Box className="p-1 rounded-lg bg-brandColor-active/20 flex items-center w-9 h-9 md:w-10 md:h-10 justify-center">
                      <LocationIcon className="!text-text-tertiary/70 !text-lg " />
                    </Box>
                    <Box className="flex-1">
                      <Typography className="!text-[13px] md:!text-[10px] !font-normal !text-text-tertiary/70 mb-1 !leading-4">
                        Address
                      </Typography>
                      <Typography className="!text-[14px] sm:!text-[15px] md:!text-xs !font-medium !text-primary-dark !leading-5">
                        {adminAddress || "Not specified"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box className="flex items-center gap-3">
                    <Box className="p-1 rounded-lg bg-brandColor-active/20 flex items-center w-9 h-9 md:w-10 md:h-10 justify-center">
                      <CalendarIcon className="!text-text-tertiary/70 !t" />
                    </Box>
                    <Box className="flex-1">
                      <Typography className="!text-[13px] md:!text-[10px] !font-normal !text-text-tertiary/70 mb-1 !leading-4">
                        Member Since
                      </Typography>
                      <Typography className="!text-[14px] sm:!text-[15px] md:!text-xs !font-medium !text-primary-dark !leading-5">
                        {memberSince || "—"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Second Card - 2/3 width */}
            <Box className="col-span-2 flex flex-col gap-4">
              <Box className="flex flex-col bg-white max-h-none md:max-h-[380px] px-0 pb-0 pt-1 md:p-6 rounded-none border-0 md:rounded-md md:border md:border-brandColor-active/20 space-y-4 overflow-visible md:overflow-y-auto">
                <Box>
                  <Typography className="!text-[18px] sm:!text-[20px] md:!text-xl !text-primary-dark !font-bold mb-6 !leading-[1.25]">
                    Account Settings
                  </Typography>
                </Box>

                <Box className="flex flex-col gap-4">
                  {settingsItems.map((item) => (
                    <Box
                      key={item.title}
                      className="flex items-center justify-between bg-[#FAFAFA] p-5 md:p-4 rounded-2xl md:rounded-lg"
                    >
                      <Box className="flex-1 pr-4">
                        <Typography className="!text-[16px] md:!text-base !font-medium !text-primary-dark mb-2 !leading-5">
                          {item.title}
                        </Typography>
                        <Typography className="!text-[13px] sm:!text-sm md:!text-xs !text-text-tertiary/70 !font-normal !leading-5">
                          {item.description}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        onClick={item.onClick}
                        className="!min-w-[50px] !rounded-lg !px-3 md:!px-6 !py-1 !text-[14px] md:!text-sm !font-medium !border-gray-300 !text-gray-700 hover:!bg-gray-50 !capitalize !bg-white"
                      >
                        Edit
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box className="bg-white px-4 py-5 md:px-6 md:py-7 rounded-2xl md:rounded-md border border-brandColor-active/20 flex flex-col gap-8">
                <Box className="flex gap-2.5 items-center">
                  <KeyIcon />
                  <Box className="flex flex-col gap-1">
                    <Typography className="!text-[28px] md:!text-[24px] !font-bold !text-primary-dark !leading-none">
                      Kiosk PIN
                    </Typography>
                    <Typography className="!text-base md:!text-sm !font-normal !text-text-tertiary/70">
                      Use this PIN to clock in/out for your class.
                    </Typography>
                  </Box>
                </Box>

                <Box className="overflow-x-auto">{renderPinBoxes()}</Box>

                <Box className="flex flex-col gap-3 items-center">
                  <Typography className="!text-[18px] md:!text-sm !font-light !text-center !text-text-tertiary/70">
                    Use this PIN at the kiosk to clock in/out.
                  </Typography>
                  <Button
                    startIcon={<ResetIcon />}
                    onClick={openResetKioskPinModal}
                    disabled={!canResetKioskPin}
                    className="!w-full !rounded-2xl md:!rounded-lg !py-3.5 !text-base md:!text-sm !font-semibold !bg-brandColor-active !text-white"
                  >
                    Reset PIN
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </DataRenderer>
      {/* Modals */}
      <PersonalInformationModal
        isOpen={isPersonalInfoModalOpen}
        onClose={() => setIsPersonalInfoModalOpen(false)}
        form={personalInfoForm}
        onSubmit={handleUpdatePersonalInfo}
        loading={isUpdatingPersonalInfo || isUploadingImage}
      />
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        form={addressForm}
        onSubmit={handleUpdateAddress}
      />

      {/* Change Password Modal */}
      {isMobile ? (
        <Drawer
          anchor="right"
          open={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          PaperProps={{
            className: "w-full flex flex-col",
            style: { maxWidth: "100vw" },
          }}
        >
          <div className="flex items-center gap-3 px-5 py-5 bg-white">
            <button
              onClick={() => setIsChangePasswordModalOpen(false)}
              className="w-8 min-w-8 h-8 rounded-full bg-[#EEF7F8] flex items-center justify-center shrink-0"
              aria-label="Close change password drawer"
            >
              <LeftIcon className="text-[#0A8EA0] -ml-2" />
            </button>
            <span className="text-[16px] font-semibold text-[#0B2F2F]">Change Password</span>
          </div>
          <div className="flex-1 overflow-y-auto bg-white px-5 pb-8">
            <form onSubmit={changePassword.handleSubmit} className="flex flex-col gap-4 pt-2">
              <Typography className="text-sm! font-normal! text-primary-dark!">
                Enter your current password and choose a new one.
              </Typography>
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
                  onClick={() => setIsChangePasswordModalOpen(false)}
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
          </div>
        </Drawer>
      ) : (
        <Modal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
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
              <IconButton
                onClick={() => setIsChangePasswordModalOpen(false)}
                className="p-1!"
                size="small"
              >
                <CloseIcon className="text-gray-600!" />
              </IconButton>
            </Box>
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
                  onClick={() => setIsChangePasswordModalOpen(false)}
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
        </Modal>
      )}

      {isMobile ? (
        <MobileFormDrawer
          open={isResetKioskPinModalOpen}
          onClose={() => setIsResetKioskPinModalOpen(false)}
          title="Reset Kiosk PIN"
          footer={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsResetKioskPinModalOpen(false)}
                className="flex-1 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="admin-reset-kiosk-pin-form"
                className="flex-1 py-3 rounded-lg bg-brandColor-active text-white text-sm font-medium hover:opacity-90"
              >
                Reset PIN
              </button>
            </div>
          }
        >
          <Box className="pt-4 px-1">
            <ResetKioskPinModalContent
              control={resetKioskPin.control}
              handleSubmit={resetKioskPin.handleSubmit}
              isResettingPin={resetKioskPin.isResettingPin}
              isMobile
              formId="admin-reset-kiosk-pin-form"
            />
          </Box>
        </MobileFormDrawer>
      ) : (
        <Modal
          isOpen={isResetKioskPinModalOpen}
          onClose={() => setIsResetKioskPinModalOpen(false)}
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
              <IconButton
                onClick={() => setIsResetKioskPinModalOpen(false)}
                className="p-1!"
                size="small"
              >
                <CloseIcon className="text-gray-600!" />
              </IconButton>
            </Box>
            <ResetKioskPinModalContent
              control={resetKioskPin.control}
              handleSubmit={resetKioskPin.handleSubmit}
              isResettingPin={resetKioskPin.isResettingPin}
              onClose={() => setIsResetKioskPinModalOpen(false)}
            />
          </Box>
        </Modal>
      )}
    </Box>
  );
};

interface ResetKioskPinModalContentProps {
  control: Control<any>;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isResettingPin: boolean;
  onClose?: () => void;
  isMobile?: boolean;
  formId?: string;
}

const limitPinInput = (v: string) => v.replace(/\D/g, "").slice(0, 8);

const ResetKioskPinModalContent = ({
  control,
  handleSubmit,
  isResettingPin,
  onClose,
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
            inputProps={{ maxLength: 8 }}
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
            inputProps={{ maxLength: 8 }}
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
