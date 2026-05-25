import { Response } from "express";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { AUTH_MESSAGES } from "../../auth/constants/messages";
import { rolesService } from "../services/roles.service";

function resolveSchoolId(req: AuthenticatedRequest): number | undefined {
  const contextSchoolId =
    typeof (req as unknown as { schoolId?: number }).schoolId === "number" &&
    !Number.isNaN((req as unknown as { schoolId?: number }).schoolId)
      ? (req as unknown as { schoolId?: number }).schoolId
      : undefined;
  const bodySchoolId =
    typeof req.body?.schoolId === "number" && !Number.isNaN(req.body?.schoolId) ? req.body.schoolId : undefined;
  const q = req.query["schoolId"];
  const querySchoolId =
    typeof q === "string" && q.trim() !== "" && !Number.isNaN(parseInt(q, 10))
      ? parseInt(q, 10)
      : typeof q === "number" && !Number.isNaN(q)
        ? q
        : undefined;
  const userSchoolId =
    typeof req.user?.schoolId === "number" && !Number.isNaN(req.user.schoolId) ? req.user.schoolId : undefined;
  return contextSchoolId ?? bodySchoolId ?? querySchoolId ?? userSchoolId;
}

function parseRoleIdParam(req: AuthenticatedRequest): number | undefined {
  const roleParam = req.params["roleId"];
  const roleId = roleParam !== undefined ? parseInt(String(roleParam), 10) : NaN;
  if (!Number.isFinite(roleId) || roleId <= 0) return undefined;
  return roleId;
}

export class RolesController {
  async getPermissionsMetadata(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = rolesService.getRolePermissionsMetadata();
      res.status(200).json(result);
    } catch (error) {
      console.error("Get role permissions metadata error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  async createRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const resolvedSchoolId = resolveSchoolId(req);
      if (!resolvedSchoolId) {
        res.status(400).json({
          success: false,
          message: "schoolId is required to create a role",
        });
        return;
      }

      const result = await rolesService.createRole({
        name: req.body.name,
        schoolId: resolvedSchoolId,
        permissions: req.body.permissions,
        isSystem: req.body.isSystem,
      });

      const statusCode = result.success ? 201 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Create role error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  async listRoles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const resolvedSchoolId = resolveSchoolId(req);
      if (!resolvedSchoolId) {
        res.status(400).json({
          success: false,
          message: "schoolId is required to list roles",
        });
        return;
      }

      const result = await rolesService.listRolesForSchool(resolvedSchoolId);
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("List roles error:", error);
      res.status(500).json({ success: false, message: AUTH_MESSAGES.INTERNAL_ERROR });
    }
  }

  async getRoleById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const resolvedSchoolId = resolveSchoolId(req);
      const roleId = parseRoleIdParam(req);
      if (!resolvedSchoolId) {
        res.status(400).json({ success: false, message: "schoolId is required" });
        return;
      }
      if (!roleId) {
        res.status(400).json({ success: false, message: "Invalid roleId" });
        return;
      }

