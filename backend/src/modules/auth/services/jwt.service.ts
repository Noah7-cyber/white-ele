import jwt from "jsonwebtoken";
import { authConfig } from "./config";
import { JWTPayload } from "../types/types";
import { Repository, LessThan } from "typeorm";
import { AppDataSource } from "../../core/config/database";
import { TokenBlacklist } from "../../shared/entities/TokenBlacklist";

export class JWTService {
  private tokenBlacklistRepository: Repository<TokenBlacklist>;

  constructor() {
    this.tokenBlacklistRepository = AppDataSource.getRepository(TokenBlacklist);
  }

  /**
   * Check if a token is blacklisted
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistedToken = await this.tokenBlacklistRepository.findOne({
      where: {
        token,
      },
    });

    if (!blacklistedToken) {
      return false;
    }

    // Check if token has expired
    if (new Date() > blacklistedToken.expiresAt) {
      // Clean up expired token
      await this.tokenBlacklistRepository.delete(blacklistedToken.id);
      return false;
    }

    return true;
  }

  /**
   * Add a token to the blacklist
   */
  private async blacklistToken(token: string, expiresAt: Date): Promise<void> {
    try {
      const blacklistEntry = this.tokenBlacklistRepository.create({
        token,
        expiresAt,
      });
      await this.tokenBlacklistRepository.save(blacklistEntry);
    } catch (error) {
      // Ignore duplicate key errors
      if (!(error instanceof Error) || !error.message.includes("duplicate")) {
        throw error;
      }
    }
  }

  /**
   * Clean up expired blacklisted tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.tokenBlacklistRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }
  /**
   * Generate access token with user payload
   */
  generateAccessToken(payload: Omit<JWTPayload, "iat" | "exp" | "tokenType">): string {
    return jwt.sign(
      { ...payload, tokenType: "access" },
      authConfig.jwt.accessSecret as string,
      {
        expiresIn: authConfig.jwt.accessExpiresIn as string,
        issuer: authConfig.jwt.issuer,
      } as jwt.SignOptions
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: number, sessionId?: number, role?: string): string {
    const payload = {
      userId,
      sessionId: sessionId || "",
      role: role || "customer", // Use provided role or default to customer
      tokenType: "refresh" as const,
    };

    return jwt.sign(
      payload,
      authConfig.jwt.refreshSecret as string,
      {
        expiresIn: authConfig.jwt.refreshExpiresIn as string,
        issuer: authConfig.jwt.issuer,
      } as jwt.SignOptions
    );
  }

  /**
   * Generate MFA token (short-lived)
   */
  generateMFAToken(payload: Omit<JWTPayload, "iat" | "exp" | "tokenType">): string {
    return jwt.sign(
      { ...payload, tokenType: "mfa" },
      authConfig.jwt.mfaSecret as string,
      {
        expiresIn: authConfig.jwt.mfaExpiresIn as string,
        issuer: authConfig.jwt.issuer,
      } as jwt.SignOptions
    );
  }

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(userId: number, email: string): string {
    const payload = {
      userId,
      email,
      tokenType: "password_reset" as const,
    };

    return jwt.sign(
      payload,
      authConfig.jwt.passwordResetSecret as string,
      {
        expiresIn: authConfig.jwt.passwordResetExpiresIn as string,
        issuer: authConfig.jwt.issuer,
      } as jwt.SignOptions
    );
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<JWTPayload> {
    // Check blacklist first
    const isBlacklisted = await this.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new Error("Token has been revoked");
    }

    try {
      const decoded = jwt.verify(token, authConfig.jwt.accessSecret) as JWTPayload;

      if (decoded.tokenType !== "access") {
        throw new Error("Invalid token type");
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Token has expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid token");
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<JWTPayload> {
    // Check blacklist first
    const isBlacklisted = await this.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new Error("Refresh token has been revoked");
    }

    try {
      const decoded = jwt.verify(token, authConfig.jwt.refreshSecret) as JWTPayload;

      if (decoded.tokenType !== "refresh") {
        throw new Error("Invalid refresh token");
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Refresh token has expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid refresh token");
      }
      throw error;
    }
  }

  /**
   * Verify MFA token
   */
  async verifyMFAToken(token: string): Promise<JWTPayload> {
    // Check blacklist first
    const isBlacklisted = await this.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new Error("MFA token has been revoked");
    }

    try {
      const decoded = jwt.verify(token, authConfig.jwt.mfaSecret) as JWTPayload;

      if (decoded.tokenType !== "mfa") {
        throw new Error("Invalid MFA token");
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("MFA token has expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid MFA token");
      }
      throw error;
    }
  }

  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token: string): Promise<{ userId: number; email: string }> {
    // Check blacklist first
    const isBlacklisted = await this.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new Error("Password reset token has been revoked");
    }

    try {
      const decoded = jwt.verify(token, authConfig.jwt.passwordResetSecret) as any;

      if (decoded.tokenType !== "password_reset") {
        throw new Error("Invalid password reset token");
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Password reset token has expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid password reset token");
      }
      throw error;
    }
  }

  /**
   * Revoke token by adding to blacklist
   */
  async revokeToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        const expiresAt = new Date(decoded.exp * 1000);
        if (expiresAt > new Date()) {
          await this.blacklistToken(token, expiresAt);
        }
      }
    } catch (error) {
      console.error("Error revoking token:", error);
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Generate token pair (access + refresh)
   */
  generateTokenPair(payload: Omit<JWTPayload, "iat" | "exp" | "tokenType">): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload.userId, payload.sessionId, payload.role);

    return { accessToken, refreshToken };
  }
}

export const jwtService = new JWTService();
