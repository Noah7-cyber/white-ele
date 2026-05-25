import { Repository, In } from "typeorm";
import { User } from "../../shared/entities/User";
import { UserRole } from "../../shared/entities/EntityEnums";
import { Profile } from "../../shared/entities/Profile";
import { Staff } from "../../shared/entities/Staff";
import { Emergency } from "../../shared/entities/Emergency";
import { Classroom } from "../../shared/entities/Classroom";
import { School } from "../../shared/entities/School";
import { StaffClassesAndSubject } from "../../shared/entities/StaffClassesAndSubject";
import { logger, UserAssociationService } from "../../shared";
import { AppDataSource } from "../../core/config/database";
import * as bcrypt from "bcrypt";
import { Suffix } from "../../shared";
import { RelationshipType } from "../../shared/entities";
import { StaffRole, StaffStatus } from "../../shared/entities";
import { generateRandomPIN, generateStrongPassword, getSchoolPortalUrl } from "../../shared/services/utils";
import { notificationService } from "../../notification";
import { NotificationType } from "../../shared/entities/Notification";
import { emailService } from "../../shared/services/email.service";
import { sessionService } from "../../auth";
import { authConfig } from "../../auth/services/config";
export interface CreateStaffData {
  suffix?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  qualification: string;
  assignedClassroom: number[];
  emergencyContact: CreateEmergencyContact;
  schoolId: number;
  startDate: Date;
  city?: string;
  state?: string;
  postalCode?: string;
  photo?: string;
  role?: string;
  daysPerWeek?: string[];
}

export interface UpdateStaffData {
  suffix?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  qualification?: string;
  staffRole?: string;
  assignedClassroom?: number[];
  emergencyContact?: CreateEmergencyContact;
  schoolId?: number;
  startDate?: Date;
  city?: string;
  state?: string;
  postalCode?: string;
  photo?: string;
  role?: string;
  daysPerWeek?: string[];
  pin?: string;
}

export interface StaffSearchFilters {
  search?: string;
  role?: string;
  school?: string;
  schoolId?: number; // Add schoolId filter
  qualification?: string;
  classroom?: string;
  status?: StaffStatus;
  pos?: number;
  delta?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface StaffResponse {
  success: boolean;
  message: string;
  staff?: any[];
  pagination?: {
    pos: number;
    delta: number;
    count: number;
  };
}

export interface CreateEmergencyContact {
  suffix?: string;
  contactName: string;
  phone: string;
  relationship: string;
  email: string;
  address?: string;
  notes?: string;
  staffId?: string;
}

export interface updateTeacherStatusData {
  staffId: number;
  status: StaffStatus;
}

export class StaffService {
  private get userRepository(): Repository<User> {
    return AppDataSource.getRepository(User);
  }

  private get staffRepository(): Repository<Staff> {
    return AppDataSource.getRepository(Staff);
  }

  private get schoolRepository(): Repository<School> {
    return AppDataSource.getRepository(School);
  }

  private get classroomRepository(): Repository<Classroom> {
    return AppDataSource.getRepository(Classroom);
  }

  private get userAssociationService(): UserAssociationService {
    return new UserAssociationService();
  }

  private get staffClassesAndSubjectRepository(): Repository<StaffClassesAndSubject> {
    return AppDataSource.getRepository(StaffClassesAndSubject);
  }

