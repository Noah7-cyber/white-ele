import { In, Repository } from "typeorm";
import { AppDataSource } from "../../core/config/database";
import { User } from "../../shared/entities/User";
import { Profile } from "../../shared/entities/Profile";
import { EntityManager } from "typeorm";
import { UserRole } from "../../shared/entities/EntityEnums";
import { notificationService } from "../../notification";
import { NotificationType, NotificationPriority } from "../../shared/entities/Notification";
import {
  AuthUser,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  DeviceInfo,
  MFAVerificationRequest,
  ForgotPasswordRequest,
  PasswordResetRequest,
  SecurityEvent,
} from "../types/types";
import { jwtService } from "./jwt.service";
import { sessionService } from "./session.service";
import { validationService } from "./validation.service";
import { tokenService } from "./token.service";
import { authConfig } from "./config";
import { AUTH_MESSAGES, getPasswordHistoryError, getLoginSuccessMessage } from "../constants/messages";
import { generateStrongPassword } from "../../shared/services/utils";
import { userAssociationService } from "../../shared/services/user-association.service";

export class AuthService {
  private userRepository: Repository<User>;
  private profileRepository: Repository<Profile>;
  private readonly disableLoginAttemptProtection = true;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.profileRepository = AppDataSource.getRepository(Profile);
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest, deviceInfo: DeviceInfo): Promise<AuthResponse> {
    // Check if this is an invitation-based registration
    let invitationSchoolId: number | undefined;
    let invitationRole: UserRole | undefined;
    let invitationRoleId: number | undefined;
    let isInvitationRegistration = false;

    try {
      const { invitationService } = await import("../../invitation/services/invitation.service");

      if (data.invitationToken) {
        let invitationResult = await invitationService.getInvitationByStatus({
          token: data.invitationToken,
          expectedEmail: data.email,
          hasAccepted: true,
        });

        // If invitation is not accepted, accept it then re-validate
        if (!invitationResult.success) {
          const acceptInvitationResult = await invitationService.acceptInvitation(data.invitationToken);
          if (!acceptInvitationResult.success) {
            return {
              success: false,
              message: acceptInvitationResult.message,
            };
          }

          invitationResult = await invitationService.getInvitationByStatus({
            token: data.invitationToken,
            expectedEmail: data.email,
            hasAccepted: true,
          });
        }

        if (!invitationResult.invitation) {
          return {
            success: false,
            message: AUTH_MESSAGES.INVITATION_NOT_ACCEPTED,
          };
        }

        invitationSchoolId = invitationResult.invitation.schoolId;
        invitationRole = invitationResult.invitation.role;
        invitationRoleId =
          typeof invitationResult.invitation.roleId === "number" && !Number.isNaN(invitationResult.invitation.roleId)
            ? invitationResult.invitation.roleId
            : undefined;
        isInvitationRegistration = true;
      } else {
        // Fallback: if the caller didn't provide invitationToken, but they *did* accept an invite,
        // use the latest accepted invite for this email to derive school context + role.
        const acceptedInviteResult = await invitationService.getInvitationByStatus({
          email: data.email,
          hasAccepted: true,
        });

        if (acceptedInviteResult.success && acceptedInviteResult.invitation) {
          invitationSchoolId = acceptedInviteResult.invitation.schoolId;
          invitationRole = acceptedInviteResult.invitation.role;
          invitationRoleId =
            typeof acceptedInviteResult.invitation.roleId === "number" &&
            !Number.isNaN(acceptedInviteResult.invitation.roleId)
              ? acceptedInviteResult.invitation.roleId
              : undefined;
          isInvitationRegistration = true;
        }
      }
    } catch (invitationLookupError) {
      console.error("Failed to resolve invitation context:", invitationLookupError);
    }

    // Validate input
    const validation = this.validateRegistrationData(data);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errors.join(", "),
      };
    }

    // Check rate limiting
    const rateLimit = await tokenService.checkRateLimit(data.email, "registration");

    if (!rateLimit.allowed) {
      return {
        success: false,
        message: AUTH_MESSAGES.TOO_MANY_REGISTRATION_ATTEMPTS,
      };
    }

    try {
      // If no invitation token and no accepted-invite fallback, block registration for pending invites
      if (!data.invitationToken && !isInvitationRegistration) {
        const { invitationService } = await import("../../invitation/services/invitation.service");
        const pendingInvite = await invitationService.getInvitationByStatus({
          email: data.email,
          hasAccepted: false,
        });
        if (pendingInvite.success) {
          return {
            success: false,
            message: AUTH_MESSAGES.INVITATION_NOT_ACCEPTED,
          };
        }
      }

      // Check if user already exists by email
      const existingUser = await this.findExistingUser(data.email, undefined, true);
      if (existingUser) {
        return {
          success: false,
          message: AUTH_MESSAGES.IDENTIFIER_ALREADY_EXISTS,
        };
      }

      // Hash password
      const hashedPassword = await validationService.hashPassword(data.password);

      const resolvedRole = invitationRole || data.role || UserRole.PARENT;
      const resolvedSchoolId = typeof invitationSchoolId === "number" && !Number.isNaN(invitationSchoolId) ? invitationSchoolId : undefined;

      // Create user
      const userData: Partial<User> = {
        firstName: validationService.sanitizeInput(data.firstName),
        lastName: validationService.sanitizeInput(data.lastName),
        ...(data.middleName ? { middleName: validationService.sanitizeInput(data.middleName) } : {}),
        email: data.email.toLowerCase(),
        password: hashedPassword,
        role: resolvedRole,
        emailVerified: isInvitationRegistration, // Auto-verify email for accepted invited users
        phoneVerified: false,
        isActive: true,
        loginAttempts: 0,
        mfaEnabled: false,
        passwordHistory: [],
        // We do not save schoolId on the User table directly, as associations are on role tables
      };

      // Add phone if provided
      if (data.phone) {
        userData.phone = validationService.normalizePhone(data.phone);
      }

      const user = this.userRepository.create(userData);
      const savedUser = await this.userRepository.save(user);

      // Ensure role association for new users
      if (data.schoolId || resolvedSchoolId) {
        await userAssociationService.ensureAssociation(savedUser, data.role || UserRole.PARENT, (data.schoolId || resolvedSchoolId)!, data);
      }

      if (
        isInvitationRegistration &&
        typeof invitationRoleId === "number" &&
        !Number.isNaN(invitationRoleId) &&
        typeof resolvedSchoolId === "number" &&
        !Number.isNaN(resolvedSchoolId)
      ) {
        try {
          const { rolesService } = await import("../../roles/services/roles.service");
          await rolesService.assignUserRole({
            userId: savedUser.id,
            roleId: invitationRoleId,
            schoolId: resolvedSchoolId,
            assignedByUserId: savedUser.id,
          });
        } catch (assignRoleError) {
          console.error("Failed to assign custom role from invitation:", assignRoleError);
        }
      }

      if (data.address || data.city || data.state || data.postalCode || data.photo) {
        try {
          const profileData: Partial<Profile> = {
            userId: savedUser.id,
            address: data.address,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            photo: data.photo,
          };
          const profile = this.profileRepository.create(profileData);
          await this.profileRepository.save(profile);
        } catch (profileError) {
          console.error("Failed to create profile:", profileError);
        }
      }

      // Send email verification for non-invited registrations
      if (!isInvitationRegistration) {
        try {
          const { emailService } = await import("../../shared/services/email.service");
          const displayName = [data.firstName, data.lastName].filter(Boolean).join(" ");
          await emailService.sendEmailVerification(data.email, displayName);
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
          // Continue with registration even if email fails
        }
      }
      // Send welcome email for invited users
      if (isInvitationRegistration) {
        try {
          const { emailService } = await import("../../shared/services/email.service");
          const displayName = [data.firstName, data.lastName].filter(Boolean).join(" ");
          await emailService.sendGeneralWelcomeEmail(data.email, displayName, {
            role: resolvedRole,
          });
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }
      }

      // Log security event

      await this.logSecurityEvent({
        type: "registration_success",
        userId: savedUser.id,
        identifier: data.email,
        ipAddress: deviceInfo.ipAddress || "unknown",
        userAgent: deviceInfo.userAgent || "unknown",
        deviceInfo,
        timestamp: new Date(),
      });

      // Send Welcome Notification only if we know which school it belongs to.
      // Admins who self-register without a school will get this notification when they create their first school
      // (see school.service.createSchool).
      const welcomeSchoolId = data.schoolId || resolvedSchoolId;
      if (welcomeSchoolId) {
        try {
          await notificationService.sendNotification({
            userId: savedUser.id,
            schoolId: welcomeSchoolId,
            title: "Welcome to WhitePenguin",
            message: `Welcome ${data.firstName}! We're glad to have you on board.`,
            type: NotificationType.INFO,
            priority: NotificationPriority.MEDIUM,
          });
        } catch (notifError) {
          console.error("Failed to send welcome notification:", notifError);
        }
      }

      if (isInvitationRegistration) {
        return await this.login(
          {
            email: data.email,
            password: data.password,
            role: invitationRole || data.role,
          },
          deviceInfo,
        );
      }

      return {
        success: true,
        user: this.toAuthUser(savedUser),
        message: AUTH_MESSAGES.REGISTRATION_SUCCESS,
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: AUTH_MESSAGES.REGISTRATION_FAILED,
      };
    }
  }

  async registerParentViaAdmin(data: any, options?: { manager?: EntityManager }): Promise<{ user: User; password: string }> {
    const password = data.password || generateStrongPassword();
    const hashedPassword = await validationService.hashPassword(password);
    const isSystemGeneratedPassword = !data.password;

    const userData: Partial<User> = {
      firstName: validationService.sanitizeInput(data.firstName),
      lastName: validationService.sanitizeInput(data.lastName),
      email: data.email?.toLowerCase(),
      tempPassword: data.tempPassword,
      phone: data.phone,
      password: hashedPassword,
      isSystemGeneratedPassword,
      address: data.address,
      role: UserRole.PARENT,
      isActive: true,
      emailVerified: true,
      phoneVerified: false,
      // schoolId: data.schoolId
    };

    let savedUser: User;

    if (options?.manager) {
      const user = options.manager.create(User, userData);
      savedUser = await options.manager.save(User, user);
    } else {
      const user = this.userRepository.create(userData);
      savedUser = await this.userRepository.save(user);
    }

    // Optional: create profile if needed
    if (data.address || data.photo) {
      const profileData: Partial<Profile> = {
        userId: savedUser.id,
        address: data.address,
        photo: data.photo,
        suffix: data.suffix,
      };
      if (options?.manager) {
        const profile = options.manager.create(Profile, profileData);
        await options.manager.save(Profile, profile);
      } else {
        const profile = this.profileRepository.create(profileData);
        await this.profileRepository.save(profile);
      }
    }

    return { user: savedUser, password };
  }

  /**
   * Login user
   */
  async login(data: LoginRequest, deviceInfo: DeviceInfo): Promise<AuthResponse> {
    // Validate that either email or phone is provided
    if (!data.email && !data.phone) {
      return {
        success: false,
        message: AUTH_MESSAGES.IDENTIFIER_REQUIRED,
      };
    }

    // Determine the identifier for rate limiting and logging
    const identifier = data.email || data.phone || "unknown";

    // Temporarily disable login attempt protection.
    // This bypasses per-identifier rate limiting for login only.
    if (!this.disableLoginAttemptProtection) {
      const rateLimit = await tokenService.checkRateLimit(identifier, "login");
      if (!rateLimit.allowed) {
        return {
          success: false,
          message: AUTH_MESSAGES.TOO_MANY_LOGIN_ATTEMPTS,
        };
      }
    }

    try {
      const contextSchoolId = typeof data.schoolId === "number" && !Number.isNaN(data.schoolId) ? data.schoolId : undefined;

      // Find ALL users matching the identity
      const users = await this.findUsersByIdentifier(data.email, data.phone);
      if (users.length === 0) {
        await this.logSecurityEvent({
          type: "login_failure",
          identifier: identifier,
          ipAddress: deviceInfo.ipAddress || "unknown",
          userAgent: deviceInfo.userAgent || "unknown",
          deviceInfo,
          details: { reason: "user_not_found" },
          timestamp: new Date(),
        });

        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_CREDENTIALS,
        };
      }

      let authenticatedUser: User | undefined;
      for (const u of users) {
        const isMatch = await validationService.comparePassword(data.password, u.password);
        if (isMatch) {
          authenticatedUser = u;
          break;
        }
      }

      if (!authenticatedUser) {
        if (!this.disableLoginAttemptProtection) {
          await this.handleFailedLogin(users[0]!);
        }

        await this.logSecurityEvent({
          type: "login_failure",
          identifier: identifier,
          ipAddress: deviceInfo.ipAddress || "unknown",
          userAgent: deviceInfo.userAgent || "unknown",
          deviceInfo,
          details: { reason: "invalid_password" },
          timestamp: new Date(),
        });

        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_CREDENTIALS,
        };
      }

      let activeUser = authenticatedUser;

      // Temporarily disable account lock checks from failed login attempts.
      if (!this.disableLoginAttemptProtection) {
        if (activeUser.lockedUntil && new Date() < activeUser.lockedUntil) {
          const lockTimeRemaining = Math.ceil((activeUser.lockedUntil.getTime() - Date.now()) / (1000 * 60));
          return {
            success: false,
            message: `Account is locked. Try again in ${lockTimeRemaining} minutes.`,
          };
        }
      }

      // Check if account is active
      if (!activeUser.isActive) {
        return {
          success: false,
          message: AUTH_MESSAGES.ACCOUNT_DEACTIVATED,
        };
      }

      // Role selection is based on linked role relations (admin/parent/staff), not only user.role.
      const allAccounts = typeof contextSchoolId === "number" ? (users || []).filter((u: any) => u?.schoolId === contextSchoolId) : users;

      let requestedRole: UserRole | undefined = data.role;
      let activeAccount: any = undefined;

      if (requestedRole) {
        const hasRequestedRoleAssociation = await this.hasRoleAssociation(activeUser.id, requestedRole, contextSchoolId);
        if (!hasRequestedRoleAssociation) {
          // If admin and they don't have an association, let them through
          // so the frontend can redirect to create-school.
          // IMPORTANT: Only bypass if their activeUser.role inherently is ADMIN or SUPER_ADMIN
          if (requestedRole === UserRole.ADMIN && typeof contextSchoolId !== "number" && (activeUser.role === UserRole.ADMIN || activeUser.role === UserRole.SUPER_ADMIN)) {
            // Bypass block, let them login as admin so frontend redirects
            activeUser.role = requestedRole; // ensure role is set to ADMIN
          } else {
            return {
              success: false,
              code: "ROLE_NOT_ALLOWED",
              message: AUTH_MESSAGES.ROLE_ACCOUNT_NOT_FOUND,
            };
          }
        }
      }

      // Identity-Based Login: We always issue tokens if credentials match.
      // We'll default to the first account found for the initial profile context.
      if (allAccounts.length > 0) {
        if (requestedRole) {
          activeAccount = allAccounts.find((acc) => acc.role === requestedRole);
        }

        // If no role was requested, take the first available account for context.
        if (!requestedRole && !activeAccount) {
          activeAccount = allAccounts[0]!;
        }

        if (activeAccount) {
          const targetUser = users.find((u) => u.id === activeAccount.id);
          if (targetUser) {
            activeUser = targetUser;
          }
        }

        requestedRole = activeAccount?.role ?? requestedRole;
      } else {
        // If the request specifies a tenant (school), require association to that tenant.
        if (typeof contextSchoolId === "number") {
          return {
            success: false,
            message: "You are not associated with this school.",
          };
        }

        // This might happen if they have a User record but no role associations yet
        // We'll proceed with the authenticated record's defaults unless we are bypassing
        if (!requestedRole || (requestedRole !== UserRole.ADMIN)) {
          requestedRole = activeUser.role;
        }
      }

      activeUser.role = requestedRole!;

      // Reset login attempts on successful login
      await this.userRepository.update(activeUser.id, {
        loginAttempts: 0,
        lastLogin: new Date(),
      });

      // Handle MFA if enabled
      if (activeUser.mfaEnabled) {
        const mfaToken = jwtService.generateMFAToken({
          userId: activeUser.id,
          email: activeUser.email || "",
          phone: activeUser.phone || "",
          role: activeUser.role,
          isVerified: activeUser.emailVerified,
          schoolId: contextSchoolId || null,
        });

        return {
          success: true,
          user: await this.buildLoginUserPayload(
            users.map((u) => u.id),
            activeUser.id,
            activeUser.role,
            contextSchoolId,
          ),
          requiresMFA: true,
          mfaToken,
          message: AUTH_MESSAGES.MFA_REQUIRED,
        };
      }

      // Create session
      const session = await sessionService.createSession(activeUser.id, deviceInfo);

      // Generate Identity-Based Tokens
      // The JWT identifies the person, and the middleware will handle school context via headers.
      const { accessToken, refreshToken } = jwtService.generateTokenPair({
        userId: activeUser.id,
        email: activeUser.email || "",
        phone: activeUser.phone || "",
        role: activeUser.role,
        isVerified: activeUser.emailVerified,
        schoolId: contextSchoolId || null,
        sessionId: session.id,
      });

      // Log successful login
      await this.logSecurityEvent({
        type: "login_success",
        userId: activeUser.id,
        identifier: identifier,
        ipAddress: deviceInfo.ipAddress || "unknown",
        userAgent: deviceInfo.userAgent || "unknown",
        deviceInfo,
        timestamp: new Date(),
      });

      return {
        success: true,
        user: await this.buildLoginUserPayload(
          users.map((u) => u.id),
          activeUser.id,
          activeUser.role,
          contextSchoolId,
        ),
        accessToken,
        refreshToken,
        message: getLoginSuccessMessage(activeUser.role),
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: AUTH_MESSAGES.LOGIN_FAILED,
      };
    }
  }

  /**
   * Verify MFA and complete login
   */
  async verifyMFA(data: MFAVerificationRequest, deviceInfo: DeviceInfo): Promise<AuthResponse> {
    try {
      // Verify MFA token
      const mfaPayload = await jwtService.verifyMFAToken(data.mfaToken);

      // Get user with MFA data
      const user = await this.userRepository.findOne({
        where: { id: mfaPayload.userId },
        select: [
          "id",
          "mfaEnabled",
          "mfaSecret",
          "backupCodes",
          "email",
          "phone",
          "role",
          "firstName",
          "lastName",
          "middleName",
          "isActive",
          "emailVerified",
          "phoneVerified",
        ],
      });

      if (!user || !user.mfaEnabled || !user.mfaSecret) {
        return {
          success: false,
          message: AUTH_MESSAGES.MFA_NOT_ENABLED,
        };
      }

      // Verify MFA code (implementation depends on your MFA service)
      const isValidMFA = this.verifyMFACode(user.mfaSecret, data.code, data.isBackupCode || false, user.backupCodes);

      if (!isValidMFA) {
        await this.logSecurityEvent({
          type: "mfa_failure",
          userId: user.id,
          ipAddress: deviceInfo.ipAddress || "unknown",
          userAgent: deviceInfo.userAgent || "unknown",
          deviceInfo,
          details: { reason: "invalid_mfa_code" },
          timestamp: new Date(),
        });

        return {
          success: false,
          message: AUTH_MESSAGES.MFA_INVALID,
        };
      }

      // Update last login
      await this.userRepository.update(user.id, {
        lastLogin: new Date(),
      });

      // Create session
      const session = await sessionService.createSession(user.id, deviceInfo);

      // Generate final tokens
      const { accessToken, refreshToken } = jwtService.generateTokenPair({
        userId: user.id,
        email: user.email || "",
        phone: user.phone || "",
        role: user.role,
        isVerified: user.emailVerified,
        schoolId: null,
        sessionId: session.id,
      });

      return {
        success: true,
        user: await this.buildLoginUserPayload([user.id], user.id, user.role),
        accessToken,
        refreshToken,
        message: getLoginSuccessMessage(user.role),
      };
    } catch (error) {
      console.error("MFA verification error:", error);
      return {
        success: false,
        message: AUTH_MESSAGES.MFA_VERIFICATION_FAILED,
      };
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<AuthResponse> {
    // Check rate limiting
    const rateLimit = await tokenService.checkRateLimit(data.email, "passwordReset");
    if (!rateLimit.allowed) {
      console.log(":::::::::::", "rate limit error");

      return {
        success: false,
        message: AUTH_MESSAGES.TOO_MANY_PASSWORD_RESET_ATTEMPTS,
      };
    }

    try {
      const user = await this.userRepository.findOne({
        where: { email: data.email.toLowerCase() },
      });

      // Always return success for security (don't reveal if user exists)
      if (!user || !user.isActive) {
        return {
          success: true,
          message: AUTH_MESSAGES.PASSWORD_RESET_EMAIL_SENT,
        };
      }

      // Generate 6-digit password reset token
      const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

      // Store token in database for 15 minutes (900 seconds)
      await tokenService.storePasswordResetToken(user.email!.toLowerCase(), resetToken, 900);

      // Send password reset email with 6-digit code
      try {
        const { emailService } = await import("../../shared/services/email.service");
        await emailService.sendPasswordResetEmail(user.email!, user.lastName, resetToken, user.role);
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
      }

      // Send Security Notification
      try {
        await notificationService.sendNotification({
          userId: user.id,
          schoolId: 0, // System-wide notification
          title: "Security Alert: Password Reset Requested",
          message: "A password reset was requested for your account. If this wasn't you, please secure your account immediately.",
          type: NotificationType.SECURITY,
          priority: NotificationPriority.HIGH,
        });
      } catch (notifError) {
        console.error("Failed to send security notification:", notifError);
      }

      return {
        success: true,
        message: AUTH_MESSAGES.PASSWORD_RESET_EMAIL_SENT,
      };
    } catch (error) {
      console.error("Forgot password error:", error);
      return {
        success: false,
        message: AUTH_MESSAGES.PASSWORD_RESET_REQUEST_FAILED,
      };
    }
  }

  /**
   * Reset password with email and 6-digit token
   */
  async resetPassword(data: PasswordResetRequest): Promise<AuthResponse> {
    try {
      // For backwards compatibility, check if token is JWT or 6-digit
      let email: string;
      let userId: number;

      if (/^\d{6}$/.test(data.token)) {
        // 6-digit token - need email
        if (!data.email) {
          return {
            success: false,
            message: AUTH_MESSAGES.PASSWORD_RESET_REQUIRED,
          };
        }

        // Get stored token from database
        const storedToken = await tokenService.getPasswordResetToken(data.email.toLowerCase());

        if (!storedToken) {
          return {
            success: false,
            message: AUTH_MESSAGES.INVALID_RESET_TOKEN,
          };
        }

        // Verify token matches
        if (storedToken !== data.token) {
          return {
            success: false,
            message: AUTH_MESSAGES.INVALID_RESET_TOKEN_FORMAT,
          };
        }

        email = data.email.toLowerCase();

        // Find user by email
        const userByEmail = await this.userRepository.findOne({
          where: { email },
        });

        if (!userByEmail) {
          return {
            success: false,
            message: AUTH_MESSAGES.USER_NOT_FOUND,
          };
        }

        userId = userByEmail.id;
      } else {
        // JWT token (legacy support)
        const tokenPayload = await jwtService.verifyPasswordResetToken(data.token);
        userId = tokenPayload.userId;
        email = tokenPayload.email;
      }

      // Get user with password and history
      const user = await this.userRepository
        .createQueryBuilder("user")
        .addSelect("user.password")
        .addSelect("user.passwordHistory")
        .where("user.id = :id", { id: userId })
        .getOne();

      if (!user || !user.isActive) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_RESET_TOKEN,
        };
      }

      // Validate new password
      const validation = await validationService.validatePasswordChange(data.newPassword, user.password, user.passwordHistory || []);

      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(", "),
        };
      }

      // Hash new password
      const hashedPassword = await validationService.hashPassword(data.newPassword);

      // Update password history
      const passwordHistory = user.passwordHistory || [];
      passwordHistory.push(user.password);
      const updatedHistory = passwordHistory.slice(-authConfig.security.passwordHistoryCount);

      // Update user
      await this.userRepository.update(user.id, {
        password: hashedPassword,
        passwordHistory: updatedHistory,
        loginAttempts: 0,
        isSystemGeneratedPassword: false,
      });

      // Activate associated staff record if user resets password
      try {
        const { Staff } = await import("../../shared/entities/Staff");
        const { StaffStatus } = await import("../../shared/entities/EntityEnums");
        await AppDataSource.getRepository(Staff).update({ user: { id: user.id } }, { status: StaffStatus.ACTIVE });
      } catch (err) {
        console.error("Failed to activate staff record on password reset:", err);
      }

      // Delete the reset token from database (single use)
      await tokenService.deletePasswordResetToken(email);

      // Terminate all sessions
      await sessionService.terminateAllUserSessions(user.id);

      // Send password reset confirmation email
      try {
        const { emailService } = await import("../../shared/services/email.service");
        await emailService.sendPasswordResetConfirmationEmail(user.email!, user.lastName || "User");
      } catch (emailError) {
        console.error("Failed to send password reset confirmation email:", emailError);
        // Don't fail the reset if confirmation email fails
      }

      return {
        success: true,
        message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
      };
    } catch (error) {
      console.error("Reset password error:", error);

      // Check if it's a JWT verification error
      if (error instanceof Error && (error.message.includes("Invalid") || error.message.includes("expired"))) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_RESET_TOKEN,
        };
      }

      return {
        success: false,
        message: AUTH_MESSAGES.PASSWORD_RESET_FAILED,
      };
    }
  }

  /**
   * Resend password reset token
   */
  async resendPasswordReset(email: string): Promise<AuthResponse> {
    try {
      // Validate email
      if (!validationService.validateEmail(email)) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_EMAIL_FORMAT,
        };
      }

      // Check rate limiting
      const rateLimit = await tokenService.checkRateLimit(email, "passwordReset");
      if (!rateLimit.allowed) {
        return {
          success: false,
          message: AUTH_MESSAGES.TOO_MANY_PASSWORD_RESET_ATTEMPTS,
        };
      }

      // Find user (but don't reveal if user exists for security)
      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      // Always return success for security (don't reveal if user exists)
      if (user && user.isActive) {
        // Generate new 6-digit token
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

        // Store in database with 15-minute expiration
        await tokenService.storePasswordResetToken(email.toLowerCase(), resetToken, 15 * 60);

        // Send email with new token
        try {
          const { emailService } = await import("../../shared/services/email.service");
          await emailService.sendPasswordResetEmail(user.email!, user.lastName, resetToken, user.role);
        } catch (emailError) {
          console.error("Failed to send password reset email:", emailError);
        }
      }

      return {
        success: true,
        message: AUTH_MESSAGES.PASSWORD_RESET_EMAIL_RESENT,
      };
    } catch (error) {
      console.error("Resend password reset error:", error);
      return {
        success: false,
        message: AUTH_MESSAGES.PASSWORD_RESET_RESEND_FAILED,
      };
    }
  }

  /**
   * Verify password reset token (without resetting password)
   */
  async verifyResetToken(email: string, token: string): Promise<AuthResponse> {
    try {
      // Validate email
      if (!validationService.validateEmail(email)) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_EMAIL_FORMAT,
        };
      }

      // Validate token format (should be 6 digits)
      if (!/^\d{6}$/.test(token)) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_TOKEN_FORMAT,
        };
      }

      // Get stored token from database
      const storedToken = await tokenService.getPasswordResetToken(email.toLowerCase());

      if (!storedToken) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_RESET_TOKEN,
        };
      }

      // Verify token matches
      if (storedToken !== token) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_RESET_TOKEN,
        };
      }

      // Find user
      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      if (!user || !user.isActive) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_RESET_TOKEN,
        };
      }

      return {
        success: true,
        message: AUTH_MESSAGES.RESET_TOKEN_VERIFIED,
      };
    } catch (error) {
      console.error("Verify reset token error:", error);
      return {
        success: false,
        message: AUTH_MESSAGES.INVALID_RESET_TOKEN,
      };
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      // Get user with password
      const user = await this.userRepository
        .createQueryBuilder("user")
        .addSelect("user.password")
        .addSelect("user.passwordHistory")
        .where("user.id = :id", { id: userId })
        .getOne();

      if (!user) {
        return {
          success: false,
          message: AUTH_MESSAGES.USER_NOT_FOUND,
        };
      }

      // Verify current password
      const { passwordService } = await import("../../shared/services/password.service");
      const isCurrentPasswordValid = await passwordService.comparePassword(currentPassword, user.password);

      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: AUTH_MESSAGES.CURRENT_PASSWORD_INCORRECT,
        };
      }

      // Validate new password
      const passwordValidation = await passwordService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.errors.join(", "),
        };
      }

      // Check if new password is same as current
      const isSamePassword = await passwordService.comparePassword(newPassword, user.password);
      if (isSamePassword) {
        return {
          success: false,
          message: AUTH_MESSAGES.PASSWORD_SAME_AS_CURRENT,
        };
      }

      // Check password history (prevent reuse of last 5 passwords)
      if (user.passwordHistory && user.passwordHistory.length > 0) {
        for (const oldPassword of user.passwordHistory) {
          const isReused = await passwordService.comparePassword(newPassword, oldPassword);
          if (isReused) {
            return {
              success: false,
              message: getPasswordHistoryError(5),
            };
          }
        }
      }

      // Check if password is commonly used
      const isCommon = await passwordService.isPasswordCompromised(newPassword);
      if (isCommon) {
        return {
          success: false,
          message: AUTH_MESSAGES.PASSWORD_TOO_COMMON,
        };
      }

      // Hash new password
      const hashedPassword = await passwordService.hashPassword(newPassword);

      // Update password history (keep last 5)
      const passwordHistory = user.passwordHistory || [];
      passwordHistory.unshift(user.password); // Add current password to history
      const updatedHistory = passwordHistory.slice(0, 5); // Keep only last 5

      // Update user password
      await this.userRepository.update(userId, {
        password: hashedPassword,
        passwordHistory: updatedHistory,
        updatedAt: new Date(),
        isSystemGeneratedPassword: false,
      });

      // Log security event
      await this.logSecurityEvent({
        type: "password_reset",
        userId: user.id,
        identifier: user.email || user.phone || "",
        ipAddress: "unknown",
        userAgent: "unknown",
        deviceInfo: { type: "web" },
        timestamp: new Date(),
      });

      return {
        success: true,
        message: AUTH_MESSAGES.PASSWORD_CHANGE_SUCCESS,
      };
    } catch (error) {
      console.error("Change password error:", error);
      return {
        success: false,
        message: AUTH_MESSAGES.PASSWORD_CHANGE_FAILED,
      };
    }
  }

  /**
   * Logout user
   */
  async logout(userId: number, sessionId?: number): Promise<AuthResponse> {
    try {
      if (sessionId) {
        await sessionService.terminateSession(sessionId);
      } else {
        await sessionService.terminateAllUserSessions(userId);
      }

      return {
        success: true,
        message: AUTH_MESSAGES.LOGOUT_SUCCESS,
      };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        message: AUTH_MESSAGES.LOGOUT_FAILED,
      };
    }
  }

  /**
   * Resend email verification token
   */
  async resendEmailVerification(email: string): Promise<AuthResponse> {
    try {
      // Validate email format first
      if (!validationService.validateEmail(email)) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_EMAIL_FORMAT,
        };
      }

      // Find user by email
      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // For security, return success even if user doesn't exist
        return {
          success: true,
          message: AUTH_MESSAGES.VERIFICATION_EMAIL_RESENT,
        };
      }

      // Check if already verified
      if (user.emailVerified) {
        return {
          success: false,
          message: AUTH_MESSAGES.EMAIL_ALREADY_VERIFIED,
        };
      }

      // Check rate limiting
      const rateLimit = await tokenService.checkRateLimit(email, "registration");
      if (!rateLimit.allowed) {
        return {
          success: false,
          message: AUTH_MESSAGES.TOO_MANY_REGISTRATION_ATTEMPTS,
        };
      }

      // Send new verification email
      try {
        const { emailService } = await import("../../shared/services/email.service");
        await emailService.sendEmailVerification(user.email!, user.lastName);
      } catch (error) {
        console.error(error);
      }

      return {
        success: true,
        message: AUTH_MESSAGES.VERIFICATION_EMAIL_RESENT,
      };
    } catch (error) {
      console.error("Resend email verification error:", error);
      return {
        success: false,
        message: AUTH_MESSAGES.VERIFICATION_RESEND_FAILED,
      };
    }
  }

  /**
   * Verify email address with 6-digit token
   */
  async verifyEmail(email: string, token: string): Promise<AuthResponse> {
    try {
      // Validate token format (should be 6 digits)
      if (!/^\d{6}$/.test(token)) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_TOKEN_FORMAT,
        };
      }

      // Get stored token from database
      const storedToken = await tokenService.getEmailVerificationToken(email.toLowerCase());

      if (!storedToken) {
        return {
          success: false,
          message: AUTH_MESSAGES.NO_VERIFICATION_TOKEN_EXPIRED,
        };
      }

      // Verify token matches
      if (storedToken !== token) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_VERIFICATION_TOKEN,
        };
      }

      // Find user by email
      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        return {
          success: false,
          message: AUTH_MESSAGES.USER_NOT_FOUND,
        };
      }

      if (user.emailVerified) {
        // Create session for already verified user
        const deviceInfo: DeviceInfo = {
          type: "web",
          ipAddress: "unknown",
          userAgent: "email-verification",
        };
        const session = await sessionService.createSession(user.id, deviceInfo);

        // Generate tokens
        const { accessToken, refreshToken } = jwtService.generateTokenPair({
          userId: user.id,
          email: user.email || "",
          phone: user.phone || "",
          role: user.role,
          isVerified: user.emailVerified,
          schoolId: null,
          sessionId: session.id,
        });

        return {
          success: true,
          user: this.toAuthUser(user),
          accessToken,
          refreshToken,
          message: AUTH_MESSAGES.EMAIL_ALREADY_VERIFIED,
        };
      }

      // Update user's email verification status
      await this.userRepository.update(user.id, {
        emailVerified: true,
        lastLogin: new Date(),
      });

      // Update the user object in memory
      user.emailVerified = true;
      user.lastLogin = new Date();

      // Create Profile for the user
      const existingProfile = await this.profileRepository.findOne({
        where: { userId: user.id },
      });

      if (!existingProfile) {
        const profile = this.profileRepository.create({
          userId: user.id,
        });
        await this.profileRepository.save(profile);
      }

      // Delete the verification token from database (single use)
      await tokenService.deleteEmailVerificationToken(email.toLowerCase());

      // Create session for the user
      const deviceInfo: DeviceInfo = {
        type: "web",
        ipAddress: "unknown",
        userAgent: "email-verification",
      };
      const session = await sessionService.createSession(user.id, deviceInfo);

      // Generate tokens
      const { accessToken, refreshToken } = jwtService.generateTokenPair({
        userId: user.id,
        email: user.email || "",
        phone: user.phone || "",
        role: user.role,
        isVerified: user.emailVerified,
        schoolId: null,
        sessionId: session.id,
      });

      // Log security event
      await this.logSecurityEvent({
        type: "email_verified",
        userId: user.id,
        identifier: user.email || "",
        ipAddress: "unknown", // We don't have IP in this context
        userAgent: "unknown",
        deviceInfo: { type: "web" },
        timestamp: new Date(),
      });

      // Send welcome email after successful verification
      try {
        const { emailService } = await import("../../shared/services/email.service");
        const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ");
        await emailService.sendGeneralWelcomeEmail(user.email!, displayName, {
          role: user.role,
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Continue even if welcome email fails - don't block verification
      }

      return {
        success: true,
        user: this.toAuthUser(user),
        accessToken,
        refreshToken,
        message: AUTH_MESSAGES.EMAIL_VERIFICATION_SUCCESS,
      };
    } catch (error) {
      console.error("Email verification error:", error);
      return {
        success: false,
        message: AUTH_MESSAGES.EMAIL_VERIFICATION_FAILED,
      };
    }
  }

  // Helper methods
  private validateRegistrationData(data: RegisterRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.email) {
      errors.push("Email is required");
    } else if (!validationService.validateEmail(data.email)) {
      errors.push("Invalid email format");
    }

    if (data.phone && !validationService.validatePhone(validationService.normalizePhone(data.phone))) {
      errors.push("Invalid phone number format");
    }

    const passwordValidation = validationService.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    if (!data.firstName || data.firstName.trim().length < 1) {
      errors.push("FirstName is required");
    }
    if (!data.lastName || data.lastName.trim().length < 1) {
      errors.push("LastName is required");
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async findExistingUser(email: string, _phone?: string, selectPassword = false): Promise<User | null> {
    const query = this.userRepository.createQueryBuilder("user");

    query.where("user.email = :email", { email: email.toLowerCase() });

    if (selectPassword) {
      query.addSelect("user.password");
    }

    return await query.getOne();
  }

  async findUserByEmailOrPhone(email?: string, phone?: string): Promise<User | null> {
    const where: any = {};

    if (email) {
      where.email = email.toLowerCase();
    } else if (phone) {
      where.phone = validationService.normalizePhone(phone);
    }

    return await this.userRepository.findOne({
      where,
      select: [
        "id",
        "email",
        "phone",
        "password",
        "role",
        "firstName",
        "lastName",
        "middleName",
        "emailVerified",
        "phoneVerified",
        "isActive",
        "loginAttempts",
        "lockedUntil",
        "mfaEnabled",
      ],
    });
  }

  private async findUsersByIdentifier(email?: string, phone?: string): Promise<User[]> {
    const select = [
      "id",
      "email",
      "phone",
      "password",
      "role",
      "firstName",
      "lastName",
      "middleName",
      "emailVerified",
      "phoneVerified",
      "isActive",
      "loginAttempts",
      "lockedUntil",
      "mfaEnabled",
    ] as const;

    if (email) {
      const normalizedEmail = email.toLowerCase();

      // IMPORTANT: email is expected to be unique, but we support legacy/dirty data
      // where multiple users may share the same email. Use find() not findOne().
      const usersByEmail = await this.userRepository.find({
        where: { email: normalizedEmail } as any,
        select: select as any,
      });

      if (!usersByEmail.length) return [];

      const normalizedPhones = new Set<string>();
      usersByEmail.forEach((u) => {
        if (u.phone) {
          const p = validationService.normalizePhone(u.phone);
          if (p) normalizedPhones.add(p);
        }
      });

      if (phone) {
        const p = validationService.normalizePhone(phone);
        if (p) normalizedPhones.add(p);
      }

      const where: any[] = [{ email: normalizedEmail }];
      normalizedPhones.forEach((p) => where.push({ phone: p }));

      const group = await this.userRepository.find({
        where: where as any, // OR semantics
        select: select as any,
      });

      const map = new Map<number, User>();
      group.forEach((u) => map.set(u.id, u));
      return Array.from(map.values());
    }

    if (phone) {
      const normalizedPhone = validationService.normalizePhone(phone);
      return await this.userRepository.find({
        where: { phone: normalizedPhone } as any,
        select: select as any,
      });
    }

    return [];
  }


  private async hasRoleAssociation(userId: number, role: UserRole, schoolId?: number): Promise<boolean> {
    const userWithRelations = await this.userRepository.findOne({
      where: { id: userId } as any,
      relations: ["teacher", "teacher.school", "parent", "parent.school", "admin", "admin.school"],
    });

    if (!userWithRelations) return false;

    const schoolMatch = (relationSchoolId?: number | null): boolean => {
      if (typeof schoolId !== "number") return true;
      return relationSchoolId === schoolId;
    };

    switch (role) {
      case UserRole.STAFF:
        return (userWithRelations.teacher || []).some((staff: any) => schoolMatch(staff?.schoolId ?? staff?.school?.id));
      case UserRole.PARENT:
        return (userWithRelations.parent || []).some((parent: any) => schoolMatch(parent?.schoolId ?? parent?.school?.id));
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return (userWithRelations.admin || []).some((admin: any) => schoolMatch(admin?.schoolId ?? admin?.school?.id));
      default:
        return true;
    }
  }

  private async handleFailedLogin(user: User): Promise<void> {
    const newAttempts = user.loginAttempts + 1;
    const updateData: Partial<User> = { loginAttempts: newAttempts };

    if (newAttempts >= authConfig.security.maxLoginAttempts) {
      updateData.lockedUntil = new Date(Date.now() + authConfig.security.lockoutDuration);
      updateData.loginAttempts = 0;
    }

    await this.userRepository.update(user.id, updateData);
  }

  private verifyMFACode(_secret: string, code: string, isBackupCode: boolean, backupCodes?: string[]): boolean {
    // This is a simplified implementation
    // In a real app, you'd use a proper TOTP library like speakeasy
    if (isBackupCode) {
      return backupCodes?.includes(code) || false;
    }

    // For now, accept any 6-digit code (replace with real TOTP verification)
    return /^\d{6}$/.test(code);
  }

  private toAuthUser(user: User): AuthUser {
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: displayName,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      mfaEnabled: user.mfaEnabled,
      isSystemGeneratedPassword: user.isSystemGeneratedPassword,
    };
  }

  private toSchoolSummary(school?: any): { id: number; schoolName?: string; subDomain?: string } | null {
    if (!school || typeof school.id !== "number") return null;
    return {
      id: school.id,
      schoolName: school.schoolName,
      subDomain: school.subDomain,
    };
  }

  private toProfileSummary(profile: Profile | undefined): any | null {
    if (!profile) return null;
    return {
      id: profile.id,
      userId: profile.userId,
      suffix: typeof (profile as any).suffix === "undefined" ? null : (profile as any).suffix,
      address: typeof profile.address === "undefined" ? null : profile.address,
      city: typeof profile.city === "undefined" ? null : profile.city,
      state: typeof profile.state === "undefined" ? null : profile.state,
      postalCode: typeof profile.postalCode === "undefined" ? null : profile.postalCode,
      photo: typeof profile.photo === "undefined" ? null : profile.photo,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      country: (profile as any).country ?? null,
    };
  }

  private async buildLoginUserPayload(userIds: number[], baseUserId: number, role: UserRole, contextSchoolId?: number): Promise<AuthUser> {
    const uniqueUserIds = Array.from(new Set((userIds || []).filter((id) => typeof id === "number" && !Number.isNaN(id))));

    const loadedUsers = await this.userRepository.find({
      where: { id: In(uniqueUserIds.length ? uniqueUserIds : [baseUserId]) } as any,
      relations: [
        "profile",
        "profile.country",
        "teacher",
        "teacher.school",
        "teacher.staffClassesAndSubject",
        "teacher.staffClassesAndSubject.classroom",
        "teacher.staffClassesAndSubject.subject",
        "parent",
        "parent.school",
        "admin",
        "admin.school",
        "student",
        "student.school",
      ],
    });

    const baseUser = loadedUsers.find((u) => u.id === baseUserId) || loadedUsers[0];
    if (!baseUser) {
      // Should never happen, but keep response shape stable
      return {
        id: baseUserId,
        name: "",
        role,
        isActive: false,
        emailVerified: false,
        phoneVerified: false,
        mfaEnabled: false,
        isSystemGeneratedPassword: false,
        staff: [],
        admin: [],
        parent: [],
        profile: null,
      };
    }

    const name = [baseUser.firstName, baseUser.middleName, baseUser.lastName].filter(Boolean).join(" ");

    const shouldScope = typeof contextSchoolId === "number" && !Number.isNaN(contextSchoolId);

    const staff =
      role === UserRole.STAFF
        ? (loadedUsers || [])
            .flatMap((u) => (u.teacher || []) as any[])
            .filter((s: any) => !shouldScope || s?.schoolId === contextSchoolId)
            .map((s: any) => ({
              id: s.id,
              userId: s.userId,
              staffRole: s.staffRole,
              status: s.status,
              schoolId: s.schoolId,
              school: this.toSchoolSummary(s.school),
            }))
        : [];

    const parent =
      role === UserRole.PARENT
        ? (loadedUsers || [])
            .flatMap((u) => (u.parent || []) as any[])
            .filter((p: any) => !shouldScope || p?.schoolId === contextSchoolId)
            .map((p: any) => ({
              id: p.id,
              userId: p.userId,
              relationship: p.relationship,
              status: p.status,
              schoolId: p.schoolId,
              school: this.toSchoolSummary(p.school),
            }))
        : [];

    const admin =
      role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN
        ? (loadedUsers || [])
            .flatMap((u) => (u.admin || []) as any[])
            .filter((a: any) => !shouldScope || a?.schoolId === contextSchoolId)
            .map((a: any) => ({
              id: a.id,
              userId: a.userId,
              schoolId: a.schoolId,
              role: a.role,
              school: this.toSchoolSummary(a.school),
            }))
        : [];

    return {
      id: baseUser.id,
      email: baseUser.email,
      phone: baseUser.phone,
      name,
      role,
      isActive: baseUser.isActive,
      emailVerified: baseUser.emailVerified,
      phoneVerified: baseUser.phoneVerified,
      mfaEnabled: baseUser.mfaEnabled,
      isSystemGeneratedPassword: baseUser.isSystemGeneratedPassword,
      schoolId: shouldScope ? contextSchoolId : undefined,
      staff,
      admin,
      parent,
      profile: this.toProfileSummary(baseUser.profile),
    };
  }

  private async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await tokenService.logSecurityEvent(event);
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }
}

export const authService = new AuthService();
