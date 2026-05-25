import express from "express";
import { authenticate, requireAdmin } from "../../auth/middleware/middleware";
import { handleValidationErrors } from "../../auth/middleware/validation";
import { rolesController } from "../controllers/roles.controller";
import {
  validateAssignUserRole,
  validateCreateRole,
  validateRenameRole,
  validateToggleRolePermission,
  validateUnassignUserRole,
  validateUserRolesLookup,
} from "../middleware/validation";

export const rolesRoutes = express.Router();

rolesRoutes.use(authenticate);

rolesRoutes.get(
  "/permissions-metadata",
  (req, res, next) => requireAdmin(req as any, res, next),
  (req, res) => rolesController.getPermissionsMetadata(req as any, res),
);

rolesRoutes.get(
  "/users/lookup",
  (req, res, next) => requireAdmin(req as any, res, next),
  validateUserRolesLookup,
  handleValidationErrors,
  (req, res) => rolesController.lookupUserRoles(req as any, res),
);

rolesRoutes.get(
  "/",
  (req, res, next) => requireAdmin(req as any, res, next),
  (req, res) => rolesController.listRoles(req as any, res),
);

rolesRoutes.post(
  "/",
  (req, res, next) => requireAdmin(req as any, res, next),
  validateCreateRole,
  handleValidationErrors,
  (req, res) => rolesController.createRole(req as any, res),
);

rolesRoutes.post(
  "/assign",
  (req, res, next) => requireAdmin(req as any, res, next),
  validateAssignUserRole,
  handleValidationErrors,
  (req, res) => rolesController.assignUserRole(req as any, res),
);

rolesRoutes.delete(
  "/assign",
  (req, res, next) => requireAdmin(req as any, res, next),
  validateUnassignUserRole,
  handleValidationErrors,
  (req, res) => rolesController.unassignUserRole(req as any, res),
);

rolesRoutes.post(
  "/unassign",
  (req, res, next) => requireAdmin(req as any, res, next),
  validateUnassignUserRole,
  handleValidationErrors,
  (req, res) => rolesController.unassignUserRole(req as any, res),
);

rolesRoutes.get(
  "/:roleId/users",
  (req, res, next) => requireAdmin(req as any, res, next),
  (req, res) => rolesController.listRoleAssignees(req as any, res),
);

rolesRoutes.patch(
  "/:roleId/permissions",
  (req, res, next) => requireAdmin(req as any, res, next),
  validateToggleRolePermission,
  handleValidationErrors,
  (req, res) => rolesController.togglePermission(req as any, res),
);

rolesRoutes.patch(
  "/:roleId",
  (req, res, next) => requireAdmin(req as any, res, next),
  validateRenameRole,
  handleValidationErrors,
  (req, res) => rolesController.renameRole(req as any, res),
);

rolesRoutes.get(
  "/:roleId",
  (req, res, next) => requireAdmin(req as any, res, next),
  (req, res) => rolesController.getRoleById(req as any, res),
);

rolesRoutes.delete(
  "/:roleId",
  (req, res, next) => requireAdmin(req as any, res, next),
  (req, res) => rolesController.deleteRole(req as any, res),
);