  /**
   * Create a new staff member (User + Profile + Staff/Teacher record)
   */
  async createStaff(data: CreateStaffData): Promise<{ success: boolean; message: string; staff?: Staff }> {
    try {
      const school = await this.schoolRepository.findOne({ where: { id: data.schoolId } });
      if (!school) {
        return {
          success: false,
          message: "Invalid schoolId: school not found",
        };
      }

      const existingStaffQuery = this.staffRepository
        .createQueryBuilder("staff")
        .innerJoin("staff.user", "user")
        .where("staff.schoolId = :schoolId", { schoolId: data.schoolId })
        .andWhere("user.email = :email", {
          email: data.email,
        });

      const existingStaff = await existingStaffQuery.getOne();

      if (existingStaff) {
        return {
          success: false,
          message: "Staff with this email already exists in this school",
        };
      }

      let classrooms: Classroom[] = [];
      if (Array.isArray(data.assignedClassroom) && data.assignedClassroom.length > 0) {
        classrooms = await this.classroomRepository.find({
          where: {
            id: In(data.assignedClassroom),
            schoolId: data.schoolId,
          },
        });

        if (classrooms.length !== data.assignedClassroom.length) {
          const foundIds = classrooms.map((c) => c.id);
          const missingIds = data.assignedClassroom.filter((id) => !foundIds.includes(id));
          return {
            success: false,
            message: `Classrooms not found: ${missingIds.join(", ")}`,
          };
        }
      }

      let savedUser: User | null = null;
      let savedStaff: Staff;
      let plainPassword: string | null = null;
      let plainPin: string = "";

      // Check for existing user globally by email
      const existingUser = await this.userRepository.findOne({
        where: { email: data.email }
      });

      // Prepare password/PIN if new user
      let hashedPassword = "";
      if (!existingUser) {
        plainPassword = generateStrongPassword(9);
        hashedPassword = await bcrypt.hash(plainPassword, 10);
        plainPin = generateRandomPIN(4);
        // hashedPin = await passwordService.hashPassword(plainPin);
      } else {
        // For existing users, we still need a PIN for the new school association
        plainPin = generateRandomPIN(4);
        // hashedPin = await passwordService.hashPassword(plainPin);
      }

      // Start transaction
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        if (existingUser) {
          return {
            success: false,
            message: "An account with this email already exists. Please use a unique identifier for each account.",
          };
        }

        // Create new user
        const userData: Partial<User> = {
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          email: data.email,
          dateOfBirth: data.dateOfBirth,
          password: hashedPassword,
          tempPassword: true,
          isSystemGeneratedPassword: true,
          role: UserRole.STAFF,
          emailVerified: true,
          phoneVerified: false,
          phone: data.phone,
          address: data.address
        };

        const user = queryRunner.manager.create(User, userData);
        savedUser = await queryRunner.manager.save(user);
        logger.info(`New user created: ${savedUser.id}`);

        // Create initial profile
        const profileData: Partial<Profile> = {
          userId: savedUser.id!,
          suffix: data.suffix as Suffix,
          address: data.address,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          photo: data.photo
        };
        const profile = queryRunner.manager.create(Profile, profileData);
        await queryRunner.manager.save(profile);

        // Use UserAssociationService/Manager to ensure association

        let staffRecord = await this.userAssociationService.ensureAssociation(
          savedUser,
          UserRole.STAFF,
          data.schoolId,
          {
            staffRole: data.role ? (data.role as StaffRole) : StaffRole.LEAD_TEACHER,
            qualification: data.qualification,
            startDate: data.startDate ?? new Date(),
            daysPerWeek: data.daysPerWeek,
            pin: plainPin,
            notes: data.notes, // Added notes here
            status: plainPassword ? StaffStatus.INACTIVE : StaffStatus.ACTIVE, // Added status here
          },
          { manager: queryRunner.manager }
        );
        savedStaff = staffRecord;

        logger.info(`Staff created in transaction: ${savedStaff.id}`);

        if (classrooms.length > 0) {
          const scsRecords = classrooms.map((classroom) => {
            return queryRunner.manager.create(StaffClassesAndSubject, {
              staffId: savedStaff.id,
              classroomId: classroom.id,
              subjectId: undefined,
            });
          });

          await queryRunner.manager.save(StaffClassesAndSubject, scsRecords);
          logger.info(`Created ${scsRecords.length} StaffClassesAndSubject records for staff ${savedStaff.id}`);
        }

        if (data.emergencyContact) {
          const emergencyData: Partial<Emergency> = {
            suffix: data.emergencyContact.suffix as Suffix,
            contactName: data.emergencyContact.contactName,
            relationship: data.emergencyContact.relationship as RelationshipType,
            phone: data.emergencyContact.phone,
            email: data.emergencyContact.email,
            address: data.emergencyContact.address,
            teacherId: savedStaff.id,
          };

          const emergencyContact = queryRunner.manager.create(Emergency, emergencyData);
          await queryRunner.manager.save(emergencyContact);

          logger.info(`Emergency contact created in transaction: ${savedStaff.id}`);
        }

        await queryRunner.commitTransaction();
        logger.info(`Transaction completed successfully for staff: ${savedStaff.id}`);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }

      logger.info(`Sending email verification to ${data.email}`);

      try {
        const { emailService } = await import("../../shared/services/email.service");
        const displayName = [data.firstName, data.lastName].filter(Boolean).join(" ");

        let classroomNames: string[] = [];
        if (data.assignedClassroom && data.assignedClassroom.length > 0) {
          const staffResult = await this.getStaffById(savedStaff.id);
          if (staffResult.staff?.staffClassesAndSubject) {
            classroomNames = staffResult.staff.staffClassesAndSubject
              .map((scs) => scs.classroom?.classroomName)
              .filter((name): name is string => !!name);
          }
        }

        // Use different email templates based on whether user is new or existing
        if (plainPassword) {
          await emailService.sendTeacherAccountCreationEmail(
            data.email,
            displayName,
            plainPassword,
            school.schoolName || "School",
            classroomNames,
            plainPin
          );
          logger.info(`Staff account created for ${savedUser!.email}. Temporary password: ${plainPassword}`);

          // Send persistent in-app notification
          await notificationService.sendNotification({
            userId: savedUser!.id,
            schoolId: school.id,
            title: "Welcome to WhitePenguin",
            message: `Your staff account for ${school.schoolName} has been created. Please check your email for login credentials.`,
            type: NotificationType.INFO,
          }).catch(err => logger.error("Failed to send welcome notification to new staff", err));

        } else {
          // For existing users, send a notification that they've been added to a new school
          const subDomain = school.subDomain;
          const portalUrl = getSchoolPortalUrl("/admin/dashboard", subDomain);

          await emailService.sendWelcomeEmail(
            data.email,
            displayName,
            school.schoolName || "School",
            undefined,
            portalUrl
          );
          logger.info(`Existing user ${savedUser!.email} linked to school ${school.schoolName}`);

          // Send persistent in-app notification
          await notificationService.sendNotification({
            userId: savedUser!.id,
            schoolId: school.id,
            title: "Added to New School",
            message: `You have been added as a staff member to ${school.schoolName}.`,
            type: NotificationType.INFO,
          }).catch(err => logger.error("Failed to send school addition notification to staff", err));
        }
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }

      const staffResult = await this.getStaffById(savedStaff.id);
      // Attach plain PIN to staff object for response (similar to password)
      if (staffResult.staff) {
        (staffResult.staff as any).generatedPin = plainPin;
      }

      return {
        success: true,
        message: "Staff created successfully",
        staff: staffResult.staff,
      };
    } catch (error) {
      logger.error("Error creating staff:", error);
      console.error("Staff creation error details:", error);
      return {
        success: false,
        message: "Failed to create staff",
      };
    }
  }

