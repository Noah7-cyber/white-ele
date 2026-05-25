import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { jwtService } from "../services/jwt.service";
import { sessionService } from "../services/session.service";
import { AuthenticatedRequest, extractDeviceInfo } from "../middleware/middleware";
import { AUTH_MESSAGES } from "../constants/messages";
import { activityLogger } from "../../shared/services/activity-logger.service";
import { rolesService } from "../../roles";

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const deviceInfo = extractDeviceInfo(req);
      const contextSchoolId = (req as any).schoolId;
      const headerSchoolId = req.headers["school"] || req.headers["School"];
      const resolvedSchoolId =
        typeof contextSchoolId === "number" && !Number.isNaN(contextSchoolId)
          ? contextSchoolId
          : headerSchoolId && !Number.isNaN(parseInt(headerSchoolId as string))
            ? parseInt(headerSchoolId as string)
            : req.body.schoolId;

      const result = await authService.register({ ...req.body, schoolId: resolvedSchoolId }, deviceInfo);
      console.log(req.body);
      // Log activity
      if (result.success && result.user) {
        await activityLogger.log({
          resource: "auth",
          action: "register",
          title: "New user registered",
          description: `User ${result.user.name || result.user.email} registered as ${result.user.role}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      const statusCode = result.success ? 201 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const deviceInfo = extractDeviceInfo(req);

      const contextSchoolId =
        typeof (req as any).schoolId === "number" && !Number.isNaN((req as any).schoolId) ? (req as any).schoolId : undefined;

      const bodySchoolId =
        typeof (req as any).body?.schoolId === "number" && !Number.isNaN((req as any).body?.schoolId)
          ? (req as any).body.schoolId
          : undefined;

      const result = await authService.login({ ...req.body, schoolId: contextSchoolId ?? bodySchoolId }, deviceInfo);

      const statusCode = result.success ? 200 : 401;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  async verifyMFA(req: Request, res: Response): Promise<void> {
    try {
      const deviceInfo = extractDeviceInfo(req);

      const result = await authService.verifyMFA(req.body, deviceInfo);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("MFA verification error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.forgotPassword(req.body);

      // Always return 200 for security (don't reveal if email exists)
      res.status(200).json(result);
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.resetPassword(req.body);

      // Log activity
      if (result.success) {
        await activityLogger.log({
          resource: "auth",
          action: "reset_password",
          title: "Password reset",
          description: `Password reset for ${req.body.email}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }
  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await authService.logout(req.user.id, Number(req.sessionId));

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  async logoutAllDevices(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await authService.logout(req.user.id);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Logout all devices error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  /**
   * Get user sessions
   */
  async getSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sessions = await sessionService.getUserSessions(req.user.id);

      res.status(200).json({
        success: true,
        data: { sessions },
      });
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  /**
   * Terminate a specific session
   */
  async terminateSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      // Verify the session belongs to the user
      const sessions = await sessionService.getUserSessions(req.user.id);
      const sessionExists = sessions.some((session) => session.id === Number(sessionId));

      if (!sessionExists) {
        res.status(404).json({
          success: false,
          message: AUTH_MESSAGES.SESSION_NOT_FOUND,
        });
        return;
      }

      const success = await sessionService.terminateSession(Number(sessionId));

      // Log activity
      if (success && req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "auth",
          action: "terminate_session",
          title: "Session terminated",
          description: `Session #${sessionId} terminated by ${req.user.name || req.user.email}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      if (success) {
        res.status(200).json({
          success: true,
          message: AUTH_MESSAGES.SESSION_TERMINATED,
        });
      } else {
        res.status(400).json({
          success: false,
          message: AUTH_MESSAGES.SESSION_TERMINATION_FAILED,
        });
      }
    } catch (error) {
      console.error("Terminate session error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await sessionService.getUserSessionStats(req.user.id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Get session stats error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: AUTH_MESSAGES.REFRESH_TOKEN_REQUIRED,
        });
        return;
      }

      // Verify refresh token
      const payload = await jwtService.verifyRefreshToken(refreshToken);

      // Get user from database
      const { AppDataSource } = await import("../../core/config/database");
      const { User } = await import("../../shared/entities/User");
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: payload.userId },
      });

      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: AUTH_MESSAGES.USER_NOT_FOUND_OR_INACTIVE,
        });
        return;
      }

      // Validate session if present
      let sessionId = payload.sessionId || 0;
      if (sessionId) {
        const session = await sessionService.validateSession(sessionId);
        if (!session) {
          res.status(401).json({
            success: false,
            message: AUTH_MESSAGES.SESSION_EXPIRED,
          });
          return;
        }
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = jwtService.generateTokenPair({
        userId: user.id,
        email: user.email || "",
        phone: user.phone || "",
        role: user.role,
        sessionId: sessionId || 0,
      });

      // Revoke old refresh token
      await jwtService.revokeToken(refreshToken);

      res.status(200).json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(401).json({
        success: false,
        message: AUTH_MESSAGES.INVALID_REFRESH_TOKEN,
      });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        data: { user: req.user },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  /**
   * Effective permissions for the authenticated user (custom school roles or system role map).
   */
  async getMyPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const contextSchoolId =
        typeof (req as unknown as { schoolId?: number }).schoolId === "number" &&
        !Number.isNaN((req as unknown as { schoolId?: number }).schoolId)
          ? (req as unknown as { schoolId?: number }).schoolId
          : undefined;
      const q = req.query["schoolId"];
      const querySchoolId =
        typeof q === "string" && q.trim() !== "" && !Number.isNaN(parseInt(q, 10))
          ? parseInt(q, 10)
          : typeof q === "number" && !Number.isNaN(q)
            ? q
            : undefined;
      const userSchoolId =
        typeof req.user?.schoolId === "number" && !Number.isNaN(req.user.schoolId) ? req.user.schoolId : undefined;
      const schoolId = contextSchoolId ?? querySchoolId ?? userSchoolId;

      const result = await rolesService.getMyPermissions(req.user.id, schoolId);

      const statusCode = result.success ? 200 : result.message === "User not found" ? 404 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Get my permissions error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  /**
   * Health check endpoint
   */
  async health(_req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        data: {
          status: "healthy",
          timestamp: new Date().toISOString(),
          database: "connected",
        },
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.HEALTH_CHECK_FAILED,
      });
    }
  }

  /**
   * Verify email address with 6-digit token
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, token } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: AUTH_MESSAGES.EMAIL_REQUIRED_FOR_VERIFICATION,
        });
        return;
      }

      if (!token) {
        res.status(400).json({
          success: false,
          message: AUTH_MESSAGES.TOKEN_REQUIRED_FOR_VERIFICATION,
        });
        return;
      }

      const result = await authService.verifyEmail(email, token);

      // Log activity
      if (result.success) {
        await activityLogger.log({
          resource: "auth",
          action: "verify_email",
          title: "Email verified",
          description: `Email ${email} verified successfully`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  /**
   * Resend email verification token
   */
  async resendEmailVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: AUTH_MESSAGES.EMAIL_REQUIRED_FOR_VERIFICATION,
        });
        return;
      }

      const result = await authService.resendEmailVerification(email);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Resend email verification error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  /**
   * Resend password reset token
   */
  async resendPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: AUTH_MESSAGES.EMAIL_REQUIRED,
        });
        return;
      }

      const result = await authService.resendPasswordReset(email);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Resend password reset error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  /**
   * Verify password reset token (without resetting password)
   */
  async verifyResetToken(req: Request, res: Response): Promise<void> {
    try {
      const { email, token } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: AUTH_MESSAGES.EMAIL_REQUIRED,
        });
        return;
      }

      if (!token) {
        res.status(400).json({
          success: false,
          message: AUTH_MESSAGES.RESET_TOKEN_REQUIRED,
        });
        return;
      }

      const result = await authService.verifyResetToken(email, token);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Verify reset token error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const userName = (req as any).user?.name;
      const userEmail = (req as any).user?.email;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: AUTH_MESSAGES.AUTHENTICATION_REQUIRED,
        });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: AUTH_MESSAGES.PASSWORD_AND_NEW_PASSWORD_REQUIRED,
        });
        return;
      }

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      // Log activity
      if (result.success) {
        await activityLogger.log({
          userId,
          resource: "auth",
          action: "change_password",
          title: "Password changed",
          description: `Password changed by ${userName || userEmail}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: AUTH_MESSAGES.INTERNAL_ERROR,
      });
    }
  }
}

export const authController = new AuthController();
