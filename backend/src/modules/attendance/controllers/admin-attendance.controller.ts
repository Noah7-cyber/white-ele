import { Response } from "express";
import { AuthenticatedRequest } from "../../auth";
import {
  ClockInAdmin,
  ClockOutAdmin,
  AdminAttendanceFilters,
  adminAttendanceService,
  AdminAttendanceSummary,
  CreateAdminAttendance,
  UpdateAdminAttendance,
} from "../services/admin-attendance.service";
import { logger } from "../../shared";
import { activityLogger } from "../../shared/services/activity-logger.service";
import { requireSchoolId, validateSchoolAccess } from "../../shared/utils/tenant-context";
import { adminService } from "../../admin/services/admin.service";

export class AdminAttendanceController {
  async clockIn(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data: ClockInAdmin = req.body;

      const adminResult = await adminService.getAdminById(data.adminId);
      if (!adminResult.success || !adminResult.admin) {
        res.status(404).json({ success: false, message: "Admin not found" });
        return;
      }

      try {
        validateSchoolAccess(req, (adminResult.admin as any).schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const result = await adminAttendanceService.clockIn({
        date: data.date,
        notes: data.notes,
        adminId: data.adminId,
        schoolId: requireSchoolId(req),
      });

      if (result.success && result.attendance) {
        await activityLogger.logFromRequest(req, {
          userId: req.user.id,
          resource: "admin_attendance",
          action: "clock_in",
          title: `Admin clocked in #${result.attendance.id}`,
          metadata: {
            attendanceId: result.attendance.id,
            adminId: result.attendance.adminId,
            timeIn: result.attendance.timeIn,
            date: result.attendance.date,
          },
        });
      }

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error("Error clocking in admin", error);
      res.status(500).json({ success: false, message: "Failed to clock in admin" });
    }
  }

  async clockOut(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data: ClockOutAdmin = req.body;

      const adminResult = await adminService.getAdminById(data.adminId);
      if (!adminResult.success || !adminResult.admin) {
        res.status(404).json({ success: false, message: "Admin not found" });
        return;
      }

      try {
        validateSchoolAccess(req, (adminResult.admin as any).schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const result = await adminAttendanceService.clockOut({
        adminId: data.adminId,
        timeOut: data.timeOut,
        notes: data.notes,
        schoolId: requireSchoolId(req),
      });

      if (result.success && result.attendance) {
        await activityLogger.logFromRequest(req, {
          userId: req.user.id,
          resource: "admin_attendance",
          action: "clock_out",
          title: `Admin clocked out #${result.attendance.id}`,
          metadata: {
            attendanceId: result.attendance.id,
            adminId: result.attendance.adminId,
            timeOut: result.attendance.timeOut,
            date: result.attendance.date,
          },
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error clocking out admin", error);
      res.status(500).json({ success: false, message: "Failed to clock out admin" });
    }
  }

  async recordAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminResult = await adminService.getAdminById(req.body.adminId);
      if (!adminResult.success || !adminResult.admin) {
        res.status(404).json({ success: false, message: "Admin not found" });
        return;
      }

      try {
        validateSchoolAccess(req, (adminResult.admin as any).schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const payload: CreateAdminAttendance = {
        ...req.body,
      };

      const result = await adminAttendanceService.recordAttendance(payload);

      if (result.success && result.attendance) {
        await activityLogger.logFromRequest(req, {
          userId: req.user.id,
          resource: "admin_attendance",
          action: "create",
          title: `Recorded admin attendance #${result.attendance.id}`,
          metadata: {
            attendanceId: result.attendance.id,
            adminId: result.attendance.adminId,
            status: result.attendance.status,
            date: result.attendance.date,
          },
        });
      }

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error("Error recording admin attendance", error);
      res.status(500).json({ success: false, message: "Failed to record admin attendance" });
    }
  }

  async updateAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const attendanceId = Number(req.params["id"]);

      const existingAttendance = await adminAttendanceService.getAttendanceById(attendanceId);
      if (!existingAttendance.success || !existingAttendance.attendance) {
        res.status(404).json({ success: false, message: "Attendance not found" });
        return;
      }

      if (!(existingAttendance.attendance as any).adminId) {
        res.status(400).json({ success: false, message: "Attendance record missing admin ID" });
        return;
      }

      const adminResult = await adminService.getAdminById((existingAttendance.attendance as any).adminId);
      if (adminResult.success && adminResult.admin && (adminResult.admin as any).schoolId) {
        try {
          validateSchoolAccess(req, (adminResult.admin as any).schoolId);
        } catch (error: any) {
          res.status(403).json({ success: false, message: error.message });
          return;
        }
      }

      const payload: UpdateAdminAttendance = req.body;

      const result = await adminAttendanceService.updateAttendance(attendanceId, payload, req.user.id);

      if (result.success && result.attendance) {
        await activityLogger.logFromRequest(req, {
          userId: req.user.id,
          resource: "admin_attendance",
          action: "update",
          title: `Updated admin attendance #${attendanceId}`,
          metadata: { attendanceId, status: result.attendance.status },
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error updating admin attendance", error);
      res.status(500).json({ success: false, message: "Failed to update admin attendance" });
    }
  }

  async getAttendanceSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userSchoolId = requireSchoolId(req);
      const filters: AdminAttendanceSummary = {
        schoolId: userSchoolId,
        adminId: Number(req.query["adminId"]),
        status: req.query["status"] as any,
        startDate: req.query["startDate"] as string,
        endDate: req.query["endDate"] as string,
      };

      const result = await adminAttendanceService.getAdminAttendanceSummary(filters);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error retrieving admin attendance summary", error);
      res.status(500).json({ success: false, message: "Failed to retrieve admin attendance summary" });
    }
  }

  async getAttendanceById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const attendanceId = Number(req.params["id"]);
      const result = await adminAttendanceService.getAttendanceById(attendanceId);

      if (result.success && result.attendance && (result.attendance as any).adminId) {
        const adminResult = await adminService.getAdminById((result.attendance as any).adminId);
        if (adminResult.success && adminResult.admin && (adminResult.admin as any).schoolId) {
          try {
            validateSchoolAccess(req, (adminResult.admin as any).schoolId);
          } catch (error: any) {
            res.status(403).json({ success: false, message: error.message });
            return;
          }
        }
      }

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error("Error retrieving admin attendance", error);
      res.status(500).json({ success: false, message: "Failed to retrieve admin attendance" });
    }
  }

  async listAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userSchoolId = requireSchoolId(req);

      if (req.query["schoolId"] && Number(req.query["schoolId"]) !== userSchoolId) {
        res.status(403).json({ success: false, message: "User does not belong to this school" });
        return;
      }

      const filters: AdminAttendanceFilters = {
        adminId: req.query["adminId"] as unknown as number | undefined,
        search: req.query["search"] as string | undefined,
        status: req.query["status"] as any,
        startDate: req.query["startDate"] as any,
        endDate: req.query["endDate"] as any,
        pos: req.query["pos"] as unknown as number | undefined,
        schoolId: userSchoolId,
      };
      if (req.query["delta"] !== undefined) {
        filters.delta = req.query["delta"] as unknown as number | undefined;
      }

      const result = await adminAttendanceService.listAttendance(filters);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error listing admin attendance", error);
      res.status(500).json({ success: false, message: "Failed to list admin attendance" });
    }
  }

