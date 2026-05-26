"use client";

import { Box, Typography, Avatar, IconButton, Drawer } from "@mui/material";
import { Button } from "@/modules/shared/component/Button";
import ProfileIcon from "@/modules/shared/assets/svgs/Profile.svg";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { useParentProfile } from "./hook/useParentProfile";
import { PersonalInformationModal } from "../../component/Modals/PersonalInformationModal";
import { AddressModal } from "../../component/Modals/AddressModal";
import CalendarIcon from "@/modules/shared/assets/svgs/calendarOutline.svg";
import EmailIcon from "@/modules/shared/assets/svgs/emailOutline.svg";
import PhoneIcon from "@/modules/shared/assets/svgs/phoneOutline.svg";
import LocationIcon from "@/modules/shared/assets/svgs/locationOutline.svg";
import { useRouter, useSearchParams } from "next/navigation";
import ScrollableTabBar from "@/layout/Shared/ScrollableTabBar";
import { ParentRoutes } from "@/routes/parent.routes";
import { NotificationPreferencesPanel } from "./NotificationPreferencesPanel";
import { Modal } from "@/modules/shared/component/modal";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import LeftIcon from "@/modules/shared/assets/svgs/chevronLeft.svg";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

const NOTIFICATIONS_TAB = "notifications";