  /**
   * Regenerate login credentials and resend the teacher onboarding email.
   * Only for users still on a system-generated password.
   */
  async resendStaffInvite(staffId: number, schoolId: number): Promise<{
    success: boolean;
    message: string;
    staff?: Staff;
  }> {
    try {
      const staff = await this.staffRepository
        .createQueryBuilder("teacher")
        .leftJoinAndSelect("teacher.user", "user")
        .leftJoinAndSelect("teacher.school", "school")
        .leftJoinAndSelect("teacher.staffClassesAndSubject", "staffClassesAndSubject")
        .leftJoinAndSelect("staffClassesAndSubject.classroom", "classroom")
        .addSelect("user.password")
        .addSelect("user.passwordHistory")
        .where("teacher.id = :staffId", { staffId })
        .getOne();

      if (!staff || !staff.user) {
        return { success: false, message: "Staff not found" };
      }

      if (staff.schoolId !== schoolId) {
        return { success: false, message: "Staff does not belong to this school" };
      }

      if (!staff.user.isSystemGeneratedPassword) {
        return {
          success: false,
          message: "Invitation cannot be resent: this staff member has already completed onboarding.",
        };
      }

      if (!staff.user.email) {
        return { success: false, message: "Staff user has no email address" };
      }

      const user = staff.user;
      const plainPassword = generateStrongPassword(9);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      const passwordHistory = user.passwordHistory || [];
      passwordHistory.push(user.password);
      const updatedHistory = passwordHistory.slice(-authConfig.security.passwordHistoryCount);

      await this.userRepository.update(user.id!, {
        password: hashedPassword,
        passwordHistory: updatedHistory,
        tempPassword: true,
        isSystemGeneratedPassword: true,
        loginAttempts: 0,
      });

      const plainPin = generateRandomPIN(4);
      await this.staffRepository.update(staff.id, { pin: plainPin });

      await sessionService.terminateAllUserSessions(user.id!);

      const email = user.email!;

      const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ");
      const schoolName = staff.school?.schoolName || "School";
      let classroomNames: string[] = [];
      if (staff.staffClassesAndSubject?.length) {
        classroomNames = staff.staffClassesAndSubject
          .map((scs) => scs.classroom?.classroomName)
          .filter((name): name is string => !!name);
      }

      try {
        await emailService.sendTeacherAccountCreationEmail(
          email,
          displayName,
          plainPassword,
          schoolName,
          classroomNames,
          plainPin
        );
        logger.info(`Staff invite resent for staff ${staffId}, user ${user.id}`);
      } catch (emailError) {
        logger.error("Failed to send staff resend invite email:", emailError);
        console.error("Failed to send staff resend invite email:", emailError);
      }

      const staffResult = await this.getStaffById(staffId);
      return {
        success: true,
        message: "Invitation email has been resent with new login credentials.",
        staff: staffResult.staff,
      };
    } catch (error) {
      logger.error("Error resending staff invite:", error);
      return {
        success: false,
        message: "Failed to resend staff invitation",
      };
    }
  }

  /**
   * Get staff by ID
   */
  async getStaffById(staffId: number): Promise<{ success: boolean; message: string; staff?: Staff }> {
    try {
      const staff = await this.staffRepository
        .createQueryBuilder("teacher")
        .leftJoinAndSelect("teacher.user", "user")
        .leftJoinAndSelect("user.profile", "profile")
        .leftJoinAndSelect("teacher.school", "school")
        .leftJoinAndSelect("teacher.emergencyContacts", "emergencyContacts")
        .leftJoinAndSelect("teacher.staffClassesAndSubject", "staffClassesAndSubject")
        .leftJoinAndSelect("staffClassesAndSubject.classroom", "classroom")
        .leftJoinAndSelect("staffClassesAndSubject.subject", "subject")
        .leftJoinAndSelect("classroom.curriculums", "curriculums")
        .leftJoinAndSelect("teacher.currentAttendance", "currentAttendance")
        .leftJoinAndSelect("teacher.previousAttendance", "previousAttendance")
        .where("teacher.id = :staffId", { staffId })
        .getOne();

      if (!staff) {
        return {
          success: false,
          message: "Staff not found",
        };
      }

      const formattedStaff = this.formatStaffResponse(staff);

      return {
        success: true,
        message: "Staff retrieved successfully",
        staff: formattedStaff as any,
      };
    } catch (error) {
      logger.error("Error getting staff by ID:", error);
      return {
        success: false,
        message: "Failed to retrieve staff",
      };
    }
  }

