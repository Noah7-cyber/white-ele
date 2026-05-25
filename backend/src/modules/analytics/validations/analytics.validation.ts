import { query } from "express-validator";
import { AttendanceStatus } from "../../shared";

/**
 * Validation for attendance report (classrooms | check-in-out)
 */
export const attendanceReportQuerySchema = [
  query("type")
    .notEmpty()
    .withMessage("type is required")
    .isIn(["classrooms", "check-in-out"])
    .withMessage("type must be one of: classrooms, check-in-out"),
  query("classroomId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("classroomId must be a positive integer")
    .toInt(),
  query("status")
    .optional({ values: "falsy" })
    .isIn(Object.values(AttendanceStatus))
    .withMessage(`status must be one of: ${Object.values(AttendanceStatus).join(", ")}`),
  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("startDate must be a valid ISO 8601 date"),
  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("endDate must be a valid ISO 8601 date"),
  query("pos")
    .optional({ values: "falsy" })
    .isInt({ min: 0 })
    .withMessage("pos must be a non-negative integer")
    .toInt(),
  query("delta")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("delta must be between 1 and 100")
    .toInt(),
];

/**
 * Validation for student statistics
 * Note: schoolId is extracted from authenticated user, not from query params
 */
export const studentStatsQuerySchema = [
  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
];

/**
 * Validation for admissions statistics
 * Note: schoolId is extracted from authenticated user, not from query params
 */
export const admissionsStatsQuerySchema = [
  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
  query("periodType")
    .optional({ values: "falsy" })
    .isIn(["daily", "weekly", "monthly", "yearly"])
    .withMessage("Period type must be one of: daily, weekly, monthly, yearly"),
];

/** Action center — no query params; schoolId from auth */
export const actionCenterQuerySchema: ReturnType<typeof query>[] = [];

/** Form performance report (per-form submissions + status counts) */
export const formPerformanceQuerySchema = [
  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
  query("periodType")
    .optional({ values: "falsy" })
    .isIn(["daily", "weekly", "monthly", "yearly"])
    .withMessage("Period type must be one of: daily, weekly, monthly, yearly"),
  query("pos")
    .optional({ values: "falsy" })
    .isInt({ min: 0 })
    .withMessage("pos must be a non-negative integer")
    .toInt(),
  query("delta")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("delta must be between 1 and 100")
    .toInt(),
];

/**
 * Validation for attendance statistics
 * Note: schoolId is extracted from authenticated user, not from query params
 */
export const attendanceStatsQuerySchema = [
  query("classroomId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Classroom ID must be a positive integer")
    .toInt(),
  query("studentId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Student ID must be a positive integer")
    .toInt(),
  query("teacherId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Teacher ID must be a positive integer")
    .toInt(),
  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
  query("periodType")
    .optional({ values: "falsy" })
    .isIn(["daily", "weekly", "monthly", "yearly"])
    .withMessage("Period type must be one of: daily, weekly, monthly, yearly"),
];

/**
 * Validation for staff statistics
 * Note: schoolId is extracted from authenticated user, not from query params
 */
export const staffStatsQuerySchema = [
  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
];

/**
 * Validation for classroom statistics
 * Note: schoolId is extracted from authenticated user, not from query params
 */
export const classroomStatsQuerySchema = [
  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
];

/**
 * Validation for dashboard overview
 * Note: schoolId is extracted from authenticated user, not from query params
 */
export const dashboardQuerySchema = [
  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
  query("periodType")
    .optional({ values: "falsy" })
    .isIn(["daily", "weekly", "monthly", "yearly"])
    .withMessage("Period type must be one of: daily, weekly, monthly, yearly"),

  query("attendanceStartDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Attendance start date must be a valid ISO 8601 date"),
  query("attendanceEndDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Attendance end date must be a valid ISO 8601 date"),
  query("attendancePeriodType")
    .optional({ values: "falsy" })
    .isIn(["daily", "weekly", "monthly", "yearly"])
    .withMessage("Attendance period type must be one of: daily, weekly, monthly, yearly"),
  query("attendanceClassroomId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Attendance classroom ID must be a positive integer")
    .toInt(),
];

export const parentDashboardQuerySchema = [
  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),

  query("studentId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Student ID must be a positive integer")
    .toInt(),

  query("periodType")
    .optional({ values: "falsy" })
    .isIn(["daily", "weekly", "monthly", "yearly"])
    .withMessage("Period type must be one of: daily, weekly, monthly, yearly"),
];

/**
 * Validation for attendance report PDF download
 */
