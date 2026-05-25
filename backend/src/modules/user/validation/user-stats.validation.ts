import { query } from "express-validator";

/**
 * Validation for user statistics
 */
export const validateUserStats = [
  query("city").optional().isString().isLength({ min: 1, max: 100 }).withMessage("City must be between 1 and 100 characters"),

  query("state").optional().isString().isLength({ min: 1, max: 100 }).withMessage("State must be between 1 and 100 characters"),

  query("countryCode").optional().isString().isLength({ min: 2, max: 2 }).withMessage("Country code must be exactly 2 characters"),

  query("startDate").optional().isISO8601().withMessage("Start date must be a valid ISO 8601 date"),

  query("endDate").optional().isISO8601().withMessage("End date must be a valid ISO 8601 date"),
];

