import express from "express";
import { authController } from "../controllers/controller";
import {
  authenticate,
  requireAdmin,
  requireSuperAdmin,
  requireAgentOrAdmin,
  rateLimit,
  securityHeaders,
  requestLogger,
} from "../middleware/middleware";
import {
  validateRegister,
  validateLogin,
  validateMFA,
  validateForgotPassword,
  validatePasswordReset,
  validateSessionTermination,
  handleValidationErrors,
} from "../middleware/validation";

export const authRoutes = express.Router();

// Apply security middleware to all routes
authRoutes.use(securityHeaders);
authRoutes.use(requestLogger);

// Public routes
authRoutes.post(
  "/register",
  rateLimit("registration"),
  validateRegister,
  handleValidationErrors,
  authController.register.bind(authController)
);

authRoutes.post("/login", rateLimit("login"), validateLogin, handleValidationErrors, authController.login.bind(authController));

authRoutes.post("/verify-mfa", validateMFA, handleValidationErrors, authController.verifyMFA.bind(authController));

authRoutes.post(
  "/forgot-password",
  rateLimit("passwordReset"),
  validateForgotPassword,
  handleValidationErrors,
  authController.forgotPassword.bind(authController)
);

authRoutes.post("/reset-password", validatePasswordReset, handleValidationErrors, authController.resetPassword.bind(authController));

authRoutes.post("/verify-email", authController.verifyEmail.bind(authController));

authRoutes.post("/resend-verification", authController.resendEmailVerification.bind(authController));

authRoutes.post("/resend-password-reset", authController.resendPasswordReset.bind(authController));

authRoutes.post("/verify-reset-token", authController.verifyResetToken.bind(authController));

authRoutes.post("/refresh", authController.refreshToken.bind(authController));

authRoutes.get("/health", authController.health.bind(authController));

// Protected routes (require authentication)
authRoutes.use(authenticate);

// Change password (authenticated users only)
authRoutes.post("/change-password", authController.changePassword.bind(authController));

authRoutes.post("/logout", (req, res) => authController.logout(req as any, res));

authRoutes.post("/logout-all", (req, res) => authController.logoutAllDevices(req as any, res));

authRoutes.get("/profile", (req, res) => authController.getProfile(req as any, res));

authRoutes.get("/permissions", (req, res) => authController.getMyPermissions(req as any, res));

authRoutes.get("/sessions", (req, res) => authController.getSessions(req as any, res));

authRoutes.delete("/sessions/:sessionId", validateSessionTermination, handleValidationErrors, (req, res) =>
  authController.terminateSession(req as any, res)
);

authRoutes.get("/session-stats", (req, res) => authController.getSessionStats(req as any, res));

// Admin-only routes
authRoutes.get(
  "/admin/users",
  (req, res, next) => requireAdmin(req as any, res, next),
  async (_req, res) => {
    res.status(501).json({
      success: false,
      message: "Admin user management not implemented yet",
    });
  }
);

// Super admin routes
authRoutes.get(
  "/super-admin/system-stats",
  (req, res, next) => requireSuperAdmin(req as any, res, next),
  async (_req, res) => {
    res.status(501).json({
      success: false,
      message: "System statistics not implemented yet",
    });
  }
);

// Agent and admin routes
authRoutes.get(
  "/agent/dashboard",
  (req, res, next) => requireAgentOrAdmin(req as any, res, next),
  async (_req, res) => {
    res.status(501).json({
      success: false,
      message: "Agent dashboard not implemented yet",
    });
  }
);

// Development/Test endpoints (only in non-production)
if (process.env["NODE_ENV"] !== "production") {
  authRoutes.get("/dev/test-token/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { jwtService } = await import("../services/jwt.service");

      const token = jwtService.generateAccessToken({
        userId: Number(userId),
        email: "test@example.com",
        role: "customer" as any,
      });

      res.json({
        success: true,
        message: "Test token generated",
        data: { token },
        warning: "This endpoint is only available in development mode",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to generate test token",
      });
    }
  });
}

// 404 handler for auth routes
authRoutes.use("*", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "Authentication endpoint not found",
  });
});

export default authRoutes;
