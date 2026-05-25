import bcrypt from "bcryptjs";
import { authConfig } from "./config";
import { UserRole } from "../../shared/entities/EntityEnums";

export class ValidationService {
  /**
   * Validate password strength
   */
  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
    score: number; // 0-100
  } {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < authConfig.security.passwordMinLength) {
      errors.push(`Password must be at least ${authConfig.security.passwordMinLength} characters long`);
    } else {
      score += 20;
    }

    // Character requirements
    if (authConfig.security.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    } else {
      score += 20;
    }

    if (authConfig.security.passwordRequireLowercase && !/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    } else {
      score += 20;
    }

    if (authConfig.security.passwordRequireNumbers && !/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    } else {
      score += 20;
    }

    if (authConfig.security.passwordRequireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    } else {
      score += 20;
    }

    return {
      isValid: errors.length === 0,
      errors,
      score,
    };
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  validatePhone(phone: string): boolean {
    // International format: +1234567890 (10-15 digits after +)
    const phoneRegex = /^\+[1-9]\d{4,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Normalize phone number
   */
  normalizePhone(phone: string): string {
    // Remove all non-digit characters except +
    let normalized = phone.replace(/[^\d+]/g, "");

    // If it doesn't start with +, add it
    if (!normalized.startsWith("+")) {
      normalized = "+" + normalized;
    }

    return normalized;
  }

  /**
   * Check if password is in common passwords list
   */
  async isCommonPassword(password: string): Promise<boolean> {
    // In a real implementation, you'd check against a database of common passwords
    // For now, we'll check against a basic list
    const commonPasswords = [
      "password",
      "123456",
      "password123",
      "admin",
      "qwerty",
      "letmein",
      "welcome",
      "monkey",
      "1234567890",
      "abc123",
      "Password1",
      "password1",
      "12345678",
      "dragon",
      "master",
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Hash password securely
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Validate password change (check against history)
   */
  async validatePasswordChange(
    newPassword: string,
    currentPasswordHash: string,
    passwordHistory: string[]
  ): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Basic validation
    const validation = this.validatePassword(newPassword);
    if (!validation.isValid) {
      errors.push(...validation.errors);
    }

    // Check against common passwords
    if (await this.isCommonPassword(newPassword)) {
      errors.push("This password is too common. Please choose a more secure password.");
    }

    // Check against current password
    if (await this.comparePassword(newPassword, currentPasswordHash)) {
      errors.push("New password must be different from current password.");
    }

    // Check against password history
    for (const oldHash of passwordHistory) {
      if (await this.comparePassword(newPassword, oldHash)) {
        errors.push(`Cannot reuse any of your last ${passwordHistory.length} passwords.`);
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, "");
  }

  /**
   * Validate user role
   */
  validateRole(role: string): boolean {
    const validRoles = Object.values(UserRole);
    return validRoles.includes(role as UserRole);
  }

  /**
   * Validate MFA code format
   */
  validateMFACode(code: string): boolean {
    // TOTP codes are typically 6 digits
    return /^\d{6}$/.test(code);
  }

  /**
   * Validate backup code format
   */
  validateBackupCode(code: string): boolean {
    // Backup codes are typically 8 characters (letters and numbers)
    return /^[A-Z0-9]{8}$/.test(code);
  }

  /**
   * Generate secure random string
   */
  generateSecureRandom(length: number = 32): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  /**
   * Validate session token format
   */
  validateSessionToken(token: string): boolean {
    // Basic JWT format validation
    return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(token);
  }

  /**
   * Check if string contains SQL injection patterns
   */
  containsSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\#|\/\*|\*\/)/,
      /(\b(OR|AND)\b.*\b(=|>|<)\b)/i,
      /(\b(OR|AND)\b.*\b\d+\b)/i,
    ];

    return sqlPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Check if string contains XSS patterns
   */
  containsXSS(input: string): boolean {
    const xssPatterns = [/<script[^>]*>.*?<\/script>/gi, /<iframe[^>]*>.*?<\/iframe>/gi, /javascript:/gi, /on\w+\s*=/gi, /<[^>]*>/g];

    return xssPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Sanitize and validate user input for security
   */
  sanitizeAndValidate(input: string): {
    sanitized: string;
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let sanitized = this.sanitizeInput(input);

    if (this.containsSQLInjection(input)) {
      warnings.push("Input contains potentially dangerous SQL patterns");
    }

    if (this.containsXSS(input)) {
      warnings.push("Input contains potentially dangerous XSS patterns");
    }

    // Additional sanitization
    sanitized = sanitized.replace(/[<>]/g, "");
    sanitized = sanitized.replace(/javascript:/gi, "");
    sanitized = sanitized.replace(/on\w+\s*=/gi, "");

    return {
      sanitized,
      isValid: warnings.length === 0,
      warnings,
    };
  }
}

export const validationService = new ValidationService();
