import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { authConfig } from "../../auth/services/config";
import crypto from "crypto";

export interface MFASetupResult {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface MFAVerificationResult {
  isValid: boolean;
  error?: string;
}

class MFAService {
  private readonly issuer = authConfig.mfa.issuer;
  private readonly serviceName = authConfig.mfa.serviceName;

  /**
   * Setup MFA for a user - generate secret and QR code
   */
  async setupMFA(userEmail: string, _userId: number): Promise<MFASetupResult> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${this.serviceName} (${userEmail})`,
        issuer: this.issuer,
        length: 32,
      });

      if (!secret.otpauth_url) {
        throw new Error("Failed to generate OTP auth URL");
      }

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      return {
        secret: secret.base32,
        qrCode,
        backupCodes,
        manualEntryKey: secret.base32,
      };
    } catch (error) {
      throw new Error(`Failed to setup MFA: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Verify MFA setup by validating the first token
   */
  verifyMFASetup(secret: string, token: string): boolean {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: "base32",
        token,
        window: 2, // Allow 2 time steps (60 seconds) of tolerance
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate backup codes for MFA recovery
   */
  generateBackupCodes(count: number = 10): string[] {
    return this.generateSecureBackupCodes(count);
  }

  /**
   * Hash backup codes for secure storage
   */
  async hashBackupCodes(backupCodes: string[]): Promise<string[]> {
    const bcrypt = await import("bcryptjs");
    const hashedCodes: string[] = [];

    for (const code of backupCodes) {
      const hashedCode = await bcrypt.hash(code, 10);
      hashedCodes.push(hashedCode);
    }

    return hashedCodes;
  }

  /**
   * Verify MFA token (TOTP)
   */
  verifyMFAToken(secret: string, token: string): MFAVerificationResult {
    try {
      // Remove any spaces or dashes from token
      const cleanToken = token.replace(/[\s-]/g, "");

      // Validate token format (should be 6 digits)
      if (!/^\d{6}$/.test(cleanToken)) {
        return {
          isValid: false,
          error: "Invalid token format. Token must be 6 digits.",
        };
      }

      const isValid = speakeasy.totp.verify({
        secret,
        encoding: "base32",
        token: cleanToken,
        window: 2, // Allow 2 time steps (60 seconds) of tolerance
      });

      if (isValid) {
        return { isValid: true };
      } else {
        return { isValid: false, error: "Invalid or expired token" };
      }
    } catch (error) {
      return {
        isValid: false,
        error: "Failed to verify token",
      };
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(
    inputCode: string,
    hashedBackupCodes: string[]
  ): Promise<{ isValid: boolean; usedCodeIndex?: number; error?: string }> {
    try {
      const bcrypt = await import("bcryptjs");

      // Clean input code (remove spaces, convert to uppercase)
      const cleanInputCode = inputCode.replace(/\s/g, "").toUpperCase();

      // Validate backup code format (XXXX-XXXX)
      if (!/^[A-F0-9]{4}-?[A-F0-9]{4}$/.test(cleanInputCode)) {
        return {
          isValid: false,
          error: "Invalid backup code format",
        };
      }

      // Ensure code has dash for consistency
      const formattedCode = cleanInputCode.includes("-") ? cleanInputCode : `${cleanInputCode.slice(0, 4)}-${cleanInputCode.slice(4)}`;

      // Check against all hashed backup codes
      for (let i = 0; i < hashedBackupCodes.length; i++) {
        const hashedCode = hashedBackupCodes[i];
        if (hashedCode) {
          const isMatch = await bcrypt.compare(formattedCode, hashedCode);
          if (isMatch) {
            return {
              isValid: true,
              usedCodeIndex: i,
            };
          }
        }
      }

      return {
        isValid: false,
        error: "Invalid backup code",
      };
    } catch (error) {
      return {
        isValid: false,
        error: "Failed to verify backup code",
      };
    }
  }

  /**
   * Remove used backup code from the list
   */
  removeUsedBackupCode(hashedBackupCodes: string[], usedIndex: number): string[] {
    return hashedBackupCodes.filter((_, index) => index !== usedIndex);
  }

  /**
   * Generate new backup codes (when user runs out)
   */
  async regenerateBackupCodes(): Promise<{ codes: string[]; hashedCodes: string[] }> {
    const codes = this.generateBackupCodes();
    const hashedCodes = await this.hashBackupCodes(codes);

    return { codes, hashedCodes };
  }

  /**
   * Validate MFA secret format
   */
  isValidSecret(secret: string): boolean {
    try {
      // Check if it's a valid base32 string
      return /^[A-Z2-7]+=*$/i.test(secret) && secret.length >= 16;
    } catch {
      return false;
    }
  }

  /**
   * Get current TOTP value (for testing purposes)
   */
  getCurrentTOTP(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: "base32",
    });
  }

  /**
   * Get time remaining for current TOTP (in seconds)
   */
  getTOTPTimeRemaining(): number {
    const now = Math.floor(Date.now() / 1000);
    const timeStep = 30; // TOTP time step is 30 seconds
    return timeStep - (now % timeStep);
  }

  /**
   * Disable MFA for a user (emergency function)
   */
  disableMFA(): { success: boolean; message: string } {
    // This is a placeholder - in real implementation, this would:
    // 1. Require admin privileges or strong authentication
    // 2. Log the action for audit purposes
    // 3. Notify the user via email
    // 4. Update user's MFA status in database

    return {
      success: true,
      message: "MFA has been disabled. User will need to set up MFA again.",
    };
  }

  /**
   * Check if backup codes are running low
   */
  shouldRegenerateBackupCodes(remainingCodes: number): boolean {
    return remainingCodes <= 2; // Suggest regeneration when 2 or fewer codes remain
  }

  /**
   * Generate QR code URL for manual entry
   */
  generateManualEntryURL(secret: string, userEmail: string): string {
    return `otpauth://totp/${encodeURIComponent(this.serviceName)}:${encodeURIComponent(
      userEmail
    )}?secret=${secret}&issuer=${encodeURIComponent(this.issuer)}`;
  }

  /**
   * Validate TOTP window settings
   */
  validateTOTPWindow(window: number): boolean {
    // Window should be between 0 and 10 (0-5 minutes tolerance)
    return window >= 0 && window <= 10;
  }

  /**
   * Count remaining valid backup codes
   */
  countRemainingBackupCodes(hashedBackupCodes: string[]): number {
    return hashedBackupCodes.filter((code) => code !== null && code !== "").length;
  }

  /**
   * Validate backup code format
   */
  isValidBackupCodeFormat(code: string): boolean {
    // Clean input code (remove spaces, convert to uppercase)
    const cleanCode = code.replace(/\s/g, "").toUpperCase();

    // Validate backup code format (XXXX-XXXX)
    return /^[A-F0-9]{4}-?[A-F0-9]{4}$/.test(cleanCode);
  }

  /**
   * Format backup code for display (ensure it has proper formatting)
   */
  formatBackupCode(code: string): string {
    const cleanCode = code.replace(/\s/g, "").toUpperCase();
    if (cleanCode.length === 8) {
      return `${cleanCode.slice(0, 4)}-${cleanCode.slice(4)}`;
    }
    return cleanCode;
  }

  /**
   * Generate backup codes with better entropy
   */
  generateSecureBackupCodes(count: number = 10): string[] {
    const backupCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character hex code with crypto-secure randomness
      const code = crypto.randomBytes(4).toString("hex").toUpperCase();
      // Format as XXXX-XXXX for better readability
      const formattedCode = `${code.slice(0, 4)}-${code.slice(4)}`;
      backupCodes.push(formattedCode);
    }

    return backupCodes;
  }
}

export const mfaService = new MFAService();
