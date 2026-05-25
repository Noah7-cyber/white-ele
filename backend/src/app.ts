import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler, notFoundHandler, subdomainGuard } from "./modules/shared";
import { healthRouter } from "./routes/health";
import { apiRouter } from "./routes";
import { optionalAuth } from "./modules/auth/middleware/middleware";
import { requireSchoolSubscriptionAccess } from "./modules/subscription/middleware/require-school-subscription-access.middleware";

export function createApp(): express.Application {
  const app = express();

  app.use(
    cors({
      origin: "*",
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "X-School-Id", "X-Role"],
    })
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(morgan("combined"));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  app.use("/health", healthRouter);
  // Optional auth first (doesn't block public routes), then tenant context.
  app.use("/api/v1", optionalAuth, subdomainGuard, requireSchoolSubscriptionAccess, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
