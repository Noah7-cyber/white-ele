import { Router } from "express";
import { invitationController } from "../controllers/invitation.controller";
import { authenticate } from "../../auth/middleware/middleware";
import {
  createInvitationValidation,
  acceptInvitationValidation,
  validateInvitationValidation,
  invitationIdValidation,
  getInvitationsValidation,
  updateInvitationValidation,
} from "../validation/invitation.validation";
import { handleValidationErrors } from "../../shared/middleware/validation";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { Resources, Action } from "../../auth/constants/role-permissions";

const router = Router();

/**
 * @route   GET /api/v1/invitation/validate
 * @desc    Validate an invitation token (public)
 * @access  Public
 */
router.get("/validate", ...validateInvitationValidation, handleValidationErrors, (req, res) =>
  invitationController.validateInvitation(req, res)
);

/**
 * @route   POST /api/v1/invitation/accept
 * @desc    Accept an invitation (public)
 * @access  Public
 */
router.post("/accept", ...acceptInvitationValidation, handleValidationErrors, (req, res) =>
  invitationController.acceptInvitation(req, res)
);

// All routes below require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/invitation
 * @desc    Create and send an invitation
 * @access  Private (Admin, Super Admin)
 */
router.post(
  "/",
  requirePermission({ resource: Resources.INVITATION, action: Action.CREATE }),
  ...createInvitationValidation,
  handleValidationErrors,
  (req, res) => invitationController.createInvitation(req as any, res)
);

/**
 * @route   GET /api/v1/invitation
 * @desc    Get all invitations with filters
 * @access  Private (Admin, Super Admin)
 */
router.get(
  "/",
  requirePermission({ resource: Resources.INVITATION, action: Action.VIEW }),
  ...getInvitationsValidation,
  handleValidationErrors,
  (req, res) => invitationController.getInvitations(req as any, res)
);

/**
 * @route   PATCH /api/v1/invitation/:invitationId
 * @desc    Update a pending invitation
 * @access  Private (Admin, Super Admin)
 */
router.patch(
  "/:invitationId",
  requirePermission({ resource: Resources.INVITATION, action: Action.UPDATE }),
  ...updateInvitationValidation,
  handleValidationErrors,
  (req, res) => invitationController.updateInvitation(req as any, res),
);

/**
 * @route   POST /api/v1/invitation/:invitationId/resend
 * @desc    Resend an invitation
 * @access  Private (Admin, Super Admin)
 */
router.post(
  "/:invitationId/resend",
  requirePermission({ resource: Resources.INVITATION, action: Action.UPDATE }),
  ...invitationIdValidation,
  handleValidationErrors,
  (req, res) => invitationController.resendInvitation(req as any, res)
);

/**
 * @route   DELETE /api/v1/invitation/:invitationId
 * @desc    Delete an invitation
 * @access  Private (Admin, Super Admin)
 */
router.delete(
  "/:invitationId",
  requirePermission({ resource: Resources.INVITATION, action: Action.DELETE }),
  ...invitationIdValidation,
  handleValidationErrors,
  (req, res) => invitationController.deleteInvitation(req as any, res)
);

/**
 * @route   POST /api/v1/invitation/cleanup
 * @desc    Cleanup expired invitations
 * @access  Private (Admin, Super Admin)
 */
router.post("/cleanup", requirePermission({ resource: Resources.INVITATION, action: Action.UPDATE }), (req, res) =>
  invitationController.cleanupExpiredInvitations(req as any, res)
);

export { router as invitationRoutes }
export default router;
