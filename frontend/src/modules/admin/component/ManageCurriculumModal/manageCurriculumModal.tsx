"use client";

import React from "react";
import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
import { Button } from "@/modules/shared/component/Button";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { useForm } from "react-hook-form";
import { showToast } from "@/modules/shared/component/Toast";
import DocumentUpload from "@/modules/shared/component/DocumentUpload/documentUpload";
import { Modal } from "@/modules/shared/component/modal/modal";
import { curriculumServices } from "@/services/curriculum.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { uploadServices } from "@/services/upload.service";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";

export interface ManageCurriculumModalFormValues {
  curriculumName: string;
  description: string;
  attachments: FileList | null;
}

export interface ManageCurriculumModalProps {
  open: boolean;
  onClose: () => void;
  onCurriculumAdded?: (curriculum: { id: string; name: string }) => void;
  onSubmit?: (values: ManageCurriculumModalFormValues) => void;
  isLoading?: boolean;
}

const defaultValues: ManageCurriculumModalFormValues = {
  curriculumName: "",
  description: "",
  attachments: null,
};

export default function ManageCurriculumModal({
  open,
  onClose,
  onCurriculumAdded,
}: ManageCurriculumModalProps): React.ReactElement {
  const isMobile = useMediaQuery("(max-width:768px)");
  const { control, handleSubmit, reset } = useForm<ManageCurriculumModalFormValues>({
    defaultValues,
  });

  const { mutateAsync: createCurriculum, isPending: isSubmitting } = useMutationService({
    service: curriculumServices.createCurriculum,
    options: { disableToast: true },
  });

  const { mutateAsync: uploadDocumentsAsync, isPending: isUploadingDocuments } = useMutationService({
    service: uploadServices.uploadDocuments,
    options: { isFormData: true, disableToast: true },
  });

  const onSubmit = async (values: ManageCurriculumModalFormValues) => {
    try {
      let attachments: { name: string; url: string }[] = [];

      if (values.attachments && values.attachments.length > 0) {
        const files = Array.from(values.attachments);
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("documents", file);
        });
        formData.append("folder", "curriculum");

        const response = (await uploadDocumentsAsync(formData)) as {
          files?: { fileName: string; url: string }[];
        };
        const uploaded = response?.files ?? [];
        attachments = uploaded.map((f) => ({
          name: f.fileName,
          url: f.url,
        }));
      }

      const res = await createCurriculum({
        title: values.curriculumName,
        description: values.description || undefined,
        attachmentUrl: attachments.length > 0 ? attachments : undefined,
      });
      const curriculum = (res as { curriculum?: { id: number; title?: string; name?: string } })
        ?.curriculum;
      if (curriculum) {
        onCurriculumAdded?.({
          id: String(curriculum.id),
          name: curriculum.title ?? curriculum.name ?? values.curriculumName,
        });
      }
      showToast({
        message: "Curriculum created successfully",
        severity: "success",
        duration: 3000,
      });
      reset(defaultValues);
      onClose();
    } catch (err: unknown) {
      showToast({
        message: (err as { message?: string })?.message ?? "Failed to create curriculum",
        severity: "error",
        duration: 3000,
      });
    }
  };

  const formId = "manage-curriculum-form";
  const isSaving = isSubmitting || isUploadingDocuments;

  const formContent = (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="">
      <Box
        className={`flex flex-col gap-4 py-4 ${!isMobile ? "border-t border-border-light overflow-y-auto" : ""}`}
        sx={{
          maxHeight: !isMobile ? "380px" : undefined,
        }}
      >
        <CWTextField
          control={control}
          name="curriculumName"
          required
          requiredAsterisk
          label="Curriculum Name"
          placeholder="Enter curriculum name"
          labelOnTop
          labelClassName="!text-sm !font-medium !text-input-gray"
          inputClasses="mt-1 !text-xs !h-10"
          className="w-full"
          isRounded={isMobile}
        />
        <CWTextArea
          control={control}
          name="description"
          label="Description"
          placeholder="Brief description of the curriculum..."
          rows={6}
          labelOnTop
          labelClassName="!text-sm !font-medium !text-input-gray"
          inputClasses="mt-1 !text-xs !px-3.5 !pt-3 !pb-4 !text-input-gray"
          className="w-full"
        />
        <DocumentUpload name="attachments" control={control} maxFiles={2} />
      </Box>
      {!isMobile && (
        <Box className="flex justify-end gap-3 pt-4 border-t border-border-light">
          <Button
            variant="outlined"
            onClick={onClose}
            className="!rounded-lg !px-6 !bg-background-offwhite/50 !text-primary-dark !border !border-border-table"
          >
            Cancel
          </Button>
          <Button type="submit" className="!px-6 !py-2 !rounded-lg" disabled={isSaving}>
            Save
          </Button>
        </Box>
      )}
    </form>
  );

  const mobileFooter = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form={formId}
        disabled={isSaving}
        className="flex-1 py-3 rounded-lg bg-brandColor-active text-white text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
      >
        {isSaving && <CircularProgress size={16} className="!text-white" />}
        Save
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <MobileFormDrawer open={open} onClose={onClose} title="Create Curriculum" footer={mobileFooter}>
        {formContent}
      </MobileFormDrawer>
    );
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="md:w-[600px] w-[90vw] !p-6 !rounded-md"
      width="600px"
    >
      <Box className="flex flex-col gap-3">
        <Box className="flex items-center justify-between">
          <Typography className="!text-lg !font-bold !text-text-primary">
            Create Curriculum
          </Typography>
          <IconButton onClick={onClose} size="small" className="!p-0">
            <CloseIcon />
          </IconButton>
        </Box>
        {formContent}
      </Box>
    </Modal>
  );
}
