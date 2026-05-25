import { Request, Response, NextFunction } from "express";
import { validationService } from "../services/validation.service";
import { AUTH_MESSAGES } from "../constants/messages";

/**
 * Validation error handler
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = req.validationErrors;

  if (errors && errors.length > 0) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.map((error) => error.msg),
    });
    return;
  }

  next();
};

/**
 * Register validation middleware
 */
export const validateRegister = (req: Request, _res: Response, next: NextFunction): void => {
  const { email, phone, password, firstName, lastName, middleName, role, address, city, state, countryCode, postalCode, photo } = req.body;
  const errors: Array<{ msg: string }> = [];

  // Email is required
  if (!email) {
    errors.push({ msg: AUTH_MESSAGES.EMAIL_REQUIRED });
  } else if (!validationService.validateEmail(email)) {
    errors.push({ msg: AUTH_MESSAGES.INVALID_EMAIL_FORMAT });
  }

  // Validate phone if provided (E.164 format after normalization)
  if (phone && !validationService.validatePhone(validationService.normalizePhone(phone))) {
    errors.push({ msg: AUTH_MESSAGES.INVALID_PHONE_FORMAT });
  }

  // Validate password
  const passwordValidation = validationService.validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors.map((error) => ({ msg: error })));
  }

  // Validate name
  if 
  (
    (!firstName || firstName.trim().length < 2) || 
    (!lastName || lastName.trim().length < 2) )
  {
    errors.push({ msg: AUTH_MESSAGES.NAME_TOO_SHORT });
  }

  // Validate role if provided
  if (!role && !validationService.validateRole(role)) {
    errors.push({ msg: AUTH_MESSAGES.INVALID_USER_ROLE });
  }

  // Validate optional profile fields
  if (countryCode && (typeof countryCode !== "string" || !/^[A-Z]{2}$/i.test(countryCode))) {
    errors.push({ msg: "Country code must be a valid 2-letter country code" });
  }

  if (postalCode && postalCode.length > 20) {
    errors.push({ msg: "Postal code is too long" });
  }

  // Validate photo URL
  if (photo) {
    if (photo.length > 500) {
      errors.push({ msg: "Photo URL must not exceed 500 characters" });
    } else if (!/^https?:\/\/.+\..+/.test(photo)) {
      errors.push({ msg: "Photo must be a valid URL" });
    }
  }

  // Check for XSS/SQL injection
  const inputs = [email, phone, firstName, lastName, middleName, role, address, city, state, postalCode].filter(Boolean);
  for (const input of inputs) {
    const sanitized = validationService.sanitizeAndValidate(input);
    if (!sanitized.isValid) {
      errors.push({ msg: `Invalid characters detected in ${input}` });
    }
  }

  if (errors.length > 0) {
    req.validationErrors = errors;
  }

  next();
};

/**
 * Login validation middleware
 */
export const validateLogin = (req: Request, _res: Response, next: NextFunction): void => {
  const { email, phone, password, role } = req.body;
  const errors: Array<{ msg: string }> = [];

  // Check if at least one identifier is provided
  if (!email && !phone) {
    errors.push({ msg: AUTH_MESSAGES.IDENTIFIER_REQUIRED });
  }

  if (!password) {
    errors.push({ msg: AUTH_MESSAGES.PASSWORD_REQUIRED });
  }

  // Validate email if provided
  if (email && !validationService.validateEmail(email)) {
    errors.push({ msg: AUTH_MESSAGES.INVALID_EMAIL_FORMAT });
  }

  // Validate phone if provided (E.164 format after normalization)
  if (phone && !validationService.validatePhone(validationService.normalizePhone(phone))) {
    errors.push({ msg: AUTH_MESSAGES.INVALID_PHONE_FORMAT });
  }

  // Validate role if provided
  if (role) {
    if (!validationService.validateRole(role)) {
      errors.push({ msg: AUTH_MESSAGES.INVALID_CREDENTIALS });
    }
  }

  // Check for injection attempts
  const inputs = [email, phone].filter(Boolean);
  for (const input of inputs) {
    const sanitized = validationService.sanitizeAndValidate(input);
    if (!sanitized.isValid) {
      errors.push({ msg: `Invalid characters detected in ${input}` });
    }
  }

  if (errors.length > 0) {
    req.validationErrors = errors;
  }

  next();
};

