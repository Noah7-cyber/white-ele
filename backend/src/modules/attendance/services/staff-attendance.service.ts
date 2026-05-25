import { Repository } from "typeorm";
import { AppDataSource } from "../../core";
import { AttendanceStatus, logger } from "../../shared";
import { Attendance } from "../../shared/entities/Attendance";
import { Staff } from "../../shared/entities/Staff";
import { formatDateKey, normalizeTime, getCurrentTime, countWorkingDays, getNigeriaDate } from "../../shared/utils/date-util";

export interface CreateStaffAttendance {
  teacherId: number;
  notes?: string;
  timeIn: string;
  timeOut?: string;
  schoolId?: number;
  date: string | Date;
}


export interface ClockInStaff {
  teacherId: number;
  date?: string | Date;
  notes?: string;
  schoolId?: number;
}

export interface ClockOutStaff {
  teacherId: number;
  timeOut?: string;
  notes?: string;
  schoolId?: number;
}

export interface UpdateStaffAttendance {
  status?: AttendanceStatus;
  notes?: string;
  timeIn?: string;
  timeOut?: string;
  date?: string | Date;
}

export interface StaffAttendanceFilters {
  teacherId?: number;
  studentId?: number;
  schoolId?: number;
  search?: string;
  status?: AttendanceStatus;
  startDate?: string | Date;
  endDate?: string | Date;
  classroomId?: number;
  pos?: number;
  delta?: number;
}


export interface StaffAttendanceSummary extends StaffAttendanceFilters {
  teacherId: number;
}

interface ServiceResponse {
  success: boolean;
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
  };
  pagination?: {
    pos: number;
    delta: number;
    count: number;
  };
}

class StaffAttendanceService {
  private get attendanceRepository(): Repository<Attendance> {
    return AppDataSource.getRepository(Attendance);
  }

  private get teacherRepository(): Repository<Staff> {
    return AppDataSource.getRepository(Staff);
  }

  private normalizeDate(dateInput: string | Date): string {
    return formatDateKey(dateInput);
  }

  private normalizeTime(time: string): string {
    return normalizeTime(time);
  }

  private getCurrentTime(): string {
    return getCurrentTime();
  }


  async clockIn(data: ClockInStaff): Promise<ServiceResponse> {
    try {
      const teacher = await this.teacherRepository.findOne({
        where: { id: data.teacherId },
        relations: ["user", "school", "currentAttendance"],
      });

      if (!teacher) {
        return {
          success: false,
          message: "Teacher not found",
        };
      }

      // Validate school access if schoolId is provided
      if (data.schoolId !== undefined && teacher.schoolId !== data.schoolId) {
        return {
          success: false,
          message: "Teacher does not belong to the specified school",
        };
      }

      // Check if already clocked in
      if (teacher.currentAttendance) {
        return {
          success: false,
          message: "Already clocked in. Please clock out first.",
        };
      }

      // Use provided timeIn or current time
      const finalTimeIn = this.getCurrentTime();
      const normalizedTimeIn = this.normalizeTime(finalTimeIn);

      // Calculate status based on resumption time
      let finalStatus = AttendanceStatus.PRESENT;
      const staffResumptionTime = teacher.school?.staffResumptionTime;
      if (staffResumptionTime) {
        const schoolResumption = this.normalizeTime(staffResumptionTime);
        if (normalizedTimeIn > schoolResumption) {
          finalStatus = AttendanceStatus.LATE;
        }
      }

      // Create attendance record
      const today = getNigeriaDate();
      today.setHours(0, 0, 0, 0);

      const attendance = this.attendanceRepository.create({
        teacherId: data.teacherId,
        status: finalStatus,
        date: today,
        notes: data.notes,
        timeIn: normalizedTimeIn,
        schoolId: teacher.schoolId,
      });

      const saved = await this.attendanceRepository.save(attendance);

      // Update teacher's currentAttendance pointer
      teacher.currentAttendance = saved;
      await this.teacherRepository.save(teacher);


      return {
        success: true,
        message: "Clocked in successfully",
        attendance: saved,
      };
    } catch (error) {
      logger.error("Failed to clock in staff", error);
      return {
        success: false,
        message: "Unable to clock in at this time",
      };
    }
  }