export const attendanceReportDownloadQuerySchema = [
  query("subjectType")
    .optional({ values: "falsy" })
    .default("children")
    .isIn(["students", "staff"])
    .withMessage("subjectType must be one of: students, staff"),
  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("startDate must be a valid ISO 8601 date"),
  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("endDate must be a valid ISO 8601 date"),
  query("periodType")
    .optional({ values: "falsy" })
    .isIn(["daily", "weekly", "monthly", "yearly"])
    .withMessage("periodType must be one of: daily, weekly, monthly, yearly"),
];

/**
 * Validation for staff attendance analytics
 */
export const staffAttendanceAnalyticsQuerySchema = [
  query("staffId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Staff ID must be a positive integer")
    .toInt(),
  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
  query("periodType")
    .optional({ values: "falsy" })
    .isIn(["daily", "weekly", "monthly", "yearly"])
    .withMessage("Period type must be one of: daily, weekly, monthly, yearly"),
];

/**
 * Validation for earnings statistics
 */
export const earningsStatsQuerySchema = [
  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
  query("periodType")
    .optional({ values: "falsy" })
    .isIn(["daily", "weekly", "monthly", "yearly"])
    .withMessage("Period type must be one of: daily, weekly, monthly, yearly"),
];

/**
 * Validation for billing analytics report (deposits / transactions)
 */
export const billingReportQuerySchema = [
  query("type")
    .notEmpty()
    .isIn(["deposit", "transaction"])
    .withMessage("type must be one of: deposit, transaction"),
  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
  query("classroomId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("classroomId must be a positive integer")
    .toInt(),
  query("studentId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("studentId must be a positive integer")
    .toInt(),
  query("parentId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("parentId must be a positive integer")
    .toInt(),
  query("status")
    .optional({ values: "falsy" })
    .isIn(["sent", "paid", "partially_paid", "overdue", "overpaid", "void"])
    .withMessage("status must be one of: sent, paid, partially_paid, overdue, overpaid, void"),
  query("pos")
    .optional({ values: "falsy" })
    .isInt({ min: 0 })
    .withMessage("pos must be a non-negative integer")
    .toInt(),
  query("delta")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("delta must be an integer between 1 and 100")
    .toInt(),
];

/**
 * Validation for billing summary report
 */
export const billingSummaryQuerySchema = [
  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
  query("classroomId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("classroomId must be a positive integer")
    .toInt(),
  query("studentId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("studentId must be a positive integer")
    .toInt(),
  query("parentId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("parentId must be a positive integer")
    .toInt(),
  query("status")
    .optional({ values: "falsy" })
    .isIn(["sent", "paid", "partially_paid", "overdue", "overpaid", "void"])
    .withMessage("status must be one of: sent, paid, partially_paid, overdue, overpaid, void"),
  query("pos")
    .optional({ values: "falsy" })
    .isInt({ min: 0 })
    .withMessage("pos must be a non-negative integer")
    .toInt(),
  query("delta")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("delta must be an integer between 1 and 100")
    .toInt(),
];

/**
 * Admin student report: activities | learning
 */
export const studentAdminReportQuerySchema = [
  query("type")
    .notEmpty()
    .withMessage("type is required")
    .isIn(["activities", "learning"])
    .withMessage("type must be one of: activities, learning"),
  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("startDate must be a valid ISO 8601 date"),
  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("endDate must be a valid ISO 8601 date"),
  query("classroomId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("classroomId must be a positive integer")
    .toInt(),
  query("studentId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("studentId must be a positive integer")
    .toInt(),
  query("staffId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("staffId must be a positive integer")
    .toInt(),
  query("pos")
    .optional({ values: "falsy" })
    .isInt({ min: 0 })
    .withMessage("pos must be a non-negative integer")
    .toInt(),
  query("delta")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("delta must be between 1 and 100")
    .toInt(),
];

/**
 * Admin staff report: hours, SCS rooms, ratio snapshot
 */
export const staffAdminReportQuerySchema = [
  query("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("startDate must be a valid ISO 8601 date"),
  query("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("endDate must be a valid ISO 8601 date"),
  query("classroomId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("classroomId must be a positive integer")
    .toInt(),
  query("staffId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("staffId must be a positive integer")
    .toInt(),
  query("pos")
    .optional({ values: "falsy" })
    .isInt({ min: 0 })
    .withMessage("pos must be a non-negative integer")
    .toInt(),
  query("delta")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("delta must be between 1 and 100")
    .toInt(),
];