/**
 * MFA verification validation middleware
 */
export const validateMFA = (req: Request, _res: Response, next: NextFunction): void => {
  const { mfaToken, code, isBackupCode } = req.body;
  const errors: Array<{ msg: string }> = [];

  if (!mfaToken) {
    errors.push({ msg: AUTH_MESSAGES.MFA_TOKEN_REQUIRED });
  }

  if (!code) {
    errors.push({ msg: AUTH_MESSAGES.MFA_CODE_REQUIRED });
  }

  // Validate token format
  if (mfaToken && !validationService.validateSessionToken(mfaToken)) {
    errors.push({ msg: AUTH_MESSAGES.INVALID_MFA_TOKEN_FORMAT });
  }

  // Validate code format
  if (code) {
    if (isBackupCode) {
      if (!validationService.validateBackupCode(code)) {
        errors.push({ msg: AUTH_MESSAGES.INVALID_BACKUP_CODE_FORMAT });
      }
    } else {
      if (!validationService.validateMFACode(code)) {
        errors.push({ msg: AUTH_MESSAGES.INVALID_MFA_CODE_FORMAT });
      }
    }
  }

  if (errors.length > 0) {
    req.validationErrors = errors;
  }

  next();
};

/**
 * Forgot password validation middleware
 */
export const validateForgotPassword = (req: Request, _res: Response, next: NextFunction): void => {
  const { email } = req.body;
  const errors: Array<{ msg: string }> = [];

  if (!email) {
    errors.push({ msg: AUTH_MESSAGES.EMAIL_REQUIRED });
  } else if (!validationService.validateEmail(email)) {
    errors.push({ msg: AUTH_MESSAGES.INVALID_EMAIL_FORMAT });
  }

  if (errors.length > 0) {
    req.validationErrors = errors;
  }

  next();
};

/**
 * Password reset validation middleware
 */
export const validatePasswordReset = (req: Request, _res: Response, next: NextFunction): void => {
  const { token, newPassword, email } = req.body;
  const errors: Array<{ msg: string }> = [];

  if (!token) {
    errors.push({ msg: AUTH_MESSAGES.RESET_TOKEN_REQUIRED });
  }

  // If token is 6-digit, email is required
  if (token && /^\d{6}$/.test(token) && !email) {
    errors.push({ msg: AUTH_MESSAGES.EMAIL_REQUIRED_FOR_RESET });
  }

  if (!newPassword) {
    errors.push({ msg: AUTH_MESSAGES.NEW_PASSWORD_REQUIRED });
  } else {
    const passwordValidation = validationService.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors.map((error) => ({ msg: error })));
    }
  }

  if (errors.length > 0) {
    req.validationErrors = errors;
  }

  next();
};

/**
 * Change password validation middleware
 */
export const validateChangePassword = (req: Request, _res: Response, next: NextFunction): void => {
  const { currentPassword, newPassword } = req.body;
  const errors: Array<{ msg: string }> = [];

  if (!currentPassword) {
    errors.push({ msg: AUTH_MESSAGES.CURRENT_PASSWORD_REQUIRED });
  }

  if (!newPassword) {
    errors.push({ msg: AUTH_MESSAGES.NEW_PASSWORD_REQUIRED });
  } else {
    const passwordValidation = validationService.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors.map((error) => ({ msg: error })));
    }
  }

  if (currentPassword === newPassword) {
    errors.push({ msg: AUTH_MESSAGES.PASSWORD_SAME_AS_CURRENT });
  }

  if (errors.length > 0) {
    req.validationErrors = errors;
  }

  next();
};

/**
 * Session termination validation middleware
 */
export const validateSessionTermination = (req: Request, _res: Response, next: NextFunction): void => {
  const { sessionId } = req.params;
  const errors: Array<{ msg: string }> = [];

  if (!sessionId) {
    errors.push({ msg: AUTH_MESSAGES.SESSION_ID_REQUIRED });
  } else if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    errors.push({ msg: AUTH_MESSAGES.INVALID_SESSION_ID_FORMAT });
  }

  if (errors.length > 0) {
    req.validationErrors = errors;
  }

  next();
};

// Extend Request interface to include validation errors
declare global {
  namespace Express {
    interface Request {
      validationErrors?: Array<{ msg: string }>;
    }
  }
}
