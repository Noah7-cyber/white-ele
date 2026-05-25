import { Brackets, Repository } from "typeorm";
import { AppDataSource } from "../../core/config/database";
import { Admin } from "../../shared/entities/Admin";
import { logger } from "../../shared";

export const DEFAULT_ADMIN_PIN = "1234";

export interface ListAdminsFilters {
  search?: string;
  pos?: number;
  delta?: number;
}

export interface AdminServiceResponse<T = any> {
  success: boolean;
  message: string;
  admin?: T;
  admins?: T[];
  pagination?: {
    pos: number;
    delta: number;
    count: number;
  };
}

class AdminService {
  private get adminRepository(): Repository<Admin> {
    return AppDataSource.getRepository(Admin);
  }

  /**
   * Verify an admin by identifier (id or email) and kiosk PIN, scoped to school.
   * Mirrors staffService.kioskVerify / parentService.kioskVerify.
   */
  async kioskVerify(
    identifier: string | number,
    pin: string,
    schoolId: number,
  ): Promise<AdminServiceResponse> {
    try {
      const queryBuilder = this.adminRepository
        .createQueryBuilder("admin")
        .leftJoinAndSelect("admin.user", "user")
        .leftJoinAndSelect("user.profile", "profile")
        .leftJoinAndSelect("admin.school", "school")
        .leftJoinAndSelect("admin.currentAttendance", "currentAttendance")
        .leftJoinAndSelect("admin.previousAttendance", "previousAttendance")
        .where("admin.deletedAt IS NULL")
        .andWhere("admin.schoolId = :schoolId", { schoolId });

      const numericId = typeof identifier === "number" ? identifier : parseInt(identifier as string, 10);

      if (!isNaN(numericId) && numericId > 0) {
        queryBuilder.andWhere("admin.id = :identifier", { identifier: numericId });
      } else {
        queryBuilder.andWhere("LOWER(user.email) = LOWER(:identifier)", { identifier: identifier as string });
      }

      const admin = await queryBuilder.getOne();

      if (!admin) {
        return { success: false, message: "Admin not found" };
      }

      if (!admin.pin) {
        return { success: false, message: "Admin not found or invalid PIN" };
      }

      if (pin !== admin.pin) {
        return { success: false, message: "Admin not found or invalid PIN" };
      }

      return {
        success: true,
        message: "Admin verified successfully",
        admin: this.formatAdminResponse(admin),
      };
    } catch (error: any) {
      logger?.error?.("Error in admin kiosk verify:", {
        message: error?.message,
        stack: error?.stack,
        identifier,
      });
      return {
        success: false,
        message: error?.message || "Failed to verify admin",
      };
    }
  }

  /**
   * Get an admin by primary key (with relations needed by attendance flow).
   */
  async getAdminById(adminId: number): Promise<AdminServiceResponse> {
    try {
      const admin = await this.adminRepository.findOne({
        where: { id: adminId },
        relations: ["user", "user.profile", "school", "currentAttendance", "previousAttendance"],
      });

      if (!admin) {
        return { success: false, message: "Admin not found" };
      }

      return {
        success: true,
        message: "Admin retrieved successfully",
        admin: this.formatAdminResponse(admin),
      };
    } catch (error: any) {
      logger?.error?.("Failed to fetch admin", error);
      return { success: false, message: "Unable to retrieve admin at this time" };
    }
  }

  /**
   * Set or update the kiosk PIN for an admin (school-scoped).
   */
  async setPin(adminId: number, pin: string, requesterSchoolId: number): Promise<AdminServiceResponse> {
    try {
      const admin = await this.adminRepository.findOne({ where: { id: adminId } });

      if (!admin) {
        return { success: false, message: "Admin not found" };
      }

      if (admin.schoolId !== requesterSchoolId) {
        return { success: false, message: "Admin does not belong to your school" };
      }

      admin.pin = pin;
      await this.adminRepository.save(admin);

      return {
        success: true,
        message: "Admin PIN updated successfully",
      };
    } catch (error: any) {
      logger?.error?.("Failed to set admin PIN", error);
      return { success: false, message: "Unable to update admin PIN at this time" };
    }
  }

