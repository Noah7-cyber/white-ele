/**
 * Auth Module - Shared Message Constants
 *
 * Centralized location for all success and error messages used in authentication.
 * This ensures consistency between implementation and tests.
 */

export const AUTH_MESSAGES = {
  // Registration
  REGISTRATION_SUCCESS: "Registration successful. Please check your email to verify your account.",
  EMAIL_ALREADY_EXISTS: "User with this email already exists",
  PHONE_ALREADY_EXISTS: "User with this phone number already exists",
  IDENTIFIER_ALREADY_EXISTS: "User already exists with this email or phone number",
  INVITATION_NOT_ACCEPTED: "Invitation must be accepted before registration",
  INVITATION_TOKEN_REQUIRED: "Invitation token is required",
  INVITATION_EMAIL_MISMATCH: "Invitation email does not match registration email",

  // Email Verification
  EMAIL_VERIFICATION_SUCCESS: "Email verified successfully",
  EMAIL_ALREADY_VERIFIED: "Email already verified. You can now log in.",
  INVALID_VERIFICATION_TOKEN: "Invalid verification token",
  INVALID_TOKEN_FORMAT: "Invalid token format. Token must be 6 digits.",
  NO_VERIFICATION_TOKEN: "No verification token found. Please request a new one.",
  EMAIL_REQUIRED_FOR_VERIFICATION: "Email address is required",
  TOKEN_REQUIRED_FOR_VERIFICATION: "Verification token is required",
  VERIFICATION_EMAIL_RESENT: "Verification email has been resent. Please check your inbox.",
  VERIFICATION_RESEND_FAILED: "Failed to resend verification email",

  // Login
  LOGIN_SUCCESS: "Login successful, ",
  INVALID_CREDENTIALS: "Invalid credentials",
  ROLE_ACCOUNT_NOT_FOUND: "No account found for the selected role.",
  EMAIL_NOT_VERIFIED: "Please verify your email address before logging in",
  PHONE_NOT_VERIFIED: "Please verify your phone number before logging in",
  ACCOUNT_LOCKED: "Too many login attempts. Account is temporarily locked.",
  ACCOUNT_INACTIVE: "Account is inactive. Please contact support.",

  // Logout
  LOGOUT_SUCCESS: "Logout successful",
  LOGOUT_FAILED: "Logout failed",

  // Password Reset
  PASSWORD_RESET_FAILED: "Password reset failed",
  PASSWORD_RESET_REQUEST_FAILED: "Password reset request failed",
  INVALID_RESET_TOKEN_FORMAT: "Invalid reset token",
  PASSWORD_RESET_EMAIL_SENT: "Password reset link has been sent to your email",
  PASSWORD_RESET_EMAIL_RESENT: "Password reset code has been resent. Please check your inbox.",
  PASSWORD_RESET_RESEND_FAILED: "Failed to resend password reset code",
  PASSWORD_RESET_SUCCESS: "Password has been reset successfully",
  INVALID_RESET_TOKEN: "Invalid or expired reset token",
  PASSWORD_RESET_REQUIRED: "Email is required for password reset",
  RESET_TOKEN_VALID: "Reset token is valid",
  RESET_TOKEN_VERIFIED: "Reset token verified successfully",

  // Password Change
  PASSWORD_CHANGE_SUCCESS: "Password changed successfully",
  PASSWORD_CHANGE_FAILED: "Password change failed",
  CURRENT_PASSWORD_REQUIRED: "Current password is required",
  CURRENT_PASSWORD_INCORRECT: "Current password is incorrect",
  PASSWORD_SAME_AS_CURRENT: "New password must be different from current password",
  PASSWORD_REUSE_ERROR: "Cannot reuse any of your last 5 passwords",
  PASSWORD_TOO_COMMON: "This password is commonly used and not secure. Please choose a different password.",

  // Validation
  VALIDATION_FAILED: "Validation failed",
  INVALID_EMAIL_FORMAT: "Invalid email format",
  INVALID_PHONE_FORMAT: "Invalid phone number format",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters long",
  PASSWORD_REQUIRES_UPPERCASE: "Password must contain at least one uppercase letter",
  PASSWORD_REQUIRES_LOWERCASE: "Password must contain at least one lowercase letter",
  PASSWORD_REQUIRES_NUMBER: "Password must contain at least one number",
  PASSWORD_REQUIRES_SPECIAL: "Password must contain at least one special character",
  NAME_REQUIRED: "FirstName and LastName is required",
  NAME_TOO_SHORT: "FirstName or LastName must be at least 2 characters long",
  INVALID_USER_ROLE: "Invalid user role or user role not provided",
  EMAIL_REQUIRED: "Email is required",
  PHONE_REQUIRED: "Phone number is required",
  PASSWORD_REQUIRED: "Password is required",
  IDENTIFIER_REQUIRED: "Either email or phone number is required",
  MFA_TOKEN_REQUIRED: "MFA token is required",
  MFA_CODE_REQUIRED: "MFA code is required",
  INVALID_MFA_TOKEN_FORMAT: "Invalid MFA token format",
  INVALID_BACKUP_CODE_FORMAT: "Invalid backup code format",
  INVALID_MFA_CODE_FORMAT: "Invalid MFA code format",
  INVALID_PASSWORD: "Invalid password",
  RESET_TOKEN_REQUIRED: "Reset token is required",
  EMAIL_REQUIRED_FOR_RESET: "Email is required for 6-digit reset tokens",
  NEW_PASSWORD_REQUIRED: "New password is required",

  // Token/Auth
  TOKEN_REQUIRED: "Access token required",
  TOKEN_INVALID: "Invalid or expired token",
  TOKEN_EXPIRED: "Token has expired",
  TOKEN_REVOKED: "Token has been revoked",
  REFRESH_TOKEN_REQUIRED: "Refresh token is required",
  REFRESH_TOKEN_INVALID: "Invalid or expired refresh token",

  // Session
  SESSION_EXPIRED: "Session expired or invalid",
  SESSION_INVALID: "Session expired. Please log in again.",
  SESSION_NOT_FOUND: "Session not found",
  SESSION_ID_REQUIRED: "Session ID is required",
  INVALID_SESSION_ID_FORMAT: "Invalid session ID format",
  SESSION_TERMINATED: "Session terminated successfully",
  SESSION_TERMINATION_FAILED: "Failed to terminate session",
  AUTHENTICATION_REQUIRED: "Authentication required",

  // MFA
  MFA_REQUIRED: "MFA verification required",
  MFA_INVALID: "Invalid MFA code",

  // General
  USER_NOT_FOUND: "User not found",
  USER_NOT_FOUND_OR_INACTIVE: "User not found or inactive",
  INTERNAL_ERROR: "Internal server error",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Insufficient permissions",
  REGISTRATION_FAILED: "Registration failed. Please try again.",
  LOGIN_FAILED: "Login failed. Please try again.",
  MFA_NOT_ENABLED: "MFA not enabled for this user",
  MFA_VERIFICATION_SUCCESS: "MFA verification successful",
  MFA_VERIFICATION_FAILED: "MFA verification failed",
  ACCOUNT_DEACTIVATED: "Account is deactivated",
  EMAIL_VERIFICATION_FAILED: "Email verification failed",
  NO_VERIFICATION_TOKEN_EXPIRED: "No verification token found or token has expired",
  HEALTH_CHECK_FAILED: "Health check failed",
  INVALID_REFRESH_TOKEN: "Invalid refresh token",
  PASSWORD_AND_NEW_PASSWORD_REQUIRED: "Current password and new password are required",

  // Rate Limiting
  TOO_MANY_REGISTRATION_ATTEMPTS: "Too many registration attempts. Please try again later.",
  TOO_MANY_LOGIN_ATTEMPTS: "Too many login attempts. Please try again later.",
  TOO_MANY_EMAIL_RESET_REQUESTS: "Too many password reset requests. Please try again later.",
  TOO_MANY_PASSWORD_RESET_ATTEMPTS: "Too many password reset attempts. Please try again later.",
} as const;

/**
 * Helper function to get password history error message with dynamic count
 */
export const getPasswordHistoryError = (count: number): string => {
  return `Cannot reuse any of your last ${count} passwords`;
};

/**
 * Helper function to get account locked message with duration
 */
export const getAccountLockedMessage = (minutes: number): string => {
  return `Too many login attempts. Account locked for ${minutes} minutes.`;
};

/**
 * Get dynamic login success message based on user role
 */
export const getLoginSuccessMessage = (role: string): string => {
  const roleFormatted = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase().replace("_", " ");
  return `${roleFormatted} account login successful`;
};

/**
 * Type for message keys (useful for type-safe message access)
 */
export type AuthMessageKey = keyof typeof AUTH_MESSAGES;
