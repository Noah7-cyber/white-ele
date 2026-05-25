 import express from "express";
import { ProfileController } from "../controllers/profile.controller";
import {
  validateComprehensiveProfileUpdate,
  validateEmailChange,
  validateEmailChangeConfirmation,
  handleValidationErrors,
} from "../../shared/middleware/validation";
import { authenticate, AuthenticatedRequest } from "../../auth/middleware/middleware";

export const ProfileRoutes = express.Router();

const profileController = new ProfileController();

// All profile routes require authentication
ProfileRoutes.use(authenticate);

/**
 * Get user profile
 * GET /api/v1/profile
 */
ProfileRoutes.get("/", async (req: any, res: any) => {
  await profileController.getProfile(req as AuthenticatedRequest, res);
});

/**
 * Update comprehensive profile (User + Profile entity fields)
 * PUT /api/v1/profile
 */
ProfileRoutes.put("/", validateComprehensiveProfileUpdate, handleValidationErrors, async (req: any, res: any) => {
  await profileController.updateComprehensiveProfile(req as AuthenticatedRequest, res);
});

/**
 * Request email change
 * POST /api/v1/profile/email-change/request
 */
ProfileRoutes.post("/email-change/request", validateEmailChange, handleValidationErrors, async (req: any, res: any) => {
  await profileController.requestEmailChange(req as AuthenticatedRequest, res);
});

/**
 * Confirm email change
 * POST /api/v1/profile/email-change/confirm
 */
ProfileRoutes.post(
  "/email-change/confirm",
  validateEmailChangeConfirmation,
  handleValidationErrors,
  async (req: any, res: any) => {
    await profileController.confirmEmailChange(req as AuthenticatedRequest, res);
  }
);

ProfileRoutes.get("/activity", async (req: any, res: any) => {
  await profileController.getActivityLogs(req as AuthenticatedRequest, res);
});
