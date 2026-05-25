import { Brackets, In, Repository } from "typeorm";
import { AppDataSource } from "../../core";
import { AttendanceStatus, logger } from "../../shared";
import { NotificationPriority, NotificationType } from "../../shared/entities/Notification";
import { Attendance } from "../../shared/entities/Attendance";
import { Parent } from "../../shared/entities/Parent";
import { Student } from "../../shared/entities/StudentEntity";
import { Staff } from "../../shared/entities/Staff";
import { Classroom } from "../../shared/entities/Classroom";
import {
  formatDateKey,
  normalizeTime,
  getCurrentTime,
  getNigeriaDate,
  calculateHours,
  calculateClippedHours,
  getNigeriaDayName,
  getNigeriaStartOfDay,
  getNigeriaEndOfDay,
} from "../../shared/utils/date-util";
import { notificationService } from "../../notification";
import { activitySummaryService } from "./activity-summary.service";

export interface ClockInStudent {
  studentIds: number[];
  parentId: number;
  status: AttendanceStatus;
  recordedByUserId: number;
  notes?: string;
  schoolId?: number;
  date: string | Date;
}

export interface ClockOutStudent {
  status?: AttendanceStatus;
  notes?: string;
  timeOut: string;
  parentId?: number;
  studentIds: number[];
  schoolId?: number;
}

export interface CreateStudentAttendance {
  studentId: number;
  classroomId: number;
  parentId?: number;
  teacherId?: number;
  status: AttendanceStatus;
  recordedByUserId: number;
  notes?: string;
  timeIn?: string;
  timeOut?: string;
  date: string | Date;
}

export interface UpdateStudentAttendance {
  status?: AttendanceStatus;
  reason?: string;
  timeIn?: string;
  timeOut?: string;
  date?: string | Date;
  teacherId?: number;
  parentId?: number;
}

export interface StudentAttendanceFilters {
  studentId?: number;
  classroomId?: number;
  teacherId?: number;
  parentId?: number;
  search?: string;
  schoolId?: number;
  status?: AttendanceStatus;
  startDate?: string | Date;
  endDate?: string | Date;
  pos?: number;
  delta?: number;
}

export interface StudentAttendanceSummary extends StudentAttendanceFilters {
  studentId?: number;
}

interface ServiceResponse {
  success: boolean;
  code?: string;
  message: string;
  attendance?: Attendance;
  attendances?: Attendance[];
  metadata?: {
    totalSchoolDays: number;
    PresentDays: number;
    AbsentDays: number;
    LateDays: number;
    ExcusedDays: number;
    LeaveDays: number;
    totalPotentialSchoolDays: number;
    totalPresentHours?: number;
    totalAbsentHours?: number;
  };
  pagination?: {
    pos: number;
    delta: number;
    count: number;
  };
  errors?: { studentId: number; name?: string; reason: string }[];
  data?: any;
}

class StudentAttendanceService {
  private get attendanceRepository(): Repository<Attendance> {
    return AppDataSource.getRepository(Attendance);
  }

  private get teacherRepository(): Repository<Staff> {
    return AppDataSource.getRepository(Staff);
  }

  private get studentRepository(): Repository<Student> {
    return AppDataSource.getRepository(Student);
  }
  private get classroomRepository(): Repository<Classroom> {
    return AppDataSource.getRepository(Classroom);
  }

  private get parentRepository(): Repository<Parent> {
    return AppDataSource.getRepository(Parent);
  }

  private normalizeDate(dateInput: string | Date): string {
    return formatDateKey(dateInput);
  }
  private normalizeTime(time: string): string {
    return normalizeTime(time);
  }

  private calculateHours(timeIn?: string, timeOut?: string): number {
    return calculateHours(timeIn, timeOut);
  }

  private calculateClippedHours(timeIn: string, timeOut: string, schoolIn: string, schoolOut: string): number {
    return calculateClippedHours(timeIn, timeOut, schoolIn, schoolOut);
  }

  private getDayName(date: Date): string {
    return getNigeriaDayName(date);
  }

  private getCurrentTime(): string {
    return getCurrentTime();
  }

  /**
   * Fire-and-forget daily/weekly activity report when a student is checked out.
   */
  private queueActivitySummaryOnCheckout(studentId: number, attendanceId: number): void {
    void (async () => {
      const student = await this.studentRepository.findOne({
        where: { id: studentId },
        relations: ["school", "user", "parents", "parents.user"],
      });
      if (!student) {
        logger.warn("Activity summary skipped: student not found", { studentId, attendanceId });
        return;
      }
      await activitySummaryService.sendActivitySummaryOnCheckout(student, { attendanceId });
    })().catch((err) => logger.error("Failed to send activity summary email", { studentId, attendanceId, error: err }));
  }

