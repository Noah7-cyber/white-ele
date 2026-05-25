import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { AppDataSource } from "./modules/core";
import { errorHandler, notFoundHandler, subdomainGuard } from "./modules/shared";
import { apiRouter, healthRouter } from "./routes";
import { optionalAuth } from "./modules/auth/middleware/middleware";
import { requireSchoolSubscriptionAccess } from "./modules/subscription/middleware/require-school-subscription-access.middleware";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: "*",
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.use("/health", healthRouter);
// Optional auth first (doesn't block public routes), then tenant context.
app.use("/api/v1", optionalAuth, subdomainGuard, requireSchoolSubscriptionAccess, apiRouter);

// Invitation routes (if needed)
// app.use("/api/v1/invitations", InvitationRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

export { app, initializeDatabase };
