import { Repository } from "typeorm";
import { AppDataSource } from "../../core/config/database";
import { UserRole } from "../../shared/entities";
import { Invitation } from "../../shared/entities/Invitation";
import { Role } from "../../shared/entities/Role";
import { User } from "../../shared/entities/User";
import { rolesService } from "../../roles/services/roles.service";
import { UserRole as SystemUserRole } from "../../shared/entities/EntityEnums";
import { emailService } from "../../shared/services/email.service";
import crypto from "crypto";
import { logger } from "../../shared/utils/logger";
import { School } from "../../shared/entities/School";
import { Admin } from "../../shared/entities/Admin";
import { Staff } from "../../shared/entities/Staff";
import { Parent } from "../../shared/entities/Parent";
import { notificationService } from "../../notification";
import { NotificationType } from "../../shared/entities/Notification";

export interface CreateInvitationData {
  email: string;
  role: UserRole;
  roleId?: number;
  firstName: string;
  lastName: string;
  schoolId: number;
  invitedById: number;
}

export interface UpdateInvitationData {
  invitationId: number;
  schoolId: number;
  firstName?: string;
  lastName?: string;
  roleId?: number;
}

export interface InvitationResult {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  token: string;
  expiresAt: Date;
  school: any;
  hasAccepted: boolean;
}

class InvitationService {
  private invitationRepository: Repository<Invitation>;
  private userRepository: Repository<User>;
  private schoolRepository: Repository<School>;
  private roleRepository: Repository<Role>;

  constructor() {
    this.invitationRepository = AppDataSource.getRepository(Invitation);
    this.userRepository = AppDataSource.getRepository(User);
    this.schoolRepository = AppDataSource.getRepository(School);
    this.roleRepository = AppDataSource.getRepository(Role);
  }

  private async validateSchoolRoleId(schoolId: number, roleId?: number): Promise<{ valid: boolean; message?: string }> {
    if (roleId === undefined || roleId === null) {
      return { valid: true };
    }
    if (!Number.isFinite(roleId) || roleId <= 0) {
      return { valid: false, message: "A valid roleId is required" };
    }
    const role = await this.roleRepository.findOne({ where: { id: roleId, schoolId } });
    if (!role) {
      return { valid: false, message: "Selected role does not belong to this school" };
    }
    return { valid: true };
  }

