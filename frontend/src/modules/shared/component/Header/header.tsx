"use client";

import React from "react";
import Notifications from "../../../admin/component/Notifications/notifications";
import SearchMenu from "../../../../components/SearchMenu/searchMenu";

import SearchIcon from "@mui/icons-material/Search";
import { CWPopover } from "../Popover";
import { Box, Typography } from "@mui/material";
import StaffSearchMenu from "@/modules/staff/component/StaffSearchMenu/staffSearchMenu";
import ParentSearchMenu from "@/modules/parent/component/ParentSearchMenu/parentSearchMenu";
import { usePathname, useRouter } from "next/navigation";
import {
  VALID_GENERAL_SEARCH_URL,
  adminSidebarItems,
  staffSidebarItems,
  parentSidebarItems,
} from "@/constants";
import { SidebarItemProps } from "@/constants";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { StaffRoutes } from "@/routes/staff.routes";
import { ParentRoutes } from "@/routes/parent.routes";
import AddIcon from "@mui/icons-material/Add";
import FilterIcon from "@/modules/shared/assets/svgs/filter.svg";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { usePermissionGuide } from "@/utils/hooks/usePermissionGuide";

interface HeaderProps {
  role: "admin" | "staff" | "parent";
  onHamburgerClick?: () => void;
  showNotifications?: boolean;
}

const getRoleItems = (role: "admin" | "staff" | "parent"): SidebarItemProps[] => {
  if (role === "admin") return adminSidebarItems;
  if (role === "staff") return staffSidebarItems;
  return parentSidebarItems;
};

const getPageLabel = (pathname: string, role: "admin" | "staff" | "parent"): string => {
  const items = getRoleItems(role);
  for (const item of items) {
    if (item.matchPaths?.some((p) => pathname.startsWith(p))) return item.label;
    if (item.path && pathname.startsWith(item.path)) return item.label;
  }
  return "";
};

// Map: pathname prefix → route to navigate to on plus click
const PLUS_PAGE_MAP: Record<string, string> = {
  [DashboardRoutes.children]: DashboardRoutes.addChildren,
  [DashboardRoutes.teachers]: DashboardRoutes.addTeacher,
  [DashboardRoutes.classRooms]: DashboardRoutes.addClassroom,
  [DashboardRoutes.announcement]: DashboardRoutes.createAnnouncement,
  // Staff equivalents
  [StaffRoutes.children]: StaffRoutes.addChildren,
  [StaffRoutes.announcement]: StaffRoutes.createAnnouncement,
};

// Pages where plus should dispatch a custom event (bottom drawer) instead of navigating
const PLUS_DISPATCH_MAP: Record<string, string> = {
  [DashboardRoutes.invoices]: "open-invoices-add",
  [DashboardRoutes.learningMilestones]: "open-learning-add",
  [DashboardRoutes.learningSubjects]: "open-learning-add",
  [DashboardRoutes.learningCurriculum]: "open-learning-add",
  [DashboardRoutes.learningReport]: "open-learning-add",
  [StaffRoutes.milestones]: "open-learning-add",
  [StaffRoutes.subjects]: "open-learning-add",
  [DashboardRoutes.messaging]: "open-new-message",
  [StaffRoutes.messaging]: "open-new-message",
  [ParentRoutes.messaging]: "open-new-message",
};

const getPlusRoute = (pathname: string): string | null => {
  for (const prefix of Object.keys(PLUS_PAGE_MAP)) {
    if (pathname.startsWith(prefix)) return PLUS_PAGE_MAP[prefix];
  }
  return null;
};

const getDispatchEvent = (pathname: string): string | null => {
  for (const prefix of Object.keys(PLUS_DISPATCH_MAP)) {
    if (pathname.startsWith(prefix)) return PLUS_DISPATCH_MAP[prefix];
  }
  return null;
};

const shouldHidePlusIcon = (pathname: string): boolean => {
  return (
    /^\/admin\/rooms\/classes\/[^/]+\/view(?:\/)?$/.test(pathname) ||
    /^\/staff\/rooms\/classes\/[^/]+\/view(?:\/)?$/.test(pathname)
  );
};