  async clockInStudent(data: ClockInStudent): Promise<ServiceResponse> {
    try {
      if (!data.parentId) return { success: false, code: "MISSING_PARENT_ID", message: "ParentId is required to clock in students" };

      if (!data.studentIds || data.studentIds.length === 0) {
        return { success: false, code: "MISSING_STUDENT_IDS", message: "No students provided for clock in" };
      }

      const students = await this.studentRepository.find({
        where: { id: In(data.studentIds) },
        relations: ["currentClassroom", "parents", "school", "currentAttendance", "user"],
      });

      if (students.length !== data.studentIds.length) {
        return { success: false, code: "STUDENT_NOT_FOUND", message: "One or more students not found" };
      }

      const parentRecord = await this.parentRepository.findOne({
        where: { id: data.parentId },
        relations: ["children", "user"],
      });

      if (!parentRecord) return { success: false, code: "PARENT_NOT_FOUND", message: "Parent not found" };

      const allLinked = students.every((student) => parentRecord.children?.some((child) => child.id === student.id));

      if (!allLinked) {
        return { success: false, code: "PARENT_CHILD_MISMATCH", message: "One or more students are not linked to this parent" };
      }

      const processedAttendances: Attendance[] = [];
      const today = getNigeriaDate();
      today.setHours(0, 0, 0, 0);

      const finalTimeIn = this.getCurrentTime();
      const normalizedTimeIn = this.normalizeTime(finalTimeIn);

      const errors: { studentId: number; name?: string; reason: string }[] = [];

      for (const student of students) {
        const studentName = student.user ? `${student.user.firstName} ${student.user.lastName}` : `Student #${student.id}`;

        try {
          if (data.schoolId !== undefined && student.schoolId !== data.schoolId) {
            errors.push({ studentId: student.id, name: studentName, reason: "Student does not belong to the specified school" });
            continue;
          }

          if (student.currentAttendance) {
            errors.push({ studentId: student.id, name: studentName, reason: "Already clocked in" });
            continue;
          }

          if (!student.currentClassroom) {
            errors.push({ studentId: student.id, name: studentName, reason: "No classroom assigned" });
            continue;
          }

          let finalStatus = AttendanceStatus.PRESENT;
          if (!normalizedTimeIn) {
            finalStatus = AttendanceStatus.ABSENT;
          } else {
            const schoolResumptionTime = student.school?.studentResumptionTime;
            if (schoolResumptionTime) {
              const schoolResumption = this.normalizeTime(schoolResumptionTime);

              if (normalizedTimeIn > schoolResumption) {
                finalStatus = AttendanceStatus.LATE;
              }
            }
          }

          const attendance = this.attendanceRepository.create({
            studentId: student.id,
            classroomId: student.currentClassroom.id,
            date: today,
            status: finalStatus,
            notes: data.notes,
            recordedBy: data.recordedByUserId,
            parentId: data.parentId,
            timeIn: normalizedTimeIn,
            schoolId: student.schoolId,
          });

          const saved = await this.attendanceRepository.save(attendance);

          student.currentAttendance = saved;
          await this.studentRepository.save(student);

          if (parentRecord.user) {
            await notificationService.sendNotification({
              userId: parentRecord.user.id,
              schoolId: student.schoolId,
              title: "Student Clock In",
              message: `${studentName} has been clocked in at ${normalizedTimeIn}. Status: ${finalStatus}`,
              type: NotificationType.ATTENDANCE,
              priority: NotificationPriority.MEDIUM,
              data: {
                studentId: student.id,
                attendanceId: saved.id,
                time: normalizedTimeIn,
              },
              sendEmail: true,
              sendSms: true,
            });
          }

          processedAttendances.push(saved);
        } catch (error) {
          errors.push({
            studentId: student.id,
            name: studentName,
            reason: `Unhandled processing error: ${error instanceof Error ? error.message : String(error)}`,
          });

          logger.error("Failed to process student clock in", {
            operation: "clockInStudent",
            studentId: student.id,
            parentId: data.parentId,
            schoolId: data.schoolId,
            error,
          });
        }
      }

      if (processedAttendances.length === 0 && students.length > 0) {
        return {
          success: false,
          code: "CLOCK_IN_NONE_PROCESSED",
          message: "No students were clocked in. See errors for details.",
          errors,
        };
      }

      return {
        success: true,
        message: processedAttendances.length === students.length ? "All students clocked in successfully" : "Some students were clocked in",
        attendances: processedAttendances,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to clock in students", {
        operation: "clockInStudent",
        parentId: data.parentId,
        studentIds: data.studentIds,
        schoolId: data.schoolId,
        error,
      });
      return {
        success: false,
        code: "CLOCK_IN_SYSTEM_ERROR",
        message: "Unable to clock in students at this time",
        data: {
          error: errorMessage,
        },
      };
    }
  }

  async clockStudentOut(data: ClockOutStudent): Promise<ServiceResponse> {
    try {
      if (!data.parentId) return { success: false, code: "MISSING_PARENT_ID", message: "ParentId is required to clock out student" };

      const students = await this.studentRepository.find({
        where: { id: In(data.studentIds) },
        relations: ["school", "currentAttendance", "user", "parents", "parents.user"],
      });

      if (!students || students.length === 0) {
        return {
          success: false,
          code: "STUDENT_NOT_FOUND",
          message: "No students found",
        };
      }

      let parentRecord: Parent | null = null;

      if (data.parentId) {
        parentRecord = await this.parentRepository.findOne({
          where: { id: data.parentId },
          relations: ["children", "user"],
        });

        if (!parentRecord) return { success: false, code: "PARENT_NOT_FOUND", message: "Parent not found" };

        const childrenIds = parentRecord.children?.map((c) => c.id) || [];
        const missingChildren = students.filter((s) => !childrenIds.includes(s.id));

        if (missingChildren.length > 0) {
          return {
            success: false,
            code: "PARENT_CHILD_MISMATCH",
            message: `Students ${missingChildren.map((s) => s.id).join(", ")} do not belong to this parent`,
          };
        }
      }

      const errors: { studentId: number; name?: string; reason: string }[] = [];
      const processedAttendances: Attendance[] = [];
      const finalTimeOut = data.timeOut || this.getCurrentTime();
      const normalizedTimeOut = this.normalizeTime(finalTimeOut);

      for (const student of students) {
        const studentName = student.user ? `${student.user.firstName} ${student.user.lastName}` : `Student #${student.id}`;

        try {
          if (data.schoolId !== undefined && student.schoolId !== data.schoolId) {
            errors.push({ studentId: student.id, name: studentName, reason: "Student does not belong to the specified school" });
            continue;
          }

          if (!student.currentAttendance) {
            errors.push({ studentId: student.id, name: studentName, reason: "Not clocked in" });
            continue;
          }

          const attendance = student.currentAttendance;
          attendance.timeOut = normalizedTimeOut;
          attendance.notes = data.notes;

          const saved = await this.attendanceRepository.save(attendance);

          student.previousAttendance = attendance;
          student.currentAttendance = null;
          await this.studentRepository.save(student);

          processedAttendances.push(saved);

          if (parentRecord && parentRecord.user) {
            await notificationService.sendNotification({
              userId: parentRecord.user.id,
              schoolId: student.schoolId,
              title: "Student Clock Out",
              message: `${studentName} has been clocked out at ${normalizedTimeOut}.`,
              type: NotificationType.ATTENDANCE,
              priority: NotificationPriority.MEDIUM,
              data: {
                studentId: student.id,
                attendanceId: saved.id,
                time: normalizedTimeOut,
              },
              sendEmail: true,
              sendSms: true,
            });
          }

          this.queueActivitySummaryOnCheckout(student.id, saved.id);
        } catch (error) {
          errors.push({
            studentId: student.id,
            name: studentName,
            reason: `Unhandled processing error: ${error instanceof Error ? error.message : String(error)}`,
          });

          logger.error("Failed to process student clock out", {
            operation: "clockStudentOut",
            studentId: student.id,
            parentId: data.parentId,
            schoolId: data.schoolId,
            error,
          });
        }
      }

      if (processedAttendances.length === 0 && students.length > 0) {
        return {
          success: false,
          code: "CLOCK_OUT_NONE_PROCESSED",
          message: "No students were clocked out. See errors for details.",
          errors,
        };
      }

      return {
        success: true,
        message:
          processedAttendances.length === students.length ? "All students clocked out successfully" : "Some students were clocked out",
        attendances: processedAttendances,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to clock out student", {
        operation: "clockStudentOut",
        parentId: data.parentId,
        studentIds: data.studentIds,
        schoolId: data.schoolId,
        error,
      });
      return {
        success: false,
        code: "CLOCK_OUT_SYSTEM_ERROR",
        message: "Unable to clock out at this time",
        data: {
          error: errorMessage,
        },
      };
    }
  }

  async recordAttendance(data: CreateStudentAttendance): Promise<ServiceResponse> {
    try {
      if (!data.teacherId && !data.parentId)
        return { success: false, message: "Either teacherId or parentId is required to record attendance" };

      if (data.teacherId && data.parentId) return { success: false, message: "Provide either teacherId or parentId, not both" };

      const dateOnly = new Date(data.date);

      const student = await this.studentRepository.findOne({
        where: { id: data.studentId },
        relations: ["currentClassroom", "parents", "parents.user", "school", "user"],
      });

      if (!student) return { success: false, message: "Student not found" };

      const classroom = await this.classroomRepository.findOne({
        where: { id: data.classroomId },
        relations: ["studentsCurrentClass"],
      });

      if (!classroom) return { success: false, message: "Classroom not found" };

      if (!student.currentClassroom) {
        return { success: false, message: "Student has no current classroom assigned" };
      }

      if (student.currentClassroom.id !== classroom.id) {
        return { success: false, message: "Student is not assigned to the specified classroom" };
      }

      let teacher: Staff | undefined;

      if (data.teacherId) {
        const teacherRecord = await this.teacherRepository.findOne({
          where: { id: data.teacherId },
          relations: ["staffClassesAndSubject", "staffClassesAndSubject.classroom"],
        });

        if (!teacherRecord) return { success: false, message: "Teacher not found" };

        const teacherAssignedToClass = teacherRecord.staffClassesAndSubject?.some((scs) => scs.classroom?.id === classroom.id);
        if (!teacherAssignedToClass) return { success: false, message: "Teacher is not assigned to the specified classroom" };
        teacher = teacherRecord;
      }

      let parent: Parent | undefined;
      if (data.parentId) {
        const parentRecord = await this.parentRepository.findOne({
          where: { id: data.parentId },
          relations: ["children"],
        });

        if (!parentRecord) return { success: false, message: "Parent not found" };

        const isGuardian = parentRecord.children?.some((child) => child.id === student.id);
        if (!isGuardian) return { success: false, message: "Parent is not linked to the student" };

        parent = parentRecord;
      }

      let attendance = await this.attendanceRepository.findOne({
        where: {
          studentId: data.studentId,
          classroomId: data.classroomId,
          date: dateOnly,
        },
      });

      if (attendance) return { success: false, message: "Attendance recorded already for this date" };

      let finalStatus = AttendanceStatus.PRESENT;

      if (!data.timeIn) {
        finalStatus = AttendanceStatus.ABSENT;
      } else {
        const schoolResumptionTime = student.school?.studentResumptionTime;
        if (schoolResumptionTime) {
          const schoolResumption = this.normalizeTime(schoolResumptionTime);
          const actualTimeIn = this.normalizeTime(data.timeIn);

          if (actualTimeIn > schoolResumption) {
            finalStatus = AttendanceStatus.LATE;
          }
        }
      }

      attendance = this.attendanceRepository.create({
        studentId: data.studentId,
        classroomId: data.classroomId,
        schoolId: student.schoolId,
        date: new Date(dateOnly),
        status: finalStatus,
        notes: data.notes,
        recordedBy: data.recordedByUserId,
        teacherId: teacher?.id,
        parentId: parent?.id,
        timeIn: data.timeIn,
        timeOut: data.timeOut,
      });

      const saved = await this.attendanceRepository.save(attendance);

      if (data.timeOut?.trim()) {
        this.queueActivitySummaryOnCheckout(student.id, saved.id);
      }

      const attendanceWithRelations = await this.getAttendanceById(saved.id);

      return {
        success: true,
        message: "Attendance recorded successfully",
        attendance: attendanceWithRelations.attendance,
      };
    } catch (error) {
      logger.error("Failed to record student attendance", error);
      console.error("Attendance recording error details:", error);
      return {
        success: false,
        message: "Unable to record attendance at this time",
      };
    }
  }

  async updateAttendance(attendanceId: number, data: UpdateStudentAttendance, recordedByUserId?: number): Promise<ServiceResponse> {
    try {
      const attendance = await this.attendanceRepository.findOne({
        where: { id: attendanceId },
        relations: ["school"],
      });

      if (!attendance || !attendance.studentId)
        return {
          success: false,
          message: "Student attendance record not found",
        };

      if (data.teacherId && data.parentId)
        return {
          success: false,
          message: "Provide either teacherId or parentId, not both",
        };

      // Handle Status and Time Updates logic
      const requestTimeIn = data.timeIn;
      const effectiveTimeIn = requestTimeIn !== undefined ? requestTimeIn : attendance.timeIn;

      // VALIDATION: If timeIn exists, status cannot be ABSENT
      if (effectiveTimeIn && data.status === AttendanceStatus.ABSENT) {
        return {
          success: false,
          message:
            "Cannot set status to ABSENT when a scan-in time is recorded. Please clear the timeIn first if you wish to mark as ABSENT.",
        };
      }

      // Note: Using studentResumptionTime for students
      if (effectiveTimeIn && attendance.school?.studentResumptionTime) {
        const schoolResumption = this.normalizeTime(attendance.school.studentResumptionTime);
        const actualTimeIn = this.normalizeTime(effectiveTimeIn);
        let calculatedStatus = AttendanceStatus.PRESENT;

        if (actualTimeIn > schoolResumption) {
          calculatedStatus = AttendanceStatus.LATE;
        }

        // If Updating TimeIn -> Auto Update Status
        if (requestTimeIn !== undefined) {
          if (data.status) {
            // Check conflict if trying to set specific status (Present/Late)
            if ((data.status === AttendanceStatus.PRESENT || data.status === AttendanceStatus.LATE) && data.status !== calculatedStatus) {
              return {
                success: false,
                message: `Cannot set status to ${data.status}. The time ${effectiveTimeIn} indicates the status should be ${calculatedStatus}.`,
              };
            }
            attendance.status = data.status;
          } else {
            // Auto set status based on time
            attendance.status = calculatedStatus;
          }
          attendance.timeIn = requestTimeIn;
        }
        // If Only Updating Status
        else if (data.status) {
          if ((data.status === AttendanceStatus.PRESENT || data.status === AttendanceStatus.LATE) && data.status !== calculatedStatus) {
            return {
              success: false,
              message: `Cannot update status to ${data.status}. The recorded time ${effectiveTimeIn} indicates the status should be ${calculatedStatus}.`,
            };
          }
          attendance.status = data.status;
        }
      } else {
        // Fallback
        if (data.status) attendance.status = data.status;
        if (data.timeIn) attendance.timeIn = data.timeIn;
      }

      if (data.reason) attendance.notes = data.reason;

      const previousTimeOut = attendance.timeOut?.trim();
      if (data.timeOut) attendance.timeOut = data.timeOut;
      const isNewCheckout = Boolean(attendance.timeOut?.trim()) && attendance.timeOut!.trim() !== (previousTimeOut ?? "");

      if (data.date) attendance.date = new Date(this.normalizeDate(data.date));

      if (recordedByUserId) attendance.recordedBy = recordedByUserId;

      if (data.teacherId) {
        const teacherRecord = await this.teacherRepository.findOne({
          where: { id: data.teacherId },
          relations: ["staffClassesAndSubject", "staffClassesAndSubject.classroom"],
        });

        if (!teacherRecord) {
          return { success: false, message: "Teacher not found" };
        }

        const assigned = teacherRecord.staffClassesAndSubject?.some((scs) => scs.classroom?.id === attendance.classroomId);
        if (!assigned) {
          return {
            success: false,
            message: "Teacher is not assigned to this classroom",
          };
        }

        attendance.teacherId = teacherRecord.id;
        attendance.parentId = undefined;
      }

      if (data.parentId) {
        const parentRecord = await this.parentRepository.findOne({
          where: { id: data.parentId },
          relations: ["children"],
        });
        if (!parentRecord) {
          return { success: false, message: "Parent not found" };
        }
        const isGuardian = parentRecord.children?.some((child) => child.id === attendance.studentId);
        if (!isGuardian) {
          return {
            success: false,
            message: "Parent is not linked to the student",
          };
        }

        attendance.parentId = parentRecord.id;
        attendance.teacherId = undefined;
      }

      const saved = await this.attendanceRepository.save(attendance);
      const attendanceWithRelations = await this.getAttendanceById(saved.id);

      if (isNewCheckout && attendance.studentId) {
        this.queueActivitySummaryOnCheckout(attendance.studentId, saved.id);
      }

      return {
        success: true,
        message: "Attendance updated successfully",
        attendance: attendanceWithRelations.attendance,
      };
    } catch (error) {
      logger.error("Failed to update student attendance", error);
      console.error("Attendance update error details:", error);
      return {
        success: false,
        message: "Unable to update attendance at this time",
      };
    }
  }

  async getStudentAttendanceSummary(filters: StudentAttendanceSummary): Promise<ServiceResponse> {
    try {
      const { studentId, schoolId, pos, delta } = filters;

      let rangeStart: Date;
      let rangeEnd: Date;
      if (!filters.startDate && !filters.endDate) {
        rangeStart = getNigeriaStartOfDay();
        rangeEnd = getNigeriaEndOfDay();
      } else {
        rangeStart = filters.startDate
          ? getNigeriaStartOfDay(new Date(filters.startDate))
          : getNigeriaStartOfDay();
        rangeEnd = filters.endDate ? getNigeriaEndOfDay(new Date(filters.endDate)) : getNigeriaEndOfDay();
      }

      // Fetch relevant students
      const studentQb = this.studentRepository
        .createQueryBuilder("student")
        .leftJoinAndSelect("student.user", "user")
        .leftJoinAndSelect("student.school", "school")
        .where("student.schoolId = :schoolId", { schoolId });

      await this.applyFilters(studentQb, filters);

      studentQb.skip(pos ?? 0).take(delta ?? 25);

      const [students, totalCount] = await studentQb.getManyAndCount();

      if (students.length === 0) {
        return { success: true, message: "No students found", attendances: [], data: [] };
      }

      const studentIds = students.map((s) => s.id);
      const attendanceQb = this.attendanceRepository
        .createQueryBuilder("attendance")
        .select([
          "attendance.date",
          "attendance.timeIn",
          "attendance.timeOut",
          "attendance.status",
          "attendance.studentId",
          "attendance.createdAt",
        ])
        .where("attendance.schoolId = :schoolId", { schoolId })
        .andWhere("attendance.studentId IN (:...studentIds)", { studentIds })
        .andWhere("attendance.date >= :startDate", { startDate: formatDateKey(rangeStart) })
        .andWhere("attendance.date <= :endDate", { endDate: formatDateKey(rangeEnd) });

      if (filters.status) {
        attendanceQb.andWhere("attendance.status = :status", { status: filters.status });
      }

      const attendanceLogs = await attendanceQb.getMany();

      let aggregateMetadata = {
        totalSchoolDays: 0,
        PresentDays: 0,
        AbsentDays: 0,
        LateDays: 0,
        ExcusedDays: 0,
        LeaveDays: 0,
        totalPotentialSchoolDays: 0,
        totalPresentHours: 0,
        totalAbsentHours: 0,
      };

      const studentSummaries = students.map((student) => {
        const studentLogs = attendanceLogs.filter((log) => log.studentId === student.id);
        const logsByDate = studentLogs.reduce(
          (acc, log) => {
            const key = formatDateKey(log.date);
            (acc[key] = acc[key] || []).push(log);
            return acc;
          },
          {} as Record<string, Attendance[]>,
        );

        const config = {
          schoolIn: student.school?.studentResumptionTime || "08:00:00",
          schoolOut: student.school?.schoolClosingTime || "16:00:00",
          schedule: student.schedule || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        };
        const potentialDailyHours = this.calculateHours(config.schoolIn, config.schoolOut);

        // Determine today's real-time status
        const todayKey = formatDateKey(getNigeriaStartOfDay());
        const todayLogs = logsByDate[todayKey] || [];
        const currentStatusData = this.determineCurrentStatus(todayLogs, student.currentAttendance, todayKey);

        let stats = {
          totalPresentHours: 0,
          totalAbsentHours: 0,
          presentDays: 0,
          lateDays: 0,
          excusedDays: 0,
          leaveDays: 0,
          potentialSchoolDays: 0,
          attendedDaysCount: 0,
        };

        const cur = new Date(rangeStart.getTime());
        const endDay = new Date(rangeEnd.getTime());
        const effectiveEnd = endDay > getNigeriaStartOfDay() ? getNigeriaStartOfDay() : endDay;

        while (cur <= endDay) {
          const dateKey = formatDateKey(cur);
          const dayName = this.getDayName(cur);
          const isScheduled = config.schedule.some((s) => s.trim().toLowerCase() === dayName.toLowerCase());
          const dailyLogs = logsByDate[dateKey] || [];

          if (isScheduled && cur <= effectiveEnd) stats.potentialSchoolDays++;

          if (dailyLogs.length > 0) {
            stats.attendedDaysCount++;
            const dailyStats = this.processDailyLogs(dailyLogs, config.schoolIn, config.schoolOut);

            stats.totalPresentHours += dailyStats.presentHours;
            if (isScheduled) {
              stats.totalAbsentHours += Math.max(0, potentialDailyHours - dailyStats.clippedPresentHours);
            }

            // Update day counts
            if (dailyStats.status === AttendanceStatus.PRESENT) stats.presentDays++;
            else if (dailyStats.status === AttendanceStatus.LATE) stats.lateDays++;
            else if (dailyStats.status === AttendanceStatus.EXCUSED) stats.excusedDays++;
            else if (dailyStats.status === AttendanceStatus.LEAVE) stats.leaveDays++;
          } else if (isScheduled && cur <= effectiveEnd) {
            stats.totalAbsentHours += potentialDailyHours;
          }
          cur.setDate(cur.getDate() + 1);
        }

        const summary = {
          studentId: student.id,
          studentName: student.user ? `${student.user.firstName} ${student.user.lastName}` : `Student #${student.id}`,
          admissionNumber: student.admissionNumber,
          currentStatus: currentStatusData.status,
          timeIn: currentStatusData.timeIn,
          timeOut: currentStatusData.timeOut,
          totalPresentHours: Number(stats.totalPresentHours.toFixed(2)),
          totalAbsentHours: Number(stats.totalAbsentHours.toFixed(2)),
          presentDays: stats.presentDays,
          lateDays: stats.lateDays,
          excusedDays: stats.excusedDays,
          leaveDays: stats.leaveDays,
          potentialSchoolDays: stats.potentialSchoolDays,
          attendedDaysCount: stats.attendedDaysCount,
          absentDays: Math.max(0, stats.potentialSchoolDays - stats.attendedDaysCount),
          attendances: studentLogs,
        };

        // Aggregating for overall metadata
        aggregateMetadata.totalPotentialSchoolDays += summary.potentialSchoolDays;
        aggregateMetadata.PresentDays += summary.presentDays;
        aggregateMetadata.LateDays += summary.lateDays;
        aggregateMetadata.ExcusedDays += summary.excusedDays;
        aggregateMetadata.LeaveDays += summary.leaveDays;
        aggregateMetadata.AbsentDays += summary.absentDays;
        aggregateMetadata.totalSchoolDays += summary.attendedDaysCount;
        aggregateMetadata.totalPresentHours += summary.totalPresentHours;
        aggregateMetadata.totalAbsentHours += summary.totalAbsentHours;

        return summary;
      });

      if (studentId && students.length === 1 && studentSummaries[0]) {
        return {
          success: true,
          message: "Student attendance summary retrieved successfully",
          data: studentSummaries[0],
        };
      } else {
        return {
          success: true,
          message: "Students attendance summary list retrieved successfully",
          data: studentSummaries,
          metadata: aggregateMetadata,
          pagination: {
            pos: pos || 0,
            delta: delta || studentSummaries.length,
            count: totalCount,
          },
        };
      }
    } catch (error) {
      logger.error("Failed to retrieve student attendance summary", error);
      return {
        success: false,
        message: "Unable to retrieve student attendance summary at this time",
      };
    }
  }

  async getAttendanceById(id: number): Promise<ServiceResponse> {
    try {
      const attendance = await this.attendanceRepository.findOne({
        where: { id },
        relations: ["student", "student.user", "classroom", "teacher", "parent", "parent.user"],
      });

      if (!attendance || !attendance.studentId) {
        return {
          success: false,
          message: "Student attendance record not found",
        };
      }

      const formattedAttendance = {
        id: attendance.id,
        date: attendance.date,
        status: attendance.status,
        timeIn: attendance.timeIn,
        timeOut: attendance.timeOut,
        notes: attendance.notes,
        recordedBy: attendance.recordedBy,
        classroomId: attendance.classroomId,
        classroomName: attendance.classroom?.classroomName,
        studentId: attendance.studentId,
        teacherId: attendance.teacherId,
        parentId: attendance.parentId,
        schoolId: attendance.schoolId,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
        studentName: attendance.student?.user ? `${attendance.student.user.firstName} ${attendance.student.user.lastName}` : "Unknown",
        admissionNumber: attendance.student?.admissionNumber,
        dateOfBirth: attendance.student?.user?.dateOfBirth,
        parentName: attendance.parent?.user ? `${attendance.parent.user.firstName} ${attendance.parent.user.lastName}` : undefined,
      };

      return {
        success: true,
        message: "Student attendance retrieved successfully",
        attendance: formattedAttendance as any,
      };
    } catch (error) {
      logger.error("Failed to retrieve student attendance", error);
      return {
        success: false,
        message: "Unable to retrieve attendance at this time",
      };
    }
  }

  async filterAttendance(filters: StudentAttendanceFilters): Promise<ServiceResponse> {
    try {
      const pos = filters.pos ?? 0;
      const delta = filters.delta ?? 25;
      const qb = this.attendanceRepository.createQueryBuilder("attendance");

      // classroomId + studentId
      if (filters.classroomId && filters.studentId) {
        const student = await this.studentRepository.findOne({
          where: { id: filters.studentId },
          relations: ["currentClassroom"],
        });

        if (!student) return { success: false, message: "Student not found" };

        if (!student.currentClassroom || student.currentClassroom.id !== filters.classroomId) {
          return { success: false, message: "Student does NOT belong to this classroom." };
        }

        qb.andWhere("attendance.classroomId = :classroomId", {
          classroomId: filters.classroomId,
        });
        qb.andWhere("attendance.studentId = :studentId", {
          studentId: filters.studentId,
        });
      }

      // studentId only (all attendance across all classes)
      else if (filters.studentId) {
        qb.andWhere("attendance.studentId = :studentId", {
          studentId: filters.studentId,
        });
      }

      // classroomId only (attendance for all students in that class)
      else if (filters.classroomId) {
        qb.andWhere("attendance.classroomId = :classroomId", {
          classroomId: filters.classroomId,
        });
      }

      qb.orderBy("attendance.date", "DESC").skip(pos).take(delta);

      const [attendances, count] = await qb.getManyAndCount();

      return {
        success: true,
        message: "Attendance retrieved successfully",
        attendances,
        pagination: {
          count,
          pos,
          delta,
        },
      };
    } catch (error) {
      logger.error("Failed to retrieve student attendance", error);
      return {
        success: false,
        message: "Unable to retrieve attendance at this time",
      };
    }
  }

  async listAttendance(filters: StudentAttendanceFilters): Promise<ServiceResponse> {
    try {
      const pos = filters.pos ?? 0;
      const delta = filters.delta ?? 25;

      const qb = this.attendanceRepository
        .createQueryBuilder("attendance")
        .leftJoinAndSelect("attendance.student", "student")
        .leftJoinAndSelect("student.user", "user")
        .leftJoinAndSelect("attendance.classroom", "classroom")
        .leftJoinAndSelect("attendance.teacher", "teacher")
        .leftJoinAndSelect("attendance.parent", "parent")
        .leftJoinAndSelect("parent.user", "parentUser")
        .where("attendance.schoolId = :schoolId", { schoolId: filters.schoolId })
        .andWhere("attendance.studentId IS NOT NULL");

      await this.applyFilters(qb, filters);

      qb.orderBy("attendance.createdAt", "DESC").skip(pos).take(delta);

      const [attendances, count] = await qb.getManyAndCount();

      const formattedAttendances = attendances.map((att) => {
        const name = att.student?.user ? `${att.student.user.firstName} ${att.student.user.lastName}` : "Unknown";
        return {
          id: att.id,
          date: att.date,
          status: att.status,
          timeIn: att.timeIn,
          timeOut: att.timeOut,
          notes: att.notes,
          recordedBy: att.recordedBy,
          classroomId: att.classroomId,
          classroomName: att.classroom?.classroomName,
          studentId: att.studentId,
          teacherId: att.teacherId,
          parentId: att.parentId,
          schoolId: att.schoolId,
          createdAt: att.createdAt,
          updatedAt: att.updatedAt,
          parentName: att.parent?.user ? `${att.parent.user.firstName} ${att.parent.user.lastName}` : undefined,
          studentName: name,
          admissionNumber: att.student?.admissionNumber,
          dateOfBirth: att.student?.user?.dateOfBirth,
        };
      });

      return {
        success: true,
        message: "Student attendance fetched successfully",
        attendances: formattedAttendances as any,
        pagination: {
          pos,
          delta,
          count,
        },
      };
    } catch (error) {
      logger.error("Failed to list student attendance", error);
      console.error("Attendance listing error details:", error);
      return {
        success: false,
        message: "Unable to list attendance at this time",
      };
    }
  }

  async deleteAttendance(id: number): Promise<ServiceResponse> {
    try {
      const attendance = await this.attendanceRepository.findOne({ where: { id } });

      if (!attendance || !attendance.studentId) {
        return {
          success: false,
          message: "Student attendance record not found",
        };
      }

      // Check if any student references this as current or previous attendance
      const studentsReferencing = await this.studentRepository.find({
        where: [{ currentAttendance: { id } }, { previousAttendance: { id } }],
        relations: ["currentAttendance", "previousAttendance"],
      });

      if (studentsReferencing.length > 0) {
        for (const student of studentsReferencing) {
          if (student.currentAttendance?.id === id) student.currentAttendance = null;
          if (student.previousAttendance?.id === id) student.previousAttendance = null;
          await this.studentRepository.save(student);
        }
      }

      await this.attendanceRepository.delete(id);

      return {
        success: true,
        message: "Attendance deleted successfully",
      };
    } catch (error) {
      logger.error("Failed to delete student attendance", error);
      console.error("Attendance deletion error details:", error);
      return {
        success: false,
        message: "Unable to delete attendance at this time",
      };
    }
  }

  /* Helper methods */

  private determineCurrentStatus(
    todayLogs: Attendance[],
    currentAttendance: Attendance | null | undefined,
    todayKey: string,
  ): { status: string; timeIn?: string; timeOut?: string } {
    if (todayLogs.length > 0) {
      // Sort by createdAt desc to get latest status
      const sorted = [...todayLogs].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      // First is newest
      const newest = sorted[0];

      const timesIn = todayLogs
        .map((l) => l.timeIn)
        .filter(Boolean)
        .sort();
      const timesOut = todayLogs
        .map((l) => l.timeOut)
        .filter(Boolean)
        .sort()
        .reverse();

      return {
        status: newest?.status || "Absent",
        timeIn: timesIn[0],
        timeOut: timesOut[0],
      };
    } else if (currentAttendance) {
      const caKey = formatDateKey(currentAttendance.date);
      if (caKey === todayKey) {
        return {
          status: currentAttendance.status,
          timeIn: currentAttendance.timeIn,
          timeOut: currentAttendance.timeOut,
        };
      }
    }
    return { status: "Absent" };
  }

  private processDailyLogs(dailyLogs: Attendance[], schoolIn: string, schoolOut: string) {
    let presentHours = 0;
    let clippedPresentHours = 0;

    // Process all logs for hours
    dailyLogs.forEach((log) => {
      presentHours += this.calculateHours(log.timeIn, log.timeOut);
      clippedPresentHours += this.calculateClippedHours(log.timeIn!, log.timeOut!, schoolIn, schoolOut);
    });

    // Determine status of day from the last created log
    const sortedLogs = [...dailyLogs].sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
    const lastLog = sortedLogs[sortedLogs.length - 1];

    return {
      status: lastLog?.status || null,
      presentHours,
      clippedPresentHours,
    };
  }

  private async applyFilters(qb: any, filters: StudentAttendanceFilters): Promise<void> {
    const alias = qb.expressionMap.mainAlias.name;

    if (filters.teacherId) {
      if (alias === "student") {
        qb.leftJoin("staffClassesAndSubject", "scas", "scas.classroomId = student.classroomId AND scas.staffId = :teacherId", {
          teacherId: filters.teacherId,
        });
        qb.andWhere("scas.id IS NOT NULL");
      } else {
        qb.leftJoin("staffClassesAndSubject", "scas", "scas.classroomId = attendance.classroomId AND scas.staffId = :teacherId", {
          teacherId: filters.teacherId,
        });
        qb.andWhere(
          new Brackets((q) => {
            q.where("scas.id IS NOT NULL").orWhere("attendance.teacherId = :teacherId", { teacherId: filters.teacherId });
          }),
        );
      }
    }

    if (filters.search) {
      qb.andWhere(
        new Brackets((q) => {
          q.where("LOWER(user.firstName) LIKE LOWER(:search)", { search: `%${filters.search}%` }).orWhere(
            "LOWER(user.lastName) LIKE LOWER(:search)",
            { search: `%${filters.search}%` },
          );
        }),
      );
    }

    if (filters.classroomId) {
      qb.andWhere(`${alias === "student" ? "student.classroomId" : "attendance.classroomId"} = :classroomId`, {
        classroomId: filters.classroomId,
      });
    }

    if (filters.studentId) {
      qb.andWhere(`${alias === "student" ? "student.id" : "attendance.studentId"} = :studentId`, { studentId: filters.studentId });
    }

    if (filters.parentId) {
      qb.andWhere(`${alias === "student" ? "student.parentId" : "attendance.parentId"} = :parentId`, { parentId: filters.parentId });
    }

    if (filters.status && alias === "attendance") {
      qb.andWhere("attendance.status = :status", { status: filters.status });
    }

    if (filters.startDate && alias === "attendance") {
      qb.andWhere("attendance.date >= :startDate", { startDate: formatDateKey(filters.startDate) });
    }

    if (filters.endDate && alias === "attendance") {
      qb.andWhere("attendance.date <= :endDate", { endDate: formatDateKey(filters.endDate) });
    }
  }
}

export const studentAttendanceService = new StudentAttendanceService();
export { StudentAttendanceService };
