import dotenv from "dotenv";

dotenv.config();

export const authConfig = {
  jwt: {
    accessSecret: process.env["JWT_ACCESS_SECRET"] || "your-super-secure-access-secret-key-change-in-production",
    refreshSecret: process.env["JWT_REFRESH_SECRET"] || "your-super-secure-refresh-secret-key-change-in-production",
    mfaSecret: process.env["JWT_MFA_SECRET"] || "your-super-secure-mfa-secret-key-change-in-production",
    passwordResetSecret: process.env["JWT_PASSWORD_RESET_SECRET"] || "your-super-secure-password-reset-secret-key-change-in-production",

    accessExpiresIn: "1d",
    refreshExpiresIn: "7d",
    mfaExpiresIn: "5m",
    passwordResetExpiresIn: "15m",

    issuer: process.env["JWT_ISSUER"] || "cw-backend",
  },

  session: {
    expiresIn: 24 * 60 * 60, // 24 hours in seconds
    cleanupInterval: 60 * 60 * 1000, // 1 hour in milliseconds
    maxSessionsPerUser: 20,
  },

  security: {
    maxLoginAttempts: 20,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    passwordHistoryCount: 5,
  },

  rateLimit: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 10, // 10 attempts
      blockDurationMs: 1 * 60 * 1000, // 15 minutes
    },
    passwordReset: {
      windowMs: 1 * 60 * 1000, // 1 hour
      maxAttempts: 5,
      blockDurationMs: 1 * 60 * 1000, // 1 hour
    },
    registration: {
      windowMs: 1 * 60 * 1000, // 1 hour
      maxAttempts: 10,
      blockDurationMs: 1 * 60 * 1000, // 1 hour
    },
    changeEmail: {
      windowMs: 1 * 60 * 1000, // 1 hour
      maxAttempts: 10,
      blockDurationMs: 1 * 60 * 1000, // 1 hour
    },
    staffInviteResend: {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      maxAttempts: 3,
      blockDurationMs: 24 * 60 * 60 * 1000,
    },
  },

  mfa: {
    issuer: process.env["MFA_ISSUER"] || "CW Real Estate Platform",
    serviceName: process.env["MFA_SERVICE_NAME"] || "CW Platform",
    backupCodeCount: 10,
  },
};

// Validate critical environment variables
export const validateAuthConfig = (): void => {
  const requiredVars = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "JWT_MFA_SECRET", "JWT_PASSWORD_RESET_SECRET"];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn(`⚠️  Missing critical environment variables: ${missingVars.join(", ")}`);
    console.warn("🔐 Using fallback secrets - NOT SECURE FOR PRODUCTION!");
  }

  // Warn about weak secrets in development
  if (process.env["NODE_ENV"] !== "production") {
    const weakSecrets = Object.entries(authConfig.jwt).filter(
      ([key, value]) => key.includes("Secret") && value.includes("change-in-production")
    );

    if (weakSecrets.length > 0) {
      console.warn("🔐 Using default secrets in development mode");
    }
  }
};
