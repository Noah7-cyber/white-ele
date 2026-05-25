import { Response } from "express";
import { userStatsService } from "../services/user-stats.service";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { logger } from "../../shared/utils/logger";

export class UserStatsController {
  /**
   * Get user statistics (customers, owners, agents only)
   * GET /api/v1/users/stats
   */
  async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = {
        city: req.query["city"] as string | undefined,
        state: req.query["state"] as string | undefined,
        countryCode: req.query["countryCode"] as string | undefined,
        startDate: req.query["startDate"] as string | undefined,
        endDate: req.query["endDate"] as string | undefined,
      };

      const result = await userStatsService.getUserStats(filters);

      if (!result.success) {
        res.status(500).json(result);
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        ...result.data,
      });
    } catch (error) {
      logger.error("Get user stats controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve user statistics",
      });
    }
  }
}

export const userStatsController = new UserStatsController();
