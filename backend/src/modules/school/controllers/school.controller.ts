import { Response } from "express";
import { AuthenticatedRequest } from "../../auth";
import { activityLogger } from "../../shared/services/activity-logger.service";
import {
  CreateSchoolData,
  SchoolSearchFilters,
  UpdateSchoolData,
  schoolService,
} from "../services/school.service";
import { logger } from "../../shared";
import { validateSchoolAccess } from "../../shared/utils/tenant-context";
import { UserRole } from "../../shared/entities/EntityEnums";

class SchoolController {
  async createSchool(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data: CreateSchoolData = {
        ...req.body,
        userId: req.user.id
      };

      const result = await schoolService.createSchool(data);

      if (result.success && result.school && req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "school",
          action: "create",
          title: `Created school: ${result.school.schoolName || result.school.id}`,
          description: `School "${result.school.schoolName ?? result.school.id}" created`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error("Failed to create school", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while creating the school.",
      });
    }
  }

  async getSchoolById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = parseInt(req.params["id"] as string, 10);

      if (isNaN(schoolId)) {
        res.status(400).json({
          success: false,
          message: "Invalid school ID",
        });
        return;
      }

      // Validate school access
      try {
        validateSchoolAccess(req, schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const result = await schoolService.getSchoolById(schoolId);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error("Error retrieving school", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async listSchools(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sortOrder = typeof req.query["sortOrder"] === "string"
        ? (req.query["sortOrder"] as string).toUpperCase() as "ASC" | "DESC"
        : undefined;

      const filters: SchoolSearchFilters = {
        ...(req.query["schoolName"] && { schoolName: req.query["schoolName"] as string }),
        ...(typeof req.query["pos"] !== "undefined" && { pos: Number(req.query["pos"]) }),
        ...(typeof req.query["delta"] !== "undefined" && { delta: Number(req.query["delta"]) }),
        ...(req.query["sortBy"] && { sortBy: req.query["sortBy"] as string }),
        ...(sortOrder && { sortOrder }),
      };

      const result = await schoolService.listSchools(filters);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error listing schools", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async updateSchool(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = parseInt(req.params["id"] as string, 10);

      if (isNaN(schoolId)) {
        res.status(400).json({
          success: false,
          message: "Invalid school ID",
        });
        return;
      }

      // Validate school access
      try {
        validateSchoolAccess(req, schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const data: UpdateSchoolData = req.body;
      const result = await schoolService.updateSchool(schoolId, data);

      if (result.success && result.school && req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "school",
          action: "update",
          title: `Updated school: ${result.school.schoolName || result.school.id}`,
          description: `School "${result.school.schoolName ?? result.school.id}" updated`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error updating school", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async deleteSchool(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = parseInt(req.params["id"] as string, 10);

      if (isNaN(schoolId)) {
        res.status(400).json({
          success: false,
          message: "Invalid school ID",
        });
        return;
      }

      // Validate school access
      try {
        validateSchoolAccess(req, schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const schoolBeforeDelete = await schoolService.getSchoolById(schoolId);
      const result = await schoolService.deleteSchool(schoolId);

      if (result.success && schoolBeforeDelete.success && schoolBeforeDelete.school && req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "school",
          action: "delete",
          title: `Deleted school: ${schoolBeforeDelete.school.schoolName || schoolId}`,
          description: `School "${schoolBeforeDelete.school.schoolName ?? schoolId}" deleted`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error deleting school", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getSchool(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {

      const userId = req.user.id

      if (!userId) {
        res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
        return;
      }

      const includePaystackSecret =
        req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.SUPER_ADMIN;
      const result = await schoolService.getSchool(userId, { includePaystackSecret });
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error("Error retrieving school", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getNotificationSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = parseInt(req.params["schoolId"] as string, 10);
      if (isNaN(schoolId)) {
        res.status(400).json({ success: false, message: "Invalid school ID" });
        return;
      }

      // Validate school access
      try {
        validateSchoolAccess(req, schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const result = await schoolService.getNotificationSettings(schoolId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error retrieving notification settings", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  async updateNotificationSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = parseInt(req.params["schoolId"] as string, 10);
      if (isNaN(schoolId)) {
        res.status(400).json({ success: false, message: "Invalid school ID" });
        return;
      }

      // Validate school access
      try {
        validateSchoolAccess(req, schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const result = await schoolService.updateNotificationSettings(schoolId, req.body);

      if (result.success && req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "school_notification_settings",
          action: "update",
          title: `Updated notification settings for school ${schoolId}`,
          description: `Notification settings for school ID ${schoolId} updated`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error updating notification settings", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}

export const schoolController = new SchoolController();
