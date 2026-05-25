import { Router } from "express";
import { activityLogController } from "../controllers/activity-log.controller";
import { authenticate } from "../../auth/middleware/middleware";
import { requireAdminOrHigher } from "../middleware/rbac.middleware";
import { handleValidationErrors } from "../middleware/validation";
import {
  getActivityLogsValidation,
  getActivityLogByIdValidation,
  getActivityLogStatsValidation,
} from "../validation/activity-log.validation";

const router = Router();

/**
 * Get activity logs with pagination and filters
 * GET /api/v1/activity-logs
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - userId: number (optional)
 * - resource: string (optional) - property, booking, user, etc.
 * - action: string (optional) - create, update, delete, etc.
 * - startDate: ISO 8601 date (optional)
 * - endDate: ISO 8601 date (optional)
 * - search: string (optional) - search in title or description
 * - sortBy: string (optional) - createdAt, resource, action, userId
 * - sortOrder: ASC | DESC (optional, default: DESC)
 *
 * Access: Admin only
 */
router.get(
  "/",
  authenticate,
  requireAdminOrHigher,
  getActivityLogsValidation,
  handleValidationErrors,
  activityLogController.getActivityLogs.bind(activityLogController)
);

/**
 * Get activity log statistics
 * GET /api/v1/activity-logs/stats
 *
 * Query Parameters:
 * - userId: number (optional)
 * - resource: string (optional)
 * - startDate: ISO 8601 date (optional)
 * - endDate: ISO 8601 date (optional)
 *
 * Access: Admin only
 */
router.get(
  "/stats",
  authenticate,
  requireAdminOrHigher,
  getActivityLogStatsValidation,
  handleValidationErrors,
  activityLogController.getActivityLogStats.bind(activityLogController)
);

/**
 * Get activity log by ID
 * GET /api/v1/activity-logs/:id
 *
 * Access: Admin only
 */
router.get(
  "/:id",
  authenticate,
  requireAdminOrHigher,
  getActivityLogByIdValidation,
  handleValidationErrors,
  activityLogController.getActivityLogById.bind(activityLogController)
);

export default router;
