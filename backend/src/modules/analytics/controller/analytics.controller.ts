import { Response } from "express";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import {
  AnalyticsService,
  AnalyticsFilters,
  BillingReportFilters,
  type AttendanceReportType,
  type AdminStudentReportType,
} from "../service/analytics.service";
import { logger } from "../../shared/utils/logger";
import { requireSchoolId } from "../../shared/utils/tenant-context";
import { InvoiceStatus, AttendanceStatus } from "../../shared/entities/EntityEnums";
import { AppDataSource } from "../../core/config/database";
import { School } from "../../shared/entities/School";
import { pdfService } from "../../shared/services/pdf.service";

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Get student statistics
   * GET /api/analytics/students
   * Query params: startDate, endDate
   */
  async getStudentStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "School ID not found for the authenticated user",
        });
      }

      const filters: AnalyticsFilters = {
        schoolId,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        periodType: req.query['periodType'] as 'daily' | 'weekly' | 'monthly' | 'yearly',
        staffId: req.query['staffId'] ? Number(req.query['staffId']) : undefined,
        classroomId: req.query['classroomId'] ? Number(req.query['classroomId']) : undefined,
        attendanceStartDate: req.query['attendanceStartDate'] as string | undefined,
        attendanceEndDate: req.query['attendanceEndDate'] as string | undefined,
        attendancePeriodType: req.query['attendancePeriodType'] as 'daily' | 'weekly' | 'monthly' | 'yearly',
        attendanceClassroomId: req.query['attendanceClassroomId'] ? Number(req.query['attendanceClassroomId']) : undefined,
      };

      const result = await this.analyticsService.getStudentStats(filters);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getStudentStats controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get admissions statistics
   * GET /api/analytics/admissions
   * Query params: startDate, endDate, periodType, classroomId, staffId
   */
  async getAdmissionsStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "School ID not found for the authenticated user",
        });
      }

      const filters: AnalyticsFilters = {
        schoolId,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        periodType: (req.query['periodType'] as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'daily',
        classroomId: req.query['classroomId'] ? Number(req.query['classroomId']) : undefined,
        staffId: req.query['staffId'] ? Number(req.query['staffId']) : undefined,
      };

      const result = await this.analyticsService.getAdmissionsStats(filters);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getAdmissionsStats controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * GET /api/analytics/forms/performance
   * Per-form submission totals and FormResponse status breakdown for the Admission report table.
   */
  async getFormPerformanceReport(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "School ID not found for the authenticated user",
        });
      }

      const posRaw = req.query["pos"];
      const deltaRaw = req.query["delta"];
      const filters: AnalyticsFilters & { pos?: number; delta?: number } = {
        schoolId,
        startDate: req.query["startDate"] as string | undefined,
        endDate: req.query["endDate"] as string | undefined,
        periodType: (req.query["periodType"] as "daily" | "weekly" | "monthly" | "yearly") || "daily",
        pos: posRaw !== undefined ? Number(posRaw) : undefined,
        delta: deltaRaw !== undefined ? Number(deltaRaw) : undefined,
      };

      const result = await this.analyticsService.getFormPerformanceReport(filters);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getFormPerformanceReport controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get student attendance statistics
   * GET /api/analytics/attendance/students
   * Query params: classroomId, studentId, startDate, endDate, periodType
   */
  async getStudentAttendanceStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "School ID not found for the authenticated user",
        });
      }

      const filters: AnalyticsFilters = {
        schoolId,
        classroomId: req.query['classroomId'] ? Number(req.query['classroomId']) : undefined,
        studentId: req.query['studentId'] ? Number(req.query['studentId']) : undefined,
        staffId: req.query['staffId'] ? Number(req.query['staffId']) : undefined,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        periodType: (req.query['periodType'] as 'daily' | 'weekly' | 'monthly' | 'yearly') || undefined,
      };

      const result = await this.analyticsService.getStudentAttendanceStats(filters);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getStudentAttendanceStats controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get staff attendance statistics
   * GET /api/analytics/attendance/staff
   * Query params: teacherId, startDate, endDate, periodType
   */
  async getStaffAttendanceStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "School ID not found for the authenticated user",
        });
      }

      const filters: AnalyticsFilters = {
        schoolId,
        staffId: req.query['staffId'] ? Number(req.query['staffId']) : undefined,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        periodType: (req.query['periodType'] as 'daily' | 'weekly' | 'monthly' | 'yearly') || undefined,
      };

      const result = await this.analyticsService.getStaffAttendanceStats(filters);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getStaffAttendanceStats controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get staff attendance analytics report
   * GET /api/analytics/attendance/staff/analytics
   * Query params: staffId, startDate, endDate, periodType
   */
  async getStaffAttendanceAnalytics(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "School ID not found for the authenticated user",
        });
      }

      const filters: AnalyticsFilters = {
        schoolId,
        staffId: req.query['staffId'] ? Number(req.query['staffId']) : undefined,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        periodType: (req.query['periodType'] as 'daily' | 'weekly' | 'monthly' | 'yearly') || undefined,
      };

      const result = await this.analyticsService.getStaffAttendanceAnalytics(filters);

      if (result.success) {
        const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPastPeriod = endDate < today;
        res.setHeader('Cache-Control', isPastPeriod
          ? 'public, max-age=3600'   // 1 hour -- past data is immutable
          : 'public, max-age=60'     // 60s -- current period still changing
        );
      }

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getStaffAttendanceAnalytics controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get combined attendance statistics (students and staff)
   * GET /api/analytics/attendance
   * Query params: classroomId, studentId, teacherId, startDate, endDate, periodType
   */
  async getAttendanceStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "School ID not found for the authenticated user",
        });
      }

      const filters: AnalyticsFilters = {
        schoolId,
        classroomId: req.query['classroomId'] ? Number(req.query['classroomId']) : undefined,
        studentId: req.query['studentId'] ? Number(req.query['studentId']) : undefined,
        staffId: req.query['staffId'] ? Number(req.query['staffId']) : undefined,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        periodType: (req.query['periodType'] as 'daily' | 'weekly' | 'monthly' | 'yearly') || undefined,
      };

      const result = await this.analyticsService.getAttendanceStats(filters);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getAttendanceStats controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get staff statistics
   * GET /api/analytics/staff
   * Query params: startDate, endDate
   */
  async getStaffStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "School ID not found for the authenticated user",
        });
      }

      const filters: AnalyticsFilters = {
        schoolId,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        periodType: req.query['periodType'] as 'daily' | 'weekly' | 'monthly' | 'yearly',
        staffId: req.query['staffId'] ? Number(req.query['staffId']) : undefined,
        classroomId: req.query['classroomId'] ? Number(req.query['classroomId']) : undefined,
        attendanceStartDate: req.query['attendanceStartDate'] as string | undefined,
        attendanceEndDate: req.query['attendanceEndDate'] as string | undefined,
        attendancePeriodType: req.query['attendancePeriodType'] as 'daily' | 'weekly' | 'monthly' | 'yearly',
        attendanceClassroomId: req.query['attendanceClassroomId'] ? Number(req.query['attendanceClassroomId']) : undefined,
      };

      const result = await this.analyticsService.getStaffStats(filters);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getStaffStats controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get classroom statistics
   * GET /api/analytics/classrooms
   * Query params: startDate, endDate, periodType, classroomId, staffId
   */
  async getClassroomStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "School ID not found for the authenticated user",
        });
      }

      const filters: AnalyticsFilters = {
        schoolId,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        periodType: req.query['periodType'] as 'daily' | 'weekly' | 'monthly' | 'yearly',
        classroomId: req.query['classroomId'] ? Number(req.query['classroomId']) : undefined,
        staffId: req.query['staffId'] ? Number(req.query['staffId']) : undefined,
      };

      const result = await this.analyticsService.getClassroomStats(filters);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getClassroomStats controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get comprehensive dashboard overview
   * GET /api/analytics/dashboard
   * Query params: startDate, endDate
   */
  async getDashboardOverview(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "School ID not found for the authenticated user",
        });
      }

      const filters: AnalyticsFilters = {
        schoolId,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        periodType: req.query['periodType'] as 'daily' | 'weekly' | 'monthly' | 'yearly',
        staffId: req.query['staffId'] ? Number(req.query['staffId']) : undefined,
        classroomId: req.query['classroomId'] ? Number(req.query['classroomId']) : undefined,
        attendanceStartDate: req.query['attendanceStartDate'] as string | undefined,
        attendanceEndDate: req.query['attendanceEndDate'] as string | undefined,
        attendancePeriodType: req.query['attendancePeriodType'] as 'daily' | 'weekly' | 'monthly' | 'yearly',
        attendanceClassroomId: req.query['attendanceClassroomId'] ? Number(req.query['attendanceClassroomId']) : undefined,
      };

      const result = await this.analyticsService.getDashboardOverview(filters);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getDashboardOverview controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get parent dashboard statistics
   * GET /api/analytics/parents/dashboard
   * Query params: startDate, endDate
   */
  async getParentDashboard(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "School ID not found for the authenticated user",
        });
      }

      const parent = Array.isArray(req.user?.parent) ? (req.user as any).parent?.[0] : (req.user as any).parent;
      const parentId = parent?.id;

      if (!parentId) {
        return res.status(400).json({
          success: false,
          message: "Parent ID not found for the authenticated user",
        });
      }

      console.log("Authenticated Parent", parentId)

      const filters: AnalyticsFilters = {
        schoolId,
        parentId,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        periodType: req.query['periodType'] as 'daily' | 'weekly' | 'monthly' | 'yearly',
        studentId: req.query['studentId'] ? Number(req.query['studentId']) : undefined,
      };

      const result = await this.analyticsService.getParentDashboard(filters);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getParentDashboard controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get student dashboard statistics
   * GET /api/analytics/students/dashboard
   * Query params: startDate, endDate
   */
  async getStudentStatsDashboard(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "School ID not found for the authenticated user",
        });
      }

      const staff = Array.isArray(req.user?.staff) ? (req.user as any).staff?.[0] : (req.user as any).staff;
      const staffId = staff?.id

      if (!staffId) return res.status(400).json({
        success: false,
        message: "Staff ID not found for the authenticated user",
      });


      const filters: AnalyticsFilters = {
        schoolId,
        staffId,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        periodType: req.query['periodType'] as 'daily' | 'weekly' | 'monthly' | 'yearly',
      };
      // console.log("Authenticated user id:", staffId);
      const result = await this.analyticsService.getStudentStatsDashboard(filters);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getStudentStatsDashboard controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get comprehensive attendance analytics report
   * GET /api/analytics/attendance/report
   * Query params: startDate, endDate, periodType
   */
  async getAttendanceAnalytics(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "School ID not found for the authenticated user",
        });
      }

      const filters: AnalyticsFilters = {
        schoolId,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        periodType: (req.query['periodType'] as 'daily' | 'weekly' | 'monthly' | 'yearly') || undefined,
      };

      const result = await this.analyticsService.getAttendanceAnalytics(filters);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getAttendanceAnalytics controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get earnings statistics
   * GET /api/analytics/earnings
   * Query params: startDate, endDate, periodType
   */
  async getEarningsStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "School ID not found for the authenticated user",
        });
      }

      const filters: AnalyticsFilters = {
        schoolId,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        periodType: (req.query['periodType'] as 'daily' | 'weekly' | 'monthly' | 'yearly') || undefined,
      };

      const result = await this.analyticsService.getEarningsStats(filters);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getEarningsStats controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get billing analytics report (deposits or transactions)
   * GET /api/analytics/billing
   * Query params: type (deposit | transaction), startDate, endDate, classroomId, studentId, parentId, status, pos, delta
   */
  async getBillingReport(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "School ID not found for the authenticated user",
        });
      }

      const rawType = req.query['type'] as string;
      const type: 'deposit' | 'transaction' = rawType === 'transaction' ? 'transaction' : 'deposit';

      const filters: BillingReportFilters = {
        schoolId,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        classroomId: req.query['classroomId'] ? Number(req.query['classroomId']) : undefined,
        studentId: req.query['studentId'] ? Number(req.query['studentId']) : undefined,
        parentId: req.query['parentId'] ? Number(req.query['parentId']) : undefined,
        status: req.query['status'] as InvoiceStatus | undefined,
        pos: req.query['pos'] !== undefined ? Number(req.query['pos']) : 0,
        delta: req.query['delta'] !== undefined ? Number(req.query['delta']) : 10,
      };

      const result = type === 'transaction' 
        ? await this.analyticsService.getBillingTransactions(filters)
        : await this.analyticsService.getBillingDeposits(filters);

      return res.status(result.success ? 200 : 500).json(result);

    } catch (error) {
      logger.error("Error in getBillingReport controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get billing summary report (rolled up by student)
   * GET /api/analytics/billing/summary
   * Query params: startDate, endDate, classroomId, studentId, parentId, status, pos, delta
   */
  async getBillingSummary(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error?.message || "School ID not found for the authenticated user",
        });
      }

      const filters: BillingReportFilters = {
        schoolId,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        classroomId: req.query['classroomId'] ? Number(req.query['classroomId']) : undefined,
        studentId: req.query['studentId'] ? Number(req.query['studentId']) : undefined,
        parentId: req.query['parentId'] ? Number(req.query['parentId']) : undefined,
        status: req.query['status'] as InvoiceStatus | undefined,
        pos: req.query['pos'] !== undefined ? Number(req.query['pos']) : 0,
        delta: req.query['delta'] !== undefined ? Number(req.query['delta']) : 10,
      };

      const result = await this.analyticsService.getBillingSummary(filters);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getBillingSummary controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get attendance report by type (classrooms | check-in-out)
   * GET /api/v1/analytics/reports/attendance
   * Query params: type (required), classroomId, status, startDate, endDate, pos, delta
   */
  async getAttendanceReport(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: unknown) {
        const err = error as { message?: string };
        return res.status(400).json({
          success: false,
          message: err?.message || "School ID not found for the authenticated user",
        });
      }

      const type = req.query["type"] as AttendanceReportType;
      const filters = {
        schoolId,
        type,
        classroomId: req.query["classroomId"] ? Number(req.query["classroomId"]) : undefined,
        status: req.query["status"] as AttendanceStatus | undefined,
        startDate: req.query["startDate"] as string | undefined,
        endDate: req.query["endDate"] as string | undefined,
        pos: req.query["pos"] !== undefined && req.query["pos"] !== "" ? Number(req.query["pos"]) : undefined,
        delta: req.query["delta"] !== undefined && req.query["delta"] !== "" ? Number(req.query["delta"]) : undefined,
      };

      const result = await this.analyticsService.getAttendanceReport(filters);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getAttendanceReport controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Download attendance report as PDF
   * GET /api/analytics/attendance/report/download
   * Query params: subjectType (children|teachers), startDate, endDate, periodType
   */
  async downloadAttendanceReportPDF(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: unknown) {
        const err = error as { message?: string };
        return res.status(400).json({
          success: false,
          message: err?.message || "School ID not found for the authenticated user",
        });
      }

      const subjectType = (req.query["subjectType"] as "students" | "staff") || "students";
      const filters: AnalyticsFilters = {
        schoolId,
        startDate: req.query["startDate"] as string | undefined,
        endDate: req.query["endDate"] as string | undefined,
        periodType: (req.query["periodType"] as "daily" | "weekly" | "monthly" | "yearly") || undefined,
      };

      const result =
        subjectType === "staff"
          ? await this.analyticsService.getStaffAttendanceAnalytics(filters)  
          : await this.analyticsService.getAttendanceAnalytics(filters);

      if (!result.success || !result.data) {
        return res.status(500).json({
          success: false,
          message: result.message || "Failed to retrieve attendance analytics",
        });
      }

      const school = await AppDataSource.getRepository(School).findOne({ where: { id: schoolId } });
      if (!school) {
        return res.status(404).json({
          success: false,
          message: "School not found",
        });
      }

      const metadata = (result as { metadata?: { startDate?: string; endDate?: string } }).metadata;
      const startStr: string = metadata?.startDate || filters.startDate?.split("T")[0] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
      const endStr: string = metadata?.endDate || filters.endDate?.split("T")[0] || new Date().toISOString().split("T")[0]!;
      const schoolForPdf = { ...school, schoolName: school.schoolName ?? "School" };
      if (subjectType === "staff") {
        const d = result.data as {
          overallAttendanceRate: number;
          mostPresentStaff: { staffName: string; rate: number };
          highestAbsenteeStaff: { staffName: string; rate: number };
          latenessRate: number;
          attendanceTrend: { xAxis: string[]; present: number[]; absent: number[]; late: number[] };
        };
        const pdfData = {
          school: schoolForPdf,
          subjectType: "teachers" as const,
          startDate: startStr,
          endDate: endStr,
          overallAttendanceRate: d.overallAttendanceRate,
          mostPresentStaff: d.mostPresentStaff,
          highestAbsenteeStaff: d.highestAbsenteeStaff,
          latenessRate: d.latenessRate,
          attendanceTrend: d.attendanceTrend || { xAxis: [], present: [], absent: [], late: [] },
        };
        const pdfBuffer = await pdfService.generateAttendanceReportPDF(pdfData);
        const periodLabel = filters.periodType || "month";
        const filename = `attendance-report-${subjectType}-${endStr}-${periodLabel}.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.send(pdfBuffer);
      }

      const d = result.data as {
        overallAttendanceRate: number;
        mostPresentClass: { className: string; rate: number };
        highestAbsenteeClass: { className: string; rate: number };
        latenessRate: number;
        attendanceTrend: { xAxis: string[]; present: number[]; absent: number[]; late: number[] };
      };
      const pdfData = {
        school: schoolForPdf,
        subjectType: "children" as const,
        startDate: startStr,
        endDate: endStr,
        overallAttendanceRate: d.overallAttendanceRate,
        mostPresentClass: d.mostPresentClass,
        highestAbsenteeClass: d.highestAbsenteeClass,
        latenessRate: d.latenessRate,
        attendanceTrend: d.attendanceTrend || { xAxis: [], present: [], absent: [], late: [] },
      };
      const pdfBuffer = await pdfService.generateAttendanceReportPDF(pdfData);
      const periodLabel = filters.periodType || "month";
      const filename = `attendance-report-${subjectType}-${endStr}-${periodLabel}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(pdfBuffer);
    } catch (error) {
      logger.error("Error in downloadAttendanceReportPDF controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * GET /api/analytics/reports/students
   * Query: type=activities|learning, startDate?, endDate?, classroomId?, studentId?, staffId?, pos?, delta?
   */
  async getAdminStudentReport(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: unknown) {
        const err = error as { message?: string };
        return res.status(400).json({
          success: false,
          message: err?.message || "School ID not found for the authenticated user",
        });
      }

      const type = req.query["type"] as AdminStudentReportType;
      const result = await this.analyticsService.getAdminStudentReport({
        schoolId,
        type,
        startDate: req.query["startDate"] as string | undefined,
        endDate: req.query["endDate"] as string | undefined,
        classroomId: req.query["classroomId"] ? Number(req.query["classroomId"]) : undefined,
        studentId: req.query["studentId"] ? Number(req.query["studentId"]) : undefined,
        staffId: req.query["staffId"] ? Number(req.query["staffId"]) : undefined,
        pos: req.query["pos"] !== undefined && req.query["pos"] !== "" ? Number(req.query["pos"]) : undefined,
        delta: req.query["delta"] !== undefined && req.query["delta"] !== "" ? Number(req.query["delta"]) : undefined,
      });

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getAdminStudentReport controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * GET /api/analytics/reports/staff
   * Query: startDate?, endDate?, classroomId?, staffId?, pos?, delta?
   */
  async getAdminStaffReport(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: unknown) {
        const err = error as { message?: string };
        return res.status(400).json({
          success: false,
          message: err?.message || "School ID not found for the authenticated user",
        });
      }

      const result = await this.analyticsService.getAdminStaffReport({
        schoolId,
        startDate: req.query["startDate"] as string | undefined,
        endDate: req.query["endDate"] as string | undefined,
        classroomId: req.query["classroomId"] ? Number(req.query["classroomId"]) : undefined,
        staffId: req.query["staffId"] ? Number(req.query["staffId"]) : undefined,
        pos: req.query["pos"] !== undefined && req.query["pos"] !== "" ? Number(req.query["pos"]) : undefined,
        delta: req.query["delta"] !== undefined && req.query["delta"] !== "" ? Number(req.query["delta"]) : undefined,
      });

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getAdminStaffReport controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * GET /api/analytics/action-center
   */
  async getActionCenter(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let schoolId: number;
      try {
        schoolId = requireSchoolId(req);
      } catch (error: unknown) {
        const err = error as { message?: string };
        return res.status(400).json({
          success: false,
          message: err?.message || "School ID not found for the authenticated user",
        });
      }

      const result = await this.analyticsService.getActionCenter(schoolId);
      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      logger.error("Error in getActionCenter controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

