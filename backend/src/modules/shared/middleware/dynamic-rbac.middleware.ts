import type { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { UserRole } from "../entities/EntityEnums";
import { resolveRbacIntent, getApiV1RelativePath, isPublicApiPath } from "./rbac-route-registry";
import { evaluateCustomRolePermission, getTenantSchoolId } from "../services/runtime-rbac.service";

/**
 * Runs after authentication. If the user has custom school roles, enforces DB permissions for the inferred route intent.
 * If no custom roles exist for this school, skips (legacy enum RBAC on routes applies).
 */
export async function dynamicRbacMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  delete req.rbacEnumBypass;

  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      next();
      return;
    }

    if (authReq.user.role === UserRole.SUPER_ADMIN) {
      next();
      return;
    }

    const rel = getApiV1RelativePath(req);
    if (isPublicApiPath(rel)) {
      next();
      return;
    }

    const schoolId = getTenantSchoolId(req);
    const intent = resolveRbacIntent(req);

    if (!schoolId || !intent) {
      next();
      return;
    }

    const gate = await evaluateCustomRolePermission(authReq.user.id, schoolId, intent.resource, intent.action);

    if (!gate.hasCustomRoles) {
      next();
      return;
    }

    if (gate.granted) {
      req.rbacEnumBypass = { resource: intent.resource, action: intent.action };
      console.log(
        `[DynamicRBAC] bypass enum map: user=${authReq.user.id}, role=${authReq.user.role}, schoolId=${schoolId}, resource=${intent.resource}, action=${intent.action}`,
      );
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: `Access denied. Required permission: ${intent.action} on ${intent.resource}`,
      code: "INSUFFICIENT_PERMISSIONS",
    });
  } catch (error) {
    next(error);
  }
}
