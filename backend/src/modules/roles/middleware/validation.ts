import { Request, Response, NextFunction } from "express";
import { Resources } from "../../auth/constants/role-permissions";

const KNOWN_RESOURCE_IDS = new Set<string>(Object.values(Resources));

/**
 * Create role — see `RolesService.createRole` for payload shape.
 */
export const validateCreateRole = (req: Request, _res: Response, next: NextFunction): void => {
  const { name, permissions } = req.body || {};
  const errors: Array<{ msg: string }> = [];

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push({ msg: "Role name must be at least 2 characters long" });
  }

  if (permissions !== undefined && permissions !== null && !Array.isArray(permissions)) {
    errors.push({ msg: "Permissions must be an array" });
  } else {
    const list = Array.isArray(permissions) ? permissions : [];
    const validActions = new Set(["create", "view", "update", "delete"] as const);

    for (const item of list) {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        errors.push({ msg: "Each permission entry must be an object" });
        continue;
      }

      const resource = item.resource;
      const actions = item.actions;

      if (!resource || typeof resource !== "string" || !resource.trim()) {
        errors.push({ msg: "Each permission must include a non-empty resource string" });
        continue;
      }

      const rid = resource.trim();
      if (!KNOWN_RESOURCE_IDS.has(rid)) {
        errors.push({ msg: `Unknown resource '${rid}'. Use a value from the permissions metadata endpoint.` });
        continue;
      }

      if (actions === undefined) {
        continue;
      }

      if (!actions || typeof actions !== "object" || Array.isArray(actions)) {
        errors.push({ msg: `Actions for resource '${resource}' must be an object of boolean flags` });
        continue;
      }

      const actionEntries = Object.entries(actions);
      for (const [actionKey, actionValue] of actionEntries) {
        if (!validActions.has(actionKey as "create" | "view" | "update" | "delete")) {
          errors.push({ msg: `Invalid action '${actionKey}' for resource '${resource}'` });
          continue;
        }

        if (typeof actionValue !== "boolean") {
          errors.push({ msg: `Action '${actionKey}' for resource '${resource}' must be boolean` });
        }
      }
    }
  }

  if (errors.length > 0) {
    req.validationErrors = errors;
  }

  next();
};

export const validateRenameRole = (req: Request, _res: Response, next: NextFunction): void => {
  const errors: Array<{ msg: string }> = [];
  const roleParam = req.params["roleId"];
  const roleId = roleParam !== undefined ? parseInt(String(roleParam), 10) : NaN;
  if (!Number.isFinite(roleId) || roleId <= 0) {
    errors.push({ msg: "A valid roleId is required in the URL" });
  }

  const { name } = req.body || {};
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push({ msg: "Role name must be at least 2 characters long" });
  }

  if (errors.length > 0) {
    req.validationErrors = errors;
  }

  next();
};

export const validateAssignUserRole = (req: Request, _res: Response, next: NextFunction): void => {
  const { userId, roleId, schoolId } = req.body || {};
  const errors: Array<{ msg: string }> = [];

  if (typeof userId !== "number" || Number.isNaN(userId) || userId <= 0) {
    errors.push({ msg: "A valid userId is required" });
  }

  if (typeof roleId !== "number" || Number.isNaN(roleId) || roleId <= 0) {
    errors.push({ msg: "A valid roleId is required" });
  }

  if (typeof schoolId !== "undefined" && (typeof schoolId !== "number" || Number.isNaN(schoolId) || schoolId <= 0)) {
    errors.push({ msg: "schoolId must be a valid positive number" });
  }

  if (errors.length > 0) {
    req.validationErrors = errors;
  }

  next();
};

export const validateUnassignUserRole = validateAssignUserRole;

export const validateToggleRolePermission = (req: Request, _res: Response, next: NextFunction): void => {
  const errors: Array<{ msg: string }> = [];
  const roleParam = req.params["roleId"];
  const roleId = roleParam !== undefined ? parseInt(String(roleParam), 10) : NaN;
  if (!Number.isFinite(roleId) || roleId <= 0) {
    errors.push({ msg: "A valid roleId is required in the URL" });
  }

  const { resource, action, enabled } = req.body || {};

  if (!resource || typeof resource !== "string" || !resource.trim()) {
    errors.push({ msg: "resource is required" });
  } else if (!KNOWN_RESOURCE_IDS.has(resource.trim())) {
    errors.push({ msg: `Unknown resource '${resource.trim()}'` });
  }

  const validActions = new Set(["create", "view", "update", "delete"]);
  if (!action || typeof action !== "string" || !validActions.has(action)) {
    errors.push({ msg: "action must be one of: create, view, update, delete" });
  }

  if (typeof enabled !== "boolean") {
    errors.push({ msg: "enabled must be a boolean" });
  }

  if (errors.length > 0) {
    req.validationErrors = errors;
  }

  next();
};

/** Exactly one of id, email, uuid (query). */
export const validateUserRolesLookup = (req: Request, _res: Response, next: NextFunction): void => {
  const errors: Array<{ msg: string }> = [];

  const idRaw = req.query["id"];
  const emailRaw = req.query["email"];
  const uuidRaw = req.query["uuid"];

  let count = 0;
  if (idRaw !== undefined && String(idRaw).trim() !== "") count += 1;
  if (emailRaw !== undefined && String(emailRaw).trim() !== "") count += 1;
  if (uuidRaw !== undefined && String(uuidRaw).trim() !== "") count += 1;

  if (count !== 1) {
    errors.push({ msg: "Provide exactly one of: id, email, or uuid" });
  }

  if (idRaw !== undefined && String(idRaw).trim() !== "") {
    const n = parseInt(String(idRaw), 10);
    if (!Number.isFinite(n) || n <= 0) {
      errors.push({ msg: "id must be a positive integer" });
    }
  }

  if (errors.length > 0) {
    req.validationErrors = errors;
  }

  next();
};
