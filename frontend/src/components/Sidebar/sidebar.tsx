/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarItemProps } from "@/constants";
import SchoolLogo from "@/modules/shared/assets/svgs/school-logo.svg";
import AdminLogo from "@/modules/shared/assets/svgs/admin-logo.svg";
import StaffLogo from "@/modules/shared/assets/svgs/staff.svg";
import ParentLogo from "@/modules/shared/assets/svgs/parent-logo.svg";
import ProfileIcon from "@/modules/shared/assets/svgs/Profile.svg";
import Link from "next/link";
import { ParentProfilePopover } from "./components/ParentProfilePopover";
import { StaffProfilePopover } from "./components/StaffProfilePopover";
import { AdminProfilePopover } from "./components/AdminProfilePopover";
import { ParentModals } from "./components/ParentModals";
import { AdminModals } from "./components/AdminModals";
import { StaffModals } from "./components/StaffModals";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import useSidebar from "./hook/useSidebar";
import TrashIcon from "@/modules/shared/assets/svgs/logout-mobile.svg";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

const SidebarItems: React.FC<SidebarItemProps> = ({
  id,
  label,
  icon,
  arrowIcon,
  isActive,
  isExpanded,
  subItems,
  pathname,
  path,
}) => {
  const href = path || "#";

  return (
    <li
      key={id}
      className={`mb-2 transition-all duration-200 ${
        isActive && !subItems
          ? "bg-brandColor-active text-white rounded-lg"
          : "hover:bg-gray-50 rounded-lg"
      }`}
    >
      <Link
        href={href}
        className="flex items-center justify-between px-3 py-2"
        onClick={
          arrowIcon && subItems
            ? (e: { preventDefault: () => any }) => e.preventDefault()
            : undefined
        }
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center justify-center w-6 h-6 ${
              isActive && !subItems
                ? "text-white [&>*]:filter [&>*]:brightness-0 [&>*]:invert"
                : "text-gray-600"
            }`}
          >
            {icon && <span className="text-lg">{icon}</span>}
          </div>
          <span
            className={`!text-sm font-normal ${
              isActive && !subItems ? "text-white !font-medium" : "text-gray-700"
            }`}
          >
            {label}
          </span>
        </div>

        {arrowIcon && (
          <div
            className={`transition-transform duration-200 ${
              isExpanded && subItems ? "rotate-90" : ""
            } ${isActive && !subItems ? "text-white [&>*]:filter [&>*]:brightness-0 [&>*]:invert" : "text-gray-400"}`}
          >
            {arrowIcon}
          </div>
        )}
      </Link>

      {subItems && subItems.length > 0 && (
        <div
          className={`relative transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          } overflow-hidden`}
        >
          <ul className="ml-6 space-y-1 pb-2">
            {subItems.map((sub) => (
              <li key={sub.id}>
                <Link
                  href={sub.path || "#"}
                  className={`p-2 flex items-center gap-3 rounded-lg text-sm transition-colors ${
                    pathname === sub.path
                      ? "bg-teal-50 text-teal-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {sub.subIcon && <span className="text-gray-500">{sub.subIcon}</span>}
                  <span className="text-sm">{sub.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

interface SidebarProps {
  role: "admin" | "staff" | "parent";
  isOpen?: boolean;
  onClose?: () => void;
  hideContent?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role: roleProp,
  isOpen = false,
  onClose,
  hideContent = false,
}) => {
  const {
    changePasswordModalOpen,
    resetKioskPinModalOpen,
    user,
    open,
    role,
    handleChangePasswordClick,
    handleLogout,
    handleNotificationPreferencesClick,
    handlePopoverClose,
    handleProfileClick,
    handleProfilePageClick,
    handleResetKioskPinClick,
    setChangePasswordModalOpen,
    setResetKioskPinModalOpen,
    isProfileActive,
    expandedItems,
    isActivePath,
    toggleExpanded,
    roleBasedItems,
    anchorEl,
    logoutConfirmOpen,
    setLogoutConfirmOpen,
    confirmLogout,
    isLoggingOut,
  } = useSidebar({ role: roleProp });
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [profileImageError, setProfileImageError] = React.useState(false);
  const profilePhoto = user?.profile?.photo || "";

  React.useEffect(() => {
    setProfileImageError(false);
  }, [profilePhoto]);
  // Listen for event to open reset PIN modal from parent or staff home page
  React.useEffect(() => {
    const handleOpenResetKioskPinModal = () => {
      if (role === "parent" || role === "staff") {
        setResetKioskPinModalOpen(true);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("openResetKioskPinModal", handleOpenResetKioskPinModal);
      return () => {
        window.removeEventListener("openResetKioskPinModal", handleOpenResetKioskPinModal);
      };
    }
  }, [role, setResetKioskPinModalOpen]);

  // Listen for event to open change password modal (e.g. first login when tempPassword is true)
  React.useEffect(() => {
    const handleOpenChangePasswordModal = () => {
      if (role === "parent" || role === "staff") {
        setChangePasswordModalOpen(true);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("openChangePasswordModal", handleOpenChangePasswordModal);
      return () => {
        window.removeEventListener("openChangePasswordModal", handleOpenChangePasswordModal);
      };
    }
  }, [role, setChangePasswordModalOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`w-64 bg-white flex 
        flex-col overflow-hidden border-r border-border-light
          fixed top-0 left-0 z-50 h-[100dvh] transition-transform duration-300 ease-in-out
          md:relative md:z-auto md:h-full md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className={`${role === "parent" ? "py-6 px-6" : "p-6"}`}>
          <div className="flex flex-col font-bold text-sm text-brandColor-active">
            <div className="flex gap-1 items-center">
              <SchoolLogo />{" "}
              {role === "admin" && (
                <div className="">
                  <AdminLogo />
                </div>
              )}
              {role === "staff" && (
                <div className="">
                  <StaffLogo />
                </div>
              )}
              {role === "parent" && (
                <div className="">
                  <ParentLogo />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 px-2 sm:px-4 overflow-y-auto">
          <ul className={hideContent ? "hidden" : "space-y-1"}>
            {roleBasedItems.map((item, index) => (
              <div key={item.id} onClick={() => {
                if(isMobile && item?.path){
                  onClose?.()
                }
              }}>
                <SidebarItems
                  {...item}
                  isActive={isActivePath(item)}
                  onClick={() => router.push(item.path)}
                  isExpanded={expandedItems.has(item.id)}
                  onToggle={() => toggleExpanded(item.id)}
                  subItems={item?.subItems}
                  pathname={pathname}
                />
                {role === "parent"
                  ? index === 2 && <div className="my-4 border-t border-border-light"></div>
                  : role === "staff"
                    ? (index === 2 || index === 5) && (
                        <div className="my-4 border-t border-border-light"></div>
                      )
                    : (index === 3 || index === 7) && (
                        <div className="my-4 border-t border-border-light"></div>
                      )}
              </div>
            ))}
            <li className="mb-2 md:hidden">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-3 py-2 transition-all duration-200 hover:bg-red-50 rounded-lg text-red-500"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-5 h-5 text-red-500">
                    <TrashIcon />
                  </div>
                  <span className="!text-sm font-medium">Log Out</span>
                </div>
              </button>
            </li>
          </ul>
        </div>

        <div
          className={`${role === "admin" ? "p-4 pb-6 relative" : "p-4 pb-6 relative"} ${
            hideContent ? "hidden" : ""
          }`}
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          <div
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              (role === "parent" || role === "admin" || role === "staff") && isProfileActive
                ? "bg-brandColor-active"
                : "bg-dashboard-bg hover:bg-gray-100"
            }`}
            onClick={(event) => {
              handleProfileClick(event, { isMobile })
            }}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                (role === "parent" || role === "admin" || role === "staff") && isProfileActive
                  ? "bg-brandColor-active"
                  : "bg-gray-300"
              }`}
            >
              {profilePhoto && !profileImageError ? (
                <img
                  src={profilePhoto}
                  alt={user?.name || "User"}
                  className="w-full h-full object-cover rounded-full"
                  onError={() => setProfileImageError(true)}
                />
              ) : (
                <ProfileIcon
                  className={
                    (role === "admin" || role === "parent" || role === "staff") && isProfileActive
                      ? "text-white"
                      : ""
                  }
                />
              )}
            </div>
            <div className="flex-1">
              <div
                className={`text-sm font-medium ${
                  (role === "parent" || role === "admin" || role === "staff") && isProfileActive
                    ? "text-white"
                    : "text-gray-900"
                }`}
              >
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.name || "Loading User"}
              </div>
            </div>
            <div
              className={
                (role === "parent" || role === "admin" || role === "staff") && isProfileActive
                  ? "text-white"
                  : "text-gray-400"
              }
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                />
              </svg>
            </div>
          </div>

          {role === "parent" && (
            <ParentProfilePopover
              open={open}
              anchorEl={anchorEl}
              onClose={handlePopoverClose}
              user={user}
              onProfileClick={handleProfilePageClick}
              onChangePasswordClick={handleChangePasswordClick}
              onResetKioskPinClick={handleResetKioskPinClick}
              onNotificationPreferencesClick={handleNotificationPreferencesClick}
              onLogout={handleLogout}
              isLoggingOut={isLoggingOut}
            />
          )}

          {role === "staff" && (
            <StaffProfilePopover
              open={open}
              anchorEl={anchorEl}
              onClose={handlePopoverClose}
              user={user}
              onProfileClick={handleProfilePageClick}
              onChangePasswordClick={handleChangePasswordClick}
              onResetKioskPinClick={handleResetKioskPinClick}
              onLogout={handleLogout}
              isLoggingOut={isLoggingOut}
            />
          )}
          {role === "admin" && (
            <AdminProfilePopover
              open={open}
              anchorEl={anchorEl}
              onClose={handlePopoverClose}
              user={user}
              onProfileClick={handleProfilePageClick}
              onChangePasswordClick={handleChangePasswordClick}
              onLogout={handleLogout}
              isLoggingOut={isLoggingOut}
            />
          )}
        </div>
      </aside>

      {role === "parent" && (
        <ParentModals
          changePasswordModalOpen={changePasswordModalOpen}
          resetKioskPinModalOpen={resetKioskPinModalOpen}
          onCloseChangePassword={() => setChangePasswordModalOpen(false)}
          onCloseResetKioskPin={() => setResetKioskPinModalOpen(false)}
        />
      )}

      {role === "admin" && (
        <AdminModals
          changePasswordModalOpen={changePasswordModalOpen}
          onCloseChangePassword={() => setChangePasswordModalOpen(false)}
        />
      )}

      {role === "staff" && (
        <StaffModals
          changePasswordModalOpen={changePasswordModalOpen}
          resetKioskPinModalOpen={resetKioskPinModalOpen}
          onCloseChangePassword={() => setChangePasswordModalOpen(false)}
          onCloseResetKioskPin={() => setResetKioskPinModalOpen(false)}
        />
      )}

      <ConfirmModal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={confirmLogout}
        title="Are you sure you want to log out?"
        description="You’ll be signed out of your account and redirected to the login page."
        confirmLabel="Log out"
        confirmLabelClassName="!bg-[#D92D20]"
        cancelLabel="Cancel"
        loading={isLoggingOut}
      />
    </>
  );
};
