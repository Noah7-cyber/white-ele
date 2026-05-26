import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import {
  CreateRoleRequest,
  CreateRoleResponse,
  GetRoleResponse,
  ListRolesResponse,
  RenameRoleRequest,
  RenameRoleResponse,
  TogglePermissionRequest,
  TogglePermissionResponse,
  rolesDynamicEndpoints,
  rolesServices,
} from "@/services/roles.service";

export const ROLES_LIST_QUERY_KEY = "listRoles";
export const ROLE_DETAIL_QUERY_KEY = "getRoleById";

export const useRolesList = () => {
  return useQueryService<object, ListRolesResponse>({
    service: rolesServices.listRoles,
    options: {
      keys: [ROLES_LIST_QUERY_KEY],
    },
  });
};

export const useRoleDetails = (roleId: number | null) => {
  return useQueryService<object, GetRoleResponse>({
    service: rolesDynamicEndpoints.getRoleById(roleId ?? 0),
    options: {
      keys: [ROLE_DETAIL_QUERY_KEY, String(roleId ?? "")],
      enabled: Boolean(roleId),
    },
  });
};

export const useCreateRole = () => {
  const { mutateAsync: createRole, isPending: isCreating } = useMutationService<
    CreateRoleRequest,
    CreateRoleResponse
  >({
    service: rolesServices.createRole,
    options: {
      successTitle: "Role created",
      successMessage: "Custom role created successfully.",
      errorTitle: "Failed to create role",
      invalidateKeys: [ROLES_LIST_QUERY_KEY],
    },
  });

  return { createRole, isCreating };
};

export const useRenameRole = () => {
  const { mutateAsync: renameRole, isPending: isRenaming } = useMutationService<
    RenameRoleRequest & { roleId: number },
    RenameRoleResponse
  >({
    service: (variables) => rolesDynamicEndpoints.renameRole(variables.roleId),
    options: {
      successTitle: "Role renamed",
      successMessage: "Role name updated successfully.",
      errorTitle: "Failed to rename role",
      invalidateKeys: [ROLES_LIST_QUERY_KEY, ROLE_DETAIL_QUERY_KEY],
    },
  });

  return { renameRole, isRenaming };
};

export const useToggleRolePermission = (roleId: number | null) => {
  const { mutateAsync: togglePermission, isPending: isToggling } = useMutationService<
    TogglePermissionRequest,
    TogglePermissionResponse
  >({
    service: (variables) => rolesDynamicEndpoints.togglePermission(roleId ?? 0),
    options: {
      disableToast: true,
      invalidateKeys: [ROLE_DETAIL_QUERY_KEY],
    },
  });

  return { togglePermission, isToggling };
};