  /**
   * Update staff details
   */
  async updateStaff(staffId: number, data: UpdateStaffData): Promise<{ success: boolean; message: string;[key: string]: any }> {
    try {

      const result = await this.staffRepository.manager.transaction(async manager => {
        const staffRepository = manager.getRepository(Staff);
        const userRepository = manager.getRepository(User);
        const profileRepository = manager.getRepository(Profile);
        const emergencyContactRepository = manager.getRepository(Emergency);

        // const savedActivity = await this.classroomActivityRepository.manager.transaction(async manager => {
        const staff = await this.staffRepository.findOne({
          where: { id: staffId },
          relations: ["user", "user.profile", "school"],
        });

        if (!staff) {
          return {
            success: false,
            message: "Staff not found",
          };
        }

        const oldEmail = staff.user?.email;
        const schoolName = staff.school?.schoolName || "School";

        const schoolIdToUse = data.schoolId || staff.schoolId;

        if (data.schoolId || (Array.isArray(data.assignedClassroom) && data.assignedClassroom.length > 0)) {
          const school = await this.schoolRepository.findOne({ where: { id: schoolIdToUse } });
          if (!school) {
            return {
              success: false,
              message: "Invalid schoolId: school not found",
            };
          }

          if (data.schoolId) {
            staff.school = school;
            staff.schoolId = data.schoolId;
          }
        } else if (!staff.schoolId) {
          return {
            success: false,
            message: "School ID is required for this operation",
          };
        }

        // Global uniqueness check for email
        if (data.email) {
          const userWithEmail = await userRepository.findOne({
            where: { email: data.email }
          });

          if (userWithEmail && userWithEmail.id !== staff.userId) {
            return {
              success: false,
              message: "This email address is already registered to another account. Please use a unique identifier.",
            };
          }
        }

        const user = staff.user;
        const updatedFields: any = {};

        // Update user fields only if provided
        let userUpdated = false;
        if (data.firstName !== undefined) {
          user.firstName = data.firstName;
          userUpdated = true; updatedFields.firstName = data.firstName;
        }
        if (data.middleName !== undefined) {
          user.middleName = data.middleName;
          userUpdated = true; updatedFields.middleName = data.middleName;
        }
        if (data.lastName !== undefined) {
          user.lastName = data.lastName;
          userUpdated = true; updatedFields.lastName = data.lastName;
        }
        if (data.dateOfBirth !== undefined) {
          user.dateOfBirth = data.dateOfBirth;
          userUpdated = true; updatedFields.dateOfBirth = data.dateOfBirth;
        }
        if (data.email !== undefined) {
          user.email = data.email;
          userUpdated = true; updatedFields.email = data.email;
        }
        if (data.phone !== undefined) {
          user.phone = data.phone;
          userUpdated = true; updatedFields.phone = data.phone;
        }

        if (userUpdated) {
          await userRepository.save(user);
        }

        // Update profile if it exists and data provided
        if (user.profile) {
          let profileUpdated = false;
          if (data.suffix !== undefined) {
            user.profile.suffix = data.suffix as Suffix;
            profileUpdated = true; updatedFields.suffix = data.suffix;
          }
          if (data.address !== undefined) {
            user.profile.address = data.address;
            profileUpdated = true; updatedFields.address = data.address;
          }
          if (data.city !== undefined) {
            user.profile.city = data.city;
            profileUpdated = true; updatedFields.city = data.city;
          }
          if (data.state !== undefined) {
            user.profile.state = data.state;
            profileUpdated = true; updatedFields.state = data.state;
          }
          if (data.postalCode !== undefined) {
            user.profile.postalCode = data.postalCode;
            profileUpdated = true; updatedFields.postalCode = data.postalCode;
          }
          if (data.photo !== undefined) {
            user.profile.photo = data.photo;
            profileUpdated = true; updatedFields.photo = data.photo;
          }

          if (profileUpdated) {
            await profileRepository.save(user.profile);
          }
        }

        if (data.emergencyContact) {
          const emergencyPayload: Partial<Emergency> = {
            suffix: data.emergencyContact.suffix as Suffix,
            contactName: data.emergencyContact.contactName,
            relationship: data.emergencyContact.relationship as RelationshipType,
            phone: data.emergencyContact.phone,
            email: data.emergencyContact.email,
            address: data.emergencyContact.address,
          };
          // Remove undefined values
          Object.keys(emergencyPayload).forEach(
            key =>
              emergencyPayload[key as keyof Emergency] === undefined &&
              delete emergencyPayload[key as keyof Emergency]
          );

          if (Object.keys(emergencyPayload).length > 0) {
            await emergencyContactRepository.update(
              { teacherId: staff.id },
              emergencyPayload
            );
          }
        }

        // Update staff fields only if provided
        let staffUpdated = false;
        if (data.qualification !== undefined) {
          staff.qualification = data.qualification;
          staffUpdated = true; updatedFields.qualification = data.qualification;
        }
        if (data.staffRole !== undefined) {
          staff.staffRole = data.staffRole as StaffRole;
          staffUpdated = true; updatedFields.staffRole = data.staffRole;
        }
        if (data.startDate !== undefined) {
          staff.startDate = data.startDate;
          staffUpdated = true; updatedFields.startDate = data.startDate;
        }
        if (data.notes !== undefined) {
          staff.notes = data.notes;
          staffUpdated = true; updatedFields.notes = data.notes;
        }
        if (data.daysPerWeek !== undefined) {
          staff.daysPerWeek = data.daysPerWeek;
          staffUpdated = true; updatedFields.daysPerWeek = data.daysPerWeek;
        }

        if (data.pin !== undefined) {
          // Hash the PIN before storing
          // const hashedPin = await passwordService.hashPassword(data.pin);
          staff.pin = data.pin;
          staffUpdated = true; updatedFields.pin = data.pin;
        }

        if (staffUpdated) {
          await staffRepository.save(staff);
        }

        // Update classroom assignments if provided
        if (Array.isArray(data.assignedClassroom)) {
          const existingSCS = await this.staffClassesAndSubjectRepository.find({
            where: { staffId: staff.id },
          });

          const normalizedNewClassroomIds = data.assignedClassroom.map((id) => Number(id));
          const existingClassroomIds = new Set(existingSCS.map((scs) => scs.classroomId).filter((id): id is number => id !== undefined));
          const newClassroomIds = new Set(normalizedNewClassroomIds);

          const classroomsToAdd = normalizedNewClassroomIds.filter((id) => !existingClassroomIds.has(id));

          const classroomsToRemove = existingSCS.filter((scs) => scs.classroomId !== undefined && !newClassroomIds.has(scs.classroomId));

          if (classroomsToRemove.length > 0) {
            await this.staffClassesAndSubjectRepository.remove(classroomsToRemove);
            logger.info(`Removed ${classroomsToRemove.length} classroom assignments for staff ${staff.id}`);
          }

          if (classroomsToAdd.length > 0) {
            const classrooms = await this.classroomRepository.find({
              where: {
                id: In(classroomsToAdd),
                schoolId: schoolIdToUse,
              },
            });

            if (classrooms.length !== classroomsToAdd.length) {
              const foundIds = classrooms.map((c) => c.id);
              const missingIds = classroomsToAdd.filter((id) => !foundIds.includes(id));
              return {
                success: false,
                message: `Classrooms not found: ${missingIds.join(", ")}`,
              };
            }

            const newSCSRecords = classrooms.map((classroom) => {
              return this.staffClassesAndSubjectRepository.create({
                staffId: staff.id,
                classroomId: classroom.id,
                subjectId: undefined,
              });
            });

            await this.staffClassesAndSubjectRepository.save(newSCSRecords);
            logger.info(`Created ${newSCSRecords.length} new classroom assignments for staff ${staff.id}`);
          }

          updatedFields.assignedClassroom = normalizedNewClassroomIds;
        }
        return {
          success: true,
          message: "Staff updated successfully",
          oldEmail,
          schoolName,
          ...updatedFields,
        }

      });

      if (result.success && result.email && result.email !== result.oldEmail) {
        emailService.sendEmailUpdateNotification(
          result.email,
          `${result.firstName || ""} ${result.lastName || ""}`.trim() || result.email,
          result.schoolName || "School"
        ).catch(err => logger.error("Failed to send email update notification to staff", err));
      }

      return result;
    } catch (error) {
      logger.error("Error updating staff:", error);
      return {
        success: false,
        message: "Failed to update staff",
      };
    }
  }



