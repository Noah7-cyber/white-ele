import { Response } from "express";
import { AuthenticatedRequest } from "../../auth";
import {
  ClockOutStaff,
  ClockInStaff,
  StaffAttendanceFilters,
  staffAttendanceService,
  StaffAttendanceSummary,
  CreateStaffAttendance,
  UpdateStaffAttendance
} from "../services/staff-attendance.service";
import { logger } from "../../shared";
import { activityLogger } from "../../shared/services/activity-logger.service";
import { requireSchoolId, validateSchoolAccess } from "../../shared/utils/tenant-context";
import { staffService } from "../../staff/services/staff.service";


export class StaffAttendanceController {


  async clockIn(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data: ClockInStaff = req.body;

      // Validate that staff belongs to user's school
      const staffResult = await staffService.getStaffById(data.teacherId);
      if (!staffResult.success || !staffResult.staff) {
        res.status(404).json({ success: false, message: "Staff not found" });
        return;
      }

      try {
        validateSchoolAccess(req, (staffResult.staff as any).schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const result = await staffAttendanceService.clockIn(
        {
          date: data.date,
          notes: data.notes,
          teacherId: data.teacherId,
          schoolId: requireSchoolId(req),
        }
      );

      if (result.success && result.attendance) {
        await activityLogger.logFromRequest(req, {
          userId: req.user.id,
          resource: "staff_attendance",
          action: "clock_in",
          title: `Staff clocked in #${result.attendance.id}`,
          metadata: {
            attendanceId: result.attendance.id,
            teacherId: result.attendance.teacherId,
            timeIn: result.attendance.timeIn,
            date: result.attendance.date,
          },
        });
      }

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error("Error clocking in staff", error);
      res.status(500).json({
        success: false,
        message: "Failed to clock in staff",
      });
    }
  }

  async clockOut(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data: ClockOutStaff = req.body;

      // Validate that staff belongs to user's school
      const staffResult = await staffService.getStaffById(data.teacherId);
      if (!staffResult.success || !staffResult.staff) {
        res.status(404).json({ success: false, message: "Staff not found" });
        return;
      }

      try {
        validateSchoolAccess(req, (staffResult.staff as any).schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const result = await staffAttendanceService.clockOut(
        {
          teacherId: data.teacherId,
          timeOut: data.timeOut,
          schoolId: requireSchoolId(req)
        }
      );

      if (result.success && result.attendance) {
        await activityLogger.logFromRequest(req, {
          userId: req.user.id,
          resource: "staff_attendance",
          action: "clock_out",
          title: `Staff clocked out #${result.attendance.id}`,
          metadata: {
            attendanceId: result.attendance.id,
            teacherId: result.attendance.teacherId,
            timeOut: result.attendance.timeOut,
            date: result.attendance.date,
          },
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error clocking out staff", error);
      res.status(500).json({
        success: false,
        message: "Failed to clock out staff",
      });
    }
  }


  async recordAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate that staff belongs to user's school
      const staffResult = await staffService.getStaffById(req.body.teacherId);
      if (!staffResult.success || !staffResult.staff) {
        res.status(404).json({ success: false, message: "Staff not found" });
        return;
      }

      try {
        validateSchoolAccess(req, (staffResult.staff as any).schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const payload: CreateStaffAttendance = {
        ...req.body,
        recordedByUserId: req.user.id,
      };

      const result = await staffAttendanceService.recordAttendance(payload);

      if (result.success && result.attendance) {
        await activityLogger.logFromRequest(req, {
          userId: req.user.id,
          resource: "staff_attendance",
          action: "create",
          title: `Recorded staff attendance #${result.attendance.id}`,
          metadata: {
            attendanceId: result.attendance.id,
            teacherId: result.attendance.teacherId,
            status: result.attendance.status,
            date: result.attendance.date,
          },
        });
      }

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error("Error recording staff attendance", error);
      res.status(500).json({
        success: false,
        message: "Failed to record staff attendance",
      });
    }
  }

  async updateAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const attendanceId = Number(req.params["id"]);

      // First get the attendance to validate school access
      const existingAttendance = await staffAttendanceService.getAttendanceById(attendanceId);
      if (!existingAttendance.success || !existingAttendance.attendance) {
        res.status(404).json({ success: false, message: "Attendance not found" });
        return;
      }

      // Validate school access via staff
      if (!existingAttendance.attendance.teacherId) {
        res.status(400).json({ success: false, message: "Attendance record missing teacher ID" });
        return;
      }

      const staffResult = await staffService.getStaffById(existingAttendance.attendance.teacherId);
      if (staffResult.success && staffResult.staff && (staffResult.staff as any).schoolId) {
        try {
          validateSchoolAccess(req, (staffResult.staff as any).schoolId);
        } catch (error: any) {
          res.status(403).json({ success: false, message: error.message });
          return;
        }
      }

      const payload: UpdateStaffAttendance = req.body;

      const result = await staffAttendanceService.updateAttendance(attendanceId, payload, req.user.id);

      if (result.success && result.attendance) {
        await activityLogger.logFromRequest(req, {
          userId: req.user.id,
          resource: "staff_attendance",
          action: "update",
          title: `Updated staff attendance #${attendanceId}`,
          metadata: {
            attendanceId,
            status: result.attendance.status,
          },
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error updating staff attendance", error);
      res.status(500).json({
        success: false,
        message: "Failed to update staff attendance",
      });
    }
  }

  async getAttendanceSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userSchoolId = requireSchoolId(req);
      const filters: StaffAttendanceSummary = {
        schoolId: userSchoolId,
        teacherId: Number(req.query["teacherId"]),
        classroomId: req.query["classroomId"] ? Number(req.query["classroomId"]) : undefined,
        status: req.query["status"] as any,
        startDate: req.query["startDate"] as string,
        endDate: req.query["endDate"] as string,
      };

      const result = await staffAttendanceService.getStaffAttendanceSummary(filters);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error retrieving staff attendance summary", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve staff attendance summary",
      });
    }
  }

  async getAttendanceById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const attendanceId = Number(req.params["id"]);
      const result = await staffAttendanceService.getAttendanceById(attendanceId)

      // Validate school access
      if (result.success && result.attendance && result.attendance.teacherId) {
        const staffResult = await staffService.getStaffById(result.attendance.teacherId);
        if (staffResult.success && staffResult.staff && (staffResult.staff as any).schoolId) {
          try {
            validateSchoolAccess(req, (staffResult.staff as any).schoolId);
          } catch (error: any) {
            res.status(403).json({ success: false, message: error.message });
            return;
          }
        }
      }

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error("Error retrieving staff attendance", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve staff attendance",
      });
    }
  }

  async listAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {

      const userSchoolId = requireSchoolId(req);

      if (req.query["schoolId"] && Number(req.query["schoolId"]) !== userSchoolId) {
        res.status(403).json({ success: false, message: "User does not belong to this school" });
        return;
      }

      const filters: StaffAttendanceFilters = {
        teacherId: req.query["teacherId"] as number | undefined,
        studentId: req.query["studentId"] as number | undefined,
        search: req.query["search"] as string | undefined,
        classroomId: req.query["classroomId"] as number | undefined,
        status: req.query["status"] as any,
        startDate: req.query["startDate"] as any,
        endDate: req.query["endDate"] as any,
        pos: req.query["pos"] as unknown as number | undefined,
        schoolId: userSchoolId,
      };
      if (req.query["delta"] !== undefined) {
        filters.delta = req.query["delta"] as unknown as number | undefined;
      }

      const result = await staffAttendanceService.listAttendance(filters);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error listing staff attendance", error);
      res.status(500).json({
        success: false,
        message: "Failed to list staff attendance",
      });
    }
  }

  async deleteAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const attendanceId = Number(req.params["id"]);

      // First get the attendance to validate school access
      const existingAttendance = await staffAttendanceService.getAttendanceById(attendanceId);
      if (!existingAttendance.success || !existingAttendance.attendance) {
        res.status(404).json({ success: false, message: "Attendance not found" });
        return;
      }

      // Validate school access via staff
      if (!existingAttendance.attendance.teacherId) {
        res.status(400).json({ success: false, message: "Attendance record missing teacher ID" });
        return;
      }

      const staffResult = await staffService.getStaffById(existingAttendance.attendance.teacherId);
      if (staffResult.success && staffResult.staff && (staffResult.staff as any).schoolId) {
        try {
          validateSchoolAccess(req, (staffResult.staff as any).schoolId);
        } catch (error: any) {
          res.status(403).json({ success: false, message: error.message });
          return;
        }
      }

      const result = await staffAttendanceService.deleteAttendance(attendanceId);

      if (result.success) {
        await activityLogger.logFromRequest(req, {
          userId: req.user.id,
          resource: "staff_attendance",
          action: "delete",
          title: `Deleted staff attendance #${attendanceId}`,
          metadata: {
            attendanceId,
          },
        });
      }

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error("Error deleting staff attendance", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete staff attendance",
      });
    }
  }


}

export const staffAttendanceController = new StaffAttendanceController();

