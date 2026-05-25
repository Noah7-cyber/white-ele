import { UserRepository } from "../../core/UserRepository";
import { Profile } from "../../shared/entities/Profile";
import { User } from "../../shared/entities/User";
import { Gender, UserRole } from "../../shared/entities";
import { logger } from "../../shared/utils/logger";
import { AppDataSource } from "../../core/config/database";
import { Document, Repository } from "typeorm";
import { Emergency } from "../../shared/entities/Emergency";
import { Medical } from "../../shared/entities/Medical";
import { Suffix } from "../../shared";
import { Staff } from "../../shared/entities/Staff";
import { Parent } from "../../shared/entities/Parent";
import { Student } from "../../shared/entities/StudentEntity";
import { Admin } from "../../shared/entities/Admin";
import { AUTH_MESSAGES, tokenService } from "../../auth";


export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface ComprehensiveProfileUpdateData {
  // User fields
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;

  // Profile entity fields
  suffix?: string;
  address?: string;
  city?: string;
  state?: string;
  countryCode?: string;
  postalCode?: string;
  photo?: string;

  // Teacher-specific fields
  qualification?: string;

  // teacher and student specific fields
  emergencyContacts?: Emergency;
  medicalRecords?: Medical[];


  // Student-specific fields (currently none beyond user/profile)
  documents?: Document[];


  // Parent-specific fields (currently none beyond user/profile)
  relationship?: string;

}

export interface EmailChangeRequest {
  newEmail: string;
  password: string;
  id: number;
}

export interface EmailChangeConfirm {
  newEmail: string;
  token: string;
}

export interface PhoneChangeRequest {
  newPhone: string;
  password: string;
}

export interface ProfileUpdateResult {
  success: boolean;
  message: string;
  user?: any; // Use any to avoid strict type checking issues
  requiresVerification?: boolean;
  verificationSent?: boolean;
}

export interface AccountDeactivationResult {
  success: boolean;
  message: string;
  deactivatedAt?: Date;
}

export interface ActivityLogEntry {
  id: number;
  userId: number;
  action: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface UserData {
  email?: string;
  firstName: string;
  lastName: string;
  gender?: Gender;
  middleName?: string;
  address?: string;
  phone?: string;
  role: User['role'];
  createdAt?: Date;
  updatedAt?: Date;
  password?: string;
  dateOfBirth?: string;
  schoolId?: number;

}

export interface UserCreateResponse extends UserData {
  id: number;
  message?: string;

}


class ProfileService {
  private userRepository: UserRepository;
  private profileRepository: Repository<Profile>;

  constructor() {
    this.userRepository = new UserRepository();
    this.profileRepository = AppDataSource.getRepository(Profile);
  }

  async createUser(data: UserData, options?: { manager?: any }): Promise<UserCreateResponse> {
    try {
      let user;

      // 🔹 If a transaction manager is provided, use it to create/save the user
      if (options?.manager) {
        user = options.manager.create(User, data); // 🔹 CHANGED
        user = await options.manager.save(User, user); // 🔹 CHANGED
      } else {
        // 🔹 Fallback to repository method
        user = await this.userRepository.create(data); // 🔹 CHANGED
      }

      // 4. Remove password before returning
      const { password, ...safeUser } = user;

      return safeUser;
    }
    catch (error) {
      console.error("Error creating user:", error);
      return {
        message: "Could not create user",
        id: 0,
        firstName: "",
        lastName: "",
        role: data.role
      };
    }


  }

  async updateComprehensiveProfile(userId: number, updateData: ComprehensiveProfileUpdateData): Promise<ProfileUpdateResult> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Get or create profile
      let profile = await this.profileRepository.findOne({
        where: { userId },
        relations: ["country"],
      });

      if (!profile) {
        profile = this.profileRepository.create({ userId });
        await this.profileRepository.save(profile);
      }

      // Separate user and profile fields
      const { firstName, lastName, middleName, phone, address, city, state, postalCode, photo, dateOfBirth, suffix } = updateData;

      // Update user fields
      if (firstName || lastName || middleName || phone || dateOfBirth) {
        await this.userRepository.update(userId, {
          ...(firstName && user.firstName !== firstName && { firstName }),
          ...(lastName && user.lastName !== lastName && { lastName }),
          ...(typeof middleName !== "undefined" && user.middleName !== middleName && { middleName }),
          ...(phone && user.phone !== phone && { phone }),
          ...(dateOfBirth && user.dateOfBirth !== dateOfBirth && { dateOfBirth }),
          updatedAt: new Date(),
        });
      }

      // Update profile fields
      const profileUpdateData = {
        ...(city && profile.city !== city && { city }),
        ...(state && profile.state !== state && { state }),
        ...(photo && profile.photo !== photo && { photo }),
        ...(address && profile.address !== address && { address }),
        ...(postalCode && profile.postalCode !== postalCode && { postalCode }),
        ...(suffix && profile.suffix !== suffix && { suffix: suffix as Suffix }),
      };

