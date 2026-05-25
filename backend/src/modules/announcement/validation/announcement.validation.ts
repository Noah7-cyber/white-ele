import { body, param, query, ValidationChain } from "express-validator";
import { AnnouncementStatus, AnnouncementType } from "../../shared/entities/EntityEnums";

/**
 * Validation for creating a new announcement
 */
export const validateCreateAnnouncement: ValidationChain[] = [
    body("subject")
        .notEmpty()
        .withMessage("Subject is required")
        .isString()
        .withMessage("Subject must be a string")
        .isLength({ max: 255 })
        .withMessage("Subject must not exceed 255 characters"),

    body("content")
        .notEmpty()
        .withMessage("Content is required")
        .isString()
        .withMessage("Content must be a string")
        .isLength({ max: 5000 })
        .withMessage("Content must not exceed 5000 characters"),

    body("schoolId")
        .notEmpty()
        .withMessage("School ID is required")
        .isInt({ min: 1 })
        .withMessage("School ID must be a positive integer")
        .toInt(),

    body("announcementType")
        .optional()
        .isIn(Object.values(AnnouncementType))
        .withMessage(`Announcement type must be one of: ${Object.values(AnnouncementType).join(", ")}`),

    body("announcementStatus")
        .optional()
        .isIn(Object.values(AnnouncementStatus))
        .withMessage(`Announcement status must be one of: ${Object.values(AnnouncementStatus).join(", ")}`),

    body("mediaUrl")
        .optional()
        .isString()
        .withMessage("Media URL must be a string")
        .isLength({ max: 500 })
        .withMessage("Media URL must not exceed 500 characters"),

    body("link")
        .optional()
        .isString()
        .withMessage("Link must be a string")
        .isLength({ max: 500 })
        .withMessage("Link must not exceed 500 characters"),
];

/**
 * Validation for announcement ID parameter
 */
export const validateAnnouncementId: ValidationChain[] = [
    param("id")
        .notEmpty()
        .withMessage("Announcement ID is required")
        .isInt({ min: 1 })
        .withMessage("Announcement ID must be a positive integer")
        .toInt(),
];

/**
 * Validation for updating an announcement
 */
export const validateUpdateAnnouncement: ValidationChain[] = [
    ...validateAnnouncementId,

    body("subject")
        .optional()
        .isString()
        .withMessage("Subject must be a string")
        .isLength({ max: 255 })
        .withMessage("Subject must not exceed 255 characters"),

    body("content")
        .optional()
        .isString()
        .withMessage("Content must be a string")
        .isLength({ max: 5000 })
        .withMessage("Content must not exceed 5000 characters"),

    body("announcementType")
        .optional()
        .isIn(Object.values(AnnouncementType))
        .withMessage(`Announcement type must be one of: ${Object.values(AnnouncementType).join(", ")}`),

    body("announcementStatus")
        .optional()
        .isIn(Object.values(AnnouncementStatus))
        .withMessage(`Announcement status must be one of: ${Object.values(AnnouncementStatus).join(", ")}`),

    body("mediaUrl")
        .optional()
        .isString()
        .withMessage("Media URL must be a string")
        .isLength({ max: 500 })
        .withMessage("Media URL must not exceed 500 characters"),

    body("link")
        .optional()
        .isString()
        .withMessage("Link must be a string")
        .isLength({ max: 500 })
        .withMessage("Link must not exceed 500 characters"),
];

/**
 * Validation for listing announcements with filters
 */
export const validateListAnnouncements: ValidationChain[] = [
    query("search")
        .optional({ values: "falsy" })
        .isString()
        .withMessage("Search must be a string")
        .isLength({ max: 255 })
        .withMessage("Search must not exceed 255 characters"),

    query("schoolId")
        .optional({ values: "falsy" })
        .isInt({ min: 1 })
        .withMessage("School ID must be a positive integer")
        .toInt(),

    query("announcementStatus")
        .optional({ values: "falsy" })
        .isIn(Object.values(AnnouncementStatus))
        .withMessage(`Announcement status must be one of: ${Object.values(AnnouncementStatus).join(", ")}`),

    query("announcementType")
        .optional({ values: "falsy" })
        .isIn(Object.values(AnnouncementType))
        .withMessage(`Announcement type must be one of: ${Object.values(AnnouncementType).join(", ")}`),

    query("pos")
        .optional({ values: "falsy" })
        .isInt({ min: 0 })
        .withMessage("pos must be a non-negative integer")
        .toInt(),

    query("delta")
        .optional({ values: "falsy" })
        .isInt({ min: 1, max: 100 })
        .withMessage("delta must be between 1 and 100")
        .toInt(),

    query("sortBy")
        .optional({ values: "falsy" })
        .isString()
        .withMessage("Sort by must be a string"),

    query("sortOrder")
        .optional({ values: "falsy" })
        .isIn(["ASC", "DESC"])
        .withMessage("Sort order must be ASC or DESC"),
];

/**
 * Validation for deleting an announcement
 */
export const validateDeleteAnnouncement = validateAnnouncementId;
