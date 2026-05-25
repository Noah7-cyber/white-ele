import type { Request } from "express";
import { AppDataSource } from "../../core/config/database";
import { Action } from "../../auth/constants/role-permissions";
import { UserRoleEntity } from "../entities/UserRole";
import { RolePermission } from "../entities/RolePermission";

export type RbacDbGateResult = { hasCustomRoles: false } | { hasCustomRoles: true; granted: boolean };

type PermissionFlagCol = "create" | "view" | "update" | "delete";

/** Maps `Action` string values to `RolePermission` boolean columns (same four verbs everywhere). */
const ACTION_TO_COLUMN: Record<Action, PermissionFlagCol> = {
  [Action.CREATE]: "create",
  [Action.VIEW]: "view",
  [Action.UPDATE]: "update",
  [Action.DELETE]: "delete",
} as Record<Action, PermissionFlagCol>;

function actionColumn(action: string): PermissionFlagCol | null {
  if (action === Action.CREATE || action === Action.VIEW || action === Action.UPDATE || action === Action.DELETE) {
    return ACTION_TO_COLUMN[action as Action];
  }
  return null;
}

/**
 * Tenant school id: prefer subdomain/header middleware, then authenticated user context.
 */
export function getTenantSchoolId(req: Request): number | undefined {
  const fromReq = (req as any).schoolId;
  if (typeof fromReq === "number" && !Number.isNaN(fromReq)) return fromReq;

  const userSchool = (req as any).user?.schoolId;
  if (typeof userSchool === "number" && !Number.isNaN(userSchool)) return userSchool;

  const headerSchool = req.headers["x-school-id"] || req.headers["X-School-Id"];
  if (headerSchool && !Number.isNaN(parseInt(String(headerSchool), 10))) {
    return parseInt(String(headerSchool), 10);
  }

  return undefined;
}

/**
 * OR across all custom roles for this school: first matching permission row wins.
 */
export async function evaluateCustomRolePermission(
  userId: number,
  schoolId: number,
  resource: string,
  action: string,
): Promise<RbacDbGateResult> {
  const col = actionColumn(action);
  if (!col) return { hasCustomRoles: false };

  const userRoleRepo = AppDataSource.getRepository(UserRoleEntity);
  const links = await userRoleRepo
    .createQueryBuilder("ur")
    .innerJoin("ur.role", "role")
    .where("ur.userId = :userId", { userId })
    .andWhere("role.schoolId = :schoolId", { schoolId })
    .select(["ur.id", "ur.roleId"])
    .getMany();

  const roleIds = Array.from(new Set(links.map((l) => l.roleId).filter((id) => typeof id === "number" && !Number.isNaN(id))));

  if (!roleIds.length) {
    return { hasCustomRoles: false };
  }

  const permRepo = AppDataSource.getRepository(RolePermission);
  const rows = await permRepo
    .createQueryBuilder("rp")
    .where("rp.roleId IN (:...roleIds)", { roleIds })
    .andWhere("rp.resource = :resource", { resource })
    .getMany();

  for (const row of rows) {
    if (row[col]) {
      return { hasCustomRoles: true, granted: true };
    }
  }

  return { hasCustomRoles: true, granted: false };
}
