/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Controller, Control } from "react-hook-form";
import { Box, Typography, IconButton } from "@mui/material";
import Image from "next/image";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import UploadState from "@/modules/shared/assets/images/file-upload.png";

import Dropzone from "react-dropzone";
import { Button } from "../Button";
import { showToast } from "../Toast";

const ALLOWED_DOCS_ACCEPT = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

const ALLOWED_DOCS_AND_IMAGES_ACCEPT = {
  ...ALLOWED_DOCS_ACCEPT,
  "image/*": [".png", ".jpeg", ".jpg"],
};

interface DocumentUploadProps {
  name: string;
  control: Control<any>;
  maxFiles?: number;
  label?: string;
  /** When true, only PDF and Word docs (.doc, .docx) are allowed; no images. */
  acceptOnlyPdfAndDocs?: boolean;
}

// Type guard to check if item is a File
const isFile = (item: any): item is File => {
  return item instanceof File;
};

// Type guard to check if item is a SubjectAttachment-like object
const isSubjectAttachment = (item: any): boolean => {
  return (
    item && typeof item === "object" && "name" in item && "size" in item && !(item instanceof File)
  );
};

// Type guard to check if item is a backend document object (with docName and documentUrl)
const isBackendDocument = (item: any): boolean => {
  return (
    item &&
    typeof item === "object" &&
    "docName" in item &&
    "documentUrl" in item &&
    !(item instanceof File)
  );
};

// Helper to get file name
const getFileName = (item: File | any): string => {
  if (isFile(item)) return item.name;
  if (isSubjectAttachment(item)) return item.name;
  if (isBackendDocument(item)) return item.docName;
  return "Unknown";
};

// Helper to get file size
const getFileSize = (item: File | any): number | null => {
  if (isFile(item)) return item.size;
  if (isSubjectAttachment(item)) return item.size;
  // Backend documents don't have size, return null to indicate unknown
  if (isBackendDocument(item)) return null;
  return 0;
};