  async deleteAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const attendanceId = Number(req.params["id"]);

      const existingAttendance = await adminAttendanceService.getAttendanceById(attendanceId);
      if (!existingAttendance.success || !existingAttendance.attendance) {
        res.status(404).json({ success: false, message: "Attendance not found" });
        return;
      }

      if (!(existingAttendance.attendance as any).adminId) {
        res.status(400).json({ success: false, message: "Attendance record missing admin ID" });
        return;
      }

      const adminResult = await adminService.getAdminById((existingAttendance.attendance as any).adminId);
      if (adminResult.success && adminResult.admin && (adminResult.admin as any).schoolId) {
        try {
          validateSchoolAccess(req, (adminResult.admin as any).schoolId);
        } catch (error: any) {
          res.status(403).json({ success: false, message: error.message });
          return;
        }
      }

      const result = await adminAttendanceService.deleteAttendance(attendanceId);

      if (result.success) {
        await activityLogger.logFromRequest(req, {
          userId: req.user.id,
          resource: "admin_attendance",
          action: "delete",
          title: `Deleted admin attendance #${attendanceId}`,
          metadata: { attendanceId },
        });
      }

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error("Error deleting admin attendance", error);
      res.status(500).json({ success: false, message: "Failed to delete admin attendance" });
    }
  }
}

export const adminAttendanceController = new AdminAttendanceController();
