"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Box, Typography, IconButton, useMediaQuery } from "@mui/material";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Button } from "@/modules/shared/component/Button";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { Modal } from "@/modules/shared/component/modal";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";
import { useRenameRole } from "./hooks/useRoles";
import type { RoleSummary } from "@/services/roles.service";
import { showToast } from "@/modules/shared/component/Toast";

interface RenameRoleModalProps {
  isOpen: boolean;
  role: RoleSummary | null;
  onClose: () => void;
  onRenamed?: (role: RoleSummary) => void;
}

interface RenameRoleForm {
  name: string;
}

export const RenameRoleModal = ({ isOpen, role, onClose, onRenamed }: RenameRoleModalProps) => {
  const isMobile = useMediaQuery("(max-width:768px)");
  const formId = "rename-role-form";

  const { control, handleSubmit, reset } = useForm<RenameRoleForm>({
    defaultValues: { name: "" },
  });

  const { renameRole, isRenaming } = useRenameRole();

  useEffect(() => {
    if (isOpen && role) {
      reset({ name: role.name });
    }
  }, [isOpen, role, reset]);

  const handleSave = async (data: RenameRoleForm) => {
    if (!role) return;

    const name = data.name.trim();
    if (name.length < 2) {
      showToast({
        message: "Role name must be at least 2 characters",
        severity: "error",
      });
      return;
    }

    if (name === role.name.trim()) {
      onClose();
      return;
    }

    const response = await renameRole({ roleId: role.id, name });
    if (response?.success && response.data?.role) {
      onRenamed?.(response.data.role);
      onClose();
    }
  };

  const handleClose = () => {
    reset({ name: role?.name ?? "" });
    onClose();
  };

  const formContent = (
    <form id={formId} onSubmit={handleSubmit(handleSave)} className="flex flex-col">
      <CWTextField
        control={control}
        name="name"
        placeholder="Enter role name"
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
        disabled={isRenaming}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form={formId}
        className="rounded-lg! px-4! py-3! bg-[#008080]! text-white! hover:bg-[#006666]!"
        loading={isRenaming}
        disabled={isRenaming}
      >
        Save
      </Button>
    </Box>
  );

  if (isMobile) {
    return (
      <MobileFormDrawer open={isOpen} onClose={handleClose} title="Rename Role" footer={mobileFooter}>
        <Box className="py-5">{formContent}</Box>
      </MobileFormDrawer>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="rounded-lg p-6 w-[480px]">
      <Box className="flex flex-col">
        <Box className="flex items-center justify-between border-b border-[#E4E7EC] pb-4 mb-6">
          <Typography className="text-xl! font-semibold! text-[#022F2F]!">Rename Role</Typography>
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
            disabled={isRenaming}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            className="rounded-lg! px-6! py-2! bg-[#008080]! text-white! hover:bg-[#006666]!"
            loading={isRenaming}
            disabled={isRenaming}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
