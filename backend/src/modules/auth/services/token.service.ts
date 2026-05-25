import { Repository, LessThan, MoreThan } from "typeorm";
import { AppDataSource } from "../../core/config/database";
import { PasswordResetToken } from "../../shared/entities/PasswordResetToken";
import { EmailVerificationToken } from "../../shared/entities/EmailVerificationToken";
import { RateLimit, RateLimitType } from "../../shared/entities/RateLimit";
import { authConfig } from "./config";
import { SecurityEvent as SecurityEventEntity } from "../../shared/entities/SecurityEvent";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
}

interface SecurityEvent {
  type: string;
  userId?: number;
  identifier?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  deviceInfo?: any;
  timestamp: Date;
  [key: string]: any;
}

export class TokenService {
  private passwordResetRepository: Repository<PasswordResetToken>;
  private emailVerificationRepository: Repository<EmailVerificationToken>;
  private rateLimitRepository: Repository<RateLimit>;
  private securityEventRepository: Repository<SecurityEventEntity>;

  constructor() {
    this.passwordResetRepository = AppDataSource.getRepository(PasswordResetToken);
    this.emailVerificationRepository = AppDataSource.getRepository(EmailVerificationToken);
    this.rateLimitRepository = AppDataSource.getRepository(RateLimit);
    this.securityEventRepository = AppDataSource.getRepository(SecurityEventEntity);
  }

  // Password Reset Token Management
  async storePasswordResetToken(email: string, token: string, expiresInSeconds: number): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // Delete any existing token for this email
    await this.passwordResetRepository.delete({ email: email.toLowerCase() });

    const resetToken = this.passwordResetRepository.create({
      email: email.toLowerCase(),
      token,
      expiresAt,
    });

    await this.passwordResetRepository.save(resetToken);
  }

  async getPasswordResetToken(email: string): Promise<string | null> {
    const resetToken = await this.passwordResetRepository.findOne({
      where: {
        email: email.toLowerCase(),
        expiresAt: MoreThan(new Date()),
      },
    });

    return resetToken ? resetToken.token : null;
  }

  async deletePasswordResetToken(email: string): Promise<void> {
    await this.passwordResetRepository.delete({ email: email.toLowerCase() });
  }

  // Email Verification Token Management
  async storeEmailVerificationToken(email: string, token: string, expiresInSeconds: number): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // Delete any existing token for this email
    await this.emailVerificationRepository.delete({ email: email.toLowerCase() });

    const verificationToken = this.emailVerificationRepository.create({
      email: email.toLowerCase(),
      token,
      expiresAt,
    });

    await this.emailVerificationRepository.save(verificationToken);
  }

  async getEmailVerificationToken(email: string): Promise<string | null> {
    const verificationToken = await this.emailVerificationRepository.findOne({
      where: {
        email: email.toLowerCase(),
        expiresAt: MoreThan(new Date()),
      },
    });

    return verificationToken ? verificationToken.token : null;
  }

  async deleteEmailVerificationToken(email: string): Promise<void> {
    await this.emailVerificationRepository.delete({ email: email.toLowerCase() });
  }

  // Rate Limiting
  async checkRateLimit(
    identifier: string,
    type: "login" | "passwordReset" | "registration" | "changeEmail" | "staffInviteResend"
  ): Promise<RateLimitResult> {
    const config = authConfig.rateLimit[type];
    const rateLimitType =
      type === "passwordReset"
        ? RateLimitType.PASSWORD_RESET
        : type === "login"
          ? RateLimitType.LOGIN
          : type === "changeEmail"
            ? RateLimitType.CHANGE_EMAIL
            : type === "staffInviteResend"
              ? RateLimitType.STAFF_INVITE_RESEND
              : RateLimitType.REGISTRATION;

    // Find or create rate limit entry
    let rateLimit = await this.rateLimitRepository.findOne({
      where: {
        identifier: identifier.toLowerCase(),
        type: rateLimitType,
      },
    });

    const now = new Date();

    if (!rateLimit || now > rateLimit.expiresAt) {
      // Create new rate limit entry
      const expiresAt = new Date(now.getTime() + config.windowMs);

      if (rateLimit) {
        // Update existing expired entry
        await this.rateLimitRepository.update(rateLimit.id, {
          attempts: 1,
          expiresAt,
        });
        rateLimit.attempts = 1;
        rateLimit.expiresAt = expiresAt;
      } else {
        // Create new entry
        rateLimit = this.rateLimitRepository.create({
          identifier: identifier.toLowerCase(),
          type: rateLimitType,
          attempts: 1,
          expiresAt,
        });
        await this.rateLimitRepository.save(rateLimit);
      }

      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetTime: expiresAt,
      };
    }

    // Increment attempts
    const newAttempts = rateLimit.attempts + 1;
    await this.rateLimitRepository.update(rateLimit.id, {
      attempts: newAttempts,
    });

    return {
      allowed: newAttempts <= config.maxAttempts,
      remaining: Math.max(0, config.maxAttempts - newAttempts),
      resetTime: rateLimit.expiresAt,
    };
  }

  // Security Event Logging
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const securityEvent = this.securityEventRepository.create({
        eventType: event.type,
        userId: event.userId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        deviceInfo: event.deviceInfo ? JSON.stringify(event.deviceInfo) : undefined,
        details: event.details ? JSON.stringify(event.details) : undefined,
      });

      await this.securityEventRepository.save(securityEvent);
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }

  // Cleanup expired tokens and rate limits
  async cleanupExpiredTokens(): Promise<{
    passwordResetTokens: number;
    emailVerificationTokens: number;
    rateLimits: number;
  }> {
    const now = new Date();

    const [passwordResetResult, emailVerificationResult, rateLimitResult] = await Promise.all([
      this.passwordResetRepository.delete({ expiresAt: LessThan(now) }),
      this.emailVerificationRepository.delete({ expiresAt: LessThan(now) }),
      this.rateLimitRepository.delete({ expiresAt: LessThan(now) }),
    ]);

    return {
      passwordResetTokens: passwordResetResult.affected || 0,
      emailVerificationTokens: emailVerificationResult.affected || 0,
      rateLimits: rateLimitResult.affected || 0,
    };
  }

  // Get security events for a user
  async getUserSecurityEvents(userId: number, limit: number = 50): Promise<SecurityEventEntity[]> {
    return await this.securityEventRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }
}

export const tokenService = new TokenService();