  /**
   * Suspend staff (suspend by changing status to suspend)
   */
  async updateTeacherStatus(data: updateTeacherStatusData): Promise<{ success: boolean; message: string }> {
    try {
      const staff = await this.staffRepository.findOne({
        where: { id: data.staffId },
        relations: ["user", "school", "staffClassesAndSubject", "staffClassesAndSubject.classroom"],
      });

      if (!staff) {
        return {
          success: false,
          message: "Staff not found",
        };
      }

      if (staff.status === data.status) {
        return {
          success: false,
          message: `Staff is already ${data.status.toLowerCase()}`,
        };
      }

      staff.status = data.status;
      await this.staffRepository.save(staff);

      if (staff.user) {
        staff.user.isActive = data.status === StaffStatus.ACTIVE;
        await this.userRepository.save(staff.user);
      }

      return {
        success: true,
        message: `Success ${data.status} staff`,
      };
    } catch (error) {
      logger.error(`Error trying to ${data.status} staff:`, error);
      return {
        success: false,
        message: `Failed to ${data.status} staff`,
      };
    }
  }

  /**
   * Delete staff
   */

  async deleteStaff(staffId: number): Promise<{ success: boolean; message: string }> {
    try {
      const staff = await this.staffRepository.findOne({
        where: { id: staffId },
        relations: ["user"],
      });

      if (!staff) {
        return {
          success: false,
          message: "Staff not found",
        };
      }

      const userId = staff.user?.id;

      await this.staffRepository.remove(staff);

      if (userId) {
        // Check if user has other active staff records
        const otherActiveStaff = await this.staffRepository
          .createQueryBuilder("staff")
          .where("staff.userId = :userId", { userId })
          .andWhere("staff.deletedAt IS NULL")
          .getCount();

        if (otherActiveStaff === 0) {
          const user = await this.userRepository.findOne({ where: { id: userId } });
          if (user && !user.deletedAt) {
            // Update email to include [deleted] to free it up
            if (user.email && !user.email.includes('[deleted]')) {
              const parts = user.email.split('@');
              if (parts.length === 2) {
                user.email = `${parts[0]}[deleted]@${parts[1]}`;
              } else {
                user.email = `${user.email}[deleted]`;
              }
              await this.userRepository.save(user);
            }
            // Soft delete user
            await this.userRepository.softDelete(userId);
          }
        }
      }

      return {
        success: true,
        message: "Staff deleted successfully",
      };
    } catch (error) {
      logger.error("Error deleting staff:", error);
      return {
        success: false,
        message: "Failed to delete staff",
      };
    }
  }

