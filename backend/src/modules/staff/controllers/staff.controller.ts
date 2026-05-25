import { Response } from "express";
import { staffService, CreateStaffData, UpdateStaffData, StaffSearchFilters } from "../services/staff.service";
import { StaffStatus } from "../../shared/entities";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { logger } from "../../shared/utils/logger";
import { activityLogger } from "../../shared/services/activity-logger.service";
import { requireSchoolId, validateSchoolAccess } from "../../shared/utils/tenant-context";

export class StaffController {
  constructor() { }

  /**
   * Create a new staff
   */
  async createStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data: CreateStaffData = req.body;
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        res.status(400).json({ success: false, message: error?.message ?? "School context is required" });
        return;
      }

      // Validate that schoolId from body matches user's schoolId
      try {
        validateSchoolAccess(req, schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const result = await staffService.createStaff({
        ...data,
        schoolId: schoolId as number,
      });

      // Log activity
      if (result.success && (result as any).staff && req.user) {
        const staff = (result as any).staff;
        await activityLogger.log({
          userId: req.user.id,
          resource: "staff",
          action: "create",
          title: "New staff created",
          description: `Staff "${staff.name}" for ${staff.school || "Unknown school"} by ${req.user.name}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error("Error in createStaff controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get staff by ID
   */
  async getStaffById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const staffId = parseInt(req.params["id"] as string);

      if (isNaN(staffId)) {
        res.status(400).json({
          success: false,
          message: "Invalid staff ID",
        });
        return;
      }

      const result = await staffService.getStaffById(staffId);
      
      // Validate school access
      if (result.success && result.staff) {
        try {
          validateSchoolAccess(req, (result.staff as any).schoolId);
        } catch (error: any) {
          res.status(403).json({ success: false, message: error.message });
          return;
        }
      }

      res.status(result.success ? 200 : result.message.includes("not found") ? 404 : 500).json(result);
    } catch (error) {
      logger.error("Error in getStaffById controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Resend staff onboarding email with new credentials (pending invites only)
   */
  async resendStaffInvite(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        res.status(400).json({ success: false, message: error?.message ?? "School context is required" });
        return;
      }

      const staffId = parseInt(req.params["id"] as string, 10);
      if (isNaN(staffId)) {
        res.status(400).json({ success: false, message: "Invalid staff ID" });
        return;
      }

      const preview = await staffService.getStaffById(staffId);
      if (!preview.success || !preview.staff) {
        res.status(404).json({ success: false, message: "Staff not found" });
        return;
      }

      try {
        validateSchoolAccess(req, (preview.staff as any).schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const result = await staffService.resendStaffInvite(staffId, schoolId);

      if (result.success && preview.staff && req.user) {
        const name = (preview.staff as any).name ?? "Staff";
        await activityLogger.log({
          userId: req.user.id,
          resource: "staff",
          action: "update",
          title: "Staff invite resent",
          description: `Invite resent for "${name}" (staff #${staffId}) by ${req.user.name}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(
        result.success
          ? 200
          : result.message.includes("not found")
            ? 404
            : result.message.includes("does not belong")
              ? 403
              : result.message.includes("already completed")
                ? 400
                : 400
      ).json(result);
    } catch (error) {
      logger.error("Error in resendStaffInvite controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Update staff details
   */
  async updateStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const staffId = parseInt(req.params["id"] as string);
      requireSchoolId(req);

      if (isNaN(staffId)) {
        res.status(400).json({
          success: false,
          message: "Invalid staff ID",
        });
        return;
      }

      // First get the staff to validate school access
      const existingStaff = await staffService.getStaffById(staffId);
      if (!existingStaff.success || !existingStaff.staff) {
        res.status(404).json({
          success: false,
          message: "Staff not found",
        });
        return;
      }

      // Validate school access against the staff's schoolId (from Staff table)
      try {
        validateSchoolAccess(req, (existingStaff.staff as any).schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const data: UpdateStaffData = req.body;
      
      // Map assignedClasses to assignedClassroom for backward compatibility
      if ((req.body as any).assignedClasses && !data.assignedClassroom) {
        data.assignedClassroom = (req.body as any).assignedClasses;
      }

      // If schoolId is being updated, validate it matches user's school context
      if (typeof data.schoolId === "number") {
        try {
          validateSchoolAccess(req, data.schoolId);
        } catch (error: any) {
          res.status(403).json({ success: false, message: error.message });
          return;
        }
      }

      const result = await staffService.updateStaff(staffId, data);

      // Log activity
      if (result.success && (result as any).staff && req.user) {
        const staff = (result as any).staff;
        await activityLogger.log({
          userId: req.user.id,
          resource: "staff",
          action: "update",
          title: "Staff updated",
          description: `Staff "${staff.name}" #${staffId} updated by ${req.user.name}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error in updateStaff controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Delete staff
   */
  async deleteStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const staffId = parseInt(req.params["id"] as string);

      if (isNaN(staffId)) {
        res.status(400).json({
          success: false,
          message: "Invalid staff ID",
        });
        return;
      }

      // Get staff details before deletion
      const staffResult = await staffService.getStaffById(staffId);
      
      if (!staffResult.success || !staffResult.staff) {
        res.status(404).json({
          success: false,
          message: "Staff not found",
        });
        return;
      }

      // Validate school access
      try {
        validateSchoolAccess(req, (staffResult.staff as any).schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const result = await staffService.deleteStaff(staffId);

      // Log activity
      if (result.success && staffResult.success && (staffResult as any).staff && req.user) {
        const staff = (staffResult as any).staff;
        await activityLogger.log({
          userId: req.user.id,
          resource: "staff",
          action: "delete",
          title: "Staff deleted",
          description: `Staff "${staff.name}" #${staffId} deleted by ${req.user.name}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error in deleteStaff controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * UpdateStaffStatus 
   */
  async suspendStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const staffId = parseInt(req.params["id"] as string);       
      const { status } = req.body;

      // Get staff details before suspension
      const staffResult = await staffService.getStaffById(staffId);
      
      if (!staffResult.success || !staffResult.staff) {
        res.status(404).json({
          success: false,
          message: "Staff not found",
        });
        return;
      }

      // Validate school access
      try {
        validateSchoolAccess(req, (staffResult.staff as any).schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const result = await staffService.updateTeacherStatus({ status, staffId });

      // Log activity
      if (result.success && staffResult.success && (staffResult as any).staff && req.user) {
        const staff = (staffResult as any).staff;
        await activityLogger.log({
          userId: req.user.id,
          resource: "staff",
          action: "suspension",
          title: "Staff suspended",
          description: `Staff "${staff.name}" #${staffId} suspended by ${req.user.name}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error in suspending staff controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      })
    }
  }

  /**
   * List staff with filtering, search, and pagination
   */
  async listStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Get schoolId from the authenticated user's request object
      const userSchoolId = requireSchoolId(req);
      
      // Validate that if schoolId is provided in query, it matches user's schoolId
      if (req.query["schoolId"] && Number(req.query["schoolId"]) !== userSchoolId) {
        res.status(403).json({ success: false, message: "User does not belong to this school" });
        return;
      }

      // Validate that if school is provided in query, it matches user's schoolId
      if (req.query["school"] && Number(req.query["school"]) !== userSchoolId) {
        res.status(403).json({ success: false, message: "User does not belong to this school" });
        return;
      }

      const filters: StaffSearchFilters = {
        ...(req.query["search"] && { search: req.query["search"] as string }),
        ...(req.query["role"] && { role: req.query["role"] as string }),
        schoolId: userSchoolId, // Always use schoolId from request object (user's schoolId)
        ...(req.query["classroom"] && { classroom: req.query["classroom"] as string }),
        ...(req.query["qualification"] && { qualification: req.query["qualification"] as string }),
        ...(req.query["status"] && { status: req.query["status"] as StaffStatus }),
        ...(req.query["pos"] && { pos: parseInt(req.query["pos"] as string, 10) }),
        ...(req.query["delta"] && { delta: parseInt(req.query["delta"] as string, 10) }),
        ...(req.query["sortBy"] && { sortBy: req.query["sortBy"] as string }),
        ...(req.query["sortOrder"] && { sortOrder: (req.query["sortOrder"] as string).toUpperCase() as "ASC" | "DESC" }),
      };
      const result = await staffService.listStaff(filters);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error in listStaff controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Kiosk verify staff by ID/email and PIN
   */
  async kioskVerify(req: any, res: Response): Promise<void> {
    try {
      const { id, pin } = req.body;

      if (!id) {
        res.status(400).json({ success: false, message: "ID is required (can be staff ID or email)" });
        return;
      }

      if (!pin) {
        res.status(400).json({ success: false, message: "PIN is required" });
        return;
      }

      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch {
        res.status(400).json({
          success: false,
          message: "School context is required for kiosk verification. Use subdomain or X-School-ID header.",
        });
        return;
      }

      const result = await staffService.kioskVerify(id, pin, schoolId);
      
      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      // Return the same response format as getStaffById
      res.json(result);
    } catch (error) {
      logger.error("Error in kioskVerify controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

export const staffController = new StaffController();
