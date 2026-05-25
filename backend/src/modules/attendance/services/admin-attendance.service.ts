import { Repository } from "typeorm";
import { AppDataSource } from "../../core";
import { AttendanceStatus, logger } from "../../shared";
import { Attendance } from "../../shared/entities/Attendance";
import { Admin } from "../../shared/entities/Admin";
import { formatDateKey, normalizeTime, getCurrentTime, countWorkingDays, getNigeriaDate } from "../../shared/utils/date-util";

export interface CreateAdminAttendance {
  adminId: number;
  notes?: string;
  timeIn?: string;
  timeOut?: string;
  schoolId?: number;
  date: string | Date;
}

export interface ClockInAdmin {
  adminId: number;
  date?: string | Date;
  notes?: string;
  schoolId?: number;
}

export interface ClockOutAdmin {
  adminId: number;
  timeOut?: string;
  notes?: string;
  schoolId?: number;
}

export interface UpdateAdminAttendance {
  status?: AttendanceStatus;
  notes?: string;
  timeIn?: string;
  timeOut?: string;
  date?: string | Date;
}

export interface AdminAttendanceFilters {
  adminId?: number;
  schoolId?: number;
  search?: string;
  status?: AttendanceStatus;
  startDate?: string | Date;
  endDate?: string | Date;
  pos?: number;
  delta?: number;
}

export interface AdminAttendanceSummary extends AdminAttendanceFilters {
  adminId: number;
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
    totalPotentialSchoolDays?: number;
  };
  pagination?: {
    pos: number;
    delta: number;
    count: number;
  };
}

class AdminAttendanceService {
  private get attendanceRepository(): Repository<Attendance> {
    return AppDataSource.getRepository(Attendance);
  }

