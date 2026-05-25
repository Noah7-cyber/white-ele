import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { UserRole } from "../../shared/entities/EntityEnums";
import { countryCodeExists } from "../validators/country-code.validator";

/**
 * Validation middleware for email registration
 */
export const validateEmailRegistration = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),

  body("firstName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("firstName must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("firstName can only contain letters, spaces, hyphens, and apostrophes"),

  body("lastName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("lastName must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("lastName can only contain letters, spaces, hyphens, and apostrophes"),

  body("role").optional().isIn(Object.values(UserRole)).withMessage("Invalid role specified"),
];

/**
 * Validation middleware for email verification
 */
export const validateEmailVerification = [
  body("token")
    .isLength({ min: 1 })
    .withMessage("Verification token is required")
    .matches(/^[a-fA-F0-9\-]+$/)
    .withMessage("Invalid token format"),
];

/**
 * Validation middleware for login
 */
export const validateLogin = [
  body("identifier").custom((value) => {
    // Check if it's a valid email or phone number
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isPhone = /^\+[1-9]\d{4,14}$/.test(value.replace(/[\s\-\(\)]/g, ""));

    if (!isEmail && !isPhone) {
      throw new Error("Please provide a valid email address or phone number");
    }

    return true;
  }),

  body("password").isLength({ min: 1 }).withMessage("Password is required"),
];

/**
 * Validation middleware for resend verification email
 */
export const validateResendVerification = [body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address")];

/**
 * Validation middleware for phone registration
 */
export const validatePhoneRegistration = [
  body("phone")
    .matches(/^[0-9]\d{4,14}$/)
    .withMessage("Please provide a valid phone number"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),

  body("firstName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Name can only contain letters, spaces, hyphens, and apostrophes"),


  body("lastName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Name can only contain letters, spaces, hyphens, and apostrophes"),

  body("role").optional().isIn(Object.values(UserRole)).withMessage("Invalid role specified"),
];

/**
 * Validation middleware for phone verification
 */
export const validatePhoneVerification = [
  body("phone")
    .matches(/^[0-9]\d{4,14}$/)
    .withMessage("Please provide a valid phone number"),

  body("code")
    .isLength({ min: 6, max: 6 })
    .withMessage("Verification code must be 6 digits")
    .isNumeric()
    .withMessage("Verification code must contain only numbers"),
];

/**
 * Validation middleware for resend phone verification
 */
export const validateResendPhoneVerification = [
  body("phone")
    .matches(/^[0-9]\d{4,14}$/)
    .withMessage("Please provide a valid phone number in international format"),
];

/**
 * Validation middleware for MFA verification
 */
export const validateMFAVerification = [
  body("identifier").custom((value) => {
    // Check if it's a valid email or phone number
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isPhone = /^\+[1-9]\d{4,14}$/.test(value.replace(/[\s\-\(\)]/g, ""));

    if (!isEmail && !isPhone) {
      throw new Error("Please provide a valid email address or phone number");
    }

    return true;
  }),

  body("mfaToken").isLength({ min: 1 }).withMessage("MFA token is required").isJWT().withMessage("Invalid MFA token format"),

  body("mfaCode")
    .isLength({ min: 1 })
    .withMessage("MFA code is required")
    .custom((value) => {
      // Check if it's a 6-digit TOTP code or backup code format
      const isTOTP = /^\d{6}$/.test(value);
      const isBackupCode = /^[A-F0-9]{4}-?[A-F0-9]{4}$/i.test(value.replace(/\s/g, ""));

      if (!isTOTP && !isBackupCode) {
        throw new Error("MFA code must be a 6-digit code or backup code (XXXX-XXXX format)");
      }

      return true;
    }),

  body("isBackupCode").optional().isBoolean().withMessage("isBackupCode must be a boolean"),
];

/**
 * Validation middleware for logout
 */
export const validateLogout = [body("sessionId").optional().isUUID().withMessage("Session ID must be a valid UUID")];

/**
 * Validation middleware for session termination
 */
export const validateSessionTermination = [
  // sessionId comes from URL params, validated in route
];

/**
 * Validation middleware for sending invitations
 */
export const validateSendInvitation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),

  body("role").isIn(Object.values(UserRole)).withMessage("Invalid role specified"),
];

/**
 * Validation middleware for invitation token validation
 */
export const validateInvitationToken = [
  body("token")
    .isLength({ min: 1 })
    .withMessage("Invitation token is required")
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage("Invalid token format"),
];

