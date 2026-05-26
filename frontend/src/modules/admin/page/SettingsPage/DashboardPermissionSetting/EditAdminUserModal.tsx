"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Box, Typography, IconButton, useMediaQuery, CircularProgress } from "@mui/material";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import { Button } from "@/modules/shared/component/Button";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { Modal } from "@/modules/shared/component/modal";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";
import { Invitation } from "@/services/auth.service";
import { useSchoolRoleOptions } from "./hooks/useSchoolRoleOptions";
import { useUpdateInvitation } from "./hooks/useInviteUser";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import {
  rolesDynamicEndpoints,
  rolesServices,
  UserRolesLookupResponse,
  AssignUserRoleRequest,
  UnassignUserRoleRequest,
} from "@/services/roles.service";
import type { StatusType } from "./dashboardPermissionSetting.utils";
import { showToast } from "@/modules/shared/component/Toast";

interface EditAdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: Invitation | null;
  status: StatusType;
  onSaved?: () => void;
}

interface EditAdminUserForm {
  firstName: string;
  lastName: string;
  roleId: string;
}

export const EditAdminUserModal = ({
  isOpen,
  onClose,
  invitation,
  status,
  onSaved,
}: EditAdminUserModalProps) => {
  const isMobile = useMediaQuery("(max-width:768px)");
  const formId = "edit-admin-user-form";
  const isActive = status === "Active";

  const { roleOptions, defaultRoleId, isLoadingRoles } = useSchoolRoleOptions();
  const { updateInvitation, isUpdating } = useUpdateInvitation();

  const { data: userRolesData, isLoading: isLoadingUserRoles } = useQueryService<
    object,
    UserRolesLookupResponse
  >({
    service: rolesDynamicEndpoints.lookupUserRoles({
      email: invitation?.email ?? "",
    }),
    options: {
      keys: ["lookupUserRoles", invitation?.email ?? ""],
      enabled: isOpen && isActive && Boolean(invitation?.email),
    },
  });

  const { mutateAsync: assignUserRole, isPending: isAssigning } = useMutationService<
    AssignUserRoleRequest,
    { success?: boolean; message?: string }
  >({
    service: rolesServices.assignUserRole,
    options: {
      disableToast: true,
      invalidateKeys: ["getInvitations", "lookupUserRoles"],
    },
  });

  const { mutateAsync: unassignUserRole, isPending: isUnassigning } = useMutationService<
    UnassignUserRoleRequest,
    { success?: boolean; message?: string }
  >({
    service: rolesServices.unassignUserRole,
    options: {
      disableToast: true,
      invalidateKeys: ["getInvitations", "lookupUserRoles"],
    },
  });

  const currentCustomRoleId = userRolesData?.data?.customRoles?.[0]?.id;

  const { control, handleSubmit, reset } = useForm<EditAdminUserForm>({
    defaultValues: {
      firstName: "",
      lastName: "",
      roleId: "",
    },
  });

  useEffect(() => {
    if (!isOpen || !invitation) return;

    const roleIdValue =
      isActive && currentCustomRoleId != null
        ? String(currentCustomRoleId)
        : invitation.roleId != null
          ? String(invitation.roleId)
          : defaultRoleId;

    reset({
      firstName: invitation.firstName ?? "",
      lastName: invitation.lastName ?? "",
      roleId: roleIdValue,
    });
  }, [isOpen, invitation, isActive, currentCustomRoleId, defaultRoleId, reset]);

  const isLoading = isLoadingRoles || (isActive && isLoadingUserRoles);
  const isSaving = isUpdating || isAssigning || isUnassigning;

  const handleSave = async (data: EditAdminUserForm) => {
    if (!invitation) return;

    const roleId = parseInt(data.roleId, 10);
    if (!Number.isFinite(roleId) || roleId <= 0) return;

    try {
      if (isActive) {
        const userId = userRolesData?.data?.user?.id;
        if (!userId) return;

        if (currentCustomRoleId && currentCustomRoleId !== roleId) {
          await unassignUserRole({ userId, roleId: currentCustomRoleId });
        }
        if (!currentCustomRoleId || currentCustomRoleId !== roleId) {
          await assignUserRole({ userId, roleId });
        }
        showToast({
          message: "User updated",
          description: "Admin user role updated successfully.",
          severity: "success",
        });
      } else {
        await updateInvitation({
          invitationId: invitation.id,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          roleId,
        });
      }

      onSaved?.();
      onClose();
    } catch {
      showToast({
        message: "Update failed",
        description: "Could not update admin user. Please try again.",
        severity: "error",
      });
    }
  };

  const handleClose = () => {
    onClose();
  };

  const formContent = isLoading ? (
    <Box className="flex justify-center py-10">
      <CircularProgress size={28} sx={{ color: "#008080" }} />
    </Box>
  ) : (
    <form id={formId} onSubmit={handleSubmit(handleSave)} className="flex flex-col h-full">
      <Box className="flex flex-col gap-5 flex-1 py-1 sm:py-0">
        <Box className="flex flex-col gap-4 md:flex-row">
          <CWTextField
            control={control}
            name="firstName"
            placeholder="Enter first name"
            label="First Name"
            labelClassName="!text-sm mb-2! !font-medium !text-[#344054]"
            labelOnTop
            inputClasses="!text-sm !h-11"
            required
            disabled={isActive}
          />
          <CWTextField
            control={control}
            name="lastName"
            placeholder="Enter last name"
            label="Last Name"
            labelClassName="!text-sm mb-2! !font-medium !text-[#344054]"
            labelOnTop
            inputClasses="!text-sm !h-11"
            required
            disabled={isActive}
          />
        </Box>

        <Box>
          <Typography className="!text-sm mb-2! !font-medium !text-[#344054]">Email Address</Typography>
          <Box className="h-11 flex items-center rounded-lg border border-[#D0D5DD] px-3 bg-[#F9FAFB]">
            <Typography className="text-sm! text-[#667085]!">{invitation?.email ?? ""}</Typography>
          </Box>
        </Box>

        <Box>
          <CWDropdown
            control={control}
            name="roleId"
            options={roleOptions}
            isForm
            requiredAsterisk
            disabled={roleOptions.length === 0}
            textFieldProps={{
              label: "Role",
              placeholder: roleOptions.length ? "Select role" : "No roles available",
              labelClassName: "!text-sm mb-2! !font-medium !text-[#344054]",
              labelOnTop: true,
            }}
          />
        </Box>
      </Box>
    </form>
  );

  const mobileFooter = (
    <Box className="grid grid-cols-2 gap-3">
      <Button
        type="button"
        onClick={handleClose}
        className="rounded-lg! px-4! py-3! border! border-[#D0D5DD]! bg-white! text-[#344054]! hover:bg-gray-50!"
        disabled={isSaving}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form={formId}
        className="rounded-lg! px-4! py-3! bg-[#008080]! text-white! hover:bg-[#006666]!"
        loading={isSaving}
        disabled={isSaving || isLoading || roleOptions.length === 0}
      >
        Save Changes
      </Button>
    </Box>
  );

  if (isMobile) {
    return (
      <MobileFormDrawer open={isOpen} onClose={handleClose} title="Edit Admin User" footer={mobileFooter}>
        <Box className="py-5">{formContent}</Box>
      </MobileFormDrawer>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="rounded-lg p-6 w-[640px]">
      <Box className="flex flex-col h-full">
        <Box className="flex items-center justify-between border-b border-[#E4E7EC] pb-4 mb-6">
          <Typography className="text-xl! font-semibold! text-[#022F2F]!">Edit Admin User</Typography>
          <IconButton onClick={handleClose} size="small" className="!p-1" aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Box>

        {formContent}

        <Box className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#E4E7EC]">
          <Button
            type="button"
            onClick={handleClose}
            className="rounded-lg! px-6! py-2! border! border-[#D0D5DD]! bg-white! text-[#344054]! hover:bg-gray-50!"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            className="rounded-lg! px-6! py-2! bg-[#008080]! text-white! hover:bg-[#006666]!"
            loading={isSaving}
            disabled={isSaving || isLoading || roleOptions.length === 0}
          >
            Save Changes
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
