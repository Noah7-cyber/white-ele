/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/store/slices/authSlice";
import {
  lowerSidebarItems,
  staffSidebarItems,
  parentSidebarItems,
  SidebarItemProps,
  adminSidebarItems,
} from "@/constants";

import { authServices } from "@/services/auth.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { profileServices, type ProfileResponse } from "@/services/profile.service";
import { AuthRoutes } from "@/routes/auth.routes";
import { ParentRoutes } from "@/routes/parent.routes";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { StaffRoutes } from "@/routes/staff.routes";
import { showToast } from "@/modules/shared/component/Toast";
import { clearAuthCookies, redirectToAuthRoute } from "@/utils/helper";
import { usePermissionGuide } from "@/utils/hooks/usePermissionGuide";

interface SidebarProps {
  role: "admin" | "staff" | "parent";
}
const useSidebar = ({ role: roleProp }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string | number>>(new Set());
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [resetKioskPinModalOpen, setResetKioskPinModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const dispatch = useDispatch();
  const { canAccessPath, isLoading: isPermissionLoading } = usePermissionGuide({
    enabled: roleProp === "admin",
  });

  const { data: profileData } = useQueryService<Record<string, never>, ProfileResponse>({
    service: profileServices.getProfile,
    options: {
      keys: ["profile", "sidebar"],
    },
  });

  const user = profileData?.data?.user;
  // Sync the fetched profile user into Redux so any hook/component that reads
  // state.auth.user (e.g. useChatModal) gets the real user with a numeric id.
  useEffect(() => {
    if (user) {
      dispatch(setUser(user as any));
    }
  }, [user, dispatch]);

  const { mutateAsync: logoutAsync, isPending } = useMutationService({
    service: authServices.logout,
    options: {
      disableToast: true, // We'll handle toast manually
    },
  });

  const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Prevent multiple logout attempts
    if (isLoggingOut || isPending) {
      return;
    }

    setLogoutConfirmOpen(true);
  };

  const confirmLogout = async () => {
    // Prevent multiple logout attempts
    if (isLoggingOut || isPending) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logoutAsync({});

      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      clearAuthCookies();

      showToast({
        message: "Logged out successfully",
        severity: "success",
        duration: 1500,
      });
      setLogoutConfirmOpen(false);
      handlePopoverClose();
      setTimeout(() => {
        if (redirectToAuthRoute(AuthRoutes.selectRole)) return;
        router.push(AuthRoutes.selectRole);
      }, 500);
    } catch (error: any) {
      setIsLoggingOut(false);

      let errorMessage = "Failed to logout. Please try again.";

      if (error?.message) {
        if (error.message.includes("network") || error.message.includes("Network")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
        } else {
          errorMessage = error.message;
        }
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showToast({
        message: "Logout Failed",
        description: errorMessage,
        severity: "error",
        duration: 5000,
      });
    }
  };
  // Route prefix wins so staff/parent shells never show admin nav when profile.role is wrong or stale.
  const role = useMemo((): "admin" | "staff" | "parent" => {
    if (pathname?.startsWith("/staff")) return "staff";
    if (pathname?.startsWith("/parent")) return "parent";
    if (pathname?.startsWith("/admin")) {
      if (user?.role) {
        const userRole = user.role.toLowerCase();
        if (userRole === "admin" || userRole === "staff" || userRole === "parent") {
          return userRole as "admin" | "staff" | "parent";
        }
      }
      return roleProp === "admin" ? "admin" : roleProp || "admin";
    }
    if (user?.role) {
      const userRole = user.role.toLowerCase();
      if (userRole === "admin" || userRole === "staff" || userRole === "parent") {
        return userRole as "admin" | "staff" | "parent";
      }
    }
    return roleProp || "parent";
  }, [user, roleProp, pathname]);

  const handleProfileClick = (
    event: React.MouseEvent<HTMLElement>,
    options?: { isMobile?: boolean },
  ) => {
    if (role === "admin" && options?.isMobile) {
      router.push(DashboardRoutes.profile);
      return;
    }
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handleProfilePageClick = () => {
    if (role === "admin") {
      router.push(DashboardRoutes.profile);
    } else if (role === "staff") {
      router.push(StaffRoutes.profile);
    } else if (role === "parent") {
      router.push(ParentRoutes.profile);
    }
    handlePopoverClose();
  };

  const handleChangePasswordClick = () => {
    handlePopoverClose();
    setChangePasswordModalOpen(true);
  };

  const handleResetKioskPinClick = () => {
    handlePopoverClose();
    setResetKioskPinModalOpen(true);
  };

  const handleNotificationPreferencesClick = () => {
    router.push(`${ParentRoutes.profile}?tab=notifications`);
    handlePopoverClose();
  };

  const roleBasedItems = useMemo(() => {
    const items =
      role === "admin"
        ? adminSidebarItems
        : role === "staff"
          ? staffSidebarItems
          : parentSidebarItems;

    if (role !== "admin" || isPermissionLoading) {
      return items;
    }

    return items.filter((item) => {
      const routeCandidates = [item.path, ...(item.matchPaths ?? [])];
      return routeCandidates.some((path) => canAccessPath(path, "view"));
    });
  }, [canAccessPath, isPermissionLoading, role]);

  function flattenItems(items: any[]) {
    return items.flatMap((item) => [item, ...(item.subItems ?? [])]);
  }

  const allSidebarItems = flattenItems([...roleBasedItems, ...lowerSidebarItems]);

  const isActivePath = (item: SidebarItemProps) => {
    if (item.matchPaths) {
      // Check if pathname matches any of the matchPaths
      const matchesPath = item.matchPaths.some((matchPath) => {
        // For dynamic routes, check if pathname matches the pattern
        if (matchPath.includes(":")) {
          const pattern = matchPath.replace(/:[^/]+/g, "[^/]+");
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(pathname);
        }
        return pathname === matchPath || pathname?.startsWith(matchPath + "/");
      });

      if (matchesPath) return true;
    }

    // Also check if pathname starts with the base path (handles dynamic routes)
    return (
      pathname === item.path ||
      (pathname?.startsWith(item.path + "/") &&
        !allSidebarItems.some(
          (otherItem) =>
            otherItem.path !== item.path &&
            pathname?.startsWith(otherItem.path + "/") &&
            otherItem.path.length > item.path.length,
        ))
    );
  };

  const toggleExpanded = (id: string | number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const open = Boolean(anchorEl);
  const isProfileActive =
    (role === "admin" && pathname === DashboardRoutes.profile) ||
    (role === "staff" && pathname === StaffRoutes.profile) ||
    (role === "parent" && (pathname === ParentRoutes.profile || open));

  return {
    isProfileActive,
    toggleExpanded,
    isActivePath,
    handleChangePasswordClick,
    handleLogout,
    handlePopoverClose,
    handleNotificationPreferencesClick,
    changePasswordModalOpen,
    expandedItems,
    resetKioskPinModalOpen,
    user,
    open,
    anchorEl,
    role,
    handleProfileClick,
    handleResetKioskPinClick,
    handleProfilePageClick,
    setChangePasswordModalOpen,
    setResetKioskPinModalOpen,
    roleBasedItems,
    logoutConfirmOpen,
    setLogoutConfirmOpen,
    confirmLogout,
    isLoggingOut: isLoggingOut || isPending,
  };
};

export default useSidebar;
