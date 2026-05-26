import { RolePermissionAction } from "@/services/roles.service";

export const SYSTEM_SUPER_ADMIN_ROLE_NAME = "Super Admin";

export function isSuperAdminRole(role?: { name?: string; isSystem?: boolean } | null): boolean {
  if (!role) return false;
  const name = String(role.name || "")
    .trim()
    .toLowerCase();
  return role.isSystem === true && name === SYSTEM_SUPER_ADMIN_ROLE_NAME.toLowerCase();
}

export function isCustomRole(role?: { isSystem?: boolean } | null): boolean {
  return Boolean(role && !role.isSystem);
}

export function sortRolesWithSuperAdminFirst<T extends { name?: string; isSystem?: boolean }>(
  roles: T[],
): T[] {
  return [...roles].sort((a, b) => {
    const aIsSuper = isSuperAdminRole(a);
    const bIsSuper = isSuperAdminRole(b);
    if (aIsSuper && !bIsSuper) return -1;
    if (!aIsSuper && bIsSuper) return 1;
    return String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, {
      sensitivity: "base",
    });
  });
}

export const ACTION_LABELS: Record<RolePermissionAction, string> = {
  view: "View",
  update: "Edit",
  create: "Create",
  delete: "Delete",
};

export const PERMISSION_ACTIONS: RolePermissionAction[] = ["view", "update", "create", "delete"];

export type PermissionGroup = {
  id: string;
  label: string;
  resources: string[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  { id: "dashboard", label: "Dashboard", resources: ["analytics", "user-stats"] },
  { id: "children-profiles", label: "Children Profiles", resources: ["student"] },
  { id: "parent", label: "Parent", resources: ["parent"] },
  { id: "classrooms", label: "Classrooms", resources: ["classroom", "classroom-activity"] },
  { id: "admission", label: "Admission", resources: ["event", "invitation"] },
  { id: "attendance", label: "Attendance", resources: ["attendance"] },
  { id: "learnings", label: "Learnings", resources: ["curriculum", "assessment"] },
  { id: "staff", label: "Staff", resources: ["staff"] },
  { id: "communication", label: "Communication", resources: ["announcement", "messaging", "notification"] },
  {
    id: "school-account",
    label: "School & Account",
    resources: ["school", "profile", "account", "upload", "activity-log", "country"],
  },
];
