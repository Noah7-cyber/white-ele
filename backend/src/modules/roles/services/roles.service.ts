import { Repository, ILike } from "typeorm";
import { AppDataSource } from "../../core/config/database";
import { User } from "../../shared/entities/User";
import { Admin } from "../../shared/entities/Admin";
import { Role } from "../../shared/entities/Role";
import { RolePermission } from "../../shared/entities/RolePermission";
import { UserRoleEntity } from "../../shared/entities/UserRole";
import { Action, Resources, ROLE_PERMISSIONS } from "../../auth/constants/role-permissions";
import { UserRole as SystemUserRole } from "../../shared/entities/EntityEnums";
import { School } from "../../shared/entities/School";
import {
  isReservedSystemSchoolSuperAdminRoleName,
  SYSTEM_SCHOOL_SUPER_ADMIN_ROLE_NAME,
} from "../constants/system-school-super-admin-role";

function isUniqueConstraintViolation(err: unknown): boolean {
  const e = err as { code?: string; errno?: number; driverError?: { code?: string; errno?: number } };
  if (e?.code === "23505") return true;
  if (e?.driverError?.code === "23505") return true;
  if (e?.errno === 1062) return true;
  if (e?.driverError?.errno === 1062) return true;
  const msg = err instanceof Error ? err.message : "";
  return /unique|duplicate entry/i.test(msg);
}

type FourFlags = { create: boolean; view: boolean; update: boolean; delete: boolean };

const ALL_ACTIONS_TRUE: FourFlags = { create: true, view: true, update: true, delete: true };