  /**
   * Create and send an invitation
   * This creates a user with no password
   */
  async createInvitation(data: CreateInvitationData): Promise<{ success: boolean; message: string; invitation?: InvitationResult }> {
    try {
      // Check if user already has this specific role in this school
      const user = await this.userRepository.findOne({
        where: { email: data.email },
      });

      if (user) {
        let alreadyInSchool = false;

        if (data.role === UserRole.ADMIN || data.role === UserRole.SUPER_ADMIN) {
          const admin = await AppDataSource.getRepository(Admin).findOne({
            where: { userId: user.id, schoolId: data.schoolId },
          });
          if (admin) alreadyInSchool = true;
        } else if (data.role === UserRole.STAFF) {
          const staff = await AppDataSource.getRepository(Staff).findOne({
            where: { userId: user.id, schoolId: data.schoolId },
          });
          if (staff) alreadyInSchool = true;
        } else if (data.role === UserRole.PARENT) {
          const parent = await AppDataSource.getRepository(Parent).findOne({
            where: { userId: user.id, schoolId: data.schoolId },
          });
          if (parent) alreadyInSchool = true;
        }

        if (alreadyInSchool) {
          return {
            success: false,
            message: `User is already registered as ${data.role} in this school`,
          };
        }
      }

      // Check if there's already a pending invitation
      const existingInvitation = await this.invitationRepository.findOne({
        where: {
          email: data.email,
          hasAccepted: false,
          invitedBy: { admin: { schoolId: data.schoolId } },
        },
        relations: ["invitedBy", "invitedBy.admin", "invitedBy.admin.school"],
      });

      if (existingInvitation && existingInvitation.expiresAt > new Date()) {
        return {
          success: false,
          message: "A pending invitation already exists for this email in this school",
        };
      }

      const school = await this.schoolRepository.findOne({
        where: { id: data.schoolId },
      });

      if (!school)
        return {
          success: false,
          message: `school with ${data.schoolId} ID not found`,
        };

      let resolvedRoleId = data.roleId;
      if (
        (resolvedRoleId === undefined || resolvedRoleId === null) &&
        (data.role === SystemUserRole.ADMIN || data.role === SystemUserRole.SUPER_ADMIN)
      ) {
        const superRole = await rolesService.ensureSystemSuperAdminRoleAndPermissions(data.schoolId);
        resolvedRoleId = superRole.id;
      }

      const roleCheck = await this.validateSchoolRoleId(data.schoolId, resolvedRoleId);
      if (!roleCheck.valid) {
        return { success: false, message: roleCheck.message || "Invalid role" };
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString("hex");

      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation
      const invitation = this.invitationRepository.create({
        email: data.email,
        role: data.role,
        roleId: resolvedRoleId ?? null,
        firstName: data.firstName,
        lastName: data.lastName,
        token,
        schoolId: data.schoolId,
        invitedById: data.invitedById,
        expiresAt,
        hasAccepted: false,
      });

      const savedInvitation = await this.invitationRepository.save(invitation);

      // Get inviter details for email
      const inviter = await this.userRepository.findOne({
        where: { id: data.invitedById },
      });

      // Send invitation email
      await emailService.sendInvitationEmail(savedInvitation, inviter || undefined, school.schoolName);

      logger.info(`Invitation created for ${data.email} with role ${data.role}`);

      // Send in-app notification if user already exists
      if (user) {
        await notificationService.sendNotification({
          userId: user.id,
          schoolId: data.schoolId,
          title: "New School Invitation",
          message: `You have been invited to join ${school.schoolName} as a ${data.role}.`,
          type: NotificationType.INVITATION,
          sendEmail: false, // Already sent via emailService
          data: {
            invitationId: savedInvitation.id,
            role: data.role,
            schoolName: school.schoolName,
          },
        });
      }

      const invite = await this.invitationRepository.findOne({
        where: { id: savedInvitation.id },
        relations: ["school"],
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          token: true,
          role: true,
          hasAccepted: true,
          acceptedAt: true,
          expiresAt: true,
          school: {
            id: true,
            schoolName: true,
            schoolMotto: true,
            address: true,
            email: true,
            phoneNumber: true,
            description: true,
          },
        },
      });

      if (!invite)
        return {
          success: false,
          message: "Invitation record not found after saving.",
        };

      return {
        success: true,
        message: "Invitation sent successfully",
        invitation: invite,
      };
    } catch (error) {
      console.log(error);
      logger.error("Error creating invitation:", error);
      const message = error instanceof Error ? error.message : "Failed to create invitation";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Update a pending invitation
   */
  async updateInvitation(data: UpdateInvitationData): Promise<{ success: boolean; message: string; invitation?: Invitation }> {
    try {
      const invitation = await this.invitationRepository.findOne({
        where: { id: data.invitationId, schoolId: data.schoolId },
      });

      if (!invitation) {
        return { success: false, message: "Invitation not found" };
      }

      if (invitation.hasAccepted) {
        return { success: false, message: "Cannot update an invitation that has already been accepted" };
      }

      if (data.roleId !== undefined) {
        const roleCheck = await this.validateSchoolRoleId(data.schoolId, data.roleId);
        if (!roleCheck.valid) {
          return { success: false, message: roleCheck.message || "Invalid role" };
        }
        invitation.roleId = data.roleId;
      }

      if (data.firstName !== undefined) {
        invitation.firstName = data.firstName;
      }
      if (data.lastName !== undefined) {
        invitation.lastName = data.lastName;
      }

      const saved = await this.invitationRepository.save(invitation);
      return { success: true, message: "Invitation updated successfully", invitation: saved };
    } catch (error) {
      logger.error("Error updating invitation:", error);
      const message = error instanceof Error ? error.message : "Failed to update invitation";
      return { success: false, message };
    }
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(invitationId: number): Promise<{ success: boolean; message: string; invitation?: InvitationResult }> {
    try {
      const invitation = await this.invitationRepository.findOne({
        where: { id: invitationId },
        relations: ["invitedBy", "school"],
        select: {
          id: true,
          email: true,
          invitedBy: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            role: true,
          },
          school: {
            id: true,
            schoolName: true,
            schoolMotto: true,
            address: true,
            email: true,
            phoneNumber: true,
            description: true,
          },
        },
      });

      if (!invitation) {
        return {
          success: false,
          message: "Invitation not found",
        };
      }

      if (invitation.hasAccepted) {
        return {
          success: false,
          message: "Cannot resend an invitation that has already been accepted",
        };
      }

      // Generate new token and extend expiration
      invitation.token = crypto.randomBytes(32).toString("hex");
      invitation.expiresAt = new Date();
      invitation.expiresAt.setDate(invitation.expiresAt.getDate() + 7);

      const updatedInvitation = await this.invitationRepository.save(invitation);

      // Send invitation email
      await emailService.sendInvitationEmail(updatedInvitation, invitation.invitedBy, invitation.school?.schoolName);

      logger.info(`Invitation resent for ${invitation.email}`);

      return {
        success: true,
        message: "Invitation resent successfully",
        invitation: {
          id: updatedInvitation.id,
          email: updatedInvitation.email,
          firstName: updatedInvitation.firstName,
          lastName: updatedInvitation.lastName,
          role: updatedInvitation.role,
          school: updatedInvitation.schoolId,
          token: updatedInvitation.token,
          expiresAt: updatedInvitation.expiresAt,
          hasAccepted: updatedInvitation.hasAccepted,
        },
      };
    } catch (error) {
      logger.error("Error resending invitation:", error);
      const message = error instanceof Error ? error.message : "Failed to resend invitation";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Accept an invitation
   * This marks the invitation as accepted but does NOT create the user
   * User will be created when they complete registration
   */
  async acceptInvitation(token: string): Promise<{ success: boolean; message: string; invitation?: Invitation }> {
    try {
      const invitation = await this.invitationRepository.findOne({
        where: { token },
        relations: ["invitedBy", "school"],
        select: {
          id: true,
          email: true,
          invitedBy: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            role: true,
          },
          school: {
            id: true,
            schoolName: true,
            schoolMotto: true,
            address: true,
            email: true,
            phoneNumber: true,
            description: true,
          },
        },
      });

      if (!invitation) {
        return {
          success: false,
          message: "Invalid invitation token",
        };
      }

      if (invitation.hasAccepted) {
        return {
          success: false,
          message: "Invitation has already been accepted",
        };
      }

      if (invitation.expiresAt < new Date()) {
        return {
          success: false,
          message: "Invitation has expired",
        };
      }

      // Mark invitation as accepted
      invitation.hasAccepted = true;
      invitation.acceptedAt = new Date();
      await this.invitationRepository.save(invitation);

      logger.info(`Invitation accepted for ${invitation.email}`);

      return {
        success: true,
        message: "Invitation accepted successfully. Please complete registration.",
        invitation,
      };
    } catch (error) {
      logger.error("Error accepting invitation:", error);
      const message = error instanceof Error ? error.message : "Failed to accept invitation";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Validate an invitation token
   * Used to check if token is valid before registration
   */
  async validateInvitation(token: string): Promise<{ success: boolean; message: string; invitation?: Invitation }> {
    try {
      const invitation = await this.invitationRepository.findOne({
        where: { token },
        relations: ["invitedBy", "school"],
        select: {
          id: true,
          email: true,
          invitedBy: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            role: true,
          },
          school: {
            id: true,
            schoolName: true,
            schoolMotto: true,
            address: true,
            email: true,
            phoneNumber: true,
            description: true,
          },
        },
      });

      if (!invitation) {
        return {
          success: false,
          message: "Invalid invitation token",
        };
      }

      if (invitation.expiresAt < new Date()) {
        return {
          success: false,
          message: "Invitation has expired",
        };
      }

      return {
        success: true,
        message: "Invitation is valid",
        invitation,
      };
    } catch (error) {
      logger.error("Error validating invitation:", error);
      const message = error instanceof Error ? error.message : "Failed to validate invitation";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<Invitation | null> {
    try {
      return await this.invitationRepository.findOne({
        where: { token },
        relations: ["invitedBy", "school"],
        select: {
          id: true,
          email: true,
          invitedBy: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            role: true,
          },
          school: {
            id: true,
            schoolName: true,
            schoolMotto: true,
            address: true,
            email: true,
            phoneNumber: true,
            description: true,
          },
        },
      });
    } catch (error) {
      logger.error("Error getting invitation by token:", error);
      return null;
    }
  }

  /**
   * Get schoolId from invitation token
   * This method is used by auth service to get the schoolId when registering via invitation
   */
  async getSchoolIdFromInvitationToken(token: string): Promise<{ success: boolean; schoolId?: number; role?: UserRole; message?: string }> {
    try {
      const invitation = await this.invitationRepository.findOne({
        where: { token },
        relations: ["school"],
      });

      if (!invitation) {
        return {
          success: false,
          message: "Invalid invitation token",
        };
      }

      if (invitation.expiresAt < new Date()) {
        return {
          success: false,
          message: "Invitation has expired",
        };
      }

      if (invitation.hasAccepted) {
        return {
          success: false,
          message: "Invitation has already been accepted",
        };
      }

      return {
        success: true,
        schoolId: invitation.schoolId,
        role: invitation.role,
      };
    } catch (error) {
      logger.error("Error getting schoolId from invitation token:", error);
      return {
        success: false,
        message: "Failed to get invitation details",
      };
    }
  }

  /**
   * Get invitation by status using token or email
   * Used to validate accepted/pending invitations during registration
   */
  async getInvitationByStatus(params: {
    token?: string;
    email?: string;
    expectedEmail?: string;
    hasAccepted: boolean;
  }): Promise<{ success: boolean; invitation?: Invitation; message?: string }> {
    try {
      if (!params.token && !params.email) {
        return {
          success: false,
          message: "Invitation token or email is required to locate an invitation",
        };
      }

      const where: any = { hasAccepted: params.hasAccepted };
      if (params.token) {
        where.token = params.token;
      }
      if (params.email) {
        where.email = params.email.toLowerCase();
      }

      const invitation = await this.invitationRepository.findOne({
        where,
        relations: ["school"],
        order: params.hasAccepted ? { acceptedAt: "DESC" } : { createdAt: "DESC" },
      });

      if (!invitation) {
        return {
          success: false,
          message: params.hasAccepted
            ? "Invitation not accepted for the provided email"
            : "No pending invitation found for the provided email",
        };
      }

      if (invitation.expiresAt < new Date()) {
        return {
          success: false,
          message: "Invitation has expired and can no longer be used",
        };
      }

      if (params.expectedEmail && invitation.email?.toLowerCase() !== params.expectedEmail.toLowerCase()) {
        return {
          success: false,
          message: "Invitation token does not match the provided email",
        };
      }

      if (params.hasAccepted && !invitation.hasAccepted) {
        return {
          success: false,
          message: "A user with this email has a pending invitation. Please accept the invitation before registering.",
        };
      }

      if (!params.hasAccepted && invitation.hasAccepted) {
        return {
          success: false,
          message: "Invitation has already been accepted",
        };
      }

      return {
        success: true,
        invitation,
      };
    } catch (error) {
      logger.error("Error getting invitation by status:", error);
      return {
        success: false,
        message: "Failed to get invitation details",
      };
    }
  }

  /**
   * Get all invitations with pagination and filters (scoped by schoolId)
   */
  async getInvitations(filters: {
    schoolId: number;
    pos?: number;
    delta?: number;
    role?: UserRole;
    hasAccepted?: boolean;
    email?: string;
  }): Promise<{ success: boolean; message: string; invitations?: unknown[]; pagination?: any }> {
    try {
      const pos = filters.pos || 0;
      const delta = filters.delta || 10;

      await rolesService.syncSystemSchoolSuperAdminForSchool(filters.schoolId);

      const queryBuilder = this.invitationRepository
        .createQueryBuilder("invitations")
        .leftJoinAndSelect("invitations.invitedBy", "invitedBy")
        .leftJoinAndSelect("invitedBy.profile", "profile")
        .leftJoin(Role, "schoolRole", "schoolRole.id = invitations.roleId")
        .addSelect(["schoolRole.id", "schoolRole.name"])
        .select([
          "invitations",
          "invitedBy.id",
          "invitedBy.uuid",
          "invitedBy.lastName",
          "invitedBy.email",
          "invitedBy.role",
          "profile",
          "schoolRole.id",
          "schoolRole.name",
        ])
        .where("invitations.schoolId = :schoolId", { schoolId: filters.schoolId });

      // Apply filters
      if (filters.role) {
        queryBuilder.andWhere("invitations.role = :role", { role: filters.role });
      }

      if (filters.hasAccepted !== undefined) {
        queryBuilder.andWhere("invitations.hasAccepted = :hasAccepted", { hasAccepted: filters.hasAccepted });
      }

      if (filters.email) {
        queryBuilder.andWhere("invitations.email LIKE :email", { email: `%${filters.email}%` });
      }

      // Get total count
      const count = await queryBuilder.getCount();

      // Apply pagination
      queryBuilder.skip(pos).take(delta).orderBy("invitations.createdAt", "DESC");

      const rawRows = await queryBuilder.getMany();

      const invitations = await Promise.all(
        rawRows.map(async (inv) => {
          let assignedRoleId: number | null =
            typeof inv.roleId === "number" && !Number.isNaN(inv.roleId) ? inv.roleId : null;
          let assignedRoleName: string | null = null;

          if (assignedRoleId) {
            const roleRow = await AppDataSource.getRepository(Role).findOne({
              where: { id: assignedRoleId, schoolId: filters.schoolId },
              select: ["id", "name"],
            });
            assignedRoleName = roleRow?.name ?? null;
          }

          if (inv.hasAccepted) {
            const user = await this.userRepository.findOne({
              where: { email: inv.email },
              select: ["id"],
            });
            if (user) {
              const primary = await rolesService.getPrimaryAssignedRoleForUser(user.id, filters.schoolId);
              if (primary) {
                assignedRoleId = primary.id;
                assignedRoleName = primary.name;
              }
            }
          }

          return {
            ...inv,
            assignedRoleId,
            assignedRoleName,
          };
        }),
      );

      return {
        success: true,
        message: "Invitations retrieved successfully",
        invitations,
        pagination: {
          pos,
          delta,
          count,
        },
      };
    } catch (error) {
      console.log(error);
      logger.error("Error getting invitations:", error);
      const message = error instanceof Error ? error.message : "Failed to retrieve invitations";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Delete/Cancel an invitation
   */
  async deleteInvitation(invitationId: number): Promise<{ success: boolean; message: string }> {
    try {
      const invitation = await this.invitationRepository.findOne({
        where: { id: invitationId },
      });

      if (!invitation) {
        return {
          success: false,
          message: "Invitation not found",
        };
      }

      await this.invitationRepository.remove(invitation);

      logger.info(`Invitation deleted for ${invitation.email}`);

      return {
        success: true,
        message: "Invitation deleted successfully",
      };
    } catch (error) {
      logger.error("Error deleting invitation:", error);
      const message = error instanceof Error ? error.message : "Failed to delete invitation";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Clean up expired invitations
   */
  async cleanupExpiredInvitations(): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      const result = await this.invitationRepository
        .createQueryBuilder()
        .delete()
        .from(Invitation)
        .where("expiresAt < :now", { now: new Date() })
        .andWhere("hasAccepted = :hasAccepted", { hasAccepted: false })
        .execute();

      const count = result.affected || 0;
      logger.info(`Cleaned up ${count} expired invitations`);

      return {
        success: true,
        message: `${count} expired invitation(s) deleted`,
        count,
      };
    } catch (error) {
      logger.error("Error cleaning up expired invitations:", error);
      const message = error instanceof Error ? error.message : "Failed to cleanup expired invitations";
      return {
        success: false,
        message,
      };
    }
  }
}

export const invitationService = new InvitationService();