  private get adminRepository(): Repository<Admin> {
    return AppDataSource.getRepository(Admin);
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

  async clockIn(data: ClockInAdmin): Promise<ServiceResponse> {
    try {
      const admin = await this.adminRepository.findOne({
        where: { id: data.adminId },
        relations: ["user", "school", "currentAttendance"],
      });

      if (!admin) {
        return { success: false, message: "Admin not found" };
      }

      if (data.schoolId !== undefined && admin.schoolId !== data.schoolId) {
        return { success: false, message: "Admin does not belong to the specified school" };
      }

      if (admin.currentAttendance) {
        return { success: false, message: "Already clocked in. Please clock out first." };
      }

      const finalTimeIn = this.getCurrentTime();
      const normalizedTimeIn = this.normalizeTime(finalTimeIn);

      let finalStatus = AttendanceStatus.PRESENT;
      const staffResumptionTime = admin.school?.staffResumptionTime;
      if (staffResumptionTime) {
        const schoolResumption = this.normalizeTime(staffResumptionTime);
        if (normalizedTimeIn > schoolResumption) {
          finalStatus = AttendanceStatus.LATE;
        }
      }

      const today = getNigeriaDate();
      today.setHours(0, 0, 0, 0);

      const attendance = this.attendanceRepository.create({
        adminId: data.adminId,
        status: finalStatus,
        date: today,
        notes: data.notes,
        timeIn: normalizedTimeIn,
        schoolId: admin.schoolId,
      });

      const saved = await this.attendanceRepository.save(attendance);

      admin.currentAttendance = saved;
      await this.adminRepository.save(admin);

      return {
        success: true,
        message: "Clocked in successfully",
        attendance: saved,
      };
    } catch (error) {
      logger.error("Failed to clock in admin", error);
      return { success: false, message: "Unable to clock in at this time" };
    }
  }

  async clockOut(data: ClockOutAdmin): Promise<ServiceResponse> {
    try {
      const admin = await this.adminRepository.findOne({
        where: { id: data.adminId },
        relations: ["user", "school", "currentAttendance"],
      });

      if (!admin) {
        return { success: false, message: "Admin not found" };
      }

      if (data.schoolId !== undefined && admin.schoolId !== data.schoolId) {
        return { success: false, message: "Admin does not belong to the specified school" };
      }

      if (!admin.currentAttendance) {
        return { success: false, message: "Not clocked in. Please clock in first." };
      }

      const finalTimeOut = data.timeOut || this.getCurrentTime();
      const normalizedTimeOut = this.normalizeTime(finalTimeOut);

      const attendance = admin.currentAttendance;
      attendance.timeOut = normalizedTimeOut;
      if (data.notes) attendance.notes = data.notes;
      const saved = await this.attendanceRepository.save(attendance);

      admin.previousAttendance = attendance;
      admin.currentAttendance = null;
      await this.adminRepository.save(admin);

      return {
        success: true,
        message: "Clocked out successfully",
        attendance: saved,
      };
    } catch (error) {
      logger.error("Failed to clock out admin", error);
      return { success: false, message: "Unable to clock out at this time" };
    }
  }

  async recordAttendance(data: CreateAdminAttendance): Promise<ServiceResponse> {
    try {
      const admin = await this.adminRepository.findOne({
        where: { id: data.adminId },
        relations: ["user", "school"],
      });

      if (!admin) {
        return { success: false, message: "Admin not found" };
      }

      const dateOnly = new Date(data.date);

      const existing = await this.attendanceRepository.findOne({
        where: { adminId: data.adminId, date: dateOnly },
      });

      if (existing) {
        return { success: false, message: "Attendance recorded already for this date" };
      }

      let finalStatus = AttendanceStatus.PRESENT;

      if (!data.timeIn) {
        finalStatus = AttendanceStatus.ABSENT;
      } else {
        const staffResumptionTime = admin.school?.staffResumptionTime;
        if (staffResumptionTime) {
          const schoolResumption = this.normalizeTime(staffResumptionTime);
          const actualTimeIn = this.normalizeTime(data.timeIn);
          if (actualTimeIn > schoolResumption) {
            finalStatus = AttendanceStatus.LATE;
          }
        }
      }

      const attendance = this.attendanceRepository.create({
        adminId: data.adminId,
        status: finalStatus,
        notes: data.notes,
        date: dateOnly,
        timeIn: data.timeIn,
        timeOut: data.timeOut,
        schoolId: admin.schoolId,
      });

      const saved = await this.attendanceRepository.save(attendance);
      const attendanceWithRelations = await this.getAttendanceById(saved.id);

      return {
        success: true,
        message: "Admin attendance recorded successfully",
        attendance: attendanceWithRelations.attendance,
      };
    } catch (error) {
      logger.error("Failed to record admin attendance", error);
      return { success: false, message: "Unable to record admin attendance at this time" };
    }
  }

  async updateAttendance(
    attendanceId: number,
    data: UpdateAdminAttendance,
    recordedByUserId?: number,
  ): Promise<ServiceResponse> {
    try {
      const attendance = await this.attendanceRepository.findOne({
        where: { id: attendanceId },
        relations: ["school"],
      });

      if (!attendance || !attendance.adminId) {
        return { success: false, message: "Admin attendance record not found" };
      }

      const requestTimeIn = data.timeIn;
      const effectiveTimeIn = requestTimeIn !== undefined ? requestTimeIn : attendance.timeIn;

      if (effectiveTimeIn && data.status === AttendanceStatus.ABSENT) {
        return {
          success: false,
          message:
            "Cannot set status to ABSENT when a clock-in time is recorded. Please clear the timeIn first if you wish to mark as ABSENT.",
        };
      }

      if (effectiveTimeIn && attendance.school?.staffResumptionTime) {
        const schoolResumption = this.normalizeTime(attendance.school.staffResumptionTime);
        const actualTimeIn = this.normalizeTime(effectiveTimeIn);
        let calculatedStatus = AttendanceStatus.PRESENT;

        if (actualTimeIn > schoolResumption) {
          calculatedStatus = AttendanceStatus.LATE;
        }

        if (requestTimeIn !== undefined) {
          if (data.status) {
            if (
              (data.status === AttendanceStatus.PRESENT || data.status === AttendanceStatus.LATE) &&
              data.status !== calculatedStatus
            ) {
              return {
                success: false,
                message: `Cannot set status to ${data.status}. The time ${effectiveTimeIn} indicates the status should be ${calculatedStatus}.`,
              };
            }
            attendance.status = data.status;
          } else {
            attendance.status = calculatedStatus;
          }
          attendance.timeIn = requestTimeIn;
        } else if (data.status) {
          if (
            (data.status === AttendanceStatus.PRESENT || data.status === AttendanceStatus.LATE) &&
            data.status !== calculatedStatus
          ) {
            return {
              success: false,
              message: `Cannot update status to ${data.status}. The recorded time ${effectiveTimeIn} indicates the status should be ${calculatedStatus}.`,
            };
          }
          attendance.status = data.status;
        }
      } else {
        if (data.status) attendance.status = data.status;
        if (data.timeIn) attendance.timeIn = data.timeIn;
      }

      if (data.notes) attendance.notes = data.notes;
      if (data.timeOut) attendance.timeOut = data.timeOut;
      if (data.date) attendance.date = new Date(this.normalizeDate(data.date));
      if (recordedByUserId) attendance.recordedBy = recordedByUserId;

      const saved = await this.attendanceRepository.save(attendance);
      const attendanceWithRelations = await this.getAttendanceById(saved.id);

      return {
        success: true,
        message: "Admin attendance updated successfully",
        attendance: attendanceWithRelations.attendance,
      };
    } catch (error) {
      logger.error("Failed to update admin attendance", error);
      return { success: false, message: "Unable to update admin attendance at this time" };
    }
  }

  async getAttendanceById(id: number): Promise<ServiceResponse> {
    try {
      const attendance = await this.attendanceRepository.findOne({
        where: { id },
        relations: {
          admin: {
            user: {
              profile: true,
            },
          },
          school: true,
        },
      });

      if (!attendance) {
        return { success: false, message: "Attendance record not found" };
      }

      const formattedAttendance = {
        id: attendance.id,
        date: attendance.date,
        status: attendance.status,
        timeIn: attendance.timeIn,
        timeOut: attendance.timeOut,
        notes: attendance.notes,
        recordedBy: attendance.recordedBy,
        adminId: attendance.adminId,
        schoolId: attendance.schoolId,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
        adminName: attendance.admin?.user
          ? `${attendance.admin.user.firstName} ${attendance.admin.user.lastName}`
          : undefined,
        adminRole: attendance.admin?.role,
        adminPhoto: attendance.admin?.user?.profile?.photo,
      };

      return {
        success: true,
        message: "Admin attendance retrieved successfully",
        attendance: formattedAttendance as any,
      };
    } catch (error) {
      logger.error("Failed to retrieve admin attendance", error);
      return { success: false, message: "Unable to retrieve admin attendance at this time" };
    }
  }

  async getAdminAttendanceSummary(filters: AdminAttendanceSummary): Promise<ServiceResponse> {
    try {
      const { adminId, startDate, endDate } = filters;

      const qbLogs = this.attendanceRepository
        .createQueryBuilder("attendance")
        .leftJoin("attendance.admin", "admin")
        .where("attendance.adminId = :adminId", { adminId });

      await this.applyFilters(qbLogs, { ...filters, startDate, endDate });

      const attendanceLogs = await qbLogs.orderBy("attendance.createdAt", "DESC").getMany();

      const metadata = await this.getSummaryMetadata({ ...filters, startDate, endDate });

      return {
        success: true,
        message: "Admin attendance summary retrieved successfully",
        attendances: attendanceLogs,
        metadata,
      };
    } catch (error) {
      logger.error("Failed to retrieve admin attendance summary", error);
      return { success: false, message: "Unable to retrieve admin attendance summary at this time" };
    }
  }

  async listAttendance(filters: AdminAttendanceFilters): Promise<ServiceResponse> {
    try {
      const pos = filters.pos ?? 0;
      const delta = filters.delta ?? 25;

      const qb = this.attendanceRepository
        .createQueryBuilder("attendance")
        .leftJoinAndSelect("attendance.admin", "admin")
        .leftJoinAndSelect("admin.user", "adminUser")
        .leftJoinAndSelect("adminUser.profile", "profile")
        .where("attendance.adminId IS NOT NULL")
        .andWhere("attendance.schoolId = :schoolId", { schoolId: filters.schoolId });

      await this.applyFilters(qb, filters);

      qb.orderBy("attendance.createdAt", "DESC").skip(pos).take(delta);

      const [attendances, count] = await qb.getManyAndCount();

      const formattedAttendances = attendances.map((attendance) => {
        const formatted: any = {
          id: attendance.id,
          date: attendance.date,
          status: attendance.status,
          timeIn: attendance.timeIn,
          timeOut: attendance.timeOut,
          notes: attendance.notes,
          recordedBy: attendance.recordedBy,
          adminId: attendance.adminId,
          createdAt: attendance.createdAt,
          updatedAt: attendance.updatedAt,
        };

        if (attendance?.admin) {
          formatted.admin = {
            id: attendance.admin.id,
            userId: attendance.admin.userId,
            role: attendance.admin.role,
          };

          if (attendance?.admin?.user) {
            formatted.admin.user = {
              id: attendance.admin.user.id,
              uuid: attendance.admin.user.uuid,
              firstName: attendance.admin.user.firstName,
              lastName: attendance.admin.user.lastName,
              middleName: attendance.admin.user.middleName,
              email: attendance.admin.user.email,
              role: attendance.admin.user.role,
              profile: attendance.admin.user.profile
                ? {
                    id: attendance.admin.user.profile.id,
                    suffix: attendance.admin.user.profile.suffix,
                    photo: attendance.admin.user.profile.photo,
                  }
                : null,
            };
          }
        }

        return formatted;
      });

      const metadata = await this.getSummaryMetadata(filters);

      return {
        success: true,
        message: "Admin attendance fetched successfully",
        attendances: formattedAttendances,
        metadata,
        pagination: { pos, delta, count },
      };
    } catch (error) {
      logger.error("Failed to list admin attendance", error);
      return { success: false, message: "Unable to list admin attendance at this time" };
    }
  }

  async deleteAttendance(id: number): Promise<ServiceResponse> {
    try {
      const attendance = await this.attendanceRepository.findOne({ where: { id } });

      if (!attendance || !attendance.adminId) {
        return { success: false, message: "Admin attendance record not found" };
      }

      const adminsReferencing = await this.adminRepository.find({
        where: [{ currentAttendance: { id } }, { previousAttendance: { id } }],
        relations: ["currentAttendance", "previousAttendance"],
      });

      if (adminsReferencing.length > 0) {
        for (const admin of adminsReferencing) {
          if (admin.currentAttendance?.id === id) admin.currentAttendance = null;
          if (admin.previousAttendance?.id === id) admin.previousAttendance = null;
          await this.adminRepository.save(admin);
        }
      }

      await this.attendanceRepository.delete(id);

      return { success: true, message: "Admin attendance deleted successfully" };
    } catch (error) {
      logger.error("Failed to delete admin attendance", error);
      return { success: false, message: "Unable to delete admin attendance at this time" };
    }
  }

  private async applyFilters(qb: any, filters: AdminAttendanceFilters): Promise<void> {
    if (filters.adminId) {
      qb.andWhere("attendance.adminId = :adminId", { adminId: filters.adminId });
    }

    if (filters.search) {
      if (!qb.expressionMap.joinAttributes?.some((j: any) => j.alias?.name === "adminUser")) {
        qb.leftJoin("admin.user", "adminUser");
      }
      qb.andWhere(
        "(LOWER(adminUser.firstName) LIKE LOWER(:search) OR LOWER(adminUser.lastName) LIKE LOWER(:search))",
        { search: `%${filters.search}%` },
      );
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

  private async getSummaryMetadata(filters: AdminAttendanceFilters): Promise<any> {
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
      totalPotentialSchoolDays: 0,
    };

    summaryCounts.totalPotentialSchoolDays = countWorkingDays(
      effectiveFilters.startDate as Date,
      effectiveFilters.endDate as Date,
    );

    const statusQueries = [
      { status: AttendanceStatus.PRESENT },
      { status: AttendanceStatus.LATE },
      { status: AttendanceStatus.EXCUSED },
      { status: AttendanceStatus.LEAVE },
    ];

    const statusCountPromises = Object.values(statusQueries).map(async (statusObj) => {
      const qb = this.attendanceRepository
        .createQueryBuilder("attendance")
        .leftJoin("attendance.admin", "admin")
        .select("COUNT(DISTINCT attendance.date)", "count")
        .where("attendance.schoolId = :schoolId", { schoolId: effectiveFilters.schoolId })
        .andWhere("attendance.status = :status", { status: statusObj.status });

      await this.applyFilters(qb, effectiveFilters);
      const result = await qb.getRawOne();
      return { status: statusObj.status, count: Number(result?.count || 0) };
    });

    const statusCounts = await Promise.all(statusCountPromises);

    const statusMap: Record<string, string> = {
      [AttendanceStatus.PRESENT]: "PresentDays",
      [AttendanceStatus.ABSENT]: "AbsentDays",
      [AttendanceStatus.LATE]: "LateDays",
      [AttendanceStatus.EXCUSED]: "ExcusedDays",
      [AttendanceStatus.LEAVE]: "LeaveDays",
    };

    statusCounts.forEach(({ status, count }) => {
      const propertyName = statusMap[status];
      if (propertyName) {
        summaryCounts[propertyName] = count;
      }
    });

    const totalUniqueDaysQuery = this.attendanceRepository
      .createQueryBuilder("attendance")
      .leftJoin("attendance.admin", "admin")
      .select("COUNT(DISTINCT attendance.date)", "count")
      .where("attendance.schoolId = :schoolId", { schoolId: effectiveFilters.schoolId })
      .andWhere("attendance.adminId IS NOT NULL");

    await this.applyFilters(totalUniqueDaysQuery, effectiveFilters);
    const totalUniqueDaysResult = await totalUniqueDaysQuery.getRawOne();
    summaryCounts.totalSchoolDays = Number(totalUniqueDaysResult?.count || 0);

    summaryCounts.AbsentDays = Math.max(
      0,
      summaryCounts.totalPotentialSchoolDays - summaryCounts.totalSchoolDays,
    );

    return summaryCounts;
  }
}

export const adminAttendanceService = new AdminAttendanceService();
export { AdminAttendanceService };