  /**
   * List admins for a given school, with optional name/email search and pagination.
   * The kiosk PIN is NOT included in the response.
   */
  async listAdminsBySchool(schoolId: number, filters: ListAdminsFilters = {}): Promise<AdminServiceResponse> {
    try {
      const pos = filters.pos ?? 0;
      const delta = filters.delta ?? 25;

      const qb = this.adminRepository
        .createQueryBuilder("admin")
        .leftJoinAndSelect("admin.user", "user")
        .leftJoinAndSelect("user.profile", "profile")
        .leftJoinAndSelect("admin.school", "school")
        .leftJoinAndSelect("admin.currentAttendance", "currentAttendance")
        .leftJoinAndSelect("admin.previousAttendance", "previousAttendance")
        .where("admin.deletedAt IS NULL")
        .andWhere("admin.schoolId = :schoolId", { schoolId });

      if (filters.search) {
        qb.andWhere(
          new Brackets((q) => {
            q.where("LOWER(user.firstName) LIKE LOWER(:search)", { search: `%${filters.search}%` })
              .orWhere("LOWER(user.lastName) LIKE LOWER(:search)", { search: `%${filters.search}%` })
              .orWhere("LOWER(user.email) LIKE LOWER(:search)", { search: `%${filters.search}%` });
          }),
        );
      }

      qb.orderBy("admin.createdAt", "DESC").skip(pos).take(delta);

      const [admins, count] = await qb.getManyAndCount();

      return {
        success: true,
        message: "Admins retrieved successfully",
        admins: admins.map((a) => this.formatAdminResponse(a)),
        pagination: { pos, delta, count },
      };
    } catch (error: any) {
      logger?.error?.("Failed to list admins", error);
      return { success: false, message: "Unable to list admins at this time" };
    }
  }

  /**
   * Format admin entity for response, omitting sensitive fields like the kiosk PIN.
   */
  private formatAdminResponse(admin: Admin): any {
    const safeUser = admin.user
      ? {
          id: admin.user.id,
          uuid: admin.user.uuid,
          firstName: admin.user.firstName,
          lastName: admin.user.lastName,
          middleName: admin.user.middleName,
          email: admin.user.email,
          phone: admin.user.phone,
          role: admin.user.role,
          profile: admin.user.profile
            ? {
                id: admin.user.profile.id,
                suffix: admin.user.profile.suffix,
                photo: admin.user.profile.photo,
              }
            : null,
        }
      : null;

    return {
      id: admin.id,
      userId: admin.userId,
      schoolId: admin.schoolId,
      role: admin.role,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      user: safeUser,
      school: admin.school
        ? {
            id: admin.school.id,
            schoolName: admin.school.schoolName,
            schoolLogoUrl: admin.school.schoolLogoUrl,
          }
        : null,
      attendance: {
        currentStatus: admin.currentAttendance ? admin.currentAttendance.status : "Clocked Out",
        currentAttendance: admin.currentAttendance
          ? {
              id: admin.currentAttendance.id,
              status: admin.currentAttendance.status,
              date: admin.currentAttendance.date,
              timeIn: admin.currentAttendance.timeIn,
              timeOut: admin.currentAttendance.timeOut,
            }
          : null,
        previousAttendance: admin.previousAttendance
          ? {
              id: admin.previousAttendance.id,
              status: admin.previousAttendance.status,
              date: admin.previousAttendance.date,
              timeIn: admin.previousAttendance.timeIn,
              timeOut: admin.previousAttendance.timeOut,
            }
          : null,
      },
    };
  }
}

export const adminService = new AdminService();
export { AdminService };
