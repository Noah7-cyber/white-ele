import { Router } from "express";
import multer from "multer";
import { NextFunction, Request, Response } from "express";
import {
  uploadController,
  ALL_SUPPORTED_UPLOAD_MIME_TYPES,
  MAX_GENERIC_UPLOAD_SIZE,
} from "../controllers/upload.controller";
import { authenticate } from "../../auth/middleware/middleware";
import {
  deleteImageValidation,
  uploadImageValidation,
  uploadAnyFileValidation,
} from "../validation/upload.validation";
import { handleValidationErrors } from "../middleware/validation";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Max 10 files at once
  },
  fileFilter: (_req, file, cb) => {
    // Allow only image files
    const allowedTypes = [
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
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported image file type"));
    }
  },
});

// Multer setup for the generic any-file endpoint. The per-fileType size limit
// is enforced in the controller; this limit is just the hard upper bound.
const anyFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_GENERIC_UPLOAD_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (ALL_SUPPORTED_UPLOAD_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// Multer setup for documents (max 10MB)
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed"));
    }
  },
});

const handleMulterError = (err: unknown, _req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        success: false,
        message: "File size exceeds upload limit",
      });
      return;
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      res.status(400).json({
        success: false,
        message: "Too many files uploaded",
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof Error) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  next();
};

/**
 * @route   POST /api/v1/upload/image
 * @desc    Upload single image
 * @access  Private (Authenticated users)
 */
router.post("/image", upload.single("image") as any, ...uploadImageValidation, handleValidationErrors, (req, res) =>
  uploadController.uploadImage(req as any, res),
);

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/upload/images
 * @desc    Upload multiple images
 * @access  Private (Authenticated users)
 */
router.post("/images", upload.array("images", 10) as any, ...uploadImageValidation, handleValidationErrors, (req, res) =>
  uploadController.uploadMultipleImages(req as any, res),
);

/**
 * @route   DELETE /api/v1/upload/image
 * @desc    Delete an image
 * @access  Private (Authenticated users)
 */
router.delete("/image", ...deleteImageValidation, handleValidationErrors, (req, res) => uploadController.deleteImage(req as any, res));

/**
 * @route   POST /api/v1/upload/file
 * @desc    Upload a single file of any supported type. Caller must declare
 *          `fileType` in the body: 'image' | 'video' | 'document' | 'text'.
 *          The form field for the file itself must be named `file`.
 * @access  Private (Authenticated users)
 */
router.post(
  "/file",
  anyFileUpload.single("file") as any,
  ...uploadAnyFileValidation,
  handleValidationErrors,
  (req, res) => uploadController.uploadAnyFile(req as any, res),
);

// Single document
router.post("/document", documentUpload.single("document") as any, (req, res) => uploadController.uploadDocument(req as any, res));

// Multiple documents
router.post("/documents", documentUpload.array("documents", 10) as any, (req, res) =>
  uploadController.uploadMultipleDocuments(req as any, res),
);

router.use(handleMulterError);

export default router;