/**
 * Validation middleware for onboarding completion
 */
export const validateOnboardingCompletion = [
  body("token").isLength({ min: 1 }).withMessage("Invitation token is required"),

  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Name can only contain letters, spaces, hyphens, and apostrophes"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),

  body("profileData").optional().isObject().withMessage("Profile data must be an object"),
];

/**
 * Validation middleware for MFA token verification
 */
export const validateMFAToken = [
  body("token")
    .isLength({ min: 6, max: 6 })
    .withMessage("MFA token must be 6 digits")
    .isNumeric()
    .withMessage("MFA token must contain only numbers"),
];

/**
 * Validation middleware for onboarding step updates
 */
export const validateOnboardingStep = [
  body("step")
    .isLength({ min: 1 })
    .withMessage("Step is required")
    .isIn(["profile_completed", "mfa_setup", "agreement_accepted", "guidelines_reviewed", "terms_accepted", "property_setup"])
    .withMessage("Invalid onboarding step"),

  body("completed").optional().isBoolean().withMessage("Completed must be a boolean value"),
];

/**
 * Validation middleware for password change
 */
export const validatePasswordChange = [
  body("currentPassword").isLength({ min: 1 }).withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage("New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
];

/**
 * Validation middleware for forgot password
 */
export const validateForgotPassword = [body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address")];

/**
 * Validation middleware for password reset
 */
export const validatePasswordReset = [
  body("token").isLength({ min: 1 }).withMessage("Reset token is required"),

  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage("New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
];

/**
 * Validation middleware for profile update
 */
export const validateProfileUpdate = [
  body("firtName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("firstName must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Name can only contain letters, spaces, hyphens, and apostrophes"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("firstName must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Name can only contain letters, spaces, hyphens, and apostrophes"),
];

/**
 * Validation middleware for email change
 */
export const validateEmailChange = [
  body("newEmail").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),

  body("password").isLength({ min: 1 }).withMessage("Current password is required"),
];

/**
 * Validation middleware for email change confirmation
 */
export const validateEmailChangeConfirmation = [
  body("newEmail").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),
  body("token")
    .isLength({ min: 6, max: 6 })
    .matches(/^\d{6}$/)
    .withMessage("Verification token must be 6 digits"),
];

/**
 * Validation middleware for phone change
 */
export const validatePhoneChange = [
  body("newPhone")
    .matches(/^[0-9]\d{4,14}$/)
    .withMessage("Please provide a valid phone number"),

  body("password").isLength({ min: 1 }).withMessage("Current password is required"),
];

/**
 * Validation middleware for comprehensive profile update
 */
export const validateComprehensiveProfileUpdate = [
  body("firstName").optional().trim().isLength({ min: 1, max: 100 }).withMessage("fistName must be between 1 and 100 characters"),
  body("lastName").optional().trim().isLength({ min: 1, max: 100 }).withMessage("lastName must be between 1 and 100 characters"),

  body("phone")
    .optional()
    .matches(/^[0-9]\d{4,14}$/)
    .withMessage("Please provide a valid phone number"),

  body("address").optional().trim().isLength({ max: 255 }).withMessage("Address must not exceed 255 characters"),

  body("city").optional().trim().isLength({ max: 100 }).withMessage("City must not exceed 100 characters"),

  body("state").optional().trim().isLength({ max: 100 }).withMessage("State must not exceed 100 characters"),

  body("countryCode")
    .optional()
    .isString()
    .isLength({ min: 2, max: 2 })
    .withMessage("Country code must be exactly 2 characters")
    .matches(/^[A-Z]{2}$/i)
    .withMessage("Country code must be 2 uppercase letters (ISO 3166-1 alpha-2 format)")
    .custom(countryCodeExists),

  body("postalCode").optional().trim().isLength({ max: 20 }).withMessage("Postal code must not exceed 20 characters"),

  body("photo").optional().trim().isLength({ max: 500 }).withMessage("Photo URL must not exceed 500 characters"),

  // Agent-specific fields
];

/**
 * Validation middleware for account deactivation
 */
export const validateAccountDeactivation = [
  body("password").isLength({ min: 1 }).withMessage("Password is required to deactivate account"),
];

/**
 * Validation middleware for account reactivation
 */
export const validateAccountReactivation = [
  body("email").notEmpty().withMessage("Email is required").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),

  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    res.status(400).json({
      success: false,
      message: errorArray[0]?.msg || "Validation failed",
      errors: errorArray,
    });
    return;
  }

  next();
};
