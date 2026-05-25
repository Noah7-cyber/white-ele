import { Router } from "express";
import { AnalyticsController } from "../controller/analytics.controller";
import {
  studentStatsQuerySchema,
  admissionsStatsQuerySchema,
  attendanceStatsQuerySchema,
  staffStatsQuerySchema,
  classroomStatsQuerySchema,
  dashboardQuerySchema,
  parentDashboardQuerySchema,
  earningsStatsQuerySchema,
  billingReportQuerySchema,
  billingSummaryQuerySchema,
  attendanceReportQuerySchema,
  attendanceReportDownloadQuerySchema,
  staffAttendanceAnalyticsQuerySchema,
  studentAdminReportQuerySchema,
  staffAdminReportQuerySchema,
  formPerformanceQuerySchema,
  actionCenterQuerySchema,
} from "../validations/analytics.validation";
import { handleValidationErrors } from "../../shared/middleware/validation";
import { authenticate } from "../../auth/middleware/middleware";
import { requirePermission } from "../../shared";
import { Resources, Action } from "../../auth/constants/role-permissions";

const router = Router();
const analyticsController = new AnalyticsController();

// Apply authentication middleware to all analytics routes
router.use(authenticate);

/**
 * @route GET /api/analytics/dashboard
 * @desc Get comprehensive dashboard overview with all key metrics
 * @access Protected (requires authentication)
 */
router.get(
  "/dashboard",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  dashboardQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getDashboardOverview(req, res)
);

/**
 * @route GET /api/analytics/action-center
 * @desc Follow-up alerts (absences today, late week, unpaid balance, admission offers)
 * @access Protected (ANALYTICS read)
 */
router.get(
  "/action-center",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  ...actionCenterQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getActionCenter(req, res)
);

/**
 * @route GET /api/analytics/students/dashboard
 * @desc Get student dashboard overview (total, signed in, late, absent, gender stats, attendance)
 * @access Protected (requires authentication)
 */
router.get(
  "/staff/dashboard",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  dashboardQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getStudentStatsDashboard(req, res)
);


router.get(
  "/parent/dashboard",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  parentDashboardQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getParentDashboard(req, res)
);

/**
 * @route GET /api/analytics/students
 * @desc Get student statistics (total, active, inactive, suspended)
 * @access Protected (requires authentication)
 */
router.get(
  "/students",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  studentStatsQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getStudentStats(req, res)
);

/**
 * @route GET /api/analytics/admissions
 * @desc Get admissions statistics over time
 * @access Protected (requires authentication)
 */
router.get(
  "/admissions",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  admissionsStatsQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getAdmissionsStats(req, res)
);

/**
 * @route GET /api/analytics/forms/performance
 * @desc Per-form submission counts and FormResponse status breakdown (Admission reports)
 */
router.get(
  "/forms/performance",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  formPerformanceQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getFormPerformanceReport(req, res)
);

/**
 * @route GET /api/analytics/attendance/students
 * @desc Get student attendance statistics (present, absent, late)
 * @access Protected (requires authentication)
 */
router.get(
  "/attendance/students",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  attendanceStatsQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getStudentAttendanceStats(req, res)
);

/**
 * @route GET /api/analytics/attendance/staff/analytics
 * @desc Get staff attendance analytics report (overall rate, by-staff breakdown, trend, distribution)
 * @access Protected (requires authentication)
 */
router.get(
  "/attendance/staff/analytics",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  ...staffAttendanceAnalyticsQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getStaffAttendanceAnalytics(req, res)
);

/**
 * @route GET /api/analytics/attendance/staff
 * @desc Get staff attendance statistics (present, absent, late)
 * @access Protected (requires authentication)
 */
router.get(
  "/attendance/staff",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  attendanceStatsQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getStaffAttendanceStats(req, res)
);

/**
 * @route GET /api/analytics/attendance/report/download
 * @desc Download attendance report as PDF
 * @access Protected (requires ANALYTICS read permission), rate limited
 */
router.get(
  "/attendance/report/download",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  attendanceReportDownloadQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.downloadAttendanceReportPDF(req, res)
);

/**
 * @route GET /api/analytics/attendance/report
 * @desc Get comprehensive attendance analytics report
 * @access Protected (requires authentication)
 */
router.get(
  "/attendance/report",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  attendanceStatsQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getAttendanceAnalytics(req, res)
);

/**
 * @route GET /api/analytics/attendance
 * @desc Get combined attendance statistics (students and staff)
 * @access Protected (requires authentication)
 */
router.get(
  "/attendance",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  attendanceStatsQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getAttendanceStats(req, res)
);

/**
 * @route GET /api/analytics/staff
 * @desc Get staff statistics (total, active, suspended, inactive)
 * @access Protected (requires authentication)
 */
router.get(
  "/staff",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  staffStatsQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getStaffStats(req, res)
);

/**
 * @route GET /api/analytics/classrooms
 * @desc Get classroom statistics (total, capacity, utilization)
 * @access Protected (requires authentication)
 */
router.get(
  "/classrooms",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  classroomStatsQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getClassroomStats(req, res)
);

/**
 * @route GET /api/analytics/earnings
 * @desc Get earnings statistics (monthly revenue for the year)
 * @access Protected (requires authentication)
 */
router.get(
  "/earnings",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  earningsStatsQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getEarningsStats(req, res)
);

/**
 * @route GET /api/analytics/billing/summary
 * @desc Get billing summary report — grouped by student
 * @access Protected (requires authentication)
 */
router.get(
  "/billing/summary",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  billingSummaryQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getBillingSummary(req, res)
);

/**
 * @route GET /api/analytics/billing
 * @desc Get billing analytics report — deposits (invoices) or transactions (invoice payments)
 * @access Protected (requires authentication)
 */
router.get(
  "/billing",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  billingReportQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getBillingReport(req, res)
);

/**
 * @route GET /api/v1/analytics/reports/attendance
 * @desc Get attendance report by type (classrooms | check-in-out)
 * @access Protected (requires ANALYTICS read permission)
 */
router.get(
  "/reports/attendance",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  attendanceReportQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getAttendanceReport(req, res)
);

/**
 * @route GET /api/analytics/reports/students
 * @desc Admin student report: activities or learning (type query). Optional staffId = students in rooms assigned to that staff (SCS).
 */
router.get(
  "/reports/students",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  studentAdminReportQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getAdminStudentReport(req, res)
);

/**
 * @route GET /api/analytics/reports/staff
 * @desc Admin staff report: hours, room assignments, staff-to-child ratio snapshot
 */
router.get(
  "/reports/staff",
  requirePermission({ resource: Resources.ANALYTICS, action: Action.VIEW }),
  staffAdminReportQuerySchema,
  handleValidationErrors,
  (req: any, res: any) => analyticsController.getAdminStaffReport(req, res)
);

export default router;
