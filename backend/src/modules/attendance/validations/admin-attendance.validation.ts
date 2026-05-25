import { body, param, query, ValidationChain } from "express-validator";
import { AttendanceStatus } from "../../shared";

const timeField = (field: string): ValidationChain =>
  body(field)
    .optional({ values: "falsy" })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage(`${field} must be in HH:MM or HH:MM:SS format`);

export const validateClockInAdmin: ValidationChain[] = [
  body("adminId").isInt({ min: 1 }).withMessage("adminId is required").toInt(),
  body("notes").optional({ values: "falsy" }).isString().withMessage("notes must be a string"),
];

export const validateClockOutAdmin: ValidationChain[] = [
  body("adminId").isInt({ min: 1 }).withMessage("adminId is required").toInt(),
  body("notes").optional({ values: "falsy" }).isString().withMessage("notes must be a string"),
  timeField("timeOut"),
];

export const validateCreateAdminAttendance: ValidationChain[] = [
  body("adminId").isInt({ min: 1 }).withMessage("adminId is required").toInt(),
  body("date").notEmpty().withMessage("date is required"),
  body("notes")
    .optional({ values: "falsy" })
    .isLength({ max: 1000 })
    .withMessage("notes must not exceed 1000 characters"),
  timeField("timeIn"),
  timeField("timeOut"),
];

export const validateUpdateAdminAttendance: ValidationChain[] = [
  param("id").isInt({ min: 1 }).withMessage("Attendance ID must be a positive integer").toInt(),
  body("status")
    .optional({ values: "falsy" })
    .isIn(Object.values(AttendanceStatus))
    .withMessage(`status must be one of: ${Object.values(AttendanceStatus).join(", ")}`),
  body("date").optional({ values: "falsy" }).isISO8601().withMessage("date must be a valid ISO date"),
  body("notes")
    .optional({ values: "falsy" })
    .isLength({ max: 1000 })
    .withMessage("notes must not exceed 1000 characters"),
  timeField("timeIn"),
  timeField("timeOut"),
];

export const validateAdminAttendanceId: ValidationChain[] = [
  param("id").isInt({ min: 1 }).withMessage("Attendance ID must be a positive integer").toInt(),
];

export const validateAdminAttendanceQuery: ValidationChain[] = [
  query("adminId").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("adminId must be a positive integer").toInt(),
  query("status")
    .optional({ values: "falsy" })
    .isIn(Object.values(AttendanceStatus))
    .withMessage(`status must be one of: ${Object.values(AttendanceStatus).join(", ")}`),
  query("startDate").optional({ values: "falsy" }).isISO8601().withMessage("startDate must be a valid ISO date"),
  query("endDate").optional({ values: "falsy" }).isISO8601().withMessage("endDate must be a valid ISO date"),
  query("pos").optional({ values: "falsy" }).isInt({ min: 0 }).withMessage("pos must be a non-negative integer").toInt(),
  query("delta")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("delta must be between 1 and 100")
    .toInt(),
];

export const validateAdminAttendanceSummaryQuery: ValidationChain[] = [
  query("adminId").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("adminId must be a positive integer").toInt(),
  query("startDate").optional({ values: "falsy" }).isISO8601().withMessage("startDate must be a valid ISO date"),
  query("endDate").optional({ values: "falsy" }).isISO8601().withMessage("endDate must be a valid ISO date"),
];