export class RolesService {
  private userRepository: Repository<User>;
  private roleRepository: Repository<Role>;
  private rolePermissionRepository: Repository<RolePermission>;
  private userRoleRepository: Repository<UserRoleEntity>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.roleRepository = AppDataSource.getRepository(Role);
    this.rolePermissionRepository = AppDataSource.getRepository(RolePermission);
    this.userRoleRepository = AppDataSource.getRepository(UserRoleEntity);
  }

  getRolePermissionsMetadata(): {
    success: boolean;
    data: {
      resources: string[];
      actions: string[];
      permissionsByResource: Record<string, string[]>;
    };
  } {
    const resources = Object.values(Resources);
    const actions = ["create", "view", "update", "delete"] as const;
    const actionList = [...actions];

    const permissionsByResource = resources.reduce<Record<string, string[]>>((acc, resource) => {
      acc[resource] = [...actionList];
      return acc;
    }, {});

    return {
      success: true,
      data: {
        resources,
        actions: actionList,
        permissionsByResource,
      },
    };
  }

  async createRole(data: {
    name: string;
    schoolId: number;
    permissions?: Array<{
      resource: string;
      actions?: {
        create?: boolean;
        view?: boolean;
        update?: boolean;
        delete?: boolean;
      };
    }>;
    isSystem?: boolean;
  }): Promise<{ success: boolean; message: string; data?: { role: unknown } }> {
    const normalizedName = String(data.name || "").trim();
    const normalizedSchoolId = Number(data.schoolId);

    if (!normalizedName || normalizedName.length < 2) {
      return {
        success: false,
        message: "Role name must be at least 2 characters long",
      };
    }

    if (isReservedSystemSchoolSuperAdminRoleName(normalizedName)) {
      return {
        success: false,
        message: "This role name is reserved for the system Super Admin role",
      };
    }

    if (!Number.isFinite(normalizedSchoolId) || normalizedSchoolId <= 0) {
      return {
        success: false,
        message: "A valid schoolId is required",
      };
    }

    const existing = await this.roleRepository.findOne({
      where: {
        name: normalizedName,
        schoolId: normalizedSchoolId,
      },
    });

    if (existing) {
      return {
        success: false,
        message: "Role already exists for this school",
      };
    }

    const allFalse: FourFlags = { create: false, view: false, update: false, delete: false };
    const validActions = new Set(["create", "view", "update", "delete"] as const);
    const overlayByResource = new Map<string, FourFlags>();

    const payload = Array.isArray(data.permissions) ? data.permissions : [];
    for (const item of payload) {
      if (!item || typeof item.resource !== "string" || !item.resource.trim()) {
        continue;
      }
      const resource = item.resource.trim();
      const safeActions =
        item.actions !== undefined && typeof item.actions === "object" && item.actions !== null && !Array.isArray(item.actions)
          ? item.actions
          : {};
      const flags: FourFlags = { ...allFalse };
      for (const key of validActions) {
        if (Object.prototype.hasOwnProperty.call(safeActions, key)) {
          const v = (safeActions as Record<string, unknown>)[key];
          if (typeof v === "boolean") {
            flags[key] = v;
          }
        }
      }
      overlayByResource.set(resource, flags);
    }

    const allResourceIds = Object.values(Resources) as string[];

    try {
      const result = await AppDataSource.transaction(async (manager) => {
        const roleRepo = manager.getRepository(Role);
        const rolePermissionRepo = manager.getRepository(RolePermission);

        const role = roleRepo.create({
          name: normalizedName,
          schoolId: normalizedSchoolId,
          isSystem: Boolean(data.isSystem),
        });

        const savedRole = await roleRepo.save(role);

        const permissionRows = allResourceIds.map((resource) => {
          const o = overlayByResource.get(resource) ?? allFalse;
          return rolePermissionRepo.create({
            roleId: savedRole.id,
            resource,
            create: o.create,
            view: o.view,
            update: o.update,
            delete: o.delete,
          });
        });

        await rolePermissionRepo.save(permissionRows);

        const permissions = permissionRows.map((row) => ({
          resource: row.resource,
          actions: {
            create: row.create,
            view: row.view,
            update: row.update,
            delete: row.delete,
          },
        }));

        return {
          role: {
            id: savedRole.id,
            name: savedRole.name,
            schoolId: savedRole.schoolId,
            isSystem: savedRole.isSystem,
            permissions,
            createdAt: savedRole.createdAt,
            updatedAt: savedRole.updatedAt,
          },
        };
      });

      return {
        success: true,
        message: "Role created successfully",
        data: result,
      };
    } catch (error) {
      console.error("Create role error:", error);
      if (isUniqueConstraintViolation(error)) {
        return {
          success: false,
          message: "Role already exists for this school",
        };
      }
      return {
        success: false,
        message: "Failed to create role",
      };
    }
  }

  async assignUserRole(data: {
    userId: number;
    roleId: number;
    schoolId: number;
    assignedByUserId?: number;
  }): Promise<{ success: boolean; message: string; data?: { assignment: unknown } }> {
    const userId = Number(data.userId);
    const roleId = Number(data.roleId);
    const schoolId = Number(data.schoolId);

    if (!Number.isFinite(userId) || userId <= 0) {
      return { success: false, message: "A valid userId is required" };
    }
    if (!Number.isFinite(roleId) || roleId <= 0) {
      return { success: false, message: "A valid roleId is required" };
    }
    if (!Number.isFinite(schoolId) || schoolId <= 0) {
      return { success: false, message: "A valid schoolId is required" };
    }

    try {
      const outcome = await AppDataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const roleRepo = manager.getRepository(Role);
        const userRoleRepo = manager.getRepository(UserRoleEntity);

        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user) {
          return { kind: "error" as const, message: "User not found" };
        }

        const role = await roleRepo.findOne({ where: { id: roleId } });
        if (!role) {
          return { kind: "error" as const, message: "Role not found" };
        }

        if (role.schoolId !== schoolId) {
          return { kind: "error" as const, message: "Selected role does not belong to this school" };
        }

        if (typeof user.schoolId === "number" && user.schoolId !== schoolId) {
          return { kind: "error" as const, message: "User does not belong to this school" };
        }

        const existing = await userRoleRepo.findOne({
          where: { userId, roleId },
        });
        if (existing) {
          return { kind: "error" as const, message: "User is already assigned to this role" };
        }

        const record = userRoleRepo.create({ userId, roleId });
        const assignment = await userRoleRepo.save(record);
        return { kind: "ok" as const, assignment, roleName: role.name };
      });

      if (outcome.kind === "error") {
        return { success: false, message: outcome.message };
      }

      return {
        success: true,
        message: "User role assigned successfully",
        data: {
          assignment: {
            id: outcome.assignment.id,
            userId: outcome.assignment.userId,
            roleId: outcome.assignment.roleId,
            schoolId,
            roleName: outcome.roleName,
            assignedByUserId: data.assignedByUserId,
            createdAt: outcome.assignment.createdAt,
            updatedAt: outcome.assignment.updatedAt,
          },
        },
      };
    } catch (error) {
      console.error("Assign user role error:", error);
      if (isUniqueConstraintViolation(error)) {
        return {
          success: false,
          message: "User is already assigned to this role",
        };
      }
      return {
        success: false,
        message: "Failed to assign user role",
      };
    }
  }

  async unassignUserRole(data: {
    userId: number;
    roleId: number;
    schoolId: number;
  }): Promise<{ success: boolean; message: string }> {
    const userId = Number(data.userId);
    const roleId = Number(data.roleId);
    const schoolId = Number(data.schoolId);

    if (!Number.isFinite(userId) || userId <= 0) {
      return { success: false, message: "A valid userId is required" };
    }
    if (!Number.isFinite(roleId) || roleId <= 0) {
      return { success: false, message: "A valid roleId is required" };
    }
    if (!Number.isFinite(schoolId) || schoolId <= 0) {
      return { success: false, message: "A valid schoolId is required" };
    }

    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      return { success: false, message: "Role not found" };
    }
    if (role.schoolId !== schoolId) {
      return { success: false, message: "Role does not belong to this school" };
    }

    const link = await this.userRoleRepository.findOne({ where: { userId, roleId } });
    if (!link) {
      return { success: false, message: "User is not assigned to this role" };
    }

    await this.userRoleRepository.remove(link);
    return { success: true, message: "User role assignment removed" };
  }

  async listRolesForSchool(schoolId: number): Promise<{ success: boolean; data?: { roles: unknown[] }; message?: string }> {
    if (!Number.isFinite(schoolId) || schoolId <= 0) {
      return { success: false, message: "A valid schoolId is required" };
    }

    await this.ensureSystemSuperAdminRoleAndPermissions(schoolId);

    const roles = await this.roleRepository.find({
      where: { schoolId },
      order: { name: "ASC" },
      select: ["id", "name", "schoolId", "isSystem", "createdAt", "updatedAt"],
    });

    if (roles.length === 0) {
      return { success: true, data: { roles: [] } };
    }

    const roleIds = roles.map((r) => r.id);

    const permRaw = await this.rolePermissionRepository
      .createQueryBuilder("rp")
      .select("rp.roleId", "roleId")
      .addSelect("COUNT(*)", "cnt")
      .where("rp.roleId IN (:...roleIds)", { roleIds })
      .groupBy("rp.roleId")
      .getRawMany();

    const assigneeRaw = await this.userRoleRepository
      .createQueryBuilder("ur")
      .select("ur.roleId", "roleId")
      .addSelect("COUNT(*)", "cnt")
      .where("ur.roleId IN (:...roleIds)", { roleIds })
      .groupBy("ur.roleId")
      .getRawMany();

    const permMap = new Map<number, number>();
    for (const row of permRaw) {
      const rid = Number(row["roleId"]);
      permMap.set(rid, Number(row["cnt"]));
    }
    const assignMap = new Map<number, number>();
    for (const row of assigneeRaw) {
      const rid = Number(row["roleId"]);
      assignMap.set(rid, Number(row["cnt"]));
    }

    const withCounts = roles.map((r) => ({
      id: r.id,
      name: r.name,
      schoolId: r.schoolId,
      isSystem: r.isSystem,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      permissionRowCount: permMap.get(r.id) ?? 0,
      assignedUserCount: assignMap.get(r.id) ?? 0,
    }));

    return { success: true, data: { roles: withCounts } };
  }

  async getRoleById(
    roleId: number,
    schoolId: number,
  ): Promise<{ success: boolean; message?: string; data?: { role: unknown } }> {
    if (!Number.isFinite(roleId) || roleId <= 0) {
      return { success: false, message: "A valid roleId is required" };
    }
    if (!Number.isFinite(schoolId) || schoolId <= 0) {
      return { success: false, message: "A valid schoolId is required" };
    }

    await this.ensureSystemSuperAdminRoleAndPermissions(schoolId);

    const role = await this.roleRepository.findOne({
      where: { id: roleId, schoolId },
      relations: ["permissions"],
    });

    if (!role) {
      return { success: false, message: "Role not found" };
    }

    const permissions = (role.permissions || []).map((row) => ({
      id: row.id,
      resource: row.resource,
      actions: {
        create: row.create,
        view: row.view,
        update: row.update,
        delete: row.delete,
      },
    }));

    return {
      success: true,
      data: {
        role: {
          id: role.id,
          name: role.name,
          schoolId: role.schoolId,
          isSystem: role.isSystem,
          permissions,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        },
      },
    };
  }

  async renameRole(
    roleId: number,
    schoolId: number,
    name: string,
  ): Promise<{ success: boolean; message: string; data?: { role: unknown } }> {
    if (!Number.isFinite(roleId) || roleId <= 0) {
      return { success: false, message: "A valid roleId is required" };
    }
    if (!Number.isFinite(schoolId) || schoolId <= 0) {
      return { success: false, message: "A valid schoolId is required" };
    }

    const normalizedName = String(name || "").trim();
    if (!normalizedName || normalizedName.length < 2) {
      return { success: false, message: "Role name must be at least 2 characters long" };
    }

    if (isReservedSystemSchoolSuperAdminRoleName(normalizedName)) {
      return {
        success: false,
        message: "This role name is reserved for the system Super Admin role",
      };
    }

    const role = await this.roleRepository.findOne({ where: { id: roleId, schoolId } });
    if (!role) {
      return { success: false, message: "Role not found" };
    }

    if (role.isSystem) {
      return { success: false, message: "System roles cannot be renamed" };
    }

    const duplicate = await this.roleRepository.findOne({
      where: { name: normalizedName, schoolId },
    });
    if (duplicate && duplicate.id !== roleId) {
      return { success: false, message: "Role already exists for this school" };
    }

    try {
      role.name = normalizedName;
      const saved = await this.roleRepository.save(role);
      return {
        success: true,
        message: "Role renamed successfully",
        data: {
          role: {
            id: saved.id,
            name: saved.name,
            schoolId: saved.schoolId,
            isSystem: saved.isSystem,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
          },
        },
      };
    } catch (error) {
      console.error("Rename role error:", error);
      if (isUniqueConstraintViolation(error)) {
        return { success: false, message: "Role already exists for this school" };
      }
      return { success: false, message: "Failed to rename role" };
    }
  }

  async softDeleteRole(roleId: number, schoolId: number): Promise<{ success: boolean; message: string }> {
    if (!Number.isFinite(roleId) || roleId <= 0) {
      return { success: false, message: "A valid roleId is required" };
    }
    if (!Number.isFinite(schoolId) || schoolId <= 0) {
      return { success: false, message: "A valid schoolId is required" };
    }

    const role = await this.roleRepository.findOne({ where: { id: roleId, schoolId } });
    if (!role) {
      return { success: false, message: "Role not found" };
    }

    if (role.isSystem) {
      return { success: false, message: "System roles cannot be deleted" };
    }

    try {
      await AppDataSource.transaction(async (manager) => {
        const permRepo = manager.getRepository(RolePermission);
        const urRepo = manager.getRepository(UserRoleEntity);
        const roleRepo = manager.getRepository(Role);
        await permRepo.delete({ roleId });
        await urRepo.delete({ roleId });
        await roleRepo.softDelete({ id: roleId });
      });
      return { success: true, message: "Role deleted" };
    } catch (error) {
      console.error("Soft delete role error:", error);
      return { success: false, message: "Failed to delete role" };
    }
  }

  async toggleRolePermission(data: {
    roleId: number;
    schoolId: number;
    resource: string;
    action: "create" | "view" | "update" | "delete";
    enabled: boolean;
  }): Promise<{ success: boolean; message: string; data?: { permission: unknown } }> {
    const { roleId, schoolId, resource, action, enabled } = data;

    if (!Number.isFinite(roleId) || roleId <= 0) {
      return { success: false, message: "A valid roleId is required" };
    }
    if (!Number.isFinite(schoolId) || schoolId <= 0) {
      return { success: false, message: "A valid schoolId is required" };
    }

    const rid = String(resource || "").trim();
    if (!Object.values(Resources).includes(rid as Resources)) {
      return { success: false, message: "Invalid resource" };
    }

    const role = await this.roleRepository.findOne({ where: { id: roleId, schoolId } });
    if (!role) {
      return { success: false, message: "Role not found" };
    }

    if (role.isSystem && isReservedSystemSchoolSuperAdminRoleName(role.name)) {
      return {
        success: false,
        message: "Permissions on the system Super Admin role cannot be changed",
      };
    }

    const allFalse: FourFlags = { create: false, view: false, update: false, delete: false };
    let row = await this.rolePermissionRepository.findOne({ where: { roleId, resource: rid } });

    if (!row) {
      row = this.rolePermissionRepository.create({
        roleId,
        resource: rid,
        ...allFalse,
        [action]: enabled,
      });
    } else {
      row[action] = enabled;
    }

    const saved = await this.rolePermissionRepository.save(row);

    return {
      success: true,
      message: "Permission updated",
      data: {
        permission: {
          id: saved.id,
          roleId: saved.roleId,
          resource: saved.resource,
          actions: {
            create: saved.create,
            view: saved.view,
            update: saved.update,
            delete: saved.delete,
          },
        },
      },
    };
  }

  private enumRoleToEffectivePermissions(systemRole: SystemUserRole): Record<string, FourFlags> {
    const merged: Record<string, FourFlags> = {};
    const allIds = Object.values(Resources) as string[];
    for (const r of allIds) {
      merged[r] = { create: false, view: false, update: false, delete: false };
    }

    const perm = ROLE_PERMISSIONS[systemRole];
    if (!perm) {
      return merged;
    }

    for (const [resource, actions] of Object.entries(perm)) {
      const m = merged[resource];
      if (!m || !Array.isArray(actions)) {
        continue;
      }
      for (const action of actions) {
        if (action === Action.CREATE) m.create = true;
        else if (action === Action.VIEW) m.view = true;
        else if (action === Action.UPDATE) m.update = true;
        else if (action === Action.DELETE) m.delete = true;
      }
    }
    return merged;
  }

  private mergeEffectivePermissions(roles: Role[]): Record<string, FourFlags> {
    const merged: Record<string, FourFlags> = {};
    const allIds = Object.values(Resources) as string[];
    for (const r of allIds) {
      merged[r] = { create: false, view: false, update: false, delete: false };
    }

    for (const role of roles) {
      const perms = role.permissions || [];
      for (const p of perms) {
        const m = merged[p.resource];
        if (!m) continue;
        m.create = m.create || p.create;
        m.view = m.view || p.view;
        m.update = m.update || p.update;
        m.delete = m.delete || p.delete;
      }
    }
    return merged;
  }

  /**
   * Permissions for the authenticated user: DB custom roles when assigned for the school,
   * otherwise the static map for `users.role`.
   */
  async getMyPermissions(
    userId: number,
    schoolId?: number,
  ): Promise<{ success: boolean; message?: string; data?: unknown }> {
    if (!Number.isFinite(userId) || userId <= 0) {
      return { success: false, message: "A valid userId is required" };
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const resolvedSchoolId =
      typeof schoolId === "number" && !Number.isNaN(schoolId) && schoolId > 0 ? schoolId : user.schoolId;

    if (!resolvedSchoolId) {
      if (user.role === SystemUserRole.SUPER_ADMIN) {
        return {
          success: true,
          data: {
            user: {
              id: user.id,
              uuid: user.uuid,
              email: user.email,
              systemRole: user.role,
              schoolId: user.schoolId,
            },
            schoolId: null,
            permissionSource: "system_role",
            hasCustomRoles: false,
            customRoles: [],
            effectivePermissions: this.enumRoleToEffectivePermissions(user.role),
          },
        };
      }
      return {
        success: false,
        message: "schoolId is required (pass ?schoolId= or ensure the user belongs to a school)",
      };
    }

    const links = await this.userRoleRepository.find({
      where: { userId: user.id },
      relations: ["role", "role.permissions"],
    });

    const customRoles = links
      .map((l) => l.role)
      .filter((r): r is Role => !!r && r.schoolId === resolvedSchoolId && !r.deletedAt);

    const hasCustomRoles = customRoles.length > 0;
    const rolePayloads = customRoles.map((r) => ({
      id: r.id,
      name: r.name,
      schoolId: r.schoolId,
      isSystem: r.isSystem,
      permissions: (r.permissions || []).map((row) => ({
        resource: row.resource,
        actions: {
          create: row.create,
          view: row.view,
          update: row.update,
          delete: row.delete,
        },
      })),
    }));

    const effectivePermissions = hasCustomRoles
      ? this.mergeEffectivePermissions(customRoles)
      : this.enumRoleToEffectivePermissions(user.role as SystemUserRole);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          systemRole: user.role as SystemUserRole,
          schoolId: user.schoolId,
        },
        schoolId: resolvedSchoolId,
        permissionSource: hasCustomRoles ? "custom_roles" : "system_role",
        hasCustomRoles,
        customRoles: rolePayloads,
        effectivePermissions,
      },
    };
  }

  async getUserCustomRolesAndPermissions(data: {
    schoolId: number;
    userId?: number;
    email?: string;
    uuid?: string;
  }): Promise<{ success: boolean; message?: string; data?: unknown }> {
    const { schoolId } = data;
    if (!Number.isFinite(schoolId) || schoolId <= 0) {
      return { success: false, message: "A valid schoolId is required" };
    }

    let user: User | null = null;

    if (typeof data.userId === "number" && !Number.isNaN(data.userId) && data.userId > 0) {
      user = await this.userRepository.findOne({ where: { id: data.userId } });
    } else if (data.uuid && data.uuid.trim()) {
      user = await this.userRepository.findOne({ where: { uuid: data.uuid.trim() } });
    } else if (data.email && data.email.trim()) {
      user = await this.userRepository.findOne({
        where: { email: ILike(data.email.trim()) },
        order: { id: "ASC" },
      });
    } else {
      return { success: false, message: "Provide user id, uuid, or email" };
    }

    if (!user) {
      return { success: false, message: "User not found" };
    }

    const links = await this.userRoleRepository.find({
      where: { userId: user.id },
      relations: ["role", "role.permissions"],
    });

    const customRoles = links
      .map((l) => l.role)
      .filter((r): r is Role => !!r && r.schoolId === schoolId && !r.deletedAt);

    const rolePayloads = customRoles.map((r) => ({
      id: r.id,
      name: r.name,
      schoolId: r.schoolId,
      isSystem: r.isSystem,
      permissions: (r.permissions || []).map((row) => ({
        resource: row.resource,
        actions: {
          create: row.create,
          view: row.view,
          update: row.update,
          delete: row.delete,
        },
      })),
    }));

    const effectivePermissions = this.mergeEffectivePermissions(customRoles);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          systemRole: user.role as SystemUserRole,
          schoolId: user.schoolId,
        },
        schoolId,
        customRoles: rolePayloads,
        effectivePermissions,
      },
    };
  }

  async listRoleAssignees(roleId: number, schoolId: number): Promise<{ success: boolean; message?: string; data?: unknown }> {
    if (!Number.isFinite(roleId) || roleId <= 0) {
      return { success: false, message: "A valid roleId is required" };
    }
    if (!Number.isFinite(schoolId) || schoolId <= 0) {
      return { success: false, message: "A valid schoolId is required" };
    }

    const role = await this.roleRepository.findOne({ where: { id: roleId, schoolId } });
    if (!role) {
      return { success: false, message: "Role not found" };
    }

    const links = await this.userRoleRepository.find({
      where: { roleId },
      relations: ["user"],
    });

    const users = links.map((l) => ({
      assignmentId: l.id,
      userId: l.userId,
      user: l.user
        ? {
            id: l.user.id,
            uuid: l.user.uuid,
            email: l.user.email,
            firstName: l.user.firstName,
            lastName: l.user.lastName,
            systemRole: l.user.role,
          }
        : undefined,
      assignedAt: l.createdAt,
    }));

    return {
      success: true,
      data: {
        roleId,
        roleName: role.name,
        users,
      },
    };
  }

  /**
   * Ensures the built-in system "Super Admin" role exists for the school with every permission enabled.
   */
  async ensureSystemSuperAdminRoleAndPermissions(schoolId: number): Promise<Role> {
    if (!Number.isFinite(schoolId) || schoolId <= 0) {
      throw new Error("A valid schoolId is required");
    }

    return await AppDataSource.transaction(async (manager) => {
      const roleRepo = manager.getRepository(Role);
      const permRepo = manager.getRepository(RolePermission);
      const name = SYSTEM_SCHOOL_SUPER_ADMIN_ROLE_NAME;

      let role = await roleRepo.findOne({ where: { schoolId, name } });
      if (!role) {
        role = await roleRepo.save(roleRepo.create({ name, schoolId, isSystem: true }));
      } else if (!role.isSystem) {
        role.isSystem = true;
        await roleRepo.save(role);
      }

      const allResourceIds = Object.values(Resources) as string[];
      const existing = await permRepo.find({ where: { roleId: role.id } });
      const byRes = new Map(existing.map((r) => [r.resource, r]));
      const toSave: RolePermission[] = [];

      for (const resource of allResourceIds) {
        const row = byRes.get(resource);
        if (!row) {
          toSave.push(
            permRepo.create({
              roleId: role.id,
              resource,
              ...ALL_ACTIONS_TRUE,
            }),
          );
        } else if (!row.create || !row.view || !row.update || !row.delete) {
          row.create = true;
          row.view = true;
          row.update = true;
          row.delete = true;
          toSave.push(row);
        }
      }

      if (toSave.length) {
        await permRepo.save(toSave);
      }

      return role;
    });
  }

  /**
   * Primary custom role for a user at a school (first assignment by id).
   */
  async getPrimaryAssignedRoleForUser(
    userId: number,
    schoolId: number,
  ): Promise<{ id: number; name: string } | null> {
    const links = await this.userRoleRepository.find({
      where: { userId },
      relations: ["role"],
      order: { id: "ASC" },
    });

    const match = links
      .map((l) => l.role)
      .filter((r): r is Role => !!r && r.schoolId === schoolId && !r.deletedAt);

    const first = match[0];
    if (!first) return null;
    return { id: first.id, name: first.name };
  }

  /**
   * Assigns every school admin (`admin` table row for this school) to the system Super Admin role.
   */
  async assignSchoolAdminsToSystemSuperAdminRole(schoolId: number, roleId: number): Promise<void> {
    if (!Number.isFinite(schoolId) || schoolId <= 0 || !Number.isFinite(roleId) || roleId <= 0) {
      return;
    }

    const adminRepo = AppDataSource.getRepository(Admin);
    const adminRows = await adminRepo.find({
      where: { schoolId },
      select: ["userId"],
    });

    const userIds = new Set<number>();
    for (const row of adminRows) {
      if (typeof row.userId === "number" && row.userId > 0) {
        userIds.add(row.userId);
      }
    }

    const usersWithSchoolId = await this.userRepository.find({
      where: { schoolId, role: SystemUserRole.ADMIN },
      select: ["id"],
    });
    for (const u of usersWithSchoolId) {
      userIds.add(u.id);
    }

    for (const userId of userIds) {
      const existing = await this.userRoleRepository.findOne({
        where: { userId, roleId },
      });
      if (!existing) {
        await this.userRoleRepository.save(this.userRoleRepository.create({ userId, roleId }));
      }
    }
  }

  /** Idempotent: full permission matrix + links for all admins (use after school creation or on startup). */
  async syncSystemSchoolSuperAdminForSchool(schoolId: number): Promise<void> {
    const role = await this.ensureSystemSuperAdminRoleAndPermissions(schoolId);
    await this.assignSchoolAdminsToSystemSuperAdminRole(schoolId, role.id);
  }

  /** Backfill all schools (server startup). */
  async bootstrapSystemSchoolSuperAdminRoles(): Promise<void> {
    const schoolRepo = AppDataSource.getRepository(School);
    const schools = await schoolRepo.find({ select: ["id"] });

    for (const s of schools) {
      try {
        await this.syncSystemSchoolSuperAdminForSchool(s.id);
      } catch (err) {
        console.error(`bootstrapSystemSchoolSuperAdminRoles failed for school ${s.id}:`, err);
      }
    }
  }
}

export const rolesService = new RolesService();
