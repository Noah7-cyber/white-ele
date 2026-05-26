"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { showToast } from "@/modules/shared/component/Toast";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { authServices } from "@/services/auth.service";
import { useQueryService } from "./useQueryService";
import { useUser } from "./useUser";

export type PermissionAction = "create" | "view" | "update" | "delete";

type UsePermissionGuideOptions = {
  enabled?: boolean;
};

type PermissionActionsMap = Partial<Record<PermissionAction, boolean>>;
type EffectivePermissionsMap = Record<string, PermissionActionsMap>;

type PermissionRequirement = {
  resource: string;
  action: PermissionAction;
};

type EnsurePermissionOptions = {
  resource?: string;
  action: PermissionAction;
  message?: string;
};

type EnsurePermission = {
  (resource: string, action: PermissionAction, message?: string): boolean;
  (options: EnsurePermissionOptions): boolean;
};

type AdminPermissionRule = {
  pattern: RegExp;
  resource: string;
};

const ADMIN_ROUTE_PERMISSION_RULES: AdminPermissionRule[] = [
  { pattern: /^\/admin\/children(?:\/|$)/, resource: "student" },
  { pattern: /^\/admin\/parents(?:\/|$)/, resource: "parent" },
  { pattern: /^\/admin\/teachers(?:\/|$)/, resource: "staff" },
  { pattern: /^\/admin\/rooms\/activities(?:\/|$)/, resource: "classroom-activity" },
  { pattern: /^\/admin\/rooms\/classes(?:\/|$)/, resource: "classroom" },
  { pattern: /^\/admin\/admission(?:\/|$)/, resource: "event" },
  { pattern: /^\/admin\/attendance(?:\/|$)/, resource: "attendance" },
  { pattern: /^\/admin\/communication\/announcement(?:\/|$)/, resource: "announcement" },
  { pattern: /^\/admin\/communication\/messaging(?:\/|$)/, resource: "messaging" },
  { pattern: /^\/admin\/learning\/assessments(?:\/|$)/, resource: "assessment" },
  { pattern: /^\/admin\/learning(?:\/|$)/, resource: "curriculum" },
  { pattern: /^\/admin\/reports(?:\/|$)/, resource: "analytics" },
  { pattern: /^\/admin\/settings\/notifications(?:\/|$)/, resource: "notification" },
  { pattern: /^\/admin\/settings\/public-links(?:\/|$)/, resource: "invitation" },
  { pattern: /^\/admin\/settings\/roles(?:\/|$)/, resource: "account" },
  { pattern: /^\/admin\/settings\/permission(?:\/|$)/, resource: "account" },
  { pattern: /^\/admin\/settings\/security(?:\/|$)/, resource: "account" },
  { pattern: /^\/admin\/settings\/payment-method(?:\/|$)/, resource: "account" },
  { pattern: /^\/admin\/settings\/billings(?:\/|$)/, resource: "account" },
  { pattern: /^\/admin\/settings\/profile(?:\/|$)/, resource: "profile" },
  { pattern: /^\/admin\/billing(?:\/|$)/, resource: "account" },
  { pattern: /^\/admin\/profile(?:\/|$)/, resource: "profile" },
];

const ADMIN_FALLBACK_ROUTES = [
  DashboardRoutes.dashboard,
  DashboardRoutes.children,
  DashboardRoutes.parents,
  DashboardRoutes.teachers,
  DashboardRoutes.classRooms,
  DashboardRoutes.events,
  DashboardRoutes.attendanceChildren,
  DashboardRoutes.learningMilestones,
  DashboardRoutes.messaging,
  DashboardRoutes.invoices,
  DashboardRoutes.reports,
  DashboardRoutes.guides,
  DashboardRoutes.profileSettings,
] as const;

function normalizePathname(pathname?: string | null) {
  return pathname?.split("?")[0].replace(/\/+$/, "") || "";
}

function inferActionFromPath(pathname: string): PermissionAction {
  if (/(?:\/add|\/create)(?:\/|$)/.test(pathname)) return "create";
  if (/(?:\/edit|\/grade)(?:\/|$)/.test(pathname)) return "update";
  return "view";
}

export function getAdminPermissionRequirement(
  pathname?: string | null,
  actionOverride?: PermissionAction,
): PermissionRequirement | null {
  const normalizedPath = normalizePathname(pathname);

  if (
    !normalizedPath ||
    normalizedPath === "/admin" ||
    normalizedPath === DashboardRoutes.dashboard ||
    normalizedPath.startsWith(DashboardRoutes.guides)
  ) {
    return null;
  }

  const matchedRule = ADMIN_ROUTE_PERMISSION_RULES.find(({ pattern }) => pattern.test(normalizedPath));
  if (!matchedRule) return null;

  return {
    resource: matchedRule.resource,
    action: actionOverride ?? inferActionFromPath(normalizedPath),
  };
}

export function usePermissionGuide(options?: UsePermissionGuideOptions) {
  const { user } = useUser();
  const isEnabled = options?.enabled ?? true;

  const { data: { data: permissionsData = {} } = {} as any, isLoading } = useQueryService({
    service: { ...authServices.getUserPermissions, data: { schoolId: user?.roleDetails?.schoolId } },
    options: {
      keys: ["permissions", "guide", String(user?.schoolId) ?? "no-school"],
      enabled: isEnabled && !!user?.roleDetails?.schoolId,
    },
  });

  const effectivePermissions = useMemo<EffectivePermissionsMap>(
    () => permissionsData?.effectivePermissions ?? {},
    [permissionsData?.effectivePermissions],
  );

  const hasPermission = useMemo(
    () => (resource?: string | null, action: PermissionAction = "view") => {
      if (!resource) return true;

      const resourcePermissions = effectivePermissions?.[resource];
      if (!resourcePermissions) return false;

      return Boolean(resourcePermissions[action]);
    },
    [effectivePermissions],
  );

  const canAccessPath = useMemo(
    () => (pathname?: string | null, actionOverride?: PermissionAction) => {
      const requirement = getAdminPermissionRequirement(pathname, actionOverride);
      if (!requirement) return true;

      return hasPermission(requirement.resource, requirement.action);
    },
    [hasPermission],
  );

  const ensurePermission = useMemo<EnsurePermission>(
    () =>
      (
        resourceOrOptions: string | EnsurePermissionOptions,
        actionArg?: PermissionAction,
        messageArg?: string,
      ) => {
        const { resource = "account", action, message } =
          typeof resourceOrOptions === "string"
            ? {
                resource: resourceOrOptions,
                action: actionArg as PermissionAction,
                message: messageArg,
              }
            : resourceOrOptions;

        if (isLoading) {
          showToast({
            message: "Permissions are still loading",
            description: "Please wait a moment and try again.",
            severity: "warning",
          });
          return false;
        }

        if (hasPermission(resource, action)) return true;

        showToast({
          message: "Permission required",
          description: message ?? `You do not have permission to ${action} this ${resource}.`,
          severity: "error",
        });
        return false;
      },
    [hasPermission, isLoading],
  );

  const firstAccessibleAdminPath = useMemo(
    () => ADMIN_FALLBACK_ROUTES.find((path) => canAccessPath(path, "view")) ?? DashboardRoutes.dashboard,
    [canAccessPath],
  );

  return {
    permissionsData,
    effectivePermissions,
    isLoading,
    hasPermission,
    ensurePermission,
    canAccessPath,
    getPathRequirement: getAdminPermissionRequirement,
    firstAccessibleAdminPath,
  };
}