export const ParentProfilePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") === NOTIFICATIONS_TAB ? NOTIFICATIONS_TAB : "profile";
  const isMobile = useMediaQuery("(max-width: 767px)");

  const {
    isLoading,
    parentName,
    parentEmail,
    parentPhone,
    parentAddress,
    parentPhoto,
    memberSince,
    isPersonalInfoModalOpen,
    isAddressModalOpen,
    isChangePasswordModalOpen,
    setIsPersonalInfoModalOpen,
    setIsAddressModalOpen,
    setIsChangePasswordModalOpen,
    openPersonalInfoModal,
    openAddressModal,
    openChangePasswordModal,
    personalInfoForm,
    addressForm,
    handleUpdatePersonalInfo,
    handleUpdateAddress,
    changePassword,
    isUpdatingProfile,
  } = useParentProfile();

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

  return (
    <DataRenderer isLoading={isLoading}>
      {() => (
        <Box
          className={`sm:min-h-screen h-auto sm:!h-full space-y-4 md:space-y-6 px-4 md:p-5 ${
            isMobile ? "!bg-white pb-5 md:pb-5 " : "!bg-dashboard-bg"
          }`}
        >
          <Box className="hidden md:block">
            <Typography className="!text-xl !text-text-primary !font-semibold mb-2 md:mb-6">
              Profile
            </Typography>
          </Box>

          <ScrollableTabBar className="bg-white md:border-b md:border-border-lightGray md:mt-0 md:mb-2 md:bg-transparent px-0 py-3 md:py-0 md:px-0">
            <button
              type="button"
              className={`shrink-0 whitespace-nowrap pb-2 px-3 text-sm hover:cursor-pointer ${
                activeTab === "profile"
                  ? "text-brandColor-active! border-b border-brandColor-active font-medium"
                  : "text-[#0250504D]"
              }`}
              onClick={() => router.replace(ParentRoutes.profile)}
            >
              Profile details
            </button>
            <button
              type="button"
              className={`shrink-0 whitespace-nowrap pb-2 px-3 text-sm hover:cursor-pointer ${
                activeTab === NOTIFICATIONS_TAB
                  ? "text-brandColor-active! border-b border-brandColor-active font-medium"
                  : "text-[#0250504D]"
              }`}
              onClick={() => router.replace(`${ParentRoutes.profile}?tab=${NOTIFICATIONS_TAB}`)}
            >
              Notification preferences
            </button>
          </ScrollableTabBar>

          {activeTab === "profile" ? (
            <Box className="grid grid-cols-1 md:grid-cols-3 md:gap-4 ">
              <Box className="col-span-1 flex flex-col justify-between bg-white sm:min-h-[120px]  px-0 py-2 md:p-7 rounded-none border-0 md:rounded-md md:border md:border-brandColor-active/20">
                <Box className="flex flex-col items-center gap-4 w-full">
                  <Box className="flex flex-col items-center gap-2 w-full pb-6 border-b border-[#D9E6E8]">
                    <Box className="relative">
                      <Avatar
                        src={parentPhoto}
                        alt={parentName}
                        sx={{ width: { xs: 88, md: 100 }, height: { xs: 88, md: 100 } }}
                      >
                        {!parentPhoto && <ProfileIcon className="w-[100px] h-[100px]" />}
                      </Avatar>
                    </Box>
                    <Typography className="!text-[18px] sm:!text-[20px] md:!text-xl !font-semibold !text-primary-dark !text-center !leading-[1.25]">
                      {parentName}
                    </Typography>
                    <Typography className="!text-[13px] sm:!text-sm !font-normal !text-[#667085] !text-center !leading-5">
                      {parentEmail || "Not provided"}
                    </Typography>
                    <Typography className="hidden md:block !text-[10px] !font-semibold py-1 px-3 !bg-brandColor-active/15 !text-primary-dark rounded-2xl">
                      Parent
                    </Typography>
                  </Box>

                  <Box className="w-full space-y-5 mt-2 border-b border-[#D9E6E8] pb-6">
                    <Box className="hidden md:flex items-center gap-3">
                      <Box className="p-1 rounded-lg bg-brandColor-active/20 flex w-10 h-10 items-center justify-center">
                        <EmailIcon className="!text-text-tertiary/70 !text-lg " />
                      </Box>
                      <Box className="flex-1">
                        <Typography className="!text-[10px] !font-normal !text-text-tertiary/70 mb-1">
                          Email
                        </Typography>
                        <Typography className="!text-xs !font-medium !text-primary-dark">
                          {parentEmail || "Not provided"}
                        </Typography>
                      </Box>
                    </Box>

                    <Box className="flex items-center gap-3">
                      <Box className="p-1 rounded-lg bg-brandColor-active/20 flex w-9 h-9 md:w-10 md:h-10 items-center justify-center">
                        <PhoneIcon className="!text-text-tertiary/70 !text-lg " />
                      </Box>
                      <Box className="flex-1">
                        <Typography className="!text-[13px] md:!text-[10px] !font-normal !text-text-tertiary/70 mb-1 !leading-4">
                          Phone
                        </Typography>
                        <Typography className="!text-[14px] sm:!text-[15px] md:!text-xs !font-medium !text-primary-dark !leading-5">
                          {parentPhone || "Not provided"}
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
                          {parentAddress || "Not specified"}
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

              <Box className="col-span-2 flex flex-col  md:min-h-0 max-h-none md:max-h-[380px] px-0 pb-6 pt-1 md:p-6 rounded-none border-0 md:rounded-md md:border md:border-brandColor-active/20 space-y-4 overflow-visible md:overflow-y-auto">
                <Box>
                  <Typography className="!text-[18px] sm:!text-[20px] md:!text-xl !text-primary-dark !font-bold mb-6 !leading-[1.25]">
                    Account Settings
                  </Typography>
                </Box>

                <Box className="flex flex-col gap-4 ">
                  {settingsItems.map((item) => (
                    <Box
                      key={item.title}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FAFAFA] p-5 md:p-4 rounded-2xl md:rounded-lg"
                    >
                      <Box className="flex-1 pr-0 sm:pr-4">
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
                        className="!min-w-[50px] !rounded-lg !px-3 md:!px-6 !py-1 !text-[14px] md:!text-sm !font-medium !border-gray-300 !text-gray-700 hover:!bg-gray-50 !capitalize !bg-white self-start sm:self-auto"
                      >
                        Edit
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          ) : (
            <Box className="bg-white rounded-none md:rounded-md border-0 md:border md:border-brandColor-active/20 p-4 md:p-6">
              <NotificationPreferencesPanel />
            </Box>
          )}

          <PersonalInformationModal
            isOpen={isPersonalInfoModalOpen}
            onClose={() => setIsPersonalInfoModalOpen(false)}
            form={personalInfoForm}
            onSubmit={handleUpdatePersonalInfo}
            loading={isUpdatingProfile}
          />
          <AddressModal
            isOpen={isAddressModalOpen}
            onClose={() => setIsAddressModalOpen(false)}
            form={addressForm}
            onSubmit={handleUpdateAddress}
          />
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
                  type="button"
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
        </Box>
      )}
    </DataRenderer>
  );
};
