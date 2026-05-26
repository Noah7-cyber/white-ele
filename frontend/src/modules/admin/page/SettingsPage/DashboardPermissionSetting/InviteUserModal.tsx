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
import { useInviteUser } from "./hooks/useInviteUser";
import { useSchoolRoleOptions } from "./hooks/useSchoolRoleOptions";
import { showToast } from "@/modules/shared/component/Toast";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite?: (data: { firstName: string; lastName: string; email: string; roleId: number }) => void;
}

interface InviteUserForm {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
}

export const InviteUserModal = ({ isOpen, onClose, onInvite }: InviteUserModalProps) => {
  const isMobile = useMediaQuery("(max-width:768px)");
  const formId = "invite-admin-user-form";

  const { roleOptions, defaultRoleId, isLoadingRoles } = useSchoolRoleOptions();

  const { control, handleSubmit, reset } = useForm<InviteUserForm>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      roleId: "",
    },
  });

  const { inviteUser, isLoading } = useInviteUser();

  useEffect(() => {
    if (isOpen && defaultRoleId) {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        roleId: defaultRoleId,
      });
    }
  }, [isOpen, defaultRoleId, reset]);

  const handleSave = async (data: InviteUserForm) => {
    const roleId = parseInt(data.roleId, 10);
    if (!Number.isFinite(roleId) || roleId <= 0) {
      showToast({ message: "Please select a role", severity: "error" });
      return;
    }

    const payload = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim(),
      role: "admin",
      roleId,
    };

    const response = await inviteUser(payload);

    if (response) {
      onInvite?.({
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        roleId,
      });
      reset({ firstName: "", lastName: "", email: "", roleId: defaultRoleId });
      onClose();
    }
  };

  const handleClose = () => {
    reset({ firstName: "", lastName: "", email: "", roleId: defaultRoleId });
    onClose();
  };

  const formContent = isLoadingRoles ? (
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
          />
        </Box>

        <Box>
          <CWTextField
            control={control}
            name="email"
            placeholder="Enter email address"
            label="Email Address"
            labelClassName="!text-sm mb-2! !font-medium !text-[#344054]"
            labelOnTop
            inputClasses="!text-sm !h-11"
            type="email"
            required
          />
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
        disabled={isLoading}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form={formId}
        className="rounded-lg! px-4! py-3! bg-[#008080]! text-white! hover:bg-[#006666]!"
        loading={isLoading}
        disabled={isLoading || isLoadingRoles || roleOptions.length === 0}
      >
        Send Invite
      </Button>
    </Box>
  );

  if (isMobile) {
    return (
      <MobileFormDrawer open={isOpen} onClose={handleClose} title="Invite Admin User" footer={mobileFooter}>
        <Box className="py-5">{formContent}</Box>
      </MobileFormDrawer>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="rounded-lg p-6 w-[640px]">
      <Box className="flex flex-col h-full">
        <Box className="flex items-center justify-between border-b border-[#E4E7EC] pb-4 mb-6">
          <Typography className="text-xl! font-semibold! text-[#022F2F]!">
            Invite Admin User
          </Typography>
          <IconButton
            onClick={handleClose}
            size="small"
            className="!p-1"
            aria-label="Close"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {formContent}

        <Box className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#E4E7EC]">
          <Button
            type="button"
            onClick={handleClose}
            className="rounded-lg! px-6! py-2! border! border-[#D0D5DD]! bg-white! text-[#344054]! hover:bg-gray-50!"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            className="rounded-lg! px-6! py-2! bg-[#008080]! text-white! hover:bg-[#006666]!"
            loading={isLoading}
            disabled={isLoading || isLoadingRoles || roleOptions.length === 0}
          >
            Send Invite
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