  async clockOut(data: ClockOutStaff): Promise<ServiceResponse> {
    try {
      const teacher = await this.teacherRepository.findOne({
        where: { id: data.teacherId },
        relations: ["user", "school", "currentAttendance"],
      });

      if (!teacher) {
        return {
          success: false,
          message: "Teacher not found",
        };
      }

      // Validate school access if schoolId is provided
      if (data.schoolId !== undefined && teacher.schoolId !== data.schoolId) {
        return {
          success: false,
          message: "Teacher does not belong to the specified school",
        };
      }

      // Check if clocked in
      if (!teacher.currentAttendance) {
        return {
          success: false,
          message: "Not clocked in. Please clock in first.",
        };
      }

      // Use provided timeOut or current time
      const finalTimeOut = data.timeOut || this.getCurrentTime();
      const normalizedTimeOut = this.normalizeTime(finalTimeOut);

      // Update attendance record with timeOut
      const attendance = teacher.currentAttendance;
      attendance.timeOut = normalizedTimeOut;
      const saved = await this.attendanceRepository.save(attendance);

      // Move currentAttendance to previousAttendance and set currentAttendance to null
      teacher.previousAttendance = attendance;
      teacher.currentAttendance = null;
      await this.teacherRepository.save(teacher);


      return {
        success: true,
        message: "Clocked out successfully",
        attendance: saved,
      };
    } catch (error) {
      logger.error("Failed to clock out staff", error);
      return {
        success: false,
        message: "Unable to clock out at this time",
      };
    }
  }


  async recordAttendance(data: CreateStaffAttendance): Promise<ServiceResponse> {
    try {
      const teacher = await this.teacherRepository.findOne({
        where: { id: data.teacherId },
        relations: ["user", "staffClassesAndSubject", "staffClassesAndSubject.classroom", "school"],
      });

      if (!teacher) {
        return {
          success: false,
          message: "Teacher not found",
        };
      }

      const dateOnly = new Date(data.date);

      let attendance = await this.attendanceRepository.findOne({
        where: {
          teacherId: data.teacherId,
          date: dateOnly,
        },
      });

      if (attendance)
        return { success: false, message: "Attendance recorded already for this date" };

      let finalStatus = AttendanceStatus.PRESENT;

      if (!data.timeIn) {
        finalStatus = AttendanceStatus.ABSENT;
      } else {
        const staffResumptionTime = teacher.school?.staffResumptionTime;
        if (staffResumptionTime) {
          const schoolResumption = this.normalizeTime(staffResumptionTime);
          const actualTimeIn = this.normalizeTime(data.timeIn);

          if (actualTimeIn > schoolResumption) {
            finalStatus = AttendanceStatus.LATE;
          }
        }
      }

      attendance = this.attendanceRepository.create({
        teacherId: data.teacherId,
        status: finalStatus,
        notes: data.notes,
        date: data.date,
        timeIn: data.timeIn,
        timeOut: data.timeOut,
      })

      const saved = await this.attendanceRepository.save(attendance);

      const attendanceWithRelations = await this.getAttendanceById(saved?.id)

      return {
        success: true,
        message: "Staff attendance recorded successfully",
        attendance: attendanceWithRelations.attendance,
      };

    } catch (error) {
      logger.error("Failed to record staff attendance", error);
      console.error("Error recording attendance", error)
      return {
        success: false,
        message: "Unable to record staff attendance at this time",
      };
    }
  }

