import { Request, Response } from "express";
import { storageService } from "../services/storage.service";
import { activityLogger } from "../services/activity-logger.service";
import { SUPPORTED_FILE_TYPES, SupportedFileType } from "../validation/upload.validation";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

// Allowed MIME types per logical file type. Used to validate that the
// uploaded file actually matches the declared fileType.
const FILE_TYPE_MIME_MAP: Record<SupportedFileType, string[]> = {
  image: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/apng",
    "image/webp",
    "image/avif",
    "image/gif",
    "image/heic",
    "image/heif",
    "image/tiff",
    "image/bmp",
    "image/jxl",
    "image/x-icon",
    "image/vnd.microsoft.icon",
    "image/svg+xml",
  ],
  video: [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/3gpp",
    "video/3gpp2",
  ],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  text: [
    "text/plain",
    "text/csv",
    "text/html",
    "text/markdown",
    "text/xml",
    "application/json",
    "application/xml",
    "application/rtf",
  ],
};

// Per-type size limits (bytes). The multer-level limit is the largest of these.
const FILE_TYPE_SIZE_LIMITS: Record<SupportedFileType, number> = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  document: 25 * 1024 * 1024, // 25MB
  text: 5 * 1024 * 1024, // 5MB
};

// Default folder when caller does not provide one
const DEFAULT_FOLDER_BY_FILE_TYPE: Record<SupportedFileType, string> = {
  image: "images",
  video: "videos",
  document: "documents",
  text: "texts",
};

// Aggregated allow-list used by multer's fileFilter for the generic endpoint
export const ALL_SUPPORTED_UPLOAD_MIME_TYPES: string[] = Object.values(FILE_TYPE_MIME_MAP).flat();
export const MAX_GENERIC_UPLOAD_SIZE: number = Math.max(...Object.values(FILE_TYPE_SIZE_LIMITS));

function isSupportedFileType(value: unknown): value is SupportedFileType {
  return typeof value === "string" && (SUPPORTED_FILE_TYPES as readonly string[]).includes(value);
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
}

export class UploadController {
   /**
   * Upload single image
   */
   async uploadImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
        return;
      }

      const folder =
        (req.body["folder"] as string) || (req.query["folder"] as string) || "uploads";
      const noCompressRaw = req.body["noCompress"] ?? req.query["noCompress"];
      const noCompress =
        ["true", "1", "yes", "on"].includes(String(noCompressRaw ?? "").toLowerCase().trim());
      const result = await storageService.uploadImage(req.file, folder, { noCompress });

      // Log activity
      if (result.success && req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "upload",
          action: "upload_image",
          title: "Image uploaded",
          description: `Image "${req.file.originalname}" uploaded to ${folder} by ${req.user.name}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
        return;
      }

      const folder =
        (req.body["folder"] as string) || (req.query["folder"] as string) || "uploads";
      const noCompressRaw = req.body["noCompress"] ?? req.query["noCompress"];
      const noCompress =
        ["true", "1", "yes", "on"].includes(String(noCompressRaw ?? "").toLowerCase().trim());
      const result = await storageService.uploadMultipleImages(req.files, folder, { noCompress });

      // Log activity
      if (result.success && req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "upload",
          action: "upload_multiple_images",
          title: "Multiple images uploaded",
          description: `${req.files.length} images uploaded to ${folder} by ${req.user.name}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload images";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Delete image
   */
  async deleteImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fileName } = req.body;

      if (!fileName) {
        res.status(400).json({
          success: false,
          message: "File name is required",
        });
        return;
      }

      const result = await storageService.deleteImage(fileName);

      // Log activity
      if (result.success && req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "upload",
          action: "delete_image",
          title: "Image deleted",
          description: `Image "${fileName}" deleted by ${req.user.name}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete image";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }


  /**
  * Upload single document (PDF/DOCX)
  */
  async uploadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: "No file uploaded" });
        return;
      }

      const folder = (req.body.folder as string) || "documents";

      const result = await storageService.uploadFile(req.file, folder, [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]);

      // Log activity
      if (result.success && req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "upload",
          action: "upload_document",
          title: "Document uploaded",
          description: `Document "${req.file.originalname}" uploaded to ${folder} by ${req.user.name}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload document";
      res.status(500).json({ success: false, message });
    }
  }

  /**
  * Upload multiple documents (PDF/DOCX)
  */
  async uploadMultipleDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({ success: false, message: "No files uploaded" });
        return;
      }

      const folder = (req.body.folder as string) || "documents";

      const uploadResults = await Promise.all(
        (req.files as Express.Multer.File[]).map((file) =>
          storageService.uploadFile(file, folder, [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ])
        )
      );

      const failed = uploadResults.filter(r => !r.success);
      if (failed.length > 0) {
        res.status(400).json({ success: false, message: `Failed to upload ${failed.length} document(s)` });
        return
      }

      const uploadedFiles = uploadResults.map(r => ({ url: r.url!, fileName: r.fileName! }));

      // Log activity
      if (req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "upload",
          action: "upload_multiple_documents",
          title: "Multiple documents uploaded",
          description: `${uploadedFiles.length} documents uploaded to ${folder} by ${req.user.name}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(200).json({
        success: true,
        message: `${uploadedFiles.length} document(s) uploaded successfully`,
        files: uploadedFiles,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload documents";
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Upload any single file (image | video | document | text).
   * Caller declares the logical fileType in the body; the MIME type and size
   * are validated against the per-type allow-list and limit.
   */
  async uploadAnyFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: "No file uploaded" });
        return;
      }

      const rawFileType = (req.body?.fileType ?? req.query?.["fileType"]) as unknown;
      const fileType =
        typeof rawFileType === "string" ? (rawFileType.trim().toLowerCase() as SupportedFileType) : undefined;

      if (!isSupportedFileType(fileType)) {
        res.status(400).json({
          success: false,
          message: `fileType is required and must be one of: ${SUPPORTED_FILE_TYPES.join(", ")}`,
        });
        return;
      }

      const allowedMimeTypes = FILE_TYPE_MIME_MAP[fileType];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          message: `Uploaded file MIME type "${req.file.mimetype}" does not match declared fileType "${fileType}"`,
        });
        return;
      }

      const sizeLimit = FILE_TYPE_SIZE_LIMITS[fileType];
      if (req.file.size > sizeLimit) {
        res.status(413).json({
          success: false,
          message: `File size exceeds ${formatBytes(sizeLimit)} limit for ${fileType} uploads`,
        });
        return;
      }

      const folder =
        ((req.body?.folder as string) || (req.query?.["folder"] as string) || "").trim() ||
        DEFAULT_FOLDER_BY_FILE_TYPE[fileType];

      // For images, reuse the dedicated image pipeline (WebP compression, etc.).
      // Allow callers to opt out of compression with noCompress=true.
      let result;
      if (fileType === "image") {
        const noCompressRaw = req.body?.noCompress ?? req.query?.["noCompress"];
        const noCompress = ["true", "1", "yes", "on"].includes(
          String(noCompressRaw ?? "").toLowerCase().trim()
        );
        result = await storageService.uploadImage(req.file, folder, { noCompress });
      } else {
        result = await storageService.uploadFile(req.file, folder, allowedMimeTypes);
      }

      if (result.success && req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "upload",
          action: `upload_${fileType}`,
          title: `${fileType.charAt(0).toUpperCase()}${fileType.slice(1)} uploaded`,
          description: `${fileType} "${req.file.originalname}" uploaded to ${folder} by ${req.user.name}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json({ ...result, fileType });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload file";
      res.status(500).json({ success: false, message });
    }
  }
}

export const uploadController = new UploadController();
