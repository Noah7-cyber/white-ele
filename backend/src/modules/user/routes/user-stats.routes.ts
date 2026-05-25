import { Router, Request, Response } from "express";
import { userStatsController } from "../controllers/user-stats.controller";
import { authenticate } from "../../auth/middleware/middleware";
import { requireAdminOrHigher } from "../../shared/middleware/rbac.middleware";
import { handleValidationErrors } from "../../shared/middleware/validation";
import { validateUserStats } from "../validation/user-stats.validation";

const router = Router();

/**
 * Get user statistics (customers, owners, agents only)
 * GET /api/v1/users/stats
 *
 * Query Parameters:
 * - city: string (optional) - Filter by city
 * - state: string (optional) - Filter by state
 * - countryCode: string (optional) - Filter by country (2-letter code)
 * - startDate: ISO 8601 date (optional) - Filter from date
 * - endDate: ISO 8601 date (optional) - Filter to date
 *
 * When both startDate and endDate are provided:
 * - Returns stats for current period
 * - Returns prevStats for previous period (same duration)
 * - Returns growth percentages for all metrics
 *
 * Access: Admin, Super Admin
 */
router.get("/stats", authenticate, requireAdminOrHigher, validateUserStats, handleValidationErrors, (req: Request, res: Response) =>
  userStatsController.getUserStats(req as any, res)
);

export default router;
