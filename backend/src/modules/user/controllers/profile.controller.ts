import { Response } from "express";
import { profileService, ComprehensiveProfileUpdateData } from "../services/profile.service";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { logger } from "../../shared/utils/logger";
import { activityLogger } from "../../shared/services/activity-logger.service";

export class ProfileController {
  constructor() {}

  /**
   * Get user profile information
   */
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.id;

      const result = await profileService.getProfile(userId);

      res.status(result.success ? 200 : 404).json({
        success: result.success,
        message: result.message,
        data: result.user ? { user: result.user } : undefined,
      });
    } catch (error) {
      console.error("Error in getProfile controller:", error);
      logger.error("Error in getProfile controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Update comprehensive profile (User + Profile entity)
   */
  async updateComprehensiveProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const updateData: ComprehensiveProfileUpdateData = req.body;

      const result = await profileService.updateComprehensiveProfile(userId, updateData);

      // Log activity
      if (result.success && result.user && req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "user",
          action: "update_profile",
          title: "Profile updated",
          description: `Profile for ${result.user.name} updated by ${req.user.name}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json({
        success: result.success,
        message: result.message,
        data: result.user ? { user: result.user } : undefined,
      });
    } catch (error) {
      logger.error("Error in updateComprehensiveProfile controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get user activity logs (for audit trail)
   */
  async getActivityLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const { pos = 0, delta = 10 } = req.query;

      const result = await profileService.getActivityLogs(userId, Number(pos), Number(delta));

      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getActivityLogs controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Request email change (send verification to new email)
   */
  async requestEmailChange(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { newEmail, password } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const result = await profileService.RequestEmailChange({ id: userId, newEmail, password });

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error in requestEmailChange controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Confirm email change with token
   */
  async confirmEmailChange(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { newEmail, token } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const result = await profileService.confirmEmailChange(userId, { newEmail, token });

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error in confirmEmailChange controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
