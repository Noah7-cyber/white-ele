import { query, param } from "express-validator";

/**
 * Validation for getting activity logs with filters
 */
export const getActivityLogsValidation = [
  query("pos").optional().isInt({ min: 0 }).withMessage("Position must be a non-negative integer"),
  query("delta").optional().isInt({ min: 1, max: 100 }).withMessage("Delta must be between 1 and 100"),
  query("userId").optional().isInt({ min: 1 }).withMessage("User ID must be a positive integer"),
  query("resource")
    .optional({ values: "falsy" })
    .isString()
    .isIn(["property", "maintenance", "booking", "lead", "customer", "agent", "invitation", "owner", "upload", "user", "auth", "security"])
    .withMessage("Invalid resource type"),
  query("action").optional().isString().isLength({ min: 1, max: 100 }).withMessage("Action must be a valid string"),
  query("startDate").optional().isISO8601().withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate").optional().isISO8601().withMessage("End date must be a valid ISO 8601 date"),
  query("search").optional().isString().isLength({ min: 1, max: 255 }).withMessage("Search must be a valid string"),
  query("sortBy")
    .optional({ values: "falsy" })
    .isString()
    .isIn(["createdAt", "resource", "action", "userId"])
    .withMessage("Sort by must be one of: createdAt, resource, action, userId"),
  query("sortOrder").optional({ values: "falsy" }).isString().isIn(["ASC", "DESC"]).withMessage("Sort order must be ASC or DESC"),
];

/**
 * Validation for getting activity log by ID
 */
export const getActivityLogByIdValidation = [param("id").isInt({ min: 1 }).withMessage("Activity log ID must be a positive integer")];

/**
 * Validation for activity log statistics
 */
export const getActivityLogStatsValidation = [
  query("userId").optional().isInt({ min: 1 }).withMessage("User ID must be a positive integer"),
  query("resource")
    .optional({ values: "falsy" })
    .isString()
    .isIn(["property", "maintenance", "booking", "lead", "customer", "agent", "invitation", "owner", "upload", "user", "auth", "security"])
    .withMessage("Invalid resource type"),
  query("startDate").optional().isISO8601().withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate").optional().isISO8601().withMessage("End date must be a valid ISO 8601 date"),
];