  /**
   * List staff with filtering, search, and pagination
   */
  async listStaff(filters: StaffSearchFilters = {}): Promise<StaffResponse> {
    try {
      const {
        search,
        role,
        school,
        schoolId,
        classroom,
        qualification,
        status,
        pos = 0,
        delta = 10,
        sortBy = "lastName",
        sortOrder = "ASC",
      } = filters;

      const queryBuilder = this.staffRepository
        .createQueryBuilder("teacher")
        .leftJoinAndSelect("teacher.user", "teacherUser")
        .leftJoinAndSelect("teacherUser.profile", "profile")
        .leftJoinAndSelect("teacher.school", "school")
        .leftJoinAndSelect("teacher.emergencyContacts", "emergencyContacts")
        .leftJoinAndSelect("teacher.staffClassesAndSubject", "staffClassesAndSubject")
        .leftJoinAndSelect("staffClassesAndSubject.classroom", "classroom")
        .leftJoinAndSelect("staffClassesAndSubject.subject", "subject")
        .leftJoinAndSelect("classroom.curriculums", "curriculums")
        .leftJoinAndSelect("teacher.currentAttendance", "currentAttendance")
        .leftJoinAndSelect("teacher.previousAttendance", "previousAttendance")
        .select([
          "teacher",
          "staffClassesAndSubject",
          "classroom",
          "subject",
          "curriculums",
          "currentAttendance",
          "previousAttendance",
          "emergencyContacts",
          "profile",
          "profile.address",
          "profile.suffix",
          "profile.photo",
          "teacherUser.id",
          "teacherUser.firstName",
          "teacherUser.lastName",
          "teacherUser.middleName",
          "teacherUser.dateOfBirth",
          "teacherUser.email",
          "teacherUser.phone",
          "teacherUser.address",
          "teacherUser.role",
          "school",
          "emergencyContacts.id",
          "emergencyContacts.contactName",
          "emergencyContacts.relationship",
          "emergencyContacts.phone",
          "emergencyContacts.email",
          "emergencyContacts.address",
        ]);

      // Apply search filter
      if (search) {
        queryBuilder.andWhere(
          "(LOWER(teacherUser.lastName) LIKE LOWER(:search) OR LOWER(teacherUser.firstName) LIKE LOWER(:search) OR LOWER(subject.name) LIKE LOWER(:search))",
          {
            search: `%${search}%`,
          }
        );
      }

      // Apply school filter - always filter by schoolId (required for data isolation)
      // schoolId should always be provided from the request object (user's schoolId)
      if (schoolId) {
        queryBuilder.andWhere("teacher.schoolId = :schoolId", { schoolId });
      } else if (school) {
        // Fallback to school name filter if schoolId not provided (legacy support)
        queryBuilder.andWhere("teacher.school = :school", { school });
      } else {
        // If neither schoolId nor school is provided, this is a security issue
        // In production, you might want to throw an error here
        logger.warn("listStaff called without schoolId or school filter - this may return all staff");
      }

      // Apply role filter
      if (role) {
        queryBuilder.andWhere("teacher.staffRole = :role", { role });
      }

      if (status) {
        queryBuilder.andWhere("teacher.status = :status", { status });
      }

      // Apply location filters
      if (classroom) {
        queryBuilder.andWhere("LOWER(classroom.classroomName) LIKE LOWER(:classroomName)", {
          classroomName: `%${classroom}%`,
        });
      }

      if (qualification) {
        queryBuilder.andWhere("LOWER(teacher.subject) LIKE LOWER(:qualification)", {
          qualification: `%${qualification}%`,
        });
      }

      // Apply sorting
      const sortFieldMap: { [key: string]: string } = {
        id: "teacher.id",
        firstname: "teacherUser.firstName",
        firstName: "teacherUser.firstName",
        lastname: "teacherUser.lastName",
        lastName: "teacherUser.lastName",
        name: "teacherUser.lastName",
        email: "teacherUser.email",
        createdat: "teacher.createdAt",
        createdAt: "teacher.createdAt",
        updatedat: "teacher.updatedAt",
        updatedAt: "teacher.updatedAt",
      };

      const sortField = sortFieldMap[sortBy] || "teacherUser.lastName";
      queryBuilder.orderBy(sortField, sortOrder);

      // Add secondary sort for consistent behavior
      if (sortField.includes("teacherUser.lastName")) {
        queryBuilder.addOrderBy("teacherUser.firstName", sortOrder);
      } else if (sortField.includes("teacherUser.firstName")) {
        queryBuilder.addOrderBy("teacherUser.lastName", sortOrder);
      }

      // Apply pagination
      queryBuilder.skip(pos).take(delta);

      const [staffRecords, count] = await queryBuilder.getManyAndCount();

      // Format each staff record with minimal data
      const formattedStaffRecords = staffRecords.map((staff) => {
        // Get unique classroom IDs only
        const classroomIds = new Set<number>();
        const subjectIds = new Set<number>();
        if (staff.staffClassesAndSubject) {
          staff.staffClassesAndSubject.forEach((scs) => {
            if (scs.classroomId) {
              classroomIds.add(scs.classroomId);
            }
            const rawSubjectId = scs.subjectId ?? scs.subject?.id;
            const subjectId = Number(rawSubjectId);
            if (Number.isFinite(subjectId)) {
              subjectIds.add(subjectId);
            }
          });
        }

        // Return minimal data
        return {
          id: staff.id,
          staffRole: staff.staffRole,
          qualification: staff.qualification,
          status: staff.status,
          user: {
            id: staff.user?.id,
            firstName: staff.user?.firstName,
            lastName: staff.user?.lastName,
            email: staff.user?.email,
            phone: staff.user?.phone,
            address: staff.user?.address,
            profile: staff.user?.profile
              ? {
                id: staff.user.profile.id,
                suffix: staff.user.profile.suffix,
                photo: staff.user.profile.photo,
                address: staff.user.profile.address,
              }
              : null,
          },
          assignedClasses: Array.from(classroomIds),
          subjectCount: subjectIds.size,
          attendance: {
            currentStatus: staff.currentAttendance ? staff.currentAttendance.status : "Clocked Out",
            currentAttendance: staff.currentAttendance
              ? {
                status: staff.currentAttendance.status,
                date: staff.currentAttendance.date,
                timeIn: staff.currentAttendance.timeIn,
                timeOut: staff.currentAttendance.timeOut,
              }
              : null,
            previousAttendance: staff.previousAttendance
              ? {
                status: staff.previousAttendance.status,
                date: staff.previousAttendance.date,
                timeIn: staff.previousAttendance.timeIn,
                timeOut: staff.previousAttendance.timeOut,
              }
              : null,
          },
        };
      });

      return {
        success: true,
        message: "Staff retrieved successfully",
        staff: formattedStaffRecords,
        pagination: {
          pos,
          delta,
          count,
        },
      };
    } catch (error) {
      logger.error("Error listing staff:", error);
      return {
        success: false,
        message: "Failed to retrieve staff",
      };
    }
  }

