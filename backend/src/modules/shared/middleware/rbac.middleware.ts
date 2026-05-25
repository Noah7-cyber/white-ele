import { Request, Response, NextFunction } from "express";
import { ROLE_PERMISSIONS, Permission, Action } from "../../auth/constants";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { UserRole } from "../entities/EntityEnums";


export interface RBACConfig {
    resource: string;
    action: string;
    allowedRoles?: UserRole[];
    customCheck?: (req: AuthenticatedRequest) => boolean | Promise<boolean>;
    customCheckOverrides?: boolean;
}

export class RBACService {

    static checkPermission(userRole: UserRole, resource: string, action: string): boolean {
        console.log(`[RBAC] checkPermission start: role=${userRole}, resource=${resource}, action=${action}`);
        const permissions = ROLE_PERMISSIONS[userRole];

        if (!permissions) {
            console.log(`[RBAC] No permissions found for role ${userRole}. Available roles: ${Object.keys(ROLE_PERMISSIONS).join(", ")}`);
            return false;
        }

        if (userRole === UserRole.SUPER_ADMIN) {
            console.log(`[RBAC] Super Admin detected, allowing all.`);
            return true;
        }

        const resourceActions = permissions[resource];
        if (!resourceActions) {
            console.log(`[RBAC] No actions found for resource ${resource} for role ${userRole}. Available resources for this role: ${Object.keys(permissions).join(", ")}`);
            return false;
        }

        const hasPermission = resourceActions.includes(action as Action);
        console.log(`[RBAC] checkPermission: role=${userRole}, resource=${resource}, action=${action} => ${hasPermission}. Allowed actions: ${resourceActions.join(", ")}`);
        return hasPermission;
    }

    static getUserPermissions(userRole: UserRole): Permission {
        return ROLE_PERMISSIONS[userRole] || {};
    }

    static checkOwnership(req: AuthenticatedRequest, resourceUserId: number): boolean {
        return req.user?.id === resourceUserId;
    }


    static checkRoleHierarchy(managerRole: UserRole, targetRole: UserRole): boolean {
        const roleHierarchy = {
            [UserRole.SUPER_ADMIN]: 6,
            [UserRole.ADMIN]: 5,
            [UserRole.STAFF]: 4,
            [UserRole.PARENT]: 2,
            [UserRole.STUDENT]: 1,
        };

        return roleHierarchy[managerRole] > roleHierarchy[targetRole];
    }
}

export const requirePermission = (config: RBACConfig) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as AuthenticatedRequest;

            if (!authReq.user) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                    code: "AUTHENTICATION_REQUIRED",
                });
                return;
            }

            if (config.customCheck && config.customCheckOverrides) {
                const customResult = await config.customCheck(authReq);
                if (customResult) {
                    next();
                    return;
                }
            }

            const bypass = req.rbacEnumBypass;
            const bypassMatches =
              !!bypass && bypass.resource === config.resource && bypass.action === config.action;

            if (bypassMatches) {
                console.log(
                  `[RBAC] enum bypass matched: user=${authReq.user.id}, role=${authReq.user.role}, resource=${config.resource}, action=${config.action}`,
                );
            }

            const hasPermission = bypassMatches || RBACService.checkPermission(authReq.user.role, config.resource, config.action);
            
            console.log(`[RBAC] requirePermission: user=${authReq.user.id}, role=${authReq.user.role}, resource=${config.resource}, action=${config.action}, hasPermission=${hasPermission}`);
            if (config.customCheck) {
                console.log(`[RBAC] customCheck present for ${config.resource}:${config.action}, overrides=${config.customCheckOverrides}`);
            }

            if (!hasPermission) {
                if (config.customCheck && !config.customCheckOverrides) {
                    console.log(`[RBAC] static check failed, running non-overriding customCheck`);
                    const customResult = await config.customCheck(authReq);
                    console.log(`[RBAC] non-overriding customCheck result: ${customResult}`);
                    if (!customResult) {
                        res.status(403).json({
                            success: false,
                            message: `Access denied. Required permission: ${config.action} on ${config.resource}`,
                            code: "INSUFFICIENT_PERMISSIONS",
                        });
                        return;
                    }
                } else {
                    console.log(`[RBAC] static check failed and no overriding customCheck passed (or overrides enabled but customCheck failed)`);
                    res.status(403).json({
                        success: false,
                        message: `Access denied. Required permission: ${config.action} on ${config.resource}`,
                        code: "INSUFFICIENT_PERMISSIONS",
                    });
                    return;
                }
            }

            // Run custom check if provided and not already run
            if (config.customCheck && !config.customCheckOverrides) {
                const customResult = await config.customCheck(authReq);
                if (!customResult) {
                    res.status(403).json({
                        success: false,
                        message: "Access denied by custom authorization rule",
                        code: "CUSTOM_AUTHORIZATION_FAILED",
                    });
                    return;
                }
            }

            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Authorization check failed",
                code: "AUTHORIZATION_ERROR",
            });
        }
    };
};

/**
 * Middleware to require ownership of a resource
 */
export const requireOwnership = (userIdParam: string = "userId") => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const authReq = req as AuthenticatedRequest;

        if (!authReq.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
                code: "AUTHENTICATION_REQUIRED",
            });
            return;
        }

        const resourceUserIdParam = req.params[userIdParam] || req.body[userIdParam];

        if (!resourceUserIdParam) {
            res.status(400).json({
                success: false,
                message: `Missing ${userIdParam} parameter`,
                code: "MISSING_PARAMETER",
            });
            return;
        }

        // Convert to number for comparison
        const resourceUserId = typeof resourceUserIdParam === "string" ? parseInt(resourceUserIdParam) : resourceUserIdParam;

        // Super admin and admin can access any resource
        if (authReq.user.role === UserRole.SUPER_ADMIN || authReq.user.role === UserRole.ADMIN) {
            next();
            return;
        }

        // Check ownership
        if (!RBACService.checkOwnership(authReq, resourceUserId)) {
            res.status(403).json({
                success: false,
                message: "You can only access your own resources",
                code: "OWNERSHIP_REQUIRED",
            });
            return;
        }

        next();
    };
};



/**
 * Middleware to check role hierarchy for user management
 */
export const requireRoleHierarchy = (targetRoleParam: string = "role") => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const authReq = req as AuthenticatedRequest;

        if (!authReq.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
                code: "AUTHENTICATION_REQUIRED",
            });
            return;
        }

        const targetRole = req.params[targetRoleParam] || req.body[targetRoleParam];

        if (!targetRole) {
            res.status(400).json({
                success: false,
                message: `Missing ${targetRoleParam} parameter`,
                code: "MISSING_PARAMETER",
            });
            return;
        }

        // Check if user can manage the target role
        if (!RBACService.checkRoleHierarchy(authReq.user.role, targetRole as UserRole)) {
            res.status(403).json({
                success: false,
                message: "Insufficient role level to perform this action",
                code: "INSUFFICIENT_ROLE_LEVEL",
            });
            return;
        }

        next();
    };
};

/**
 * Role-gated middleware for admin/super-admin only.
 * This is intentionally role-based (not permission-key based) because the permissions map
 * does not define a canonical "users" resource.
 */
export const requireAdminOrHigher = (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
        res.status(401).json({
            success: false,
            message: "Authentication required",
            code: "AUTHENTICATION_REQUIRED",
        });
        return;
    }

    const role = authReq.user.role as UserRole;
    if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
        res.status(403).json({
            success: false,
            message: "Admin privileges required",
            code: "INSUFFICIENT_PERMISSIONS",
        });
        return;
    }

    next();
};

