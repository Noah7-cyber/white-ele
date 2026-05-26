import { ApiMethods } from "@/utils/client";

const rolesRoot = "/api/v1/roles";

export type RolePermissionAction = "create" | "view" | "update" | "delete";

export interface RolePermissionActions {
  create: boolean;
  view: boolean;
  update: boolean;
  delete: boolean;
}

export interface RolePermission {
  id?: number;
  resource: string;
  actions: RolePermissionActions;
}

export interface RoleSummary {
  id: number;
  name: string;
  schoolId: number;
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
  permissionRowCount?: number;
  assignedUserCount?: number;
}

export interface RoleDetail extends RoleSummary {
  permissions: RolePermission[];
}

export interface CreateRoleRequest {
  name: string;
  permissions?: Array<{
    resource: string;
    actions?: Partial<RolePermissionActions>;
  }>;
}

export interface CreateRoleResponse {
  success: boolean;
  message: string;
  data?: {
    role: RoleDetail;
  };
}

export interface RenameRoleRequest {
  name: string;
}

export interface RenameRoleResponse {
  success: boolean;
  message: string;
  data?: {
    role: RoleSummary;
  };
}

export interface ListRolesResponse {
  success: boolean;
  message?: string;
  data?: {
    roles: RoleSummary[];
  };
}

export interface GetRoleResponse {
  success: boolean;
  message?: string;
  data?: {
    role: RoleDetail;
  };
}

export interface TogglePermissionRequest {
  resource: string;
  action: RolePermissionAction;
  enabled: boolean;
}

export interface TogglePermissionResponse {
  success: boolean;
  message: string;
  data?: {
    permission: RolePermission & { roleId?: number };
  };
}

export interface PermissionsMetadataResponse {
  success: boolean;
  data: {
    resources: string[];
    actions: RolePermissionAction[];
    permissionsByResource: Record<string, RolePermissionAction[]>;
  };
}

const rolesEndpoints = {
  listRoles: { path: rolesRoot, method: ApiMethods.GET },
  createRole: { path: rolesRoot, method: ApiMethods.POST },
  permissionsMetadata: { path: `${rolesRoot}/permissions-metadata`, method: ApiMethods.GET },
};

export interface AssignUserRoleRequest {
  userId: number;
  roleId: number;
}

export interface UnassignUserRoleRequest {
  userId: number;
  roleId: number;
}

export interface UserRolesLookupResponse {
  success: boolean;
  message?: string;
  data?: {
    user: {
      id: number;
      email?: string;
      firstName?: string;
      lastName?: string;
    };
    customRoles: Array<{ id: number; name: string }>;
  };
}

export const rolesDynamicEndpoints = {
  getRoleById: (roleId: number) => ({
    path: `${rolesRoot}/${roleId}`,
    method: ApiMethods.GET,
  }),
  togglePermission: (roleId: number) => ({
    path: `${rolesRoot}/${roleId}/permissions`,
    method: ApiMethods.PATCH,
  }),
  renameRole: (roleId: number) => ({
    path: `${rolesRoot}/${roleId}`,
    method: ApiMethods.PATCH,
  }),
  deleteRole: (roleId: number) => ({
    path: `${rolesRoot}/${roleId}`,
    method: ApiMethods.DELETE,
  }),
  lookupUserRoles: (params: { email?: string; id?: number; uuid?: string }) => {
    const search = new URLSearchParams();
    if (params.email) search.set("email", params.email);
    if (params.id != null) search.set("id", String(params.id));
    if (params.uuid) search.set("uuid", params.uuid);
    const qs = search.toString();
    return {
      path: `${rolesRoot}/users/lookup${qs ? `?${qs}` : ""}`,
      method: ApiMethods.GET,
    };
  },
};

const rolesMutationEndpoints = {
  assignUserRole: { path: `${rolesRoot}/assign`, method: ApiMethods.POST },
  unassignUserRole: { path: `${rolesRoot}/unassign`, method: ApiMethods.POST },
};

type ServiceInterface = {
  path: string;
  method: ApiMethods;
};

function generateServices<T extends Record<string, { path: string; method: ApiMethods }>>(
  endpoints: T,
) {
  const services: Record<keyof T, ServiceInterface> = {} as Record<keyof T, ServiceInterface>;
  for (const key in endpoints) {
    services[key] = {
      path: endpoints[key].path,
      method: endpoints[key].method,
    };
  }
  return services;
}

export const rolesServices = {
  ...generateServices(rolesEndpoints),
  ...generateServices(rolesMutationEndpoints),
};
