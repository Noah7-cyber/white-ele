/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { Box, Popover, Typography, IconButton, CircularProgress } from "@mui/material";
import ProfileIcon from "@/modules/shared/assets/svgs/Profile.svg";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import PasswordIcon from "@/modules/shared/assets/svgs/passwordLinear.svg";
import LockPassword from "@/modules/shared/assets/svgs/lockPassword.svg";
import LogoutIcon from "@/modules/shared/assets/svgs/logoutOutline.svg";
import UserIcon from "@/modules/shared/assets/svgs/userProfile.svg";
import { ProfilePopoverBackdrop } from "./ProfilePopoverBackdrop";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

interface StaffProfilePopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  user: any;
  onProfileClick: () => void;
  onChangePasswordClick: () => void;
  onResetKioskPinClick: () => void;
  onLogout: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isLoggingOut?: boolean;
}

export const StaffProfilePopover: React.FC<StaffProfilePopoverProps> = ({
  open,
  anchorEl,
  onClose,
  user,
  onProfileClick,
  onChangePasswordClick,
  onResetKioskPinClick,
  onLogout,
  isLoggingOut = false,
}) => {
  const isMobileLayout = useMediaQuery("(max-width: 767px)");
  const [imageError, setImageError] = React.useState(false);
  const profilePhoto = user?.profile?.photo?.trim?.() || "";

  React.useEffect(() => {
    setImageError(false);
  }, [profilePhoto]);

  return (
    <>
      <ProfilePopoverBackdrop open={open} onClose={onClose} />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={
          isMobileLayout
            ? { vertical: "top", horizontal: "left" }
            : { vertical: "center", horizontal: "right" }
        }
        transformOrigin={
          isMobileLayout
            ? { vertical: "bottom", horizontal: "left" }
            : { vertical: "center", horizontal: "left" }
        }
        PaperProps={{
          className: isMobileLayout
            ? "!mb-3 !ml-0 !rounded-lg !shadow-lg !min-w-[200px] !max-w-[min(280px,calc(100vw-24px))]"
            : "!ml-4 !-mt-5 !rounded-lg !shadow-lg !min-w-[180px] !max-w-[280px]",
          style: { zIndex: 1100 },
        }}
        slotProps={{
          root: {
            onClick: (e: React.MouseEvent) => e.stopPropagation(),
          },
        }}
      >
        <Box className="p-4">
          <Box className="flex items-start justify-between mb-4">
            <Box className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-full bg-transparent flex items-center justify-center overflow-hidden">
                {profilePhoto && !imageError ? (
                  <img
                    src={profilePhoto}
                    alt={user?.name || "User"}
                    className="w-full h-full object-cover rounded-full"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <ProfileIcon />
                )}
              </div>
              <Box>
                <Typography className="!font-semibold !text-sm !text-gray-900">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.name || "User"}
                </Typography>
                <Typography className="!text-xs !text-gray-500">
                  {user?.email || user?.user?.email || ""}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={onClose} className="!p-1">
              <Box className="">
                <CloseIcon className="w-3.5 h-3.5" />
              </Box>
            </IconButton>
          </Box>

          <Box className="space-y-1">
            <button
              onClick={onProfileClick}
              className="w-full text-left cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-3"
            >
              <UserIcon />
              Profile
            </button>
            <button
              onClick={onChangePasswordClick}
              className="w-full text-left cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-3"
            >
              <LockPassword />
              Change Password
            </button>
            <button
              onClick={onResetKioskPinClick}
              className="w-full text-left cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-3"
            >
              <PasswordIcon />
              Reset Kiosk PIN
            </button>
            <button
              onClick={onLogout}
              disabled={isLoggingOut}
              className={`w-full text-left cursor-pointer px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center gap-3 ${
                isLoggingOut ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {isLoggingOut ? (
                <CircularProgress size={16} className="!text-red-600" />
              ) : (
                <LogoutIcon />
              )}
              {isLoggingOut ? "Logging out..." : "Log Out"}
            </button>
          </Box>
        </Box>
      </Popover>
    </>
  );
};
