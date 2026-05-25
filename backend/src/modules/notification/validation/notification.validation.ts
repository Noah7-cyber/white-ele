import { body, query, param } from "express-validator";
import { NotificationType, NotificationPriority } from "../../shared/entities/Notification";

export const createNotificationValidation = [
  body("userId").isInt({ min: 1 }).withMessage("Valid user ID is required"),
  body("type")
    .isIn(Object.values(NotificationType))
    .withMessage(`Type must be one of: ${Object.values(NotificationType).join(", ")}`),
  body("priority")
    .optional()
    .isIn(Object.values(NotificationPriority))
    .withMessage(`Priority must be one of: ${Object.values(NotificationPriority).join(", ")}`),
  body("title").isString().trim().isLength({ min: 1, max: 255 }).withMessage("Title must be between 1 and 255 characters"),
  body("message").isString().trim().isLength({ min: 1, max: 5000 }).withMessage("Message must be between 1 and 5000 characters"),
  body("actionUrl").optional().isString().trim().isLength({ max: 500 }).withMessage("Action URL must not exceed 500 characters"),
  body("actionLabel").optional().isString().trim().isLength({ max: 100 }).withMessage("Action label must not exceed 100 characters"),
  body("relatedEntityType")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Related entity type must not exceed 100 characters"),
  body("relatedEntityId").optional().isInt({ min: 1 }).withMessage("Related entity ID must be a positive integer"),
  body("metadata").optional().isObject().withMessage("Metadata must be a valid object"),
  body("sendEmail").optional().isBoolean().withMessage("sendEmail must be a boolean"),
  body("sendSms").optional().isBoolean().withMessage("sendSms must be a boolean"),
];

export const bulkNotificationValidation = [
  body("userIds").isArray({ min: 1 }).withMessage("userIds must be a non-empty array"),
  body("userIds.*").isInt({ min: 1 }).withMessage("Each user ID must be a positive integer"),
  body("type")
    .isIn(Object.values(NotificationType))
    .withMessage(`Type must be one of: ${Object.values(NotificationType).join(", ")}`),
  body("priority")
    .optional()
    .isIn(Object.values(NotificationPriority))
    .withMessage(`Priority must be one of: ${Object.values(NotificationPriority).join(", ")}`),
  body("title").isString().trim().isLength({ min: 1, max: 255 }).withMessage("Title must be between 1 and 255 characters"),
  body("message").isString().trim().isLength({ min: 1, max: 5000 }).withMessage("Message must be between 1 and 5000 characters"),
  body("actionUrl").optional().isString().trim().isLength({ max: 500 }).withMessage("Action URL must not exceed 500 characters"),
  body("actionLabel").optional().isString().trim().isLength({ max: 100 }).withMessage("Action label must not exceed 100 characters"),
  body("metadata").optional().isObject().withMessage("Metadata must be a valid object"),
];

export const getNotificationsValidation = [
  query("isRead").optional().isIn(["true", "false"]).withMessage("isRead must be 'true' or 'false'"),
  query("type")
    .optional()
    .isIn(Object.values(NotificationType))
    .withMessage(`Type must be one of: ${Object.values(NotificationType).join(", ")}`),
  query("priority")
    .optional()
    .isIn(Object.values(NotificationPriority))
    .withMessage(`Priority must be one of: ${Object.values(NotificationPriority).join(", ")}`),
  query("pos").optional().isInt({ min: 0 }).withMessage("Position (pos) must be a non-negative integer"),
  query("delta").optional().isInt({ min: 1, max: 100 }).withMessage("Delta must be between 1 and 100"),
  query("sortBy")
    .optional()
    .isIn(["createdAt", "priority", "type", "isRead"])
    .withMessage("sortBy must be one of: createdAt, priority, type, isRead"),
  query("sortOrder").optional().isIn(["ASC", "DESC"]).withMessage("sortOrder must be ASC or DESC"),
];

export const notificationIdValidation = [param("id").isInt({ min: 1 }).withMessage("Notification ID must be a positive integer")];

export const userIdValidation = [param("userId").isInt({ min: 1 }).withMessage("User ID must be a positive integer")];
