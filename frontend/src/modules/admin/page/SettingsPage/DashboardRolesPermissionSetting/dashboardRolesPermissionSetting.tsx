"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import ChevronRightIcon from "@/modules/shared/assets/svgs/chevronRight.svg";
import { Button } from "@/modules/shared/component/Button";
import { CreateCustomRoleModal } from "./CreateCustomRoleModal";
import { RenameRoleModal } from "./RenameRoleModal";
import { RoleRowActions } from "./RoleRowActions";
import { PermissionGroupSection } from "./PermissionGroupSection";
import {
  isCustomRole,
  isSuperAdminRole,
  PERMISSION_GROUPS,
  sortRolesWithSuperAdminFirst,
} from "./roles.constants";
import {
  useRoleDetails,
  useRolesList,
  useToggleRolePermission,
} from "./hooks/useRoles";
import type { RolePermissionAction, RoleSummary } from "@/services/roles.service";
import { showToast } from "@/modules/shared/component/Toast";

export const DashboardRolesPermissionSetting = () => {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [renameRoleTarget, setRenameRoleTarget] = useState<RoleSummary | null>(null);

  const { data: rolesData, isLoading: isLoadingRoles } = useRolesList();
  const roles = useMemo(
    () => sortRolesWithSuperAdminFirst(rolesData?.data?.roles ?? []),
    [rolesData?.data?.roles],
  );

  const { data: roleDetailData, isLoading: isLoadingRoleDetail } = useRoleDetails(selectedRoleId);
  const selectedRole = roleDetailData?.data?.role;
  const permissions = selectedRole?.permissions ?? [];

  const selectedRoleSummary = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const permissionsReadOnly = useMemo(
    () => isSuperAdminRole(selectedRole ?? selectedRoleSummary),
    [selectedRole, selectedRoleSummary],
  );

  const { togglePermission } = useToggleRolePermission(selectedRoleId);

  useEffect(() => {
    if (roles.length === 0) {
      setSelectedRoleId(null);
      return;
    }
    if (!selectedRoleId || !roles.some((r) => r.id === selectedRoleId)) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const handleRoleCreated = (role: RoleSummary) => {
    setSelectedRoleId(role.id);
  };

  const handleGroupToggle = useCallback(
    async (groupResources: string[], action: RolePermissionAction, enabled: boolean) => {
      if (!selectedRoleId || permissionsReadOnly) return;

      try {
        await Promise.all(
          groupResources.map((resource) =>
            togglePermission({ resource, action, enabled }),
          ),
        );
      } catch {
        showToast({
          message: "Update failed",
          description: "Could not update permissions. Please try again.",
          severity: "error",
        });
      }
    },
    [selectedRoleId, permissionsReadOnly, togglePermission],
  );

  return (
    <Box className="rounded-lg bg-white flex flex-col gap-5 p-4 sm:p-5 min-h-[480px]">
      <Box className="flex flex-col gap-1 border-b border-solid border-border-lightGray pb-4">
        <Box className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Box className="flex flex-col gap-1">
            <Typography className="font-bold! text-black!">Roles & Permissions</Typography>
            <Typography className="text-xs! text-text-tertiary/70!">
              Manage users and their access permissions.
            </Typography>
          </Box>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-lg! px-4! py-3! bg-[#008080]! text-white! flex items-center justify-center gap-2! !w-full sm:!w-fit"
          >
            <span className="text-lg">+</span>
            <span>Create Role</span>
          </Button>
        </Box>
      </Box>

      <Box className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
        <Box className="lg:w-[220px] shrink-0">
          <Typography className="text-xs! font-semibold! text-[#667085]! uppercase tracking-wide mb-3">
            Roles
          </Typography>
          {isLoadingRoles ? (
            <Box className="flex justify-center py-8">
              <CircularProgress size={24} sx={{ color: "#008080" }} />
            </Box>
          ) : roles.length === 0 ? (
            <Typography className="text-sm! text-[#667085]!">No roles yet. Create one to get started.</Typography>
          ) : (
            <Box className="flex flex-col gap-0.5">
              {roles.map((role) => {
                const isSelected = role.id === selectedRoleId;
                const showActions = isCustomRole(role);
                return (
                  <Box
                    key={role.id}
                    className={`flex items-center gap-1 rounded-lg pr-1 transition-colors ${
                      isSelected
                        ? "bg-[#F2F4F7] font-medium text-[#022F2F]"
                        : "text-[#344054] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedRoleId(role.id)}
                      className="flex min-w-0 flex-1 items-center justify-between py-2.5 pl-3 text-left text-sm"
                    >
                      <span className="truncate">{role.name}</span>
                      {isSelected && (
                        <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#667085] ml-2" />
                      )}
                    </button>
                    {showActions && (
                      <RoleRowActions onRename={() => setRenameRoleTarget(role)} />
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        <Box className="flex-1 min-w-0">
          {!selectedRoleId ? (
            <Box className="flex items-center justify-center py-16 rounded-lg border border-dashed border-[#E4E7EC]">
              <Typography className="text-sm! text-[#667085]!">
                Select a role or create a new custom role.
              </Typography>
            </Box>
          ) : isLoadingRoleDetail ? (
            <Box className="flex justify-center py-16">
              <CircularProgress size={28} sx={{ color: "#008080" }} />
            </Box>
          ) : (
            <Box className="flex flex-col gap-3">
              {permissionsReadOnly && (
                <Box className="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] px-4 py-3">
                  <Typography className="text-sm! text-[#667085]!">
                    Super Admin permissions are fixed and cannot be edited.
                  </Typography>
                </Box>
              )}
              {PERMISSION_GROUPS.map((group, index) => (
                <PermissionGroupSection
                  key={group.id}
                  group={group}
                  permissions={permissions}
                  defaultExpanded={index < 3}
                  disabled={permissionsReadOnly}
                  onToggle={(action, enabled) => handleGroupToggle(group.resources, action, enabled)}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <CreateCustomRoleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleRoleCreated}
      />

      <RenameRoleModal
        isOpen={Boolean(renameRoleTarget)}
        role={renameRoleTarget}
        onClose={() => setRenameRoleTarget(null)}
        onRenamed={() => setRenameRoleTarget(null)}
      />
    </Box>
  );
};
