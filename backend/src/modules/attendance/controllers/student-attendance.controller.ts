import { Response } from "express";
import { AuthenticatedRequest } from "../../auth";
import {
  ClockOutStudent,
  StudentAttendanceFilters,
  studentAttendanceService,
  StudentAttendanceSummary,
  UpdateStudentAttendance,
  CreateStudentAttendance,
} from "../services/student-attendance.service";
import { logger } from "../../shared";
import { activityLogger } from "../../shared/services/activity-logger.service";
import { getSchoolId, requireSchoolId, validateSchoolAccess } from "../../shared/utils/tenant-context";
import { studentService } from "../../student/services/student.service";
import { classroomService } from "../../classroom/services/classroom.service";

export class StudentAttendanceController {


  async clockIn(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { studentIds, parentId, status, date, notes } = req.body;

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        res.status(400).json({ success: false, code: "INVALID_STUDENT_IDS", message: "studentIds array is required" });
        return;
      }

      if (!parentId) {
        res.status(400).json({ success: false, code: "MISSING_PARENT_ID", message: "parentId is required" });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, code: "AUTH_MISSING_USER", message: "User is not authenticated" });
        return;
      }

      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        logger.error("Clock in failed while resolving school context", {
          userId,
          studentIds,
          parentId,
          message: error?.message,
        });
        res.status(403).json({
          success: false,
          code: "TENANT_CONTEXT_MISSING",
          message: error?.message || "School context missing",
        });
        return;
      }

      const result = await studentAttendanceService.clockInStudent({
        studentIds,
        parentId,
        status,
        recordedByUserId: userId,
        schoolId,
        date,
        notes
      });

      if (result.success && result.attendances) {
        await activityLogger.logFromRequest(req, {
          userId,
          resource: "student_attendance",
          action: "clock_in_batch",
          title: `Students clocked in batch count: ${result.attendances.length}`,
          metadata: {
            studentIds,
            count: result.attendances.length,
            parentId,
            date,
          },
        });
      }

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error clocking in student", {
        userId: req.user?.id,
        studentIds: req.body?.studentIds,
        parentId: req.body?.parentId,
        date: req.body?.date,
        error,
      });
      res.status(500).json({
        success: false,
        code: "CLOCK_IN_UNEXPECTED_ERROR",
        message: "Failed to clock in student",
        error: errorMessage,
      });
    }
  }

  async clockOut(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data: ClockOutStudent = req.body;

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, code: "AUTH_MISSING_USER", message: "User is not authenticated" });
        return;
      }

      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        logger.error("Clock out failed while resolving school context", {
          userId,
          studentIds: data.studentIds,
          parentId: data.parentId,
          message: error?.message,
        });
        res.status(403).json({
          success: false,
          code: "TENANT_CONTEXT_MISSING",
          message: error?.message || "School context missing",
        });
        return;
      }

      const result = await studentAttendanceService.clockStudentOut({
        studentIds: data.studentIds,
        timeOut: data.timeOut,
        parentId: data.parentId,
        notes: data.notes,
        schoolId
      });

      if (result.success && result.attendances) {
        await activityLogger.logFromRequest(req, {
          userId,
          resource: "student_attendance",
          action: "clock_out",
          title: `Students clocked out (Batch)`,
          metadata: {
            count: result.attendances.length,
            ids: result.attendances.map(a => a.id),
            studentIds: data.studentIds,
          }
        });
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to clock out student", {
        userId: req.user?.id,
        studentIds: req.body?.studentIds,
        parentId: req.body?.parentId,
        timeOut: req.body?.timeOut,
        error,
      });
      res.status(500).json({
        success: false,
        code: "CLOCK_OUT_UNEXPECTED_ERROR",
        message: "Failed to clock out student",
        error: errorMessage,
      });
    }
  }

  async recordAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate that student belongs to user's school
      const student = await studentService.getStudentById(req.body.studentId);
      if (!student || (student as any).success === false) {
        res.status(404).json({ success: false, message: "Student not found" });
        return;
      }

      try {
        validateSchoolAccess(req, (student as any).schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
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

      const payload: CreateStudentAttendance = {
        ...req.body,
        recordedByUserId: req.user.id,
      };

      const result = await studentAttendanceService.recordAttendance(payload);

      if (result.success && result.attendance) {
        await activityLogger.logFromRequest(req, {
          userId: req.user.id,
          resource: "student_attendance",
          action: "create",
          title: `Recorded attendance for student #${result.attendance.studentId}`,
          metadata: {
            studentId: result.attendance.studentId,
            classroomId: result.attendance.classroomId,
            attendanceId: result.attendance.id,
            status: result.attendance.status,
            date: result.attendance.date,
          },
        });
      }

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error("Error recording student attendance", error);
      res.status(500).json({
        success: false,
        message: "Failed to record attendance",
      });
    }
  }

  async updateAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const attendanceId = Number(req.params["id"]);

      // First get the attendance to validate school access
      const existingAttendance = await studentAttendanceService.getAttendanceById(attendanceId);
      if (!existingAttendance.success || !existingAttendance.attendance) {
        res.status(404).json({ success: false, message: "Attendance not found" });
        return;
      }

      // Validate school access via student
      if (!existingAttendance.attendance.studentId) {
        res.status(400).json({ success: false, message: "Attendance record missing student ID" });
        return;
      }

      const student = await studentService.getStudentById(existingAttendance.attendance.studentId);
      if (student && (student as any).schoolId) {
        try {
          validateSchoolAccess(req, (student as any).schoolId);
        } catch (error: any) {
          res.status(403).json({ success: false, message: error.message });
          return;
        }
      }

      const payload: UpdateStudentAttendance = req.body;

      const result = await studentAttendanceService.updateAttendance(attendanceId, payload, req.user.id);

      if (result.success && result.attendance) {
        await activityLogger.logFromRequest(req, {
          userId: req.user.id,
          resource: "student_attendance",
          action: "update",
          title: `Updated attendance #${attendanceId}`,
          metadata: {
            attendanceId,
            status: result.attendance.status,
          },
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error updating student attendance", error);
      res.status(500).json({
        success: false,
        message: "Failed to update attendance",
      });
    }
  }



  async getAttendanceSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userSchoolId = requireSchoolId(req);


      if (!userSchoolId) {
        res.status(400).json({
          success: false,
          message: "School context required. Please provide a schoolId in the query or associate your account with a school."
        });
        return;
      }

      // If user is not super admin and is trying to access another school
      if (userSchoolId !== userSchoolId && (req.user as any).role !== "super_admin") {
        res.status(403).json({ success: false, message: "You do not have permission to access this school's records." });
        return;
      }

      const filters: StudentAttendanceSummary = {
        schoolId: userSchoolId,
        studentId: req.query["studentId"] ? Number(req.query["studentId"]) : undefined,
        classroomId: req.query["classroomId"] ? Number(req.query["classroomId"]) : undefined,
        teacherId: req.query["teacherId"] ? Number(req.query["teacherId"]) : undefined,
        parentId: req.query["parentId"] ? Number(req.query["parentId"]) : undefined,
        status: req.query["status"] as any,
        startDate: req.query["startDate"] as string,
        endDate: req.query["endDate"] as string,
        pos: req.query["pos"] ? Number(req.query["pos"]) : undefined,
        delta: req.query["delta"] ? Number(req.query["delta"]) : undefined,
      };

      const result = await studentAttendanceService.getStudentAttendanceSummary(filters);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error: any) {
      logger.error("Error retrieving student attendance summary", {
        message: error.message,
        stack: error.stack,
        query: req.query,
        user: req.user ? { id: req.user.id, schoolId: getSchoolId(req) } : "none"
      });
      res.status(500).json({
        success: false,
        message: "Failed to retrieve student attendance summary",
        error: error.message || "Unknown error",
      });
    }
  }


  async getAttendanceById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const attendanceId = Number(req.params["id"]);
      const result = await studentAttendanceService.getAttendanceById(attendanceId);

      // Validate school access
      if (result.success && result.attendance && result.attendance.studentId) {
        const student = await studentService.getStudentById(result.attendance.studentId);
        if (student && (student as any).schoolId) {
          try {
            validateSchoolAccess(req, (student as any).schoolId);
          } catch (error: any) {
            res.status(403).json({ success: false, message: error.message });
            return;
          }
        }
      }

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error("Error retrieving student attendance", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve attendance",
      });
    }
  }

  async filterAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters: StudentAttendanceFilters = {
        studentId: req.query["studentId"] as unknown as number | undefined,
        classroomId: req.query["classroomId"] as unknown as number | undefined,
        status: req.query["status"] as any,
        pos: req.query["pos"] as unknown as number | undefined,
        delta: req.query["delta"] as unknown as number | undefined,
      }
      const result = await studentAttendanceService.filterAttendance(filters);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error filtering student attendance", error);
      res.status(500).json({
        success: false,
        message: "Failed to filter attendance",
      });
    }
  }

  // async requestAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
  // //   try {
  //     const payload: RequestAttendancePermission = req.body;

  //     const result = await studentAttendanceService.requestAttendancePermission(payload);

  //     if (result.success && result.attendance) {
  //       await activityLogger.logFromRequest(req, {
  //         userId: req.user.id,
  //         resource: "student_attendance",
  //         action: "create",
  //         title: `Request attendance for student #${result.attendance.studentId}`,
  //         metadata: {
  //           studentId: result.attendance.studentId,
  //           classroomId: result.attendance.classroomId, 
  //           attendanceId: result.attendance.id,
  //           status: result.attendance.status,
  //           date: result.attendance.date,
  //         },
  //       });
  //     }
  //     res.status(result.success ? 200 : 404).json(result);
  //   } catch (error) {
  //     logger.error("Error requesting permission student attendance", error);
  //     res.status(500).json({
  //       success: false,
  //       message: "Failed to request attendance",
  //     });
  //   }
  // }



  async listAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {

      const userSchoolId = requireSchoolId(req);

      if (req.query["schoolId"] && Number(req.query["schoolId"]) !== userSchoolId) {
        res.status(403).json({ success: false, message: "User does not belong to this school" });
        return;
      }
      const filters: StudentAttendanceFilters = {
        schoolId: userSchoolId,
        studentId: req.query["studentId"] as unknown as number | undefined,
        classroomId: req.query["classroomId"] as unknown as number | undefined,
        teacherId: req.query["teacherId"] as unknown as number | undefined,
        search: req.query["search"] as unknown as string | undefined,
        parentId: req.query["parentId"] as unknown as number | undefined,
        status: req.query["status"] as any,
        startDate: req.query["startDate"] as any,
        endDate: req.query["endDate"] as any,
        pos: req.query["pos"] as unknown as number | undefined,
        delta: req.query["delta"] as unknown as number | undefined,
      };

      const result = await studentAttendanceService.listAttendance(filters);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Error listing student attendance", error);
      res.status(500).json({
        success: false,
        message: "Failed to list attendance",
      });
    }
  }

  async deleteAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const attendanceId = Number(req.params["id"]);

      // First get the attendance to validate school access
      const existingAttendance = await studentAttendanceService.getAttendanceById(attendanceId);
      if (!existingAttendance.success || !existingAttendance.attendance) {
        res.status(404).json({ success: false, message: "Attendance not found" });
        return;
      }

      // Validate school access via student
      if (!existingAttendance.attendance.studentId) {
        res.status(400).json({ success: false, message: "Attendance record missing student ID" });
        return;
      }

      const student = await studentService.getStudentById(existingAttendance.attendance.studentId);
      if (student && (student as any).schoolId) {
        try {
          validateSchoolAccess(req, (student as any).schoolId);
        } catch (error: any) {
          res.status(403).json({ success: false, message: error.message });
          return;
        }
      }

      const result = await studentAttendanceService.deleteAttendance(attendanceId);

      if (result.success) {
        await activityLogger.logFromRequest(req, {
          userId: req.user.id,
          resource: "student_attendance",
          action: "delete",
          title: `Deleted attendance #${attendanceId}`,
          metadata: {
            attendanceId,
          },
        });
      }

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error("Error deleting student attendance", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete attendance",
      });
    }
  }

}

export const studentAttendanceController = new StudentAttendanceController();

