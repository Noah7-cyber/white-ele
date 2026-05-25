import { body, param, query, ValidationChain } from "express-validator";
import { AttendanceStatus } from "../../shared";

const timeField = (field: string): ValidationChain =>
  body(field)
    .optional({ values: "falsy" })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage(`${field} must be in HH:MM or HH:MM:SS format`);

export const validateClockInStudent: ValidationChain[] = [
  body("studentIds")
    .isArray({ min: 1 })
    .withMessage("studentIds must be a non-empty array of numbers"),
  body("studentIds.*")
    .isInt({ min: 1 })
    .withMessage("Each studentId must be a positive integer")
    .toInt(),
  body("parentId").isInt({ min: 1 }).withMessage("parentId is required").toInt(),
  body("notes").optional({ values: "falsy" }).isString().withMessage("notes must be a string"),
];

export const validateClockOutStudent: ValidationChain[] = [
  body("studentIds")
    .isArray({ min: 1 })
    .withMessage("studentIds must be a non-empty array of numbers"),
  body("studentIds.*")
    .isInt({ min: 1 })
    .withMessage("Each studentId must be a positive integer")
    .toInt(),
  body("parentId").isInt({ min: 1 }).withMessage("parentId is required").toInt(),
  timeField("timeOut"),
  body("notes").optional({ values: "falsy" }).isString().withMessage("notes must be a string"),
];

export const validateStudentAttendanceId: ValidationChain[] = [
  param("id").isInt({ min: 1 }).withMessage("Attendance ID must be a positive integer").toInt(),
];


export const validateCreateStudentAttendance: ValidationChain[] = [
  body("studentId").isInt({ min: 1 }).withMessage("studentId is required").toInt(),
  body("classroomId").isInt({ min: 1 }).withMessage("classroomId is required").toInt(),
  // body("status")
  //   .notEmpty()
  //   .withMessage("status is required")
  //   .isIn(Object.values(AttendanceStatus))
  //   .withMessage(`status must be one of: ${Object.values(AttendanceStatus).join(", ")}`),
  body("date").notEmpty().withMessage("date is required").isISO8601().withMessage("date must be a valid ISO date"),
  body("teacherId").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("teacherId must be a positive integer").toInt(),
  body("parentId").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("parentId must be a positive integer").toInt(),
  body()
    .custom((_, { req }) => {
      if (!req.body.teacherId && !req.body.parentId) {
        throw new Error("Either teacherId or parentId is required");
      }
      if (req.body.teacherId && req.body.parentId) {
        throw new Error("Provide either teacherId or parentId, not both");
      }
      return true;
    })
    .withMessage("Invalid recorder"),
  body("reason").optional({ values: "falsy" }).isLength({ max: 1000 }).withMessage("reason must not exceed 1000 characters"),
  timeField("timeIn"),
  timeField("timeOut"),
];

export const validateUpdateStudentAttendance: ValidationChain[] = [
  param("id").isInt({ min: 1 }).withMessage("Attendance ID must be a positive integer").toInt(),
  body("status")
    .optional({ values: "falsy" })
    .isIn(Object.values(AttendanceStatus))
    .withMessage(`status must be one of: ${Object.values(AttendanceStatus).join(", ")}`),
  body("date").optional({ values: "falsy" }).isISO8601().withMessage("date must be a valid ISO date"),
  body("teacherId").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("teacherId must be a positive integer").toInt(),
  body("parentId").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("parentId must be a positive integer").toInt(),
  body()
    .custom((_, { req }) => {
      if (req.body.teacherId && req.body.parentId) {
        throw new Error("Provide either teacherId or parentId, not both");
      }
      return true;
    })
    .withMessage("Invalid recorder"),
  body("reason").optional({ values: "falsy" }).isLength({ max: 1000 }).withMessage("reason must not exceed 1000 characters"),
  timeField("timeIn"),
  timeField("timeOut"),
];


export const validateStudentAttendanceQuery: ValidationChain[] = [
  query("studentId").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("studentId must be a positive integer").toInt(),
  query("classroomId").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("classroomId must be a positive integer").toInt(),
  query("teacherId").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("teacherId must be a positive integer").toInt(),
  query("parentId").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("parentId must be a positive integer").toInt(),
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

export const validateStudentAttendanceSummaryQuery: ValidationChain[] = [
  query("studentId").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("studentId must be a positive integer").toInt(),
  query("startDate").optional({ values: "falsy" }).isISO8601().withMessage("startDate must be a valid ISO date"),
  query("endDate").optional({ values: "falsy" }).isISO8601().withMessage("endDate must be a valid ISO date"),
];

