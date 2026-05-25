import rateLimit from "express-rate-limit";

/**
 * Limiter for attendance report downloads to prevent abuse
 */
export const attendanceReportDownloadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many report downloads. Please try again in a minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General rate limiter for sensitive endpoints
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
