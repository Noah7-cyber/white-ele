/** Built-in school-scoped role: full permissions, `isSystem: true`, one row per school. */
export const SYSTEM_SCHOOL_SUPER_ADMIN_ROLE_NAME = "Super Admin";

export function isReservedSystemSchoolSuperAdminRoleName(name: string): boolean {
  return String(name || "")
    .trim()
    .toLowerCase() === SYSTEM_SCHOOL_SUPER_ADMIN_ROLE_NAME.toLowerCase();
}