      if (Object.keys(profileUpdateData).length > 0) {
        await this.profileRepository.update(profile.id, profileUpdateData);
      }

      // Log the comprehensive profile update
      await this.logActivity(userId, "comprehensive_profile_updated", {
        updatedFields: Object.keys(updateData),
        timestamp: new Date(),
      });

      logger.info(`Comprehensive profile updated for user ${userId}`, { updatedFields: Object.keys(updateData) });

      // Get updated user and profile data
      const updatedProfile = await this.profileRepository.findOne({
        where: { userId },
        relations: ["country"],
      });

      return {
        success: true,
        message: "Profile updated successfully",
        user: {
          uuid: user!.uuid,
          email: user!.email,
          name: [firstName ?? user!.firstName, middleName ?? user!.middleName, lastName ?? user!.lastName]
            .filter(Boolean)
            .join(" "),
          firstName: firstName ?? user!.firstName,
          lastName: lastName ?? user!.lastName,
          middleName: typeof middleName !== "undefined" ? middleName : user!.middleName,
          phone: phone || user!.phone,
          dateOfBirth: dateOfBirth || user!.dateOfBirth,
          updatedAt: user!.updatedAt,
          profile: updatedProfile,
        },
      };
    } catch (error) {
      logger.error("Error updating comprehensive profile:", error);
      return {
        success: false,
        message: "Failed to update profile",
      };
    }
  }

  async getProfile(userId: number): Promise<ProfileUpdateResult> {
    try {
      const user = await AppDataSource.getRepository(User)
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.profile", "profile")
        .leftJoinAndSelect("profile.country", "country")
        .where("user.id = :userId", { userId })
        .getOne();


      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const { role: _, ...userData } = user;

      // Fetch all available roles for this user in parallel for better performance
      const roles = [UserRole.STAFF, UserRole.PARENT, UserRole.STUDENT, UserRole.ADMIN];
      const accountData: any = {};

      await Promise.all(roles.map(async (roleToFetch) => {
        const accounts = await this.getRoleAccounts(userId, roleToFetch);
        if (accounts && accounts.length > 0) {
          // Map to correct key in response (UserRole.STAFF maps to 'staff' property)
          const key = roleToFetch === UserRole.STAFF ? 'staff' : roleToFetch;
          accountData[key] = accounts;
        }
      }));

      const completeProfile = {
        ...userData,
        ...accountData,
        profile: user.profile,
        // Preserve original fields if needed for backward compatibility
        role: user.role,
        roleDetails: (accountData.staff || accountData.admin || accountData.parent || accountData.student || [])[0] || null
      };

      return {
        success: true,
        message: "Profile retrieved successfully",
        user: completeProfile,
      };
    } catch (error) {
      console.log(error);
      logger.error("Error getting profile:", error);
      return {
        success: false,
        message: "Failed to retrieve profile",
      };
    }
  }

  async getRoleAccounts(userId: number | number[], role: UserRole): Promise<any[]> {
    const userIds = Array.isArray(userId) ? userId : [userId];
    if (userIds.length === 0) return [];

    try {
      switch (role) {
        case UserRole.STAFF:
          return await AppDataSource.getRepository(Staff)
            .createQueryBuilder("teacher")
            .leftJoinAndSelect("teacher.school", "school")
            .leftJoinAndSelect("teacher.staffClassesAndSubject", "staffClassesAndSubject")
            .leftJoinAndSelect("staffClassesAndSubject.classroom", "classroom")
            .leftJoinAndSelect("staffClassesAndSubject.subject", "subject")
            .where("teacher.userId IN (:...userIds)", { userIds })
            .getMany();
        case UserRole.STUDENT:
          return await AppDataSource.getRepository(Student)
            .createQueryBuilder("student")
            .leftJoinAndSelect("student.school", "school")
            .leftJoinAndSelect("student.parents", "parents")
            .leftJoinAndSelect("student.currentClassroom", "currentClassroom")
            .where("student.userId IN (:...userIds)", { userIds })
            .getMany();
        case UserRole.PARENT:
          return await AppDataSource.getRepository(Parent)
            .createQueryBuilder("parent")
            .leftJoinAndSelect("parent.school", "school")
            .leftJoinAndSelect("parent.children", "children")
            .where("parent.userId IN (:...userIds)", { userIds })
            .getMany();
        case UserRole.ADMIN:
          return await AppDataSource.getRepository(Admin)
            .createQueryBuilder("admin")
            .leftJoinAndSelect("admin.school", "school")
            .where("admin.userId IN (:...userIds)", { userIds })
            .orderBy("school.schoolName", "ASC")
            .getMany();
        default:
          return [];
      }
    } catch (error) {
      logger.error(`Error getting role accounts for role ${role}:`, error);
      return [];
    }
  }


  /**
   * Get all roles where the user has at least one account
   */
  async getAllAvailableRoles(userId: number): Promise<{ role: UserRole, count: number }[]> {
    const rolesToCheck = [UserRole.STAFF, UserRole.PARENT, UserRole.STUDENT, UserRole.ADMIN];
    const availableRoles: { role: UserRole, count: number }[] = [];

    for (const role of rolesToCheck) {
      const accounts = await this.getRoleAccounts(userId, role);
      if (accounts.length > 0) {
        availableRoles.push({ role, count: accounts.length });
      }
    }

    return availableRoles;
  }


  async getActivityLogs(userId: number, pos: number = 0, delta: number = 10): Promise<any> {
    try {
      // In a real implementation, you would fetch from activity_logs table
      // For now, return a placeholder structure

      // Mock activity logs
      const mockLogs = [
        {
          id: "1",
          userId,
          action: "profile_updated",
          details: { updatedFields: ["name", "bio"] },
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0...",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
          id: "2",
          userId,
          action: "login",
          details: { method: "email" },
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0...",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
      ];

      const paginatedLogs = mockLogs.slice(pos, pos + delta);
      const count = mockLogs.length;

      return {
        success: true,
        message: "Activity logs retrieved successfully",
        data: {
          logs: paginatedLogs,
          pagination: {
            pos,
            delta,
            count,
          },
        },
      };
    } catch (error) {
      logger.error("Error getting activity logs:", error);
      return {
        success: false,
        message: "Failed to retrieve activity logs",
      };
    }
  }

  /**
   * Log user activity for audit trail
   */
  private async logActivity(userId: number, action: string, details: any, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      // In a real implementation, you would save this to an activity_logs table
      // For now, we'll just log it
      logger.info("User activity logged", {
        userId,
        action,
        details,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error("Error logging activity:", error);
    }
  }

  /**
   * Find a user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    const user = await this.userRepository.findByEmail(email);
    return user || null;
  }

  async RequestEmailChange(data: EmailChangeRequest): Promise<{ success: boolean, message: string }> {
    try {
      const { id, newEmail, password } = data;
      const normalizedEmail = newEmail.trim().toLowerCase();

      const user = await this.userRepository.findByIdWithPassword(id);

      if (!user) {
        return { success: false, message: "User not found" };
      }

      // Verify current password
      const { passwordService } = await import("../../shared/services/password.service");
      const isPasswordValid = await passwordService.comparePassword(password, user.password);

      if (!isPasswordValid) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_CREDENTIALS,
        };
      }

      if (user.email?.toLowerCase() === normalizedEmail) {
        return { success: false, message: "Email is already your current email" };
      }

      const existingUser = await this.userRepository.findByEmail(normalizedEmail);
      if (existingUser) {
        return { success: false, message: "Email is already in use" };
      }

      const identifier = user.email || user.phone;
      if (!identifier) {
        return { success: false, message: "User identifier is missing" };
      }

      // Check rate limiting
      const rateLimit = await tokenService.checkRateLimit(identifier, "changeEmail");
      if (!rateLimit.allowed) {
        return {
          success: false,
          message: AUTH_MESSAGES.TOO_MANY_EMAIL_RESET_REQUESTS,
        };
      }

      const { emailService } = await import("../../shared/services/email.service");
      const { token } = emailService.generateVerificationToken(normalizedEmail);
      await tokenService.storeEmailVerificationToken(normalizedEmail, token, 86400);

      const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ");
      const emailSent = await emailService.sendEmailChangeVerification(normalizedEmail, displayName, token);
      if (!emailSent) {
        await tokenService.deleteEmailVerificationToken(normalizedEmail);
        return { success: false, message: "Failed to send verification email" };
      }

      return { success: true, message: "Email change requested successfully" };
    } catch (error) {
      logger.error("Error requesting email change:", error);
      return { success: false, message: "Failed to request email change" };
    }
  }

  async confirmEmailChange(userId: number, data: EmailChangeConfirm): Promise<{ success: boolean; message: string }> {
    try {
      const normalizedEmail = data.newEmail.trim().toLowerCase();
      const token = data.token.trim();

      if (!/^\d{6}$/.test(token)) {
        return { success: false, message: AUTH_MESSAGES.INVALID_TOKEN_FORMAT };
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { success: false, message: "User not found" };
      }

      const existingUser = await this.userRepository.findByEmail(normalizedEmail);
      if (existingUser && existingUser.id !== userId) {
        return { success: false, message: "Email is already in use" };
      }

      const storedToken = await tokenService.getEmailVerificationToken(normalizedEmail);
      if (!storedToken) {
        return { success: false, message: AUTH_MESSAGES.NO_VERIFICATION_TOKEN_EXPIRED };
      }

      if (storedToken !== token) {
        return { success: false, message: AUTH_MESSAGES.INVALID_VERIFICATION_TOKEN };
      }

      await this.userRepository.update(userId, {
        email: normalizedEmail,
        emailVerified: true,
        updatedAt: new Date(),
      });

      await tokenService.deleteEmailVerificationToken(normalizedEmail);

      return { success: true, message: "Email changed successfully" };
    } catch (error) {
      logger.error("Error confirming email change:", error);
      return { success: false, message: "Failed to confirm email change" };
    }
  }
}

export const profileService = new ProfileService();