// Helper to get file type
const getFileType = (item: File | any): string => {
  if (isFile(item)) return item.type;
  if (isSubjectAttachment(item)) {
    // Try to infer type from name if type is not available
    if (item.type) return item.type;
    const name = item.name?.toLowerCase() || "";
    if (name.endsWith(".pdf")) return "application/pdf";
    if (name.endsWith(".doc")) return "application/msword";
    if (name.endsWith(".docx"))
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  }
  if (isBackendDocument(item)) {
    // Infer type from docName extension
    const docName = item.docName?.toLowerCase() || "";
    if (docName.endsWith(".pdf")) return "application/pdf";
    if (docName.endsWith(".doc")) return "application/msword";
    if (docName.endsWith(".docx"))
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (docName.endsWith(".png")) return "image/png";
    if (docName.endsWith(".jpg") || docName.endsWith(".jpeg")) return "image/jpeg";
  }
  return "";
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};
const getFileTypeLabel = (type: string): string => {
  if (type === "application/pdf") return "PDF";
  if (type === "image/jpeg" || type === "image/png") return "IMG";
  if (type === "application/msword") return "DOC";
  if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    return "DOCX";
  return "Unknown";
};

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  name,
  control,
  maxFiles = 5,
  label,
  acceptOnlyPdfAndDocs = false,
}) => {
  const accept = acceptOnlyPdfAndDocs ? ALLOWED_DOCS_ACCEPT : ALLOWED_DOCS_AND_IMAGES_ACCEPT;
  const acceptLabel = acceptOnlyPdfAndDocs ? "PDF, WORD or DOCX" : "PDF, PNG, WORD or DOCX";

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={[]}
      render={({ field: { value, onChange } }) => {
        const handleDrop = (files: File[]) => {
          const remainingSlots = maxFiles - (value?.length || 0);

          if (remainingSlots <= 0) {
            showToast({
              message: `You can only upload a maximum of ${maxFiles} files`,
              severity: "warning",
            });
            return;
          }

          if (files.length > remainingSlots) {
            showToast({
              message: `You can only add ${remainingSlots} more file${
                remainingSlots > 1 ? "s" : ""
              }`,
              severity: "warning",
            });
          }

          const newFiles = files.slice(0, remainingSlots);

          // Check if the current value contains SubjectAttachment objects or backend documents
          const firstItem = value && value.length > 0 ? value[0] : null;
          const isSubjectAttachmentFormat = firstItem && isSubjectAttachment(firstItem);
          const isBackendDocumentFormat = firstItem && isBackendDocument(firstItem);

          if (isSubjectAttachmentFormat) {
            // Convert File objects to SubjectAttachment format
            const newAttachments = newFiles.map((file) => ({
              file,
              name: file.name,
              size: file.size,
              type: file.type,
            }));
            onChange([...(value || []), ...newAttachments]);
          } else if (isBackendDocumentFormat) {
            // When mixing with backend documents, keep new files as File objects
            // The form submission will handle converting them
            onChange([...(value || []), ...newFiles]);
          } else {
            // Keep as File objects
            onChange([...(value || []), ...newFiles]);
          }
        };

        const removeFile = (index: number) => {
          const updated = value.filter((_: any, i: number) => i !== index);
          onChange(updated);
        };

        return (
          <Box className="flex flex-col gap-5 !bg-white !py-2 rounded-xl pb-3">
            <Dropzone
              onDrop={handleDrop}
              accept={accept}
            >
              {({ getRootProps, getInputProps }) => (
                <section className="border border-dashed border-border-input rounded-2xl py-5 px-4">
                  <Box
                    {...getRootProps()}
                    className="w-full flex flex-col gap-y-3 items-center justify-center cursor-pointer"
                  >
                    <>
                      <input {...getInputProps()} />
                      <Box className="flex flex-col gap-y-3 items-center justify-center cursor-pointer">
                        <Image src={UploadState} alt="image-upload-img" className="w-12 h-12" />
                        <Box className="flex flex-col gap-y-0.5 items-center ">
                          <p className="!text-xs !text-grey500">
                            <span className="!font-semibold !text-primary-text">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="!text-[10px] !text-brandColor-inactive">
                            {acceptLabel} (max. 12MB)
                          </p>
                        </Box>
                      </Box>
                    </>
                    OR
                    <Button className="!rounded-sm">
                      <Typography className="!font-medium !text-xs  !text-white">
                        Browse Files
                      </Typography>
                    </Button>
                  </Box>
                </section>
              )}
            </Dropzone>

            {/* Preview */}
            <Box className="flex flex-col gap-2 mt-3">
              {(value || []).map((item: File | any, index: number) => {
                const fileName = getFileName(item);
                const fileSize = getFileSize(item);
                const fileType = getFileType(item);
                const fileTypeLabel = getFileTypeLabel(fileType);
                // Use document ID if available (backend document), otherwise use index
                const itemKey = isBackendDocument(item) && item.id ? item.id : index;

                return (
                  <Box
                    key={itemKey}
                    className="flex items-center justify-between border border-border-lightGray p-3 rounded-lg bg-[#F9FAFB]"
                  >
                    <Box className="flex items-center gap-3 flex-1">
                      <Box className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Typography className="!text-xs !font-semibold !text-blue-600">
                          {fileTypeLabel}
                        </Typography>
                      </Box>
                      <Box className="flex flex-col flex-1">
                        <Typography className="!text-sm !font-medium !text-primary-text">
                          {fileName}
                        </Typography>
                        <Typography className="!text-xs !text-gray-500">
                          File Format: {fileTypeLabel}
                          {fileSize !== null && ` • File Size: ${formatFileSize(fileSize)}`}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={() => removeFile(index)}>
                      <CloseIcon size={16} />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          </Box>
        );
      }}
    />
  );
};

export default DocumentUpload;
