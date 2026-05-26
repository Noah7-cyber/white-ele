import { useMemo } from "react";
import { useRolesList } from "../../DashboardRolesPermissionSetting/hooks/useRoles";
import {
  SYSTEM_SUPER_ADMIN_ROLE_NAME,
  sortRolesWithSuperAdminFirst,
} from "../../DashboardRolesPermissionSetting/roles.constants";
import type { RoleSummary } from "@/services/roles.service";

export function useSchoolRoleOptions() {
  const { data, isLoading } = useRolesList();

  const roles = useMemo(
    () => sortRolesWithSuperAdminFirst(data?.data?.roles ?? []),
    [data?.data?.roles],
  );

  const roleOptions = useMemo(
    () =>
      roles.map((role: RoleSummary) => ({
        name: role.name,
        value: String(role.id),
      })),
    [roles],
  );

  const getRoleName = (roleId?: number | null, fallback?: string) => {
    if (roleId == null) return fallback ?? "—";
    const match = roles.find((r) => r.id === roleId);
    return match?.name ?? fallback ?? "—";
  };

  const superAdminRole = useMemo(
    () =>
      roles.find(
        (r) =>
          r.isSystem &&
          r.name.trim().toLowerCase() === SYSTEM_SUPER_ADMIN_ROLE_NAME.toLowerCase(),
      ),
    [roles],
  );

  const defaultRoleId =
    superAdminRole?.id != null ? String(superAdminRole.id) : roles[0]?.id != null ? String(roles[0].id) : "";

  return {
    roles,
    roleOptions,
    getRoleName,
    defaultRoleId,
    isLoadingRoles: isLoading,
  };
}
