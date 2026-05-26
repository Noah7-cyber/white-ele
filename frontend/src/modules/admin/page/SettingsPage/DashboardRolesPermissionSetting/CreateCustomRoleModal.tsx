"use client";

import { useForm } from "react-hook-form";
import { Box, Typography, IconButton, useMediaQuery } from "@mui/material";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Button } from "@/modules/shared/component/Button";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { Modal } from "@/modules/shared/component/modal";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";
import { useCreateRole } from "./hooks/useRoles";
import type { RoleSummary } from "@/services/roles.service";
import { showToast } from "@/modules/shared/component/Toast";

interface CreateCustomRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (role: RoleSummary) => void;
}

interface CreateRoleForm {
  name: string;
}

export const CreateCustomRoleModal = ({ isOpen, onClose, onCreated }: CreateCustomRoleModalProps) => {
  const isMobile = useMediaQuery("(max-width:768px)");
  const formId = "create-custom-role-form";

  const { control, handleSubmit, reset } = useForm<CreateRoleForm>({
    defaultValues: { name: "" },
  });

  const { createRole, isCreating } = useCreateRole();

  const handleSave = async (data: CreateRoleForm) => {
    const name = data.name.trim();
    if (name.length < 2) {
      showToast({
        message: "Role name must be at least 2 characters",
        severity: "error",
      });
      return;
    }

    const response = await createRole({ name });
    if (response?.success && response.data?.role) {
      onCreated?.(response.data.role);
      reset({ name: "" });
      onClose();
    }
  };

  const handleClose = () => {
    reset({ name: "" });
    onClose();
  };

  const formContent = (
    <form id={formId} onSubmit={handleSubmit(handleSave)} className="flex flex-col">
      <CWTextField
        control={control}
        name="name"
        placeholder="Enter custom role name"
        label="Role Name"
        labelClassName="!text-sm mb-2! !font-medium !text-[#344054]"
        labelOnTop
        inputClasses="!text-sm !h-11"
        required
      />
    </form>
  );

  const mobileFooter = (
    <Box className="grid grid-cols-2 gap-3">
      <Button
        type="button"
        onClick={handleClose}
        className="rounded-lg! px-4! py-3! border! border-[#D0D5DD]! bg-white! text-[#344054]! hover:bg-gray-50!"
        disabled={isCreating}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form={formId}
        className="rounded-lg! px-4! py-3! bg-[#008080]! text-white! hover:bg-[#006666]!"
        loading={isCreating}
        disabled={isCreating}
      >
        Continue
      </Button>
    </Box>
  );

  if (isMobile) {
    return (
      <MobileFormDrawer open={isOpen} onClose={handleClose} title="Create Custom Role" footer={mobileFooter}>
        <Box className="py-5">{formContent}</Box>
      </MobileFormDrawer>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="rounded-lg p-6 w-[480px]">
      <Box className="flex flex-col">
        <Box className="flex items-center justify-between border-b border-[#E4E7EC] pb-4 mb-6">
          <Typography className="text-xl! font-semibold! text-[#022F2F]!">Create Custom Role</Typography>
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
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            className="rounded-lg! px-6! py-2! bg-[#008080]! text-white! hover:bg-[#006666]!"
            loading={isCreating}
            disabled={isCreating}
          >
            Continue
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
