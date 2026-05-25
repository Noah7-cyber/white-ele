import { body } from "express-validator";

export const deleteImageValidation = [body("fileName").notEmpty().withMessage("File name is required").isString().trim()];

export const uploadImageValidation = [
  body("folder")
    .optional()
    .isString()
    .trim()
    .isIn(["uploads", "profiles", "properties", "documents"])
    .withMessage("Folder must be one of: uploads, profiles, properties, documents"),
];

export const SUPPORTED_FILE_TYPES = ["image", "video", "document", "text"] as const;
export type SupportedFileType = (typeof SUPPORTED_FILE_TYPES)[number];

export const uploadAnyFileValidation = [
  body("fileType")
    .notEmpty()
    .withMessage("fileType is required")
    .isString()
    .trim()
    .toLowerCase()
    .isIn(SUPPORTED_FILE_TYPES as unknown as string[])
    .withMessage(`fileType must be one of: ${SUPPORTED_FILE_TYPES.join(", ")}`),

  body("folder").optional().isString().trim().isLength({ max: 100 }).withMessage("Folder must be at most 100 characters"),
];
