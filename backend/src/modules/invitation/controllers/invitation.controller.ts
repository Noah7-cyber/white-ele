import { Request, Response } from "express";
import { invitationService } from "../services/invitation.service";
import { UserRole } from "../../shared/entities";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { activityLogger } from "../../shared/services/activity-logger.service";
import { validateSchoolAccess } from "../../shared/utils/tenant-context";

export class InvitationController {
  /**
   * Create and send an invitation
   */
  async createInvitation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        res.status(400).json({
          success: false,
          message: "School ID is required",
        });
        return;
      }

      const { email, role, roleId, firstName, lastName } = req.body;
      const invitedById = req.user.id;
      const parsedRoleId =
        typeof roleId === "number" && !Number.isNaN(roleId)
          ? roleId
          : typeof roleId === "string" && roleId.trim() !== ""
            ? parseInt(roleId, 10)
            : undefined;

      // Role hierarchy validation
      const roleHierarchy = {
        [UserRole.SUPER_ADMIN]: 6,
        [UserRole.ADMIN]: 5,
        [UserRole.STAFF]: 4,
        [UserRole.PARENT]: 2,
        [UserRole.STUDENT]: 1,
      };

      const inviterRoleLevel = roleHierarchy[req.user.role as UserRole];
      const targetRoleLevel = roleHierarchy[role as UserRole];

      if (inviterRoleLevel < targetRoleLevel) {
        res.status(403).json({
          success: false,
          message: "You cannot invite users with equal or higher privileges than your own",
        });
        return;
      }

      // Validate that schoolId from body matches user's schoolId
      if (schoolId) {
        try {
          validateSchoolAccess(req, schoolId);
        } catch (error: any) {
          res.status(403).json({ success: false, message: error.message });
          return;
        }
      }

      const result = await invitationService.createInvitation({
        email,
        role,
        roleId: Number.isFinite(parsedRoleId) ? parsedRoleId : undefined,
        firstName,
        lastName,
        invitedById,
        schoolId,
      });

      // Log activity
      if (result.success && req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "invitation",
          action: "create",
          title: "Invitation sent",
          description: `Invitation sent to ${email} for ${role} role by ${req.user.name}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create invitation";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }


  /**
   * Resend an invitation
   */
  async resendInvitation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const invitationId = parseInt(req.params["invitationId"] || "");

      if (!invitationId) {
        res.status(400).json({
          success: false,
          message: "Invalid invitation ID",
        });
        return;
      }

      const result = await invitationService.resendInvitation(invitationId);

      // Log activity
      if (result.success && (result as any).invitation && req.user) {
        const invitation = (result as any).invitation;
        await activityLogger.log({
          userId: req.user.id,
          resource: "invitation",
          action: "resend",
          title: "Invitation resent",
          description: `Invitation #${invitationId} to ${invitation.email} resent by ${req.user.name}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to resend invitation";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }



  /**
   * Accept an invitation (does not create user - just marks as accepted)
   */
  async acceptInvitation(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: "Token is required",
        });
        return;
      }

      const result = await invitationService.acceptInvitation(token);

      // Log activity (no user context since this is public endpoint)
      if (result.success && result.invitation) {
        await activityLogger.log({
          resource: "invitation",
          action: "accept",
          title: "Invitation accepted",
          description: `Invitation to ${result.invitation.email} for ${result.invitation.role} role accepted`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });

        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            email: result.invitation.email,
            firstName: result.invitation.firstName,
            lastName: result.invitation.lastName,
            role: result.invitation.role,
            token: result.invitation.token,
            acceptedAt: result.invitation.acceptedAt,
          },
        });
        return;
      }

      res.status(400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to accept invitation";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  

  /**
   * Validate an invitation token
   */
  async validateInvitation(req: Request, res: Response): Promise<void> {
    try {
      const token = req.query["token"] as string;

      if (!token) {
        res.status(400).json({
          success: false,
          message: "Token is required",
        });
        return;
      }

      const result = await invitationService.validateInvitation(token);

      if (result.success && result.invitation) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            email: result.invitation.email,
            firstName: result.invitation.firstName,
            lastName: result.invitation.lastName,
            role: result.invitation.role, 
            hasAccepted: result.invitation.hasAccepted,
            expiresAt: result.invitation.expiresAt,
            inviterName: result.invitation.invitedBy?.lastName,
          },
        });
        return;
      }

      res.status(400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to validate invitation";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Get all invitations with filters (scoped to user's school)
   */
  async getInvitations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        res.status(400).json({
          success: false,
          message: "School ID is required",
        });
        return;
      }

      try {
        validateSchoolAccess(req, schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const pos = parseInt(req.query["pos"] as string) || 0;
      const delta = parseInt(req.query["delta"] as string) || 10;
      const role = req.query["role"] as UserRole | undefined;
      const hasAccepted = req.query["hasAccepted"] === "true" ? true : req.query["hasAccepted"] === "false" ? false : undefined;
      const email = req.query["email"] as string | undefined;

      const result = await invitationService.getInvitations({
        schoolId,
        pos,
        delta,
        role,
        hasAccepted,
        email,
      });

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve invitations";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Update a pending invitation
   */
  async updateInvitation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        res.status(400).json({ success: false, message: "School ID is required" });
        return;
      }

      const invitationId = parseInt(req.params["invitationId"] || "");
      if (!invitationId) {
        res.status(400).json({ success: false, message: "Invalid invitation ID" });
        return;
      }

      const { firstName, lastName, roleId } = req.body;
      const parsedRoleId =
        typeof roleId === "number" && !Number.isNaN(roleId)
          ? roleId
          : typeof roleId === "string" && roleId.trim() !== ""
            ? parseInt(roleId, 10)
            : undefined;

      const result = await invitationService.updateInvitation({
        invitationId,
        schoolId,
        firstName,
        lastName,
        roleId: parsedRoleId,
      });

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update invitation";
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Delete an invitation
   */
  async deleteInvitation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const invitationId = parseInt(req.params["invitationId"] || "");

      if (!invitationId) {
        res.status(400).json({
          success: false,
          message: "Invalid invitation ID",
        });
        return;
      }

      const result = await invitationService.deleteInvitation(invitationId);

      // Log activity
      if (result.success && req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "invitation",
          action: "delete",
          title: "Invitation revoked",
          description: `Invitation #${invitationId} revoked by ${req.user.name}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete invitation";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Cleanup expired invitations
   */
  async cleanupExpiredInvitations(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await invitationService.cleanupExpiredInvitations();

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cleanup expired invitations";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
}

export const invitationController = new InvitationController();