  /**
   * Format staff entity for response (removes sensitive data and formats relations)
   */
  async kioskVerify(identifier: string | number, pin: string, schoolId: number): Promise<{ success: boolean; message: string; staff?: any }> {
    try {
      // Build query to find staff by id or email (scoped to school)
      const queryBuilder = this.staffRepository
        .createQueryBuilder("teacher")
        .leftJoinAndSelect("teacher.user", "user")
        .leftJoinAndSelect("user.profile", "profile")
        .leftJoinAndSelect("teacher.school", "school")
        .leftJoinAndSelect("teacher.emergencyContacts", "emergencyContacts")
        .leftJoinAndSelect("teacher.staffClassesAndSubject", "staffClassesAndSubject")
        .leftJoinAndSelect("staffClassesAndSubject.classroom", "classroom")
        .leftJoinAndSelect("staffClassesAndSubject.subject", "subject")
        .leftJoinAndSelect("staffClassesAndSubject.classroom", "scsClassroom")
        .leftJoinAndSelect("scsClassroom.curriculums", "curriculums")
        .leftJoinAndSelect("teacher.currentAttendance", "currentAttendance")
        .leftJoinAndSelect("teacher.previousAttendance", "previousAttendance")
        .where("teacher.deletedAt IS NULL")
        .andWhere("teacher.schoolId = :schoolId", { schoolId });

      // Check if identifier is a number (staff id)
      const numericId = typeof identifier === "number" ? identifier : parseInt(identifier as string, 10);

      if (!isNaN(numericId) && numericId > 0) {
        // Search by staff ID
        queryBuilder.andWhere("teacher.id = :identifier", { identifier: numericId });
      } else {
        // Search by email (case-insensitive)
        queryBuilder.andWhere("LOWER(user.email) = LOWER(:identifier)", { identifier: identifier as string });
      }

      const staff = await queryBuilder.getOne();

      if (!staff) {
        return {
          success: false,
          message: "Staff not found",
        };
      }

      // Verify PIN
      if (!staff.pin) {
        return {
          success: false,
          message: "Staff not found or invalid PIN",
        };
      }

      const isPinValid = pin === staff.pin;
      if (!isPinValid) {
        return {
          success: false,
          message: "Staff not found or invalid PIN",
        };
      }

      // Format response same as getStaffById (exclude PIN)
      const { pin: _, ...staffWithoutPin } = staff;
      const formattedStaff = this.formatStaffResponse(staffWithoutPin as Staff);

      return {
        success: true,
        message: "Staff verified successfully",
        staff: formattedStaff,
      };
    } catch (error: any) {
      logger?.error?.("Error in kiosk verify:", error);
      // Log the actual error details for debugging
      logger?.error?.("Error details:", {
        message: error?.message,
        stack: error?.stack,
        identifier,
      });
      return {
        success: false,
        message: error?.message || "Failed to verify staff",
      };
    }
  }

