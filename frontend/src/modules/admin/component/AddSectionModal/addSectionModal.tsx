/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
import { Modal } from "@/modules/shared/component/modal/modal";
import { Button } from "@/modules/shared/component/Button";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { showToast } from "@/modules/shared/component/Toast";
import type { CreateSectionRequest, UpdateSectionRequest } from "@/services/portfolio.service";
import MediaUpload from "@/modules/shared/component/MediaUpload/mediaUpload";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { uploadServices } from "@/services/upload.service";
import * as Yup from "yup";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";
interface AddSectionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateSectionRequest | UpdateSectionRequest) => Promise<void>;
  isLoading?: boolean;
  portfolioId: number;
  mode?: "create" | "edit";
  initialValues?: {
    content?: string;
    mediaUrls?: string[];
  };
}

interface FormValues {
  content: string;
  mediaFiles: Array<File | { url: string; fileName?: string; mimeType?: string }>;
}

const defaultValues: FormValues = {
  content: "",
  mediaFiles: [],
};

const validationSchema = Yup.object().shape({
  content: Yup.string().required("Content is required"),
}) as Yup.ObjectSchema<FormValues>;

export default function AddSectionModal({
  open,
  onClose,
  onSubmit,
  isLoading,
  portfolioId,
  mode = "create",
  initialValues,
}: AddSectionModalProps) {
  const isMobile = useMediaQuery("(max-width:768px)");
  const { control, handleSubmit, reset } = useFormValidator<FormValues>({
    validationSchema: validationSchema,
    defaultValues: defaultValues,
    reValidateMode: "onChange",
  });

  const { mutateAsync: uploadImages, isPending: isUploading } = useMutationService<
    FormData,
    { data: any[] }
  >({
    service: uploadServices.uploadImages,
    options: { isFormData: true },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        content: initialValues?.content || "",
        mediaFiles: (initialValues?.mediaUrls || []).map((url) => ({
          url,
          fileName: "Uploaded Media",
          mimeType: "image/*",
        })),
      });
    }
  }, [open, reset, initialValues]);

  const handleFormSubmit = async (values: FormValues) => {
    try {
      const urls: string[] = [];

      // Upload files if any
      if (values.mediaFiles && values.mediaFiles.length > 0) {
        values.mediaFiles.forEach((file) => {
          if (!(file instanceof File) && file?.url) {
            urls.push(file.url);
          }
        });

        const newFiles = values.mediaFiles.filter((file): file is File => file instanceof File);
        if (newFiles.length === 0) {
          const payload =
            mode === "edit"
              ? {
                  content: values.content,
                  mediaUrls: urls.length > 0 ? urls : [],
                }
              : {
                  portfolioId: portfolioId,
                  content: values.content,
                  mediaUrls: urls.length > 0 ? urls : [],
                };
          await onSubmit(payload as any);
          onClose();
          return;
        }

        const formData = new FormData();
        newFiles.forEach((file) => {
          formData.append("images", file);
        });
        formData.append("folder", "uploads");

        const uploadResult: any = await uploadImages(formData);

        // The API returns an array of URLs directly in the `urls` property
        if (uploadResult?.urls && Array.isArray(uploadResult.urls)) {
          uploadResult.urls.forEach((url: string) => {
            urls.push(url);
          });
        }
        // Fallback: Check if there's a `files` array with url properties
        else if (uploadResult?.files && Array.isArray(uploadResult.files)) {
          uploadResult.files.forEach((file: any) => {
            if (file.url) urls.push(file.url);
          });
        }
        // Fallback: Original logic for other endpoint shapes
        else {
          const filesArray = Array.isArray(uploadResult)
            ? uploadResult
            : Array.isArray(uploadResult?.data)
              ? uploadResult.data
              : Array.isArray(uploadResult?.data?.data)
                ? uploadResult.data.data
                : [uploadResult?.data || uploadResult];

          filesArray.forEach((item: any) => {
            if (!item) return;
            if (typeof item === "string") {
              urls.push(item);
            } else if (item.url) {
              urls.push(item.url);
            } else if (item.documentUrl) {
              urls.push(item.documentUrl);
            }
          });
        }
      }

      const payload =
        mode === "edit"
          ? {
              content: values.content,
              mediaUrls: urls.length > 0 ? urls : [],
            }
          : {
              portfolioId: portfolioId,
              content: values.content,
              mediaUrls: urls.length > 0 ? urls : [],
            };
      await onSubmit(payload as any);

      onClose();
    } catch (error: any) {
      showToast({
        message: error?.message || (mode === "edit" ? "Failed to update section" : "Failed to add section"),
        severity: "error",
      });
    }
  };

  const formId = `add-section-form-${mode}`;
  const formContent = (
    <form id={formId} onSubmit={handleSubmit(handleFormSubmit)}>
      <Box
        className={`flex flex-col gap-4 py-4 ${!isMobile ? "border-t border-border-light" : ""}`}
        sx={{
          maxHeight: !isMobile ? "380px" : "unset",
          overflowY: !isMobile ? "auto" : "unset",
        }}
      >
        <CWTextArea
          control={control}
          name="content"
          requiredAsterisk
          label="Content"
          placeholder="Enter section notes or observation..."
          labelOnTop
          labelClassName="!text-xs !font-medium !text-input-gray"
          inputClasses="mt-1 !text-xs placeholder:!text-xs "
          className="w-full"
          minRows={4}
          maxRows={6}
        />

        <MediaUpload
          control={control}
          name="mediaFiles"
          label="Upload Media (Images & Videos)"
        />
      </Box>

      {!isMobile && (
        <Box className="flex justify-end gap-3 pt-4 border-t border-border-light">
          <Button
            variant="outlined"
            onClick={onClose}
            className="!rounded-lg !px-6 !bg-background-offwhite/50 !text-primary-dark !border !border-border-table"
            disabled={isLoading || isUploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="!px-6 !py-2 !rounded-lg"
            disabled={isLoading || isUploading}
          >
            {isLoading || isUploading ? (
              <CircularProgress size={20} className="!text-white" />
            ) : (
              mode === "edit" ? "Save Changes" : "Submit"
            )}
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
        className="flex-1 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700"
        disabled={isLoading || isUploading}
      >
        Cancel
      </button>
      <button
        type="submit"
        form={formId}
        disabled={isLoading || isUploading}
        className="flex-1 py-3 rounded-lg bg-brandColor-active text-white text-sm font-medium flex items-center justify-center gap-2"
      >
        {isLoading || isUploading ? (
          <CircularProgress size={16} className="!text-white" />
        ) : mode === "edit" ? (
          "Save Changes"
        ) : (
          "Submit"
        )}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <MobileFormDrawer
        open={open}
        onClose={onClose}
        title={mode === "edit" ? "Edit Section" : "Add Section"}
        footer={mobileFooter}
      >
        {formContent}
      </MobileFormDrawer>
    );
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="md:w-[500px] w-[90vw] !p-6 !rounded-md"
      width="500px"
    >
      <Box className="flex flex-col gap-3">
        <Box className="flex items-center justify-between">
          <Typography className="!text-lg !font-bold !text-text-primary">
            {mode === "edit" ? "Edit Section" : "Add Section"}
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