  async updateAttendance(attendanceId: number, data: UpdateStaffAttendance, recordedByUserId?: number): Promise<ServiceResponse> {
    try {
      const attendance = await this.attendanceRepository.findOne({
        where: { id: attendanceId },
        relations: ["school"],
      });

      if (!attendance || !attendance.teacherId) {
        return {
          success: false,
          message: "Staff attendance record not found",
        };
      }

      // Handle Status and Time Updates logic
      const requestTimeIn = data.timeIn;
      const effectiveTimeIn = requestTimeIn !== undefined ? requestTimeIn : attendance.timeIn;

      // VALIDATION: If timeIn exists, status cannot be ABSENT
      if (effectiveTimeIn && data.status === AttendanceStatus.ABSENT) {
        return {
          success: false,
          message: "Cannot set status to ABSENT when a clock-in time is recorded. Please clear the timeIn first if you wish to mark as ABSENT."
        };
      }

      if (effectiveTimeIn && attendance.school?.staffResumptionTime) {
        const schoolResumption = this.normalizeTime(attendance.school.staffResumptionTime);
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
                message: `Cannot set status to ${data.status}. The time ${effectiveTimeIn} indicates the status should be ${calculatedStatus}.`
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
              message: `Cannot update status to ${data.status}. The recorded time ${effectiveTimeIn} indicates the status should be ${calculatedStatus}.`
            };
          }
          attendance.status = data.status;
        }
      } else {
        // Fallback for when no resumption time is configured or no timeIn
        if (data.status) attendance.status = data.status;
        if (data.timeIn) attendance.timeIn = data.timeIn;
      }

      if (data.notes) attendance.notes = data.notes;

      if (data.timeOut) attendance.timeOut = data.timeOut;

      if (data.date) attendance.date = new Date(this.normalizeDate(data.date));

      if (recordedByUserId) attendance.recordedBy = recordedByUserId;


      const saved = await this.attendanceRepository.save(attendance);

      const attendanceWithRelations = await this.getAttendanceById(saved?.id)

      return {
        success: true,
        message: "Staff attendance updated successfully",
        attendance: attendanceWithRelations.attendance
      };

    } catch (error) {
      logger.error("Failed to update staff attendance", error);
      console.error("Error updating Attendance", error)
      return {
        success: false,
        message: "Unable to update staff attendance at this time",
      };
    }
  }



  async getAttendanceById(id: number): Promise<ServiceResponse> {
    try {
      const attendance = await this.attendanceRepository.findOne({
        where: { id },
        relations: {
          teacher: {
            user: {
              profile: true,
            },
          },
          school: true,
        },
      });

      if (!attendance) {
        return {
          success: false,
          message: "Attendance record not found",
        };
      }

      // Format attendance with flattened teacher data
      const formattedAttendance = {
        id: attendance.id,
        date: attendance.date,
        status: attendance.status,
        timeIn: attendance.timeIn,
        timeOut: attendance.timeOut,
        notes: attendance.notes,
        recordedBy: attendance.recordedBy,
        classroomId: attendance.classroomId,
        studentId: attendance.studentId,
        teacherId: attendance.teacherId,
        parentId: attendance.parentId,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
        teacherName: attendance.teacher?.user
          ? `${attendance.teacher.user.firstName} ${attendance.teacher.user.lastName}`
          : undefined,
        staffRole: attendance.teacher?.staffRole,
        staffPhoto: attendance.teacher?.user?.profile?.photo,
        qualification: attendance.teacher?.qualification,
      };

      return {
        success: true,
        message: "Staff attendance retrieved successfully",
        attendance: formattedAttendance as any,
      };
    } catch (error) {
      logger.error("Failed to retrieve staff attendance", error);
      return {
        success: false,
        message: "Unable to retrieve staff attendance at this time",
      };
    }
  }


  async getStaffAttendanceSummary(filters: StaffAttendanceSummary): Promise<ServiceResponse> {
    try {
      const { teacherId, startDate, endDate } = filters;


      const qbLogs = this.attendanceRepository.createQueryBuilder("attendance")
        .leftJoin("attendance.teacher", "teacher")
        .leftJoin("teacher.staffClassesAndSubject", "staffClassesAndSubject")
        .where("attendance.teacherId = :teacherId", { teacherId });

      await this.applyFilters(qbLogs, { ...filters, startDate, endDate });

      const attendanceLogs = await qbLogs.orderBy("attendance.createdAt", "DESC").getMany();

      const metadata = await this.getSummaryMetadata({ ...filters, startDate, endDate });

      return {
        success: true,
        message: "Staff attendance summary retrieved successfully",
        attendances: attendanceLogs,
        metadata,
      };
    } catch (error) {
      logger.error("Failed to retrieve staff attendance summary", error);
      return {
        success: false,
        message: "Unable to retrieve staff attendance summary at this time",
      };
    }
  }


  async listAttendance(filters: StaffAttendanceFilters): Promise<ServiceResponse> {
    try {
      const pos = filters.pos ?? 0;
      const delta = filters.delta ?? 25;

      const qb = this.attendanceRepository
        .createQueryBuilder("attendance")
        .leftJoinAndSelect("attendance.teacher", "teacher")
        .leftJoin("teacher.staffClassesAndSubject", "staffClassesAndSubject")
        .leftJoinAndSelect("teacher.user", "teacherUser")
        .leftJoinAndSelect("teacherUser.profile", "profile")
        .where("attendance.teacherId IS NOT NULL")
        .andWhere("attendance.schoolId = :schoolId", { schoolId: filters.schoolId });

      await this.applyFilters(qb, filters);

      qb.orderBy("attendance.createdAt", "DESC").skip(pos).take(delta);

      const [attendances, count] = await qb.getManyAndCount();

      // Format attendances to remove sensitive data
      const formattedAttendances = attendances.map(attendance => {
        const formatted: any = {
          id: attendance.id,
          date: attendance.date,
          status: attendance.status,
          timeIn: attendance.timeIn,
          timeOut: attendance.timeOut,
          notes: attendance.notes,
          recordedBy: attendance.recordedBy,
          classroomId: attendance.classroomId,
          studentId: attendance.studentId,
          teacherId: attendance.teacherId,
          parentId: attendance.parentId,
          createdAt: attendance.createdAt,
          updatedAt: attendance.updatedAt,
        };

        // Format teacher data - remove sensitive user information
        if (attendance?.teacher) {
          formatted.teacher = {
            id: attendance.teacher.id,
            userId: attendance.teacher.userId,
            staffRole: attendance.teacher.staffRole,
            qualification: attendance.teacher.qualification,
            status: attendance.teacher.status,
          };

          // Add safe user data (no sensitive fields)
          if (attendance?.teacher?.user) {
            formatted.teacher.user = {
              id: attendance.teacher.user.id,
              uuid: attendance.teacher.user.uuid,
              firstName: attendance.teacher.user.firstName,
              lastName: attendance.teacher.user.lastName,
              middleName: attendance.teacher.user.middleName,
              email: attendance.teacher.user.email,
              role: attendance.teacher.user.role,
              profile: attendance.teacher.user.profile ? {
                id: attendance.teacher.user.profile.id,
                suffix: attendance.teacher.user.profile.suffix,
                photo: attendance.teacher.user.profile.photo,
              } : null,
            };
          }
        }

        return formatted;
      });

      const metadata = await this.getSummaryMetadata(filters);

      return {
        success: true,
        message: "Staff attendance fetched successfully",
        attendances: formattedAttendances,
        metadata,
        pagination: {
          pos,
          delta,
          count,
        },
      };
    } catch (error) {
      logger.error("Failed to list staff attendance", error);
      console.error("Error fetching attendance:", error);
      console.error("Filters used:", JSON.stringify(filters, null, 2));
      if (error instanceof Error) {
        console.error("Error stack:", error.stack);
      }
      return {
        success: false,
        message: "Unable to list staff attendance at this time",
      };
    }
  }

  async deleteAttendance(id: number): Promise<ServiceResponse> {
    try {
      const attendance = await this.attendanceRepository.findOne({
        where: { id },
      });

      if (!attendance || !attendance.teacherId) {
        return {
          success: false,
          message: "Staff attendance record not found",
        };
      }

      // Check if any teacher references this as current or previous attendance
      const teachersReferencing = await this.teacherRepository.find({
        where: [
          { currentAttendance: { id } },
          { previousAttendance: { id } }
        ],
        relations: ["currentAttendance", "previousAttendance"]
      });

      if (teachersReferencing.length > 0) {
        for (const teacher of teachersReferencing) {
          if (teacher.currentAttendance?.id === id) teacher.currentAttendance = null;
          if (teacher.previousAttendance?.id === id) teacher.previousAttendance = null;
          await this.teacherRepository.save(teacher);
        }
      }

      await this.attendanceRepository.delete(id);

      return {
        success: true,
        message: "Staff attendance deleted successfully",
      };
    } catch (error) {
      logger.error("Failed to delete staff attendance", error);
      return {
        success: false,
        message: "Unable to delete staff attendance at this time",
      };
    }
  }

  // Helper methods

  private async applyFilters(qb: any, filters: StaffAttendanceFilters): Promise<void> {
    if (filters.teacherId) {
      qb.andWhere("attendance.teacherId = :teacherId", { teacherId: filters.teacherId });
    }

    if (filters.search) {
      if (!qb.expressionMap.joinAttributes?.some((j: any) => j.alias?.name === "teacherUser")) {
        qb.leftJoin("teacher.user", "teacherUser");
      }
      qb.andWhere("(LOWER(teacherUser.firstName) LIKE LOWER(:search) OR LOWER(teacherUser.lastName) LIKE LOWER(:search))", { search: `%${filters.search}%` });
    }

    if (filters.classroomId) {
      qb.andWhere("staffClassesAndSubject.classroomId = :classroomId", { classroomId: filters.classroomId });
    }

    if (filters.studentId) {
      qb.andWhere("attendance.studentId = :studentId", { studentId: filters.studentId });
    }

    if (filters.status) {
      qb.andWhere("attendance.status = :status", { status: filters.status });
    }

    if (filters.startDate) {
      qb.andWhere("attendance.date >= :startDate", { startDate: this.normalizeDate(filters.startDate) });
    }

    if (filters.endDate) {
      qb.andWhere("attendance.date <= :endDate", { endDate: this.normalizeDate(filters.endDate) });
    }
  }

  private async getSummaryMetadata(filters: StaffAttendanceFilters): Promise<any> {
    const effectiveFilters = { ...filters };

    if (!effectiveFilters.startDate || !effectiveFilters.endDate) {
      const now = getNigeriaDate();
      if (!effectiveFilters.startDate) {
        effectiveFilters.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      if (!effectiveFilters.endDate) {
        effectiveFilters.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
    }

    const summaryCounts: any = {
      totalSchoolDays: 0,
      PresentDays: 0,
      AbsentDays: 0,
      LateDays: 0,
      ExcusedDays: 0,
      LeaveDays: 0,
      totalPotentialSchoolDays: 0
    };

    summaryCounts.totalPotentialSchoolDays = countWorkingDays(effectiveFilters.startDate as Date, effectiveFilters.endDate as Date);

    // Count unique days for each status (excluding ABSENT which is computed)
    const statusQueries = [
      { status: AttendanceStatus.PRESENT },
      { status: AttendanceStatus.LATE },
      { status: AttendanceStatus.EXCUSED },
      { status: AttendanceStatus.LEAVE },
    ];

    const statusCountPromises = Object.values(statusQueries).map(async (statusObj) => {
      const qb = this.attendanceRepository
        .createQueryBuilder("attendance")
        .leftJoin("attendance.teacher", "teacher")
        .leftJoin("teacher.staffClassesAndSubject", "staffClassesAndSubject")
        .select("COUNT(DISTINCT attendance.date)", "count")
        .where("attendance.schoolId = :schoolId", { schoolId: effectiveFilters.schoolId })
        .andWhere("attendance.status = :status", { status: statusObj.status });

      await this.applyFilters(qb, effectiveFilters);
      const result = await qb.getRawOne();
      return { status: statusObj.status, count: Number(result?.count || 0) };
    });

    const statusCounts = await Promise.all(statusCountPromises);

    // Map status enum values to the correct property names
    const statusMap: Record<string, string> = {
      [AttendanceStatus.PRESENT]: 'PresentDays',
      [AttendanceStatus.ABSENT]: 'AbsentDays',
      [AttendanceStatus.LATE]: 'LateDays',
      [AttendanceStatus.EXCUSED]: 'ExcusedDays',
      [AttendanceStatus.LEAVE]: 'LeaveDays',
    };

    statusCounts.forEach(({ status, count }) => {
      const propertyName = statusMap[status];
      if (propertyName) {
        summaryCounts[propertyName] = count;
      }
    });

    // Count total unique days with any attendance record
    const totalUniqueDaysQuery = this.attendanceRepository
      .createQueryBuilder("attendance")
      .leftJoin("attendance.teacher", "teacher")
      .leftJoin("teacher.staffClassesAndSubject", "staffClassesAndSubject")
      .select("COUNT(DISTINCT attendance.date)", "count")
      .where("attendance.schoolId = :schoolId", { schoolId: effectiveFilters.schoolId });

    await this.applyFilters(totalUniqueDaysQuery, effectiveFilters);
    const totalUniqueDaysResult = await totalUniqueDaysQuery.getRawOne();
    summaryCounts.totalSchoolDays = Number(totalUniqueDaysResult?.count || 0);

    summaryCounts.AbsentDays = Math.max(
      0,
      summaryCounts.totalPotentialSchoolDays - summaryCounts.totalSchoolDays
    );

    return summaryCounts;
  }
}

export const staffAttendanceService = new StaffAttendanceService();
export { StaffAttendanceService };

