import { Response } from "express";
import { AuthenticatedRequest } from "../../auth";
import {
  classroomActivityService,
  CreateClassroomActivityInput,
  ClassroomActivityFilters,
  UpdateClassroomActivityInput,
} from "../services/classroom-activity.service";
import { activityLogger } from "../../shared/services/activity-logger.service";
import { logger } from "../../shared";
import { ActivityType } from "../../shared";
import { requireSchoolId, validateSchoolAccess } from "../../shared/utils/tenant-context";
import { classroomService } from "../../classroom/services/classroom.service";

export class ClassroomActivityController {
  constructor() { }

  async createActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const activityType = req.body.activityType as ActivityType;

      let studentIds: number[] = [];
      if (req.body.studentIds && Array.isArray(req.body.studentIds)) {
        studentIds = req.body.studentIds.map((id: any) => Number(id));
      } else if (req.body.studentId) {
        studentIds = [Number(req.body.studentId)];
      }

      let creatorId: number | null = null;
      let creatorType: "STAFF" | "USER" | null = null;

      creatorId = Number(req.user.id);
      const staffAccount = Array.isArray(req.user.staff) ? (req.user as any).staff?.[0] : (req.user as any).staff;
      creatorType = staffAccount?.id ? "STAFF" : "USER";

      if (!creatorId || isNaN(creatorId)) {
        res.status(400).json({
          success: false,
          message: "Creator could not be determined from the logged-in user",
        });
        return;
      }

      // Validate that classroom belongs to user's school
      const classroomResult = await classroomService.getClassroomById(req.body.classroomId);
      if (!classroomResult.success || !classroomResult.classroom) {
        res.status(404).json({ success: false, message: "Classroom not found" });
        return;
      }