      const result = await rolesService.getRoleById(roleId, resolvedSchoolId);
      const statusCode = result.success ? 200 : 404;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Get role error:", error);
      res.status(500).json({ success: false, message: AUTH_MESSAGES.INTERNAL_ERROR });
    }
  }

  async renameRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const resolvedSchoolId = resolveSchoolId(req);
      const roleId = parseRoleIdParam(req);
      if (!resolvedSchoolId) {
        res.status(400).json({ success: false, message: "schoolId is required" });
        return;
      }
      if (!roleId) {
        res.status(400).json({ success: false, message: "Invalid roleId" });
        return;
      }

      const result = await rolesService.renameRole(roleId, resolvedSchoolId, req.body.name);
      const statusCode = result.success ? 200 : result.message === "Role not found" ? 404 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Rename role error:", error);
      res.status(500).json({ success: false, message: AUTH_MESSAGES.INTERNAL_ERROR });
    }
  }

  async deleteRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const resolvedSchoolId = resolveSchoolId(req);
      const roleId = parseRoleIdParam(req);
      if (!resolvedSchoolId) {
        res.status(400).json({ success: false, message: "schoolId is required" });
        return;
      }
      if (!roleId) {
        res.status(400).json({ success: false, message: "Invalid roleId" });
        return;
      }

      const result = await rolesService.softDeleteRole(roleId, resolvedSchoolId);
      const statusCode = result.success ? 200 : result.message === "Role not found" ? 404 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Delete role error:", error);
      res.status(500).json({ success: false, message: AUTH_MESSAGES.INTERNAL_ERROR });
    }
  }

  async listRoleAssignees(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const resolvedSchoolId = resolveSchoolId(req);
      const roleId = parseRoleIdParam(req);
      if (!resolvedSchoolId) {
        res.status(400).json({ success: false, message: "schoolId is required" });
        return;
      }
      if (!roleId) {
        res.status(400).json({ success: false, message: "Invalid roleId" });
        return;
      }

      const result = await rolesService.listRoleAssignees(roleId, resolvedSchoolId);
      const statusCode = result.success ? 200 : 404;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("List role assignees error:", error);
      res.status(500).json({ success: false, message: AUTH_MESSAGES.INTERNAL_ERROR });
    }
  }

  async togglePermission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const resolvedSchoolId = resolveSchoolId(req);
      const roleId = parseRoleIdParam(req);
      if (!resolvedSchoolId) {
        res.status(400).json({ success: false, message: "schoolId is required" });
        return;
      }
      if (!roleId) {
        res.status(400).json({ success: false, message: "Invalid roleId" });
        return;
      }

      const result = await rolesService.toggleRolePermission({
        roleId,
        schoolId: resolvedSchoolId,
        resource: String(req.body.resource || "").trim(),
        action: req.body.action as "create" | "view" | "update" | "delete",
        enabled: req.body.enabled,
      });

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Toggle permission error:", error);
      res.status(500).json({ success: false, message: AUTH_MESSAGES.INTERNAL_ERROR });
    }
  }

  async assignUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const resolvedSchoolId = resolveSchoolId(req);
      if (!resolvedSchoolId) {
        res.status(400).json({
          success: false,
          message: "schoolId is required to assign a user role",
        });
        return;
      }

      const result = await rolesService.assignUserRole({
        userId: req.body.userId,
        roleId: req.body.roleId,
        schoolId: resolvedSchoolId,
        assignedByUserId: req.user?.id,
      });

      const statusCode = result.success ? 201 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Assign user role error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  async unassignUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const resolvedSchoolId = resolveSchoolId(req);
      if (!resolvedSchoolId) {
        res.status(400).json({
          success: false,
          message: "schoolId is required to remove a user role",
        });
        return;
      }

      const result = await rolesService.unassignUserRole({
        userId: req.body.userId,
        roleId: req.body.roleId,
        schoolId: resolvedSchoolId,
      });

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Unassign user role error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  async lookupUserRoles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const resolvedSchoolId = resolveSchoolId(req);
      if (!resolvedSchoolId) {
        res.status(400).json({
          success: false,
          message: "schoolId is required",
        });
        return;
      }

      const idRaw = req.query["id"];
      const emailRaw = req.query["email"];
      const uuidRaw = req.query["uuid"];

      let userId: number | undefined;
      let email: string | undefined;
      let uuid: string | undefined;

      if (idRaw !== undefined && String(idRaw).trim() !== "") {
        const n = parseInt(String(idRaw), 10);
        userId = Number.isFinite(n) && n > 0 ? n : undefined;
      }
      if (emailRaw !== undefined && String(emailRaw).trim() !== "") {
        email = String(emailRaw).trim();
      }
      if (uuidRaw !== undefined && String(uuidRaw).trim() !== "") {
        uuid = String(uuidRaw).trim();
      }

      const payload: {
        schoolId: number;
        userId?: number;
        email?: string;
        uuid?: string;
      } = { schoolId: resolvedSchoolId };

      if (userId !== undefined) {
        payload.userId = userId;
      } else if (uuid !== undefined) {
        payload.uuid = uuid;
      } else if (email !== undefined) {
        payload.email = email;
      }

      const result = await rolesService.getUserCustomRolesAndPermissions(payload);

      const statusCode = result.success
        ? 200
        : result.message === "User not found"
          ? 404
          : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("User roles lookup error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }
}

export const rolesController = new RolesController();
