import { useCallback } from "react";
import { uploadServices } from "@/services/upload.service";
import { useMutationService } from "./useMutationService";

export type GenericUploadFileType = "image" | "video" | "document" | "text";

type UploadFileParams = {
  file: File;
  fileType?: GenericUploadFileType;
  folder?: string;
  noCompress?: boolean;
};

type UploadFileResponse = {
  success?: boolean;
  message?: string;
  url?: string;
  fileName?: string;
  data?: {
    url?: string;
    fileName?: string;
    folder?: string;
    mimeType?: string;
    size?: number;
  };
};

const FILE_TYPE_DEFAULT_FOLDER: Record<GenericUploadFileType, string> = {
  image: "images",
  video: "videos",
  document: "documents",
  text: "texts",
};

const MAX_FILE_SIZE_BYTES: Record<GenericUploadFileType, number> = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  document: 25 * 1024 * 1024,
  text: 5 * 1024 * 1024,
};

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "image/heic",
  "image/heif",
]);

const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/3gpp",
  "video/3gpp2",
]);

const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/csv",
  "text/html",
  "text/markdown",
  "text/xml",
  "application/json",
  "application/xml",
  "application/rtf",
]);

const MIME_TYPE_BY_FILE_TYPE: Record<GenericUploadFileType, Set<string>> = {
  image: IMAGE_MIME_TYPES,
  video: VIDEO_MIME_TYPES,
  document: DOCUMENT_MIME_TYPES,
  text: TEXT_MIME_TYPES,
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function inferFileType(file: File): GenericUploadFileType | null {
  if (IMAGE_MIME_TYPES.has(file.type)) return "image";
  if (VIDEO_MIME_TYPES.has(file.type)) return "video";
  if (DOCUMENT_MIME_TYPES.has(file.type)) return "document";
  if (TEXT_MIME_TYPES.has(file.type)) return "text";
  return null;
}

function validateFile(file: File, fileType: GenericUploadFileType) {
  const allowedMimeTypes = MIME_TYPE_BY_FILE_TYPE[fileType];
  if (!allowedMimeTypes.has(file.type)) {
    throw new Error(`Unsupported ${fileType} format: ${file.type || file.name}`);
  }

  const maxSize = MAX_FILE_SIZE_BYTES[fileType];
  if (file.size > maxSize) {
    throw new Error(`${fileType} exceeds the ${formatBytes(maxSize)} limit.`);
  }
}

export function useUploadFile() {
  const { mutateAsync: uploadFileAsync, isPending: isUploadingFile } = useMutationService<
    FormData,
    UploadFileResponse
  >({
    service: uploadServices.uploadFile,
    options: {
      isFormData: true,
      onSuccess: (response) => {
        if (response && typeof response === "object" && "message" in response) {
          delete (response as { message?: string }).message;
        }
      },
    },
  });

  const uploadFile = useCallback(
    async ({ file, fileType, folder, noCompress }: UploadFileParams) => {
      const resolvedFileType = fileType ?? inferFileType(file);

      if (!resolvedFileType) {
        throw new Error(`Unsupported file type: ${file.type || file.name}`);
      }

      validateFile(file, resolvedFileType);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", resolvedFileType);
      formData.append("folder", folder ?? FILE_TYPE_DEFAULT_FOLDER[resolvedFileType]);

      if (resolvedFileType === "image" && noCompress) {
        formData.append("noCompress", "true");
      }

      const response = await uploadFileAsync(formData);
      const uploadedFile = response?.data ?? response;

      if (!uploadedFile?.url) {
        throw new Error(`Unable to upload ${resolvedFileType}`);
      }

      return {
        url: uploadedFile.url,
        fileName: uploadedFile?.fileName ?? file.name,
        fileType: resolvedFileType,
      };
    },
    [uploadFileAsync],
  );

  return {
    uploadFile,
    isUploadingFile,
    inferFileType,
  };
}