      try {
        validateSchoolAccess(req, classroomResult.classroom.schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const basePayload = {
        activityType,
        studentIds,
        creatorId,
        creatorType,
        classroomId: req.body.classroomId,
        notes: req.body.notes,
        notifyParent: req.body.notifyParent ?? false,
      };

      let payload: CreateClassroomActivityInput;

      switch (activityType) {
        case ActivityType.MEAL:
          payload = {
            ...basePayload,
            activityType: ActivityType.MEAL,
            mealType: req.body.mealType,
            timeGiven: req.body.timeGiven ?? req.body.time,
            foodItem: req.body.foodItem,
          } as CreateClassroomActivityInput;
          break;
        case ActivityType.NAP:
          payload = {
            ...basePayload,
            activityType: ActivityType.NAP,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
          } as CreateClassroomActivityInput;
          break;
        case ActivityType.MEDICATION:
          payload = {
            ...basePayload,
            activityType: ActivityType.MEDICATION,
            medicationName: req.body.medicationName,
            dosage: req.body.dosage,
            timeGiven: req.body.timeGiven ?? req.body.time,
          } as CreateClassroomActivityInput;
          break;
        case ActivityType.BATHROOM:
          payload = {
            ...basePayload,
            activityType: ActivityType.BATHROOM,
            bathroomType: req.body.bathroomType,
            time: req.body.time ?? req.body.timeGiven,
          } as CreateClassroomActivityInput;
          break;
        case ActivityType.WATER:
          payload = {
            ...basePayload,
            activityType: ActivityType.WATER,
            timeGiven: req.body.timeGiven ?? req.body.time,
          } as CreateClassroomActivityInput;
          break;
        case ActivityType.PHOTO:
          payload = {
            ...basePayload,
            activityType: ActivityType.PHOTO,
            photoUrl: req.body.photoUrl
          } as CreateClassroomActivityInput;
          break;
        default:
          res.status(400).json({
            success: false,
            message: "Invalid activity type",
          });
          return;
      }

      const result = await classroomActivityService.createActivity(payload);

      if (result.success && result.activities && req.user) {
        for (const activity of result.activities) {
          await activityLogger.log({
            userId: req.user.id,
            resource: "classroomActivity",
            action: "create",
            title: `Activity created: ${activity.activityType}`,
            description: `Activity for student #${activity.id} created by ${creatorType} #${creatorId}`,
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
          });
        }
      }

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      console.log("Error in createActivity controller:", error);
      logger.error("Error in createMealLog controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getActivityById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const activityId = Number(req.params["id"]);

      if (isNaN(activityId)) {
        res.status(400).json({
          success: false,
          message: "Invalid activity ID",
        });
        return;
      }

      const result = await classroomActivityService.getActivityById(activityId);

      // Validate school access via student
      if (result.success && result.activity) {
        const { validateSchoolAccess } = await import("../../shared/utils/tenant-context");
        const { studentService } = await import("../../student/services/student.service");
        const studentId = result.activity.students?.[0]?.id;
        if (studentId) {
          const student = await studentService.getStudentById(studentId);
          if (student && (student as any).schoolId) {
            try {
              validateSchoolAccess(req, (student as any).schoolId);
            } catch (error: any) {
              res.status(403).json({ success: false, message: error.message });
              return;
            }
          }
        }
      }

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      console.log("Error in getActivityById controller:", error);
      logger.error("Error in getActivityById controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async listActivities(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {

      const userSchoolId = requireSchoolId(req);

      // Validate that if schoolId is provided in query, it matches user's schoolId
      if (req.query["schoolId"] && Number(req.query["schoolId"]) !== userSchoolId) {
        res.status(403).json({ success: false, message: "User does not belong to this school" });
        return;
      }

      const filters: ClassroomActivityFilters = {
        ...(req.query["activityType"] && { activityType: req.query["activityType"] as ActivityType }),
        schoolId: userSchoolId,
        ...(req.query["studentId"] && { studentId: Number(req.query["studentId"]) }),
        ...(req.query["classroomId"] && { classroomId: Number(req.query["classroomId"]) }),
        ...(req.query["teacherId"] && { teacherId: Number(req.query["teacherId"]) }),
        ...(req.query["creatorId"] && { creatorId: Number(req.query["creatorId"]) }),
        ...(req.query["parentId"] && { parentId: Number(req.query["parentId"]) }),
        ...(req.query["startDate"] && { startDate: req.query["startDate"] as string }),
        ...(req.query["endDate"] && { endDate: req.query["endDate"] as string }),
        ...(req.query["pos"] && { pos: Number(req.query["pos"]) }),
        ...(req.query["delta"] && { delta: Number(req.query["delta"]) }),
        ...(req.query["sortBy"] && { sortBy: req.query["sortBy"] as string }),
        ...(req.query["sortOrder"] && { sortOrder: req.query["sortOrder"] as "ASC" | "DESC" }),
      };
      const result = await classroomActivityService.listActivities(filters);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error in listActivities controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }


  async updateActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const activityId = Number(req.params["id"]);

      if (isNaN(activityId)) {
        res.status(400).json({ 
          success: false,
          message: "Invalid activity ID",
        });
        return;
      }

      // First get the activity to validate school access
      const existingActivity = await classroomActivityService.getActivityById(activityId);
      if (!existingActivity.success || !existingActivity.activity) {
        res.status(404).json({ success: false, message: "Activity not found" });
        return;
      }

      // Validate school access via student
      const { validateSchoolAccess } = await import("../../shared/utils/tenant-context");
      const { studentService } = await import("../../student/services/student.service");
      // Get studentId from the classroom student activity
      const studentId = existingActivity.activity?.students?.[0]?.id;

      if (!studentId) {
        res.status(400).json({ success: false, message: "Could not determine student for this activity" });
        return;
      }

      const student = await studentService.getStudentById(studentId);
      if (student && (student as any).schoolId) {
        try {
          validateSchoolAccess(req, (student as any).schoolId);
        } catch (error: any) {
          res.status(403).json({ success: false, message: error.message });
          return;
        }
      }

      const payload: UpdateClassroomActivityInput = {
        ...(req.body.activityType && { activityType: req.body.activityType }),
        ...(req.body.studentId && { studentId: Number(req.body.studentId) }),
        ...(req.body.teacherId && { teacherId: Number(req.body.teacherId) }),
        ...(req.body.mealType && { mealType: req.body.mealType }),
        ...(req.body.foodItem && { foodItem: req.body.foodItem }),
        ...(req.body.timeGiven && { timeGiven: req.body.timeGiven }),
        ...(req.body.time && { time: req.body.time }),
        ...(req.body.startTime && { startTime: req.body.startTime }),
        ...(req.body.endTime && { endTime: req.body.endTime }),
        ...(req.body.medicationName && { medicationName: req.body.medicationName }),
        ...(req.body.dosage && { dosage: req.body.dosage }),
        ...(req.body.bathroomType && { bathroomType: req.body.bathroomType }),
        ...(req.body.foodItem && { foodItem: req.body.foodItem }),
        ...(req.body.notes && { notes: req.body.notes }),
        ...(typeof req.body.notifyParent !== "undefined" && { notifyParent: Boolean(req.body.notifyParent) }),
      };

      const result = await classroomActivityService.updateActivity(activityId, payload)

      if (result.success && result.activity && req.user) {
        const activity = result.activity as any;
        await activityLogger.log({
          userId: req.user.id,
          resource: "classroomActivity",
          action: "update",
          title: `Activity updated: ${activity.classroomActivity?.activityType}`,
          description: `Activity for student #${activity.student?.id}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error in updateActivity controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async deleteActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const activityId = parseInt(req.params["id"] as string, 10);

      if (isNaN(activityId)) {
        res.status(400).json({
          success: false,
          message: "Invalid activity ID",
        });
        return;
      }

      const existing = await classroomActivityService.getActivityById(activityId);

      if (!existing.success || !existing.activity) {
        res.status(404).json({ success: false, message: "Activity not found" });
        return;
      }

      // Validate school access via student
      const { validateSchoolAccess } = await import("../../shared/utils/tenant-context");
      const { studentService } = await import("../../student/services/student.service");
      const studentId = existing.activity.students?.[0]?.id;
      const student = studentId ? await studentService.getStudentById(studentId) : null;
      if (student && (student as any).schoolId) {
        try {
          validateSchoolAccess(req, (student as any).schoolId);
        } catch (error: any) {
          res.status(403).json({ success: false, message: error.message });
          return;
        }
      }

      const result = await classroomActivityService.deleteActivity(activityId)

      if (result.success && existing.success && existing.activity && req.user) {
        const activity = existing.activity;
        await activityLogger.log({
          userId: req.user.id,
          resource: "classroomActivity",
          action: "delete",
          title: `Activity deleted: ${activity.activityType}`,
          description: `Activity for student #${activity.studentId}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error in deleteActivity controller:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

export const classroomActivityController = new ClassroomActivityController();