  private formatStaffResponse(staff: Staff): any {
    // Format with full details but remove sensitive user/profile data
    const uniqueClassrooms = new Map<number, any>();
    if (staff.staffClassesAndSubject) {
      staff.staffClassesAndSubject.forEach((scs) => {
        if (scs.classroom && !uniqueClassrooms.has(scs.classroom.id)) {
          // Full classroom details without unnecessary relations
          uniqueClassrooms.set(scs.classroom.id, {
            id: scs.classroom.id,
            classroomName: scs.classroom.classroomName,
            minimumAge: scs.classroom.minimumAge,
            maximumAge: scs.classroom.maximumAge,
            maximumCapacity: scs.classroom.maximumCapacity,
            description: scs.classroom.description,
            tuitionFee: scs.classroom.tuitionFee,
            schoolId: scs.classroom.schoolId,
            classroomStatus: scs.classroom.classroomStatus,
            createdAt: scs.classroom.createdAt,
            updatedAt: scs.classroom.updatedAt,
          });
        }
      });
    }

    // Group assignments by Subject
    const assignedSubjectsMap = new Map<number, any>();
    const assignedCurriculumsMap = new Map<number, any>();

    if (staff.staffClassesAndSubject) {
      for (const scs of staff.staffClassesAndSubject) {
        // Collect Curriculums (access through classroom - many-to-many)
        if (Array.isArray(scs?.classroom?.curriculums) && (scs?.classroom?.curriculums?.length || 0) > 0) {
          for (const curriculum of scs?.classroom?.curriculums || []) {
            if (!assignedCurriculumsMap.has(curriculum.id)) {
              assignedCurriculumsMap.set(curriculum.id, {
                id: curriculum.id,
                title: curriculum.title,
                academicYear: curriculum.academicYear,
                term: curriculum.term,
                description: curriculum.description,
              });
            }
          }
        }

        // Collect Subjects
        if (scs.subjectId && scs.subject) {
          const subjectId = scs.subject.id;
          if (!assignedSubjectsMap.has(subjectId)) {
            assignedSubjectsMap.set(subjectId, {
              id: scs.subject.id,
              name: scs.subject.name,
              description: scs.subject.description,
              assignedClassrooms: [],
              assignedCurriculums: [],
            });
          }

          const subjectData = assignedSubjectsMap.get(subjectId)!;

          // Add unique classroom to subject
          if (scs.classroom && !subjectData.assignedClassrooms.find((c: any) => c.id === scs.classroom!.id)) {
            subjectData.assignedClassrooms.push({
              id: scs.classroom.id,
              name: scs.classroom.classroomName,
              schoolId: scs.classroom.schoolId,
            });
          }

          // Add unique curriculums to subject (access through classroom - many-to-many)
          if (Array.isArray(scs?.classroom?.curriculums) && (scs?.classroom?.curriculums?.length || 0) > 0) {
            for (const curriculum of scs?.classroom?.curriculums || []) {
              if (!subjectData.assignedCurriculums.find((c: any) => c.id === curriculum.id)) {
                subjectData.assignedCurriculums.push({
                  id: curriculum.id,
                  title: curriculum.title,
                  academicYear: curriculum.academicYear,
                  term: curriculum.term,
                });
              }
            }
          }
        }
      }
    }

    // Remove sensitive user/profile data
    const safeUser = staff.user
      ? {
        uuid: staff.user.uuid,
        firstName: staff.user.firstName,
        lastName: staff.user.lastName,
        middleName: staff.user.middleName,
        email: staff.user.email,
        phone: staff.user.phone,
        address: staff.user.address,
        role: staff.user.role,
        profile: staff.user.profile
          ? {
            id: staff.user.profile.id,
            suffix: staff.user.profile.suffix,
            photo: staff.user.profile.photo,
            address: staff.user.profile.address,
          }
          : null,
      }
      : null;

    const formattedStaff = {
      id: staff.id,
      userId: staff.userId,
      kioskPin: staff.pin,
      staffRole: staff.staffRole,
      qualification: staff.qualification,
      startDate: staff.startDate,
      schoolId: staff.schoolId,
      notes: staff.notes,
      daysPerWeek: staff.daysPerWeek,
      status: staff.status,
      isSuspended: staff.isSuspended,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
      deletedAt: staff.deletedAt,
      user: safeUser,
      school: staff.school
        ? {
          id: staff.school.id,
          schoolName: staff.school.schoolName,
          schoolMotto: staff.school.schoolMotto,
          schoolType: staff.school.schoolType,
          schoolLogoUrl: staff.school.schoolLogoUrl,
          address: staff.school.address,
          country: staff.school.country,
          email: staff.school.email,
          phoneNumber: staff.school.phoneNumber,
        }
        : null,
      emergencyContacts: staff.emergencyContacts
        ? {
          id: staff.emergencyContacts.id,
          suffix: staff.emergencyContacts.suffix,
          contactName: staff.emergencyContacts.contactName,
          relationship: staff.emergencyContacts.relationship,
          phone: staff.emergencyContacts.phone,
          email: staff.emergencyContacts.email,
          address: staff.emergencyContacts.address,
        }
        : null,
      assignedClasses: Array.from(uniqueClassrooms.values()),
      assignedSubjects: Array.from(assignedSubjectsMap.values()),
      assignedCurriculums: Array.from(assignedCurriculumsMap.values()),
      attendance: {
        currentStatus: staff.currentAttendance ? staff.currentAttendance.status : "Clocked Out",
        currentAttendance: staff.currentAttendance
          ? {
            status: staff.currentAttendance.status,
            date: staff.currentAttendance.date,
            timeIn: staff.currentAttendance.timeIn,
            timeOut: staff.currentAttendance.timeOut,
          }
          : null,
        previousAttendance: staff.previousAttendance
          ? {
            status: staff.previousAttendance.status,
            date: staff.previousAttendance.date,
            timeIn: staff.previousAttendance.timeIn,
            timeOut: staff.previousAttendance.timeOut,
          }
          : null,
      },
    };

    return formattedStaff;
  }
}

// Create singleton instance
const staffService = new StaffService();

export { staffService };