export const Header: React.FC<HeaderProps> = ({
  role,
  onHamburgerClick,
  showNotifications = true,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pathname: any = usePathname();
  const router = useRouter();
  const { canAccessPath, isLoading: isPermissionLoading } = usePermissionGuide({
    enabled: role === "admin",
  });
  const isPageWithGeneralSearch = VALID_GENERAL_SEARCH_URL.includes(pathname);
  const pageLabel = getPageLabel(pathname, role);
  const plusRoute = shouldHidePlusIcon(pathname) ? null : getPlusRoute(pathname);
  const dispatchEventName = shouldHidePlusIcon(pathname) ? null : getDispatchEvent(pathname);
  const canUseCreateEntryPoint =
    role !== "admin" ||
    isPermissionLoading ||
    (plusRoute ? canAccessPath(plusRoute) : dispatchEventName ? canAccessPath(pathname, "create") : true);
  // const shouldHideHeaderOnMobile =
  //   role === "parent" && /^\/parent\/children\/[^/]+(?:\/.*)?$/.test(pathname);
  const isActivitiesPage =
    pathname?.includes("/rooms/activities") || pathname?.startsWith(StaffRoutes.activities);
  const isToursPage = pathname === "/admin/admission/tours";
  const isReportsPage = pathname?.includes("/reports");
  const isStaffClassroomPage =
    role === "staff" &&
    (pathname === StaffRoutes.classRooms || pathname?.startsWith(`${StaffRoutes.classRooms}/`));

  return (
    <header className="flex w-full items-center py-4 px-4 md:px-12 bg-white">
      {/* Mobile: hamburger button */}
      <button
        className="md:hidden shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={onHamburgerClick}
        aria-label="Toggle sidebar"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile: page name — 16px (ml-4) gap from hamburger */}
      {pageLabel && (
        <span className="md:hidden ml-4 text-sm font-semibold text-black shrink-0">
          {pageLabel}
        </span>
      )}

      {/* Desktop: search */}
      {isPageWithGeneralSearch && (
        <div className="hidden md:block">
          <CWPopover
            actionComponent={
              <div className="text-black! flex flex-row gap-2 items-center font-normal!">
                <SearchIcon className="text-mediumGray p-0.5" />
                <Typography className="font-normal! text-sm! text-grey-5!">Search here</Typography>
              </div>
            }
            buttonProps={{
              className:
                "!font-medium !text-white py-3 !bg-header-gray max-w-md w-full px-4 !rounded-lg gap-x-1 2xl:!text-base !text-sm !flex !items-start !justify-start !h-[35px] !max-h-[35px]",
            }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
          >
            {(closePopover) => (
              <Box paddingY={1} className="p-4 max-w-lg">
                {role === "admin" ? (
                  <SearchMenu onClose={closePopover} />
                ) : role === "staff" ? (
                  <StaffSearchMenu onClose={closePopover} />
                ) : (
                  <ParentSearchMenu onClose={closePopover} />
                )}
              </Box>
            )}
          </CWPopover>
        </div>
      )}

      {/* Flex spacer — pushes notifications to the far right */}
      <div className="flex-1" />

      {/* Mobile: dispatch event for invoice/learning, plus nav for others, notifications fallback */}
      {!showNotifications ? null : isActivitiesPage && role === "staff" ? (
        <button
          className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
          onClick={() => window.dispatchEvent(new CustomEvent("open-activities-filter"))}
          aria-label="Open activities menu"
        >
          <MoreHorizIcon className="text-[#667185] w-5 h-5" fontSize="small" />
        </button>
      ) : isActivitiesPage ? (
        <button
          className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
          onClick={() => window.dispatchEvent(new CustomEvent("open-activities-filter"))}
          aria-label="Open filter"
        >
          <FilterIcon className="text-[#667185] w-5 h-5 !scale-125" />
        </button>
      ) : isReportsPage ? (
        <button
          className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
          onClick={() => window.dispatchEvent(new CustomEvent("open-reports-filter"))}
          aria-label="Open filter"
        >
          <FilterIcon className="text-[#667185] w-5 h-5 !scale-125" />
        </button>
      ) : isStaffClassroomPage ? (
        <button
          type="button"
          className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
          onClick={() => window.dispatchEvent(new CustomEvent("open-staff-classroom-filter"))}
          aria-label="Filter classrooms"
        >
          <FilterIcon className="text-[#667185] w-5 h-5 !scale-125" />
        </button>
      ) : isToursPage && canUseCreateEntryPoint ? (
        <button
          className="md:hidden rounded-full border border-black hover:bg-gray-100 transition-colors w-8 h-8 flex items-center justify-center shrink-0"
          onClick={() => window.dispatchEvent(new CustomEvent("open-tours-add"))}
          aria-label="Create new"
        >
          <AddIcon className="text-black" fontSize="small" />
        </button>
      ) : dispatchEventName && canUseCreateEntryPoint ? (
        <button
          className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
          onClick={() => window.dispatchEvent(new CustomEvent(dispatchEventName))}
          aria-label="Add new"
        >
          <AddIcon className="text-gray-700" fontSize="small" />
        </button>
      ) : plusRoute && canUseCreateEntryPoint ? (
        <button
          className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
          onClick={() => router.push(plusRoute)}
          aria-label="Add new"
        >
          <AddIcon className="text-gray-700" fontSize="small" />
        </button>
      ) : (
        <div className="md:hidden">
          <Notifications />
        </div>
      )}

      {/* Desktop: always show notifications */}
      <div className={showNotifications ? "hidden md:block" : "hidden"}>
        <Notifications />
      </div>
    </header>
  );
};
