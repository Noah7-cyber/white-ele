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

interface MediaUploadProps {
  name: string;
  control: Control<any>;
  maxFiles?: number;
  label?: string;
}

// Type guard to check if item is a File
const isFile = (item: any): item is File => {
  return item instanceof File;
};

// Type guard to check if it's an existing uploaded file from the backend
const isBackendMedia = (item: any): boolean => {
  return item && typeof item === "object" && "url" in item && !(item instanceof File);
};

// Helper to get file name
const getFileName = (item: File | any): string => {
  if (isFile(item)) return item.name;
  if (isBackendMedia(item)) return item.fileName || "Uploaded Media";
  return "Unknown";
};

// Helper to get file size
const getFileSize = (item: File | any): number | null => {
  if (isFile(item)) return item.size;
  return null;
};

// Helper to get file type
const getFileType = (item: File | any): string => {
  if (isFile(item)) return item.type;
  if (isBackendMedia(item)) return item.mimeType || "";
  return "";
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

const getFileTypeLabel = (type: string): string => {
  if (type.startsWith("image/")) return "IMG";
  if (type.startsWith("video/")) return "VID";
  return "Media";
};

const MediaUpload: React.FC<MediaUploadProps> = ({ name, control, maxFiles = 5, label }) => {
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

          // Keep as File objects to be uploaded via FormData later
          onChange([...(value || []), ...newFiles]);
        };

        const removeFile = (index: number) => {
          const updated = value.filter((_: any, i: number) => i !== index);
          onChange(updated);
        };

        return (
          <Box className="flex flex-col gap-2 !bg-white !py-2 rounded-xl pb-3">
            {label && (
              <Typography className="!text-xs !font-medium !text-input-gray">{label}</Typography>
            )}
            <Dropzone
              onDrop={handleDrop}
              accept={{
                "image/*": [".png", ".jpeg", ".jpg", ".gif", ".webp"],
                "video/*": [".mp4", ".mov", ".avi", ".mkv"],
              }}
            >
              {({ getRootProps, getInputProps }) => (
                <section className="border border-dashed border-border-input rounded-2xl py-5 px-4 bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors">
                  <Box
                    {...getRootProps()}
                    className="w-full flex flex-col gap-y-3 items-center justify-center cursor-pointer"
                  >
                    <>
                      <input {...getInputProps()} />
                      <Box className="flex flex-col gap-y-3 items-center justify-center cursor-pointer">
                        <Image src={UploadState} alt="media-upload-img" className="w-12 h-12" />
                        <Box className="flex flex-col gap-y-0.5 items-center ">
                          <p className="!text-xs !text-grey500">
                            <span className="!font-semibold !text-primary-text">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="!text-[10px] !text-brandColor-inactive text-center">
                            Images (PNG, JPG, GIF) or Videos (MP4, MOV)
                            <br />
                            (max. 50MB per file)
                          </p>
                        </Box>
                      </Box>
                    </>
                    <div className="flex items-center w-full max-w-[200px] gap-2 my-1">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-xs text-gray-400">OR</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
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
            {value && value.length > 0 && (
              <Box className="flex flex-col gap-2 mt-3">
                {value.map((item: File | any, index: number) => {
                  const fileName = getFileName(item);
                  const fileSize = getFileSize(item);
                  const fileType = getFileType(item);
                  const fileTypeLabel = getFileTypeLabel(fileType);
                  // Use URL if available (backend media), otherwise use index
                  const itemKey = isBackendMedia(item) && item.url ? item.url : index;

                  // Create local preview URL if it's a File
                  const previewUrl = isFile(item) ? URL.createObjectURL(item) : item.url;
                  const isImage = fileType.startsWith("image/");

                  return (
                    <Box
                      key={itemKey}
                      className="flex items-center justify-between border border-border-lightGray p-3 rounded-lg bg-[#F9FAFB]"
                    >
                      <Box className="flex items-center gap-3 flex-1 overflow-hidden">
                        <Box className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                          {isImage && previewUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={previewUrl}
                              alt={fileName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Typography className="!text-xs !font-semibold !text-blue-600">
                              {fileTypeLabel}
                            </Typography>
                          )}
                        </Box>
                        <Box className="flex flex-col flex-1 min-w-0">
                          <Typography className="!text-sm !font-medium !text-primary-text truncate">
                            {fileName}
                          </Typography>
                          <Typography className="!text-xs !text-gray-500">
                            {fileTypeLabel}
                            {fileSize !== null && ` • ${formatFileSize(fileSize)}`}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => removeFile(index)}
                        className="!text-red-500 hover:!bg-red-50 ml-2 border border-transparent hover:border-red-100 transition-colors"
                      >
                        <CloseIcon size={16} />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        );
      }}
    />
  );
};

export default MediaUpload;
