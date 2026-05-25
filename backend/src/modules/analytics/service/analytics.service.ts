import { Student } from "../../shared/entities/StudentEntity";
import { AppDataSource } from "../../core/config/database";
import { Staff } from "../../shared/entities/Staff";
import { Classroom } from "../../shared/entities/Classroom";
import { Attendance } from "../../shared/entities/Attendance";
import { StaffClassesAndSubject } from "../../shared/entities/StaffClassesAndSubject";
import { Repository } from "typeorm";
import { ClassroomActivity } from "../../shared/entities/ClassroomActivity";
import { Parent } from "../../shared/entities/Parent";
import { InvoicePayment } from "../../shared/entities/InvoicePayment";
import {
  StudentStatus,
  StaffStatus,
  ClassroomStatus,
  AttendanceStatus,
  ActivityType,
  BathroomType,
  MealType,
  Gender,
  InvoiceStatus,
  FormStatus,
  FormResponseStatus,
  BookingStatus,
} from "../../shared/entities/EntityEnums";
import { TourBooking } from "../../shared/entities/TourBooking";
import { Form } from "../../shared/entities/Form";
import { Invoice } from "../../shared/entities/Invoice";
import { logger } from "../../shared/utils/logger";
import { formatDateKey, getNigeriaStartOfDay, getNigeriaEndOfDay, computeRelativeGrowthPercent, calculateHours, getNigeriaWeekRangeContaining } from "../../shared/utils/date-util";
import { StudentAssessmentScore } from "../../shared/entities/StudentAssessmentScore";
import { ClassroomStudentActivity } from "../../shared/entities/ClassroomStudentActivity";
import { StudentService } from "../../student/services/student.service";

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  schoolId?: number;
  classroomId?: number;
  studentId?: number;
  staffId?: number;
  periodType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  attendanceStartDate?: string;
  attendanceEndDate?: string;
  attendancePeriodType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  attendanceClassroomId?: number;
  parentId?: number;
  studentIds?: number[];
}

export interface BillingReportFilters {
  schoolId: number;
  startDate?: string;
  endDate?: string;
  classroomId?: number;
  studentId?: number;
  parentId?: number;
  status?: InvoiceStatus;
  pos?: number;
  delta?: number;
}

export interface BillingDepositItem {
  id: number;
  studentName: string;
  parentName: string;
  issueDate: string;
  dueDate: string;
  description: string;
  status: InvoiceStatus;
  totalFees: number;
  amountDeposited: number;
}

export interface BillingTransactionItem {
  id: number;
  studentName: string;
  parentName: string;
  paymentDate: string;
  description: string;
  amountPaid: number;
}

export interface BillingSummaryItem {
  studentId: number;
  studentName: string;
  parentName: string;
  invoiceDates: string[];
  invoicesIssued: number;
  totalInvoiceAmount: number;
  outstandingBalance: number;
  paid: number;
}

export interface BillingSummaryResponse {
  success: boolean;
  message: string;
  data?: BillingSummaryItem[];
  pagination?: { pos: number; delta: number; count: number };
  metadata?: {
    totalOutstandingBalanceAmount: number;
    totalOutstandingBalanceCount: number;
    totalAmount: number;
    totalPaidAmount: number;
  };
}

export interface BillingReportResponse {
  success: boolean;
  message: string;
  data?: BillingDepositItem[] | BillingTransactionItem[];
  pagination?: { pos: number; delta: number; count: number };
}

// Response interfaces with key stats + graph data
export interface StudentStatsResponse {
  success: boolean;
  message: string;
  data?: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    xAxis: string[];
    yAxis: number[];
  };
  metadata?: {
    xAxisLabel: string;
    yAxisLabel: string;
    percentageGrowth: number;
  };
}

export interface AdmissionsStatsResponse {
  success: boolean;
  message: string;
  data?: {
    total: number;
    averagePerPeriod: number;
    xAxis: string[];
    yAxis: number[];
  };
  metadata?: {
    xAxisLabel: string;
    yAxisLabel: string;
    percentageGrowth: number;
  };
}

export interface StudentAttendanceStatsResponse {
  success: boolean;
  message: string;
  data?: {
    present: {
      xAxis: string[];
      yAxis: number[];
    };
    absent: {
      xAxis: string[];
      yAxis: number[];
    };
    late: {
      xAxis: string[];
      yAxis: number[];
    };
  };
  metadata?: {
    xAxisLabel: string;
    yAxisLabel: string;
    percentageGrowth: number;
    totalRecords: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    attendanceRate: number;
  };
}

export interface StaffAttendanceStatsResponse {
  success: boolean;
  message: string;
  data?: {
    present: {
      xAxis: string[];
      yAxis: number[];
    };
    absent: {
      xAxis: string[];
      yAxis: number[];
    };
    late: {
      xAxis: string[];
      yAxis: number[];
    };
  };
  metadata?: {
    xAxisLabel: string;
    yAxisLabel: string;
    percentageGrowth: number;
    totalRecords: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    attendanceRate: number;
  };
}

export interface AttendanceStatsResponse {
  success: boolean;
  message: string;
  data?: {
    combinedRate: number;
    combinedPresent: number;
    combinedAbsent: number;
    combinedLate: number;
    studentPresent: {
      xAxis: string[];
      yAxis: number[];
    };
    studentAbsent: {
      xAxis: string[];
      yAxis: number[];
    };
    studentLate: {
      xAxis: string[];
      yAxis: number[];
    };
    staffPresent: {
      xAxis: string[];
      yAxis: number[];
    };
    staffAbsent: {
      xAxis: string[];
      yAxis: number[];
    };
    staffLate: {
      xAxis: string[];
      yAxis: number[];
    };
  };
  metadata?: {
    xAxisLabel: string;
    yAxisLabel: string;
    combinedPercentageGrowth?: number;
  };
}

export interface StaffStatsResponse {
  success: boolean;
  message: string;
  data?: {
    total: number;
    active: number;
    xAxis: string[];
    yAxis: number[];
  };
  metadata?: {
    xAxisLabel: string;
    yAxisLabel: string;
    percentageGrowth: number;
  };
}

export interface ClassroomStatsResponse {
  success: boolean;
  message: string;
  data?: {
    total: number;
    active: number;
    averageUtilization: number;
    xAxis: string[];
    yAxis: number[];
  };
  metadata?: {
    xAxisLabel: string;
    yAxisLabel: string;
  };
}

export interface DashboardOverviewResponse {
  success: boolean;
  message: string;
  data?: {
    students: {
      total: number;
      active: number;
      male: number;
      female: number;
      other: number;
      percentageGrowth: number;
    };
    admissions: {
      total: number;
      thisMonth: number;
      percentageGrowth: number;
    };
    staff: {
      total: number;
      active: number;
      percentageGrowth: number;
    };
    classrooms: {
      total: number;
      active: number;
      utilizationRate: number;
    };
    attendance: {
      student: {
        rate: number;
        present: number;
        absent: number;
        late: number;
        percentageGrowth: number;
        expectedSlots: number;
      };
      staff: {
        rate: number;
        present: number;
        absent: number;
        late: number;
        percentageGrowth: number;
        expectedSlots: number;
      };
      combined: {
        rate: number;
        present: number;
        absent: number;
        late: number;
        percentageGrowth: number;
        expectedSlots: number;
      };
    };
    attendanceTrend: {
      periodType: 'daily' | 'weekly' | 'monthly' | 'yearly';
      xAxis: string[];
      present: number[];
      absent: number[];
      late: number[];
    };
  };
  metadata?: {
    generatedAt: string;
    schoolId?: number;
    summary: string;
  };
}

export interface StudentStatsDashboardResponse {
  success: boolean;
  message: string;
  data?: {
    totalStudents: number;
    totalSignedIn: number;
    totalLate: number;
    totalAbsent: number;
    percentageGrowth: number;
    classStats: {
      byGender: {
        xAxis: ['Boys', 'Girls', 'Other'],
        yAxis: number[];
        percentages: number[];
      };
    };
    attendance: {
      xAxis: string[];
      present: number[];
      absent: number[];
      late: number[];
    };
  };
  metadata?: {
    date: string;
    attendanceRate: number;
  };
}

export interface AttendanceInsight {
  bestDay: { dayName: string; ratePercent: number };
  worstDay: { dayName: string; ratePercent: number };
  weeklyTrend: {
    direction: "improving" | "declining" | "stable";
    changePercent: number;
  };
}

export interface AttendanceAnalyticsResponse {
  success: boolean;
  message: string;
  data?: {
    overallAttendanceRate: number;
    mostPresentClass: {
      className: string;
      rate: number;
    };
    highestAbsenteeClass: {
      className: string;
      rate: number;
    };
    latenessRate: number;
    attendanceTrend: {
      xAxis: string[];
      present: number[];
      absent: number[];
      late: number[];
    };
    attendanceByStudent: {
      xAxis: string[];
      present: number[];
      absent: number[];
      late: number[];
    };
    statusDistribution: {
      xAxis: string[];
      yAxis: number[];
      percentages: number[];
    };
    attendanceInsight: AttendanceInsight;
  };
  metadata?: {
    startDate: string;
    endDate: string;
    totalRecords: number;
  };
}

export interface StaffAttendanceAnalyticsResponse {
  success: boolean;
  message: string;
  data?: {
    overallAttendanceRate: number;
    mostPresentStaff: {
      staffName: string;
      rate: number;
    };
    highestAbsenteeStaff: {
      staffName: string;
      rate: number;
    };
    latenessRate: number;
    attendanceTrend: {
      xAxis: string[];
      present: number[];
      absent: number[];
      late: number[];
    };
    attendanceByStaff: {
      xAxis: string[];
      present: number[];
      absent: number[];
      late: number[];
    };
    statusDistribution: {
      xAxis: string[];
      yAxis: number[];
      percentages: number[];
    };
  };
  metadata?: {
    startDate: string;
    endDate: string;
    totalRecords: number;
  };
}

export interface ParentDashboardResponse {
  success: boolean;
  message: string;
  data?: {
    attendance: {
      xAxis: string[];
      present: number[];
      absent: number[];
      late: number[];
    };
    activities: {
      id: number;
      activityType: ActivityType;
      startTime?: string;
      endTime?: string;
      mealType?: MealType;
      timeGiven?: string;
      bathroomType?: BathroomType;
      foodItems?: string;
      medicationName?: string;
      dosage?: string;
      notes?: string;
      photoUrl?: string;
      createdAt: Date;
      student: {
        id: number;
        firstName: string;
        lastName: string;
        photoUrl?: string;
      };
    }[];
    kioskPin?: string;
  };
  metadata?: {
    date: string;
    totalStudents: number;
  };
}

export interface EarningsStatsResponse {
  success: boolean;
  message: string;
  data?: {
    xAxis: string[];
    yAxis: number[];
    periodType?: string;
  };
  metadata?: {
    unit: string;
    total: number;
    startDate: string;
    endDate: string;
    periodType: string;
  };
}

export type AttendanceReportType = "classrooms" | "check-in-out";

export interface AttendanceReportFilters {
  schoolId: number;
  type: AttendanceReportType;
  classroomId?: number;
  status?: AttendanceStatus;
  startDate?: string;
  endDate?: string;
  pos?: number;
  delta?: number;
}

export interface AttendanceReportResponse {
  success: boolean;
  message: string;
  data?: unknown[];
  pagination?: { pos: number; delta: number; total: number };
}

export type AdminStudentReportType = "activities" | "learning";

export interface AdminStudentReportFilters {
  schoolId: number;
  type: AdminStudentReportType;
  startDate?: string;
  endDate?: string;
  classroomId?: number;
  studentId?: number;
  /** Students in a classroom assigned to this staff (SCS). */
  staffId?: number;
  pos?: number;
  delta?: number;
}

export interface AdminStaffReportFilters {
  schoolId: number;
  startDate?: string;
  endDate?: string;
  classroomId?: number;
  staffId?: number;
  pos?: number;
  delta?: number;
}

export interface AdminReportResponse {
  success: boolean;
  message: string;
  data?: unknown[];
  metadata?: {
    type?: AdminStudentReportType;
    startDate: string;
    endDate: string;
    ratioSnapshotDate?: string;
    staffToChildRatioBasis?: "assignment";
  };
  pagination?: { pos: number; delta: number; total: number };
}

export interface FormPerformanceStatusBreakdown {
  draft: number;
  submitted: number;
  reviewed: number;
  accepted: number;
  rejected: number;
}

export interface FormPerformanceRow {
  formId: number;
  formName: string;
  /** Responses in range excluding draft */
  totalSubmissions: number;
  /** Responses with status `accepted` in range (admission-style outcome) */
  totalAccepted: number;
  status: FormPerformanceStatusBreakdown;
}

export interface FormPerformanceReportResponse {
  success: boolean;
  message: string;
  data?: FormPerformanceRow[];
  metadata?: {
    startDate: string;
    endDate: string;
  };
  pagination?: { pos: number; delta: number; count: number };
}

export interface ActionCenterItem {
  message: string;
  context: string;
}

export interface ActionCenterResponse {
  success: boolean;
  message: string;
  data: ActionCenterItem[];
}

function formatTimeToAmPm(timeStr: string | undefined): string {
  if (!timeStr) return "N/A";
  const parts = timeStr.split(":");
  const h = parseInt(parts[0] || "0", 10);
  const m = parseInt(parts[1] || "0", 10);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
}

export class AnalyticsService {
  private get staffRepository(): Repository<Staff> {
    return AppDataSource.getRepository(Staff);
  }
  private get classroomRepository(): Repository<Classroom> {
    return AppDataSource.getRepository(Classroom);
  }
  private get studentRepository(): Repository<Student> {
    return AppDataSource.getRepository(Student);
  }
  private get attendanceRepository(): Repository<Attendance> {
    return AppDataSource.getRepository(Attendance);
  }

  private get classroomActivityRepository(): Repository<ClassroomActivity> {
    return AppDataSource.getRepository(ClassroomActivity);
  }

  private get parentRepository(): Repository<Parent> {
    return AppDataSource.getRepository(Parent);
  }

  private get invoicePaymentRepository(): Repository<InvoicePayment> {
    return AppDataSource.getRepository(InvoicePayment);
  }

  private get invoiceRepository(): Repository<Invoice> {
    return AppDataSource.getRepository(Invoice);
  }

  private get formRepository(): Repository<Form> {
    return AppDataSource.getRepository(Form);
  }

  private get studentAssessmentScoreRepository(): Repository<StudentAssessmentScore> {
    return AppDataSource.getRepository(StudentAssessmentScore);
  }

  private get classroomStudentActivityRepository(): Repository<ClassroomStudentActivity> {
    return AppDataSource.getRepository(ClassroomStudentActivity);
  }

  private get tourBookingRepository(): Repository<TourBooking> {
    return AppDataSource.getRepository(TourBooking);
  }

  private resolveAdminDateRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
    if (startDate && endDate) {
      return {
        start: getNigeriaStartOfDay(new Date(startDate)),
        end: getNigeriaEndOfDay(new Date(endDate)),
      };
    }
    return getNigeriaWeekRangeContaining(new Date());
  }

  private getAttendanceReportDateRange(filters: AttendanceReportFilters): { start: Date; end: Date } {
    const now = new Date();
    if (filters.startDate && filters.endDate) {
      return {
        start: getNigeriaStartOfDay(new Date(filters.startDate)),
        end: getNigeriaEndOfDay(new Date(filters.endDate)),
      };
    }
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: getNigeriaStartOfDay(startOfMonth),
      end: getNigeriaEndOfDay(endOfMonth),
    };
  }

  async getAttendanceReport(filters: AttendanceReportFilters): Promise<AttendanceReportResponse> {
    switch (filters.type) {
      case "classrooms":
        return this.getAttendanceClassroomsReport(filters);
      case "check-in-out":
        return this.getAttendanceCheckInOutReport(filters);
      default:
        return { success: false, message: `Unknown report type: ${filters.type}` };
    }
  }

  private async getAttendanceClassroomsReport(filters: AttendanceReportFilters): Promise<AttendanceReportResponse> {
    try {
      const { schoolId, classroomId, pos= 0, delta = 10 } = filters;
      const { end } = this.getAttendanceReportDateRange(filters);
      const today = getNigeriaStartOfDay();
      const targetDate = formatDateKey(end > today ? today : end);

      const classroomQb = this.classroomRepository
        .createQueryBuilder("classroom")
        .select(["classroom.id", "classroom.classroomName"])
        .where("classroom.schoolId = :schoolId", { schoolId });

      if (classroomId) {
        classroomQb.andWhere("classroom.id = :classroomId", { classroomId });
      }

      const classrooms = await classroomQb.getMany();

      if (classrooms.length === 0) {
        return {
          success: true,
          message: "No classrooms found",
          data: [],
          pagination: { pos, delta, total: 0 },
        };
      }

      const classroomIds = classrooms.map((c) => c.id);

      const studentsInQuery = this.attendanceRepository
        .createQueryBuilder("attendance")
        .select("attendance.classroomId", "classroomId")
        .addSelect("COUNT(DISTINCT attendance.studentId)", "studentsIn")
        .where("attendance.schoolId = :schoolId", { schoolId })
        .andWhere("attendance.studentId IS NOT NULL")
        .andWhere("attendance.classroomId IN (:...classroomIds)", { classroomIds })
        .andWhere("attendance.date = :targetDate", { targetDate })
        .andWhere("attendance.status IN (:...statuses)", {
          statuses: [AttendanceStatus.PRESENT, AttendanceStatus.LATE],
        })
        .andWhere("attendance.timeOut IS NULL")
        .groupBy("attendance.classroomId");

      const staffInQuery = this.attendanceRepository
        .createQueryBuilder("attendance")
        .select("scas.classroomId", "classroomId")
        .addSelect("COUNT(DISTINCT attendance.teacherId)", "staffIn")
        .innerJoin(
          StaffClassesAndSubject,
          "scas",
          "scas.staffId = attendance.teacherId AND scas.classroomId IN (:...classroomIds)",
          { classroomIds }
        )
        .where("attendance.schoolId = :schoolId", { schoolId })
        .andWhere("attendance.teacherId IS NOT NULL")
        .andWhere("attendance.date = :targetDate", { targetDate })
        .andWhere("attendance.status IN (:...statuses)", {
          statuses: [AttendanceStatus.PRESENT, AttendanceStatus.LATE],
        })
        .andWhere("attendance.timeOut IS NULL")
        .groupBy("scas.classroomId");

      const [studentsInRaw, staffInRaw] = await Promise.all([
        studentsInQuery.getRawMany(),
        staffInQuery.getRawMany(),
      ]);

      const staffInByClassroom = staffInRaw.reduce(
        (acc, r) => {
          acc[r.classroomId] = parseInt(r.staffIn, 10) || 0;
          return acc;
        },
        {} as Record<number, number>
      );
      const studentsInByClassroom = studentsInRaw.reduce(
        (acc, r) => {
          acc[r.classroomId] = parseInt(r.studentsIn, 10) || 0;
          return acc;
        },
        {} as Record<number, number>
      );

      const data = classrooms.map((c) => {
        const studentsIn = studentsInByClassroom[c.id] ?? 0;
        const staffIn = staffInByClassroom[c.id] ?? 0;
        const ratio = staffIn > 0 ? `1:${Math.ceil(studentsIn / staffIn) || 1}` : "0:0";
        return {
          classroomId: c.id,
          className: c.classroomName,
          studentsIn,
          staffIn,
          ratio,
        };
      });

      const total = data.length;
      const offset = pos ?? 0;
      const limit = delta ?? 10;
      const paginatedData = data.slice(offset, offset + limit);

      return {
        success: true,
        message: "Attendance classrooms report retrieved successfully",
        data: paginatedData,
        pagination: { pos: offset, delta: limit, total },
      };
    } catch (error) {
      logger.error("Error in getAttendanceClassroomsReport:", error);
      return {
        success: false,
        message: "Failed to retrieve classrooms report",
      };
    }
  }

  private async getAttendanceCheckInOutReport(filters: AttendanceReportFilters): Promise<AttendanceReportResponse> {
    try {
      const { schoolId, classroomId, status, pos = 0, delta = 10 } = filters;
      const { start, end } = this.getAttendanceReportDateRange(filters);
      const offset = typeof pos === "number" && pos >= 0 ? pos : (pos - 1) * delta;

      const qb = this.attendanceRepository
        .createQueryBuilder("attendance")
        .select(["attendance.id", "attendance.timeIn", "attendance.timeOut", "attendance.notes", "attendance.status", "attendance.createdAt"])
        .leftJoinAndSelect("attendance.student", "student")
        .leftJoinAndSelect("student.user", "user")
        .where("attendance.schoolId = :schoolId", { schoolId })
        .andWhere("attendance.studentId IS NOT NULL")
        .andWhere("attendance.date >= :startDate", { startDate: formatDateKey(start) })
        .andWhere("attendance.date <= :endDate", { endDate: formatDateKey(end) })
        .orderBy("attendance.createdAt", "DESC");

      if (classroomId) {
        qb.andWhere("attendance.classroomId = :classroomId", { classroomId });
      }
      if (status) {
        qb.andWhere("attendance.status = :status", { status });
      }

      const [rows, total] = await Promise.all([
        qb.clone().skip(offset).take(delta).getMany(),
        qb.getCount(),
      ]);

      const data = rows.map((att: { id?: number; timeIn?: string; timeOut?: string; notes?: string; status?: string; student?: { user?: { firstName?: string; lastName?: string } } }) => {
        const firstName = att.student?.user?.firstName ?? "";
        const lastName = att.student?.user?.lastName ?? "";
        const childName = [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
        return {
          id: att.id,
          childName,
          timeIn: att.timeIn ? formatTimeToAmPm(att.timeIn) : "N/A",
          timeOut: att.timeOut ? formatTimeToAmPm(att.timeOut) : "N/A",
          reasonNote: att.notes || "-",
          status: att.status || "unknown",
        };
      });

      return {
        success: true,
        message: "Check in/out report retrieved successfully",
        data,
        pagination: { pos, delta, total },
      };
    } catch (error) {
      logger.error("Error in getAttendanceCheckInOutReport:", error);
      return {
        success: false,
        message: "Failed to retrieve check-in/out report",
      };
    }
  }

  private async getStaffClassroomIds(staffId: number): Promise<number[]> {
    const staffClassroomRepository = AppDataSource.getRepository(StaffClassesAndSubject);
    const assignedClassrooms = await staffClassroomRepository
      .createQueryBuilder('staffClass')
      .select('staffClass.classroomId', 'classroomId')
      .where('staffClass.staffId = :staffId', { staffId })
      .distinct(true)
      .getRawMany();

    return assignedClassrooms.map(row => row.classroomId);
  }

  /**
   * Analytics date windows use Africa/Lagos calendar day boundaries via getNigeriaStartOfDay / getNigeriaEndOfDay.
   * Semantics: student/staff/classroom "headline" totals in detailed helpers are cumulative as-of `end` where noted;
   * admissions detailed counts new enrollments in [start,end]; attendance uses attendance rows in [start,end].
   * Previous window [prevStart, prevEnd] has the same span as [start, end] and ends the instant before `start`.
   */
  private getDateRange(filters: AnalyticsFilters) {
    const { startDate, endDate, periodType } = filters;
    const end = endDate ? getNigeriaEndOfDay(new Date(endDate)) : getNigeriaEndOfDay(new Date());

    let start: Date;
    if (startDate) {
      start = getNigeriaStartOfDay(new Date(startDate));
    } else {
      const anchor = new Date(end.getTime());
      start = getNigeriaStartOfDay(anchor);
      switch (periodType) {
        case 'weekly':
          start.setDate(start.getDate() - 7);
          start = getNigeriaStartOfDay(start);
          break;
        case 'monthly':
          start.setMonth(start.getMonth() - 1);
          start = getNigeriaStartOfDay(start);
          break;
        case 'yearly':
          start.setFullYear(start.getFullYear() - 1);
          start = getNigeriaStartOfDay(start);
          break;
        default:
          start = getNigeriaStartOfDay(anchor);
      }
    }

    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.max(Math.ceil(timeDiff / (1000 * 60 * 60 * 24)), 1);

    const prevStartRaw = new Date(start);
    prevStartRaw.setDate(prevStartRaw.getDate() - daysDiff);
    const prevStart = getNigeriaStartOfDay(prevStartRaw);

    const dayBeforeStart = new Date(start);
    dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
    const prevEnd = getNigeriaEndOfDay(dayBeforeStart);

    return { start, end, prevStart, prevEnd, daysDiff };
  }

  /**
   * Internal methods for dashboard - return detailed stats without graphs
   */

  /**
   * Period-based student attendance metrics (distinct student×day, all calendar days in range; expected slots from schedules).
   * Used for dashboard attendance, growth, and student attendance API metadata.
   */
  private async computeStudentAttendanceMetricsForRange(
    filters: AnalyticsFilters,
    rangeStart: Date,
    rangeEnd: Date,
    preloadedActiveStudents?: { studentId?: string; schedule?: unknown }[]
  ): Promise<{ rate: number; present: number; late: number; absent: number; expectedRecords: number }> {
    const { schoolId, classroomId, studentId, staffId } = filters;

    let activeStudents: { studentId?: string; schedule?: unknown }[];
    if (preloadedActiveStudents) {
      activeStudents = preloadedActiveStudents;
    } else {
      const studentPopulationQuery = this.studentRepository
        .createQueryBuilder('student')
        .select(['student.id as "studentId"', 'student.schedule as "schedule"'])
        .where('student.status = :status', { status: StudentStatus.ACTIVE });

      if (schoolId) studentPopulationQuery.andWhere('student.schoolId = :schoolId', { schoolId });
      if (classroomId) studentPopulationQuery.andWhere('student.classroomId = :classroomId', { classroomId });
      if (studentId) studentPopulationQuery.andWhere('student.id = :studentId', { studentId });
      if (staffId) {
        const staffClassroomIds = await this.getStaffClassroomIds(staffId);
        if (staffClassroomIds.length > 0) {
          studentPopulationQuery.andWhere('student.classroomId IN (:...staffClassroomIds)', { staffClassroomIds });
        } else {
          studentPopulationQuery.andWhere('1 = 0');
        }
      }

      activeStudents = await studentPopulationQuery.getRawMany();
    }

    const studentDayKey = `CONCAT(CAST(attendance.studentId AS VARCHAR), '|', CAST(attendance.date AS VARCHAR))`;

    const studentStatsQuery = this.attendanceRepository
      .createQueryBuilder('attendance')
      .select([
        `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN ${studentDayKey} END) as present`,
        `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.ABSENT}' THEN ${studentDayKey} END) as reported_absent`,
        `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN ${studentDayKey} END) as late`,
      ])
      .where('attendance.date BETWEEN :start AND :end', { start: rangeStart, end: rangeEnd })
      .andWhere('attendance.studentId IS NOT NULL');

    if (schoolId) studentStatsQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });
    if (classroomId) studentStatsQuery.andWhere('attendance.classroomId = :classroomId', { classroomId });
    if (studentId) studentStatsQuery.andWhere('attendance.studentId = :studentId', { studentId });
    if (staffId) {
      const staffClassroomIds2 = await this.getStaffClassroomIds(staffId);
      if (staffClassroomIds2.length > 0) {
        studentStatsQuery.innerJoin('attendance.student', 'student');
        studentStatsQuery.andWhere('student.classroomId IN (:...staffClassroomIds)', { staffClassroomIds: staffClassroomIds2 });
      } else {
        studentStatsQuery.andWhere('1 = 0');
      }
    }

    const studentStats = await studentStatsQuery.getRawOne();

    const studentPresent = studentStats ? (parseInt(studentStats.present, 10) || 0) : 0;
    const studentReportedAbsent = studentStats ? (parseInt(studentStats.reported_absent, 10) || 0) : 0;
    const studentLate = studentStats ? (parseInt(studentStats.late, 10) || 0) : 0;

    const expectedRecords = activeStudents.reduce((sum, s) => {
      const raw = s.schedule;
      const sched: string[] = typeof raw === 'string' && raw.length > 0 ? raw.split(',').map((d: string) => d.trim()) : (Array.isArray(raw) ? raw : []);
      return sum + this.countScheduledDays(rangeStart, rangeEnd, sched.length > 0 ? sched : undefined);
    }, 0);

    const studentAttended = studentPresent + studentLate;
    const studentAbsent = Math.max(studentReportedAbsent, expectedRecords - studentAttended);
    const rate = expectedRecords > 0 ? (studentAttended / expectedRecords) * 100 : 0;

    return {
      rate,
      present: studentPresent,
      late: studentLate,
      absent: studentAbsent,
      expectedRecords
    };
  }

  /**
   * Period-based staff attendance metrics (distinct staff×day, all calendar days in range; expected slots from schedules).
   */
  private async computeStaffAttendanceMetricsForRange(
    filters: AnalyticsFilters,
    rangeStart: Date,
    rangeEnd: Date,
    preloadedActiveStaff?: { staffId?: string; daysPerWeek?: unknown }[]
  ): Promise<{ rate: number; present: number; late: number; absent: number; expectedRecords: number }> {
    const { schoolId, staffId } = filters;

    let activeStaff: { staffId?: string; daysPerWeek?: unknown }[];
    if (preloadedActiveStaff) {
      activeStaff = preloadedActiveStaff;
    } else {
      const staffPopulationQuery = this.staffRepository
        .createQueryBuilder('staff')
        .select(['staff.id as "staffId"', 'staff.daysPerWeek as "daysPerWeek"'])
        .where('staff.status = :status', { status: StaffStatus.ACTIVE });

      if (schoolId) staffPopulationQuery.andWhere('staff.schoolId = :schoolId', { schoolId });
      if (staffId) staffPopulationQuery.andWhere('staff.id = :staffId', { staffId });

      activeStaff = await staffPopulationQuery.getRawMany();
    }

    const staffDayKey = `CONCAT(CAST(attendance.teacherId AS VARCHAR), '|', CAST(attendance.date AS VARCHAR))`;

    const staffStatsQuery = this.attendanceRepository
      .createQueryBuilder('attendance')
      .select([
        `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN ${staffDayKey} END) as present`,
        `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.ABSENT}' THEN ${staffDayKey} END) as reported_absent`,
        `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN ${staffDayKey} END) as late`,
      ])
      .where('attendance.date BETWEEN :start AND :end', { start: rangeStart, end: rangeEnd })
      .andWhere('attendance.teacherId IS NOT NULL');

    if (schoolId) staffStatsQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });
    if (staffId) staffStatsQuery.andWhere('attendance.teacherId = :staffId', { staffId });

    const staffStats = await staffStatsQuery.getRawOne();

    const staffPresent = staffStats ? (parseInt(staffStats.present, 10) || 0) : 0;
    const staffReportedAbsent = staffStats ? (parseInt(staffStats.reported_absent, 10) || 0) : 0;
    const staffLate = staffStats ? (parseInt(staffStats.late, 10) || 0) : 0;

    const expectedRecords = activeStaff.reduce((sum, s) => {
      const raw = s.daysPerWeek;
      const sched: string[] = Array.isArray(raw) ? raw : (typeof raw === 'string' && raw.length > 0 ? raw.split(',').map((d: string) => d.trim()) : []);
      return sum + this.countScheduledDays(rangeStart, rangeEnd, sched.length > 0 ? sched : undefined);
    }, 0);

    const staffAttended = staffPresent + staffLate;
    const staffAbsent = Math.max(staffReportedAbsent, expectedRecords - staffAttended);
    const rate = expectedRecords > 0 ? (staffAttended / expectedRecords) * 100 : 0;

    return {
      rate,
      present: staffPresent,
      late: staffLate,
      absent: staffAbsent,
      expectedRecords
    };
  }

  private async getStudentStatsDetailed(filters: AnalyticsFilters) {
    const { schoolId, staffId, classroomId: filterClassroomId } = filters;
    const { end, prevEnd } = this.getDateRange(filters);

    // If staffId is provided, get the classrooms assigned to this staff member
    let classroomIds: number[] = [];
    if (staffId) {
      classroomIds = await this.getStaffClassroomIds(staffId);
    }

    const statusCountsQuery = this.studentRepository
      .createQueryBuilder('student')
      .leftJoin('student.user', 'user')
      .select([
        'COUNT(*) as total',
        `SUM(CASE WHEN student.status = '${StudentStatus.ACTIVE}' THEN 1 ELSE 0 END) as active`,
        `SUM(CASE WHEN student.status = '${StudentStatus.INACTIVE}' THEN 1 ELSE 0 END) as inactive`,
        `SUM(CASE WHEN student.status = '${StudentStatus.SUSPENDED}' THEN 1 ELSE 0 END) as suspended`,
        `SUM(CASE WHEN student.status = '${StudentStatus.ACTIVE}' AND user.gender = '${Gender.MALE}' THEN 1 ELSE 0 END) as male`,
        `SUM(CASE WHEN student.status = '${StudentStatus.ACTIVE}' AND user.gender = '${Gender.FEMALE}' THEN 1 ELSE 0 END) as female`,
        `SUM(CASE WHEN student.status = '${StudentStatus.ACTIVE}' AND (user.gender NOT IN ('${Gender.MALE}', '${Gender.FEMALE}') OR user.gender IS NULL) THEN 1 ELSE 0 END) as other`,
      ])
      .where('student.createdAt <= :end', { end });

    if (schoolId) {
      statusCountsQuery.andWhere('student.schoolId = :schoolId', { schoolId });
    }

    if (filterClassroomId) {
      statusCountsQuery.andWhere('student.classroomId = :classroomId', { classroomId: filterClassroomId });
    }

    // If staffId is provided, filter by assigned classrooms
    if (staffId && classroomIds.length > 0) {
      statusCountsQuery.andWhere('student.classroomId IN (:...classroomIds)', { classroomIds });
    } else if (staffId && classroomIds.length === 0) {
      // If staff has no assigned classrooms, return zero stats
      return { total: 0, active: 0, male: 0, female: 0, other: 0, percentageGrowth: 0 };
    }

    const prevQuery = this.studentRepository
      .createQueryBuilder('student')
      .where('student.createdAt <= :prevEnd', { prevEnd });

    if (schoolId) {
      prevQuery.andWhere('student.schoolId = :schoolId', { schoolId });
    }

    // Apply classroom filter to previous period query as well
    if (filterClassroomId) {
      prevQuery.andWhere('student.classroomId = :classroomId', { classroomId: filterClassroomId });
    }
    if (staffId && classroomIds.length > 0) {
      prevQuery.andWhere('student.classroomId IN (:...classroomIds)', { classroomIds });
    }

    const [prevTotal, result] = await Promise.all([prevQuery.getCount(), statusCountsQuery.getRawOne()]);

    const total = result ? (parseInt(result.total, 10) || 0) : 0;
    const active = result ? (parseInt(result.active, 10) || 0) : 0;
    const male = result ? (parseInt(result.male, 10) || 0) : 0;
    const female = result ? (parseInt(result.female, 10) || 0) : 0;
    const other = result ? (parseInt(result.other, 10) || 0) : 0;
    const percentageGrowth = computeRelativeGrowthPercent(total, prevTotal);

    return { total, active, male, female, other, percentageGrowth };
  }

  private async getAdmissionsStatsDetailed(filters: AnalyticsFilters) {
    const { schoolId, classroomId } = filters;
    const { start, end, prevStart, prevEnd } = this.getDateRange(filters);

    const thisPeriodQuery = this.studentRepository
      .createQueryBuilder('student')
      .where('student.createdAt BETWEEN :start AND :end', { start, end });

    const lastPeriodQuery = this.studentRepository
      .createQueryBuilder('student')
      .where('student.createdAt BETWEEN :start AND :end', { start: prevStart, end: prevEnd });

    if (schoolId) {
      thisPeriodQuery.andWhere('student.schoolId = :schoolId', { schoolId });
      lastPeriodQuery.andWhere('student.schoolId = :schoolId', { schoolId });
    }

    if (classroomId) {
      thisPeriodQuery.andWhere('student.classroomId = :classroomId', { classroomId });
      lastPeriodQuery.andWhere('student.classroomId = :classroomId', { classroomId });
    }

    const { staffId } = filters;
    if (staffId) {
      const classroomIds = await this.getStaffClassroomIds(staffId);
      if (classroomIds.length > 0) {
        thisPeriodQuery.andWhere('student.classroomId IN (:...classroomIds)', { classroomIds });
        lastPeriodQuery.andWhere('student.classroomId IN (:...classroomIds)', { classroomIds });
      } else {
        return { total: 0, thisMonth: 0, percentageGrowth: 0 };
      }
    }

    const [thisPeriod, lastPeriod] = await Promise.all([
      thisPeriodQuery.getCount(),
      lastPeriodQuery.getCount()
    ]);

    const percentageGrowth = computeRelativeGrowthPercent(thisPeriod, lastPeriod);

    return { total: thisPeriod, thisMonth: thisPeriod, percentageGrowth };
  }

  private async getStaffStatsDetailed(filters: AnalyticsFilters) {
    const { schoolId, classroomId } = filters;
    const { end, prevEnd } = this.getDateRange(filters);

    const statusQuery = this.staffRepository
      .createQueryBuilder('staff')
      .select([
        'COUNT(*) as total',
        `SUM(CASE WHEN staff.status = '${StaffStatus.ACTIVE}' THEN 1 ELSE 0 END) as active`,
      ])
      .where('staff.createdAt <= :end', { end });

    if (schoolId) {
      statusQuery.andWhere('staff.schoolId = :schoolId', { schoolId });
    }

    if (classroomId) {
      statusQuery.andWhere(
        `staff.id IN (SELECT DISTINCT "staffId" FROM "staffClassesAndSubject" WHERE "classroomId" = :classroomId)`,
        { classroomId }
      );
    }

    const prevQuery = this.staffRepository
      .createQueryBuilder('staff')
      .where('staff.createdAt <= :prevEnd', { prevEnd });

    if (schoolId) {
      prevQuery.andWhere('staff.schoolId = :schoolId', { schoolId });
    }

    if (classroomId) {
      prevQuery.andWhere(
        `staff.id IN (SELECT DISTINCT "staffId" FROM "staffClassesAndSubject" WHERE "classroomId" = :classroomId)`,
        { classroomId }
      );
    }

    if (filters.staffId) {
      statusQuery.andWhere('staff.id = :staffId', { staffId: filters.staffId });
      prevQuery.andWhere('staff.id = :staffId', { staffId: filters.staffId });
    }

    const [statusResult, prevTotal] = await Promise.all([
      statusQuery.getRawOne(),
      prevQuery.getCount()
    ]);

    const total = statusResult ? (parseInt(statusResult.total, 10) || 0) : 0;
    const active = statusResult ? (parseInt(statusResult.active, 10) || 0) : 0;
    const percentageGrowth = computeRelativeGrowthPercent(total, prevTotal);

    return { total, active, percentageGrowth };
  }

  private async getClassroomStatsDetailed(filters: AnalyticsFilters) {
    const { schoolId, classroomId } = filters;
    const { end } = this.getDateRange(filters);

    const statsQuery = this.classroomRepository
      .createQueryBuilder('classroom')
      .select([
        'COUNT(*) as total',
        `SUM(CASE WHEN classroom.classroomStatus = '${ClassroomStatus.ACTIVE}' THEN 1 ELSE 0 END) as active`,
        'SUM(classroom.maximumCapacity) as totalCapacity',
      ])
      .where('classroom.createdAt <= :end', { end });

    const classroomsQuery = this.classroomRepository
      .createQueryBuilder('classroom')
      .select([
        '(SELECT COUNT(*) FROM student WHERE student."classroomId" = classroom.id) as enrolled',
      ])
      .where('classroom.createdAt <= :end', { end });

    if (schoolId) {
      statsQuery.andWhere('classroom.schoolId = :schoolId', { schoolId });
      classroomsQuery.andWhere('classroom.schoolId = :schoolId', { schoolId });
    }

    if (classroomId) {
      statsQuery.andWhere('classroom.id = :classroomId', { classroomId });
      classroomsQuery.andWhere('classroom.id = :classroomId', { classroomId });
    }

    const { staffId } = filters;
    if (staffId) {
      const classroomIds = await this.getStaffClassroomIds(staffId);
      if (classroomIds.length > 0) {
        statsQuery.andWhere('classroom.id IN (:...classroomIds)', { classroomIds });
        classroomsQuery.andWhere('classroom.id IN (:...classroomIds)', { classroomIds });
      } else {
        return { total: 0, active: 0, utilizationRate: 0 };
      }
    }

    const [statsResult, classroomResults] = await Promise.all([
      statsQuery.getRawOne(),
      classroomsQuery.getRawMany()
    ]);

    const total = statsResult ? (parseInt(statsResult.total, 10) || 0) : 0;
    const active = statsResult ? (parseInt(statsResult.active, 10) || 0) : 0;
    const totalCapacity = statsResult ? (parseInt(statsResult.totalcapacity, 10) || 0) : 0;

    let totalEnrolled = 0;
    classroomResults.forEach(row => {
      totalEnrolled += parseInt(row.enrolled, 10) || 0;
    });

    const utilizationRate = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;

    return { total, active, utilizationRate };
  }

  private async getAttendanceStatsDetailed(filters: AnalyticsFilters) {
    const { start, end, prevStart, prevEnd } = this.getDateRange(filters);

    const [
      curStudent,
      prevStudent,
      curStaff,
      prevStaff,
    ] = await Promise.all([
      this.computeStudentAttendanceMetricsForRange(filters, start, end),
      this.computeStudentAttendanceMetricsForRange(filters, prevStart, prevEnd),
      this.computeStaffAttendanceMetricsForRange(filters, start, end),
      this.computeStaffAttendanceMetricsForRange(filters, prevStart, prevEnd),
    ]);

    const studentPercentageGrowth = computeRelativeGrowthPercent(curStudent.rate, prevStudent.rate);
    const staffPercentageGrowth = computeRelativeGrowthPercent(curStaff.rate, prevStaff.rate);

    const combinedExpected = curStudent.expectedRecords + curStaff.expectedRecords;
    const combinedAttended = (curStudent.present + curStudent.late) + (curStaff.present + curStaff.late);
    const combinedRate = combinedExpected > 0 ? (combinedAttended / combinedExpected) * 100 : 0;

    const prevCombinedExpected = prevStudent.expectedRecords + prevStaff.expectedRecords;
    const prevCombinedAttended = (prevStudent.present + prevStudent.late) + (prevStaff.present + prevStaff.late);
    const prevCombinedRate = prevCombinedExpected > 0 ? (prevCombinedAttended / prevCombinedExpected) * 100 : 0;
    const combinedPercentageGrowth = computeRelativeGrowthPercent(combinedRate, prevCombinedRate);

    return {
      student: {
        rate: curStudent.rate,
        present: curStudent.present,
        absent: curStudent.absent,
        late: curStudent.late,
        percentageGrowth: studentPercentageGrowth,
        expectedSlots: curStudent.expectedRecords
      },
      staff: {
        rate: curStaff.rate,
        present: curStaff.present,
        absent: curStaff.absent,
        late: curStaff.late,
        percentageGrowth: staffPercentageGrowth,
        expectedSlots: curStaff.expectedRecords
      },
      combined: {
        rate: combinedRate,
        present: curStudent.present + curStaff.present,
        absent: curStudent.absent + curStaff.absent,
        late: curStudent.late + curStaff.late,
        percentageGrowth: combinedPercentageGrowth,
        expectedSlots: combinedExpected
      }
    };
  }

  private async getDashboardAttendanceTrend(filters: AnalyticsFilters): Promise<{
    periodType: 'daily' | 'weekly' | 'monthly' | 'yearly';
    xAxis: string[];
    present: number[];
    absent: number[];
    late: number[];
  }> {
    const { schoolId, periodType, staffId, classroomId } = filters;
    const { start, end } = this.getDateRange(filters);

    // Get active students with schedules for population-aware calculations
    const studentPopulationQuery = this.studentRepository
      .createQueryBuilder('student')
      .select(['student.id as "studentId"', 'student.schedule as "schedule"'])
      .where('student.status = :status', { status: StudentStatus.ACTIVE });

    if (schoolId) {
      studentPopulationQuery.andWhere('student.schoolId = :schoolId', { schoolId });
    }
    if (classroomId) {
      studentPopulationQuery.andWhere('student.classroomId = :classroomId', { classroomId });
    }
    if (staffId) {
      const staffClassroomIds = await this.getStaffClassroomIds(staffId);
      if (staffClassroomIds.length > 0) {
        studentPopulationQuery.andWhere('student.classroomId IN (:...staffClassroomIds)', { staffClassroomIds });
      } else {
        studentPopulationQuery.andWhere('1 = 0');
      }
    }

    const activeStudents = await studentPopulationQuery.getRawMany();
    const studentScheduleArrays = activeStudents.map(s => {
      const raw = s.schedule;
      const sched: string[] = typeof raw === 'string' && raw.length > 0 ? raw.split(',').map((d: string) => d.trim()) : (Array.isArray(raw) ? raw : []);
      return { schedule: sched.length > 0 ? sched : undefined };
    });

    const optimalPeriodType = this.determineOptimalPeriodType(start, end, periodType);

    const dateExpr = this.getDateTruncExpression(optimalPeriodType);

    const attendanceTrendQuery = this.attendanceRepository
      .createQueryBuilder('attendance')
      .select([
        `${dateExpr} as date`,
        `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN attendance.studentId END) as present`,
        `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.ABSENT}' THEN attendance.studentId END) as reported_absent`,
        `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN attendance.studentId END) as late`,
      ])
      .where('attendance.date BETWEEN :start AND :end', { start, end })
      .andWhere('attendance.studentId IS NOT NULL')
      .groupBy(dateExpr)
      .orderBy(dateExpr, 'ASC');

    if (schoolId) {
      attendanceTrendQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });
    }

    if (classroomId) {
      attendanceTrendQuery.andWhere('attendance.classroomId = :classroomId', { classroomId });
    }

    if (staffId) {
      const staffClassroomIds = await this.getStaffClassroomIds(staffId);
      if (staffClassroomIds.length > 0) {
        attendanceTrendQuery.innerJoin('attendance.student', 'student');
        attendanceTrendQuery.andWhere('student.classroomId IN (:...staffClassroomIds)', { staffClassroomIds });
      } else {
        attendanceTrendQuery.andWhere('1 = 0');
      }
    }

    const attendanceTrend = await attendanceTrendQuery.getRawMany();

    const filledTrend = this.fillMissingAttendancePeriods(
      start,
      end,
      attendanceTrend.map(row => {
        const periodDate = new Date(row.date);
        const scheduledForPeriod = this.countScheduledStudentsForDate(periodDate, studentScheduleArrays);
        const present = parseInt(row.present, 10) || 0;
        const reportedAbsent = parseInt(row.reported_absent, 10) || 0;
        const late = parseInt(row.late, 10) || 0;
        const derivedAbsent = Math.max(reportedAbsent, scheduledForPeriod - (present + late));

        return {
          period: formatDateKey(periodDate),
          present,
          absent: derivedAbsent,
          late,
          total: scheduledForPeriod,
          rate: 0
        };
      }),
      optimalPeriodType
    );

    const finalTrend = filledTrend.map(item => {
      if (item.present === 0 && item.late === 0 && item.absent === 0) {
        const periodDate = new Date(item.period);
        const scheduledForPeriod = this.countScheduledStudentsForDate(periodDate, studentScheduleArrays);
        return { ...item, absent: scheduledForPeriod };
      }
      return item;
    });

    return {
      periodType: optimalPeriodType,
      xAxis: finalTrend.map(item => this.formatDateLabel(item.period, optimalPeriodType)),
      present: finalTrend.map(item => item.present),
      absent: finalTrend.map(item => item.absent),
      late: finalTrend.map(item => item.late),
    };
  }

  /**
   * Get student statistics including total, active, inactive, and suspended counts
   */
  async getStudentStats(filters: AnalyticsFilters): Promise<StudentStatsResponse> {
    try {
      const { schoolId, staffId, classroomId: filterClassroomId } = filters;
      const { end, prevEnd } = this.getDateRange(filters);

      let classroomIds: number[] = [];
      if (staffId) {
        classroomIds = await this.getStaffClassroomIds(staffId);
      }

      const statusCountsQuery = this.studentRepository
        .createQueryBuilder('student')
        .leftJoin('student.user', 'user')
        .select([
          'COUNT(*) as total',
          `SUM(CASE WHEN student.status = '${StudentStatus.ACTIVE}' THEN 1 ELSE 0 END) as active`,
          `SUM(CASE WHEN student.status = '${StudentStatus.INACTIVE}' THEN 1 ELSE 0 END) as inactive`,
          `SUM(CASE WHEN student.status = '${StudentStatus.SUSPENDED}' THEN 1 ELSE 0 END) as suspended`,
          `SUM(CASE WHEN student.status = '${StudentStatus.ACTIVE}' AND user.gender = '${Gender.MALE}' THEN 1 ELSE 0 END) as male`,
          `SUM(CASE WHEN student.status = '${StudentStatus.ACTIVE}' AND user.gender = '${Gender.FEMALE}' THEN 1 ELSE 0 END) as female`,
          `SUM(CASE WHEN student.status = '${StudentStatus.ACTIVE}' AND (user.gender NOT IN ('${Gender.MALE}', '${Gender.FEMALE}') OR user.gender IS NULL) THEN 1 ELSE 0 END) as other`,
        ])
        .where('student.createdAt <= :end', { end });

      if (schoolId) {
        statusCountsQuery.andWhere('student.schoolId = :schoolId', { schoolId });
      }

      if (filterClassroomId) {
        statusCountsQuery.andWhere('student.classroomId = :classroomId', { classroomId: filterClassroomId });
      }

      if (staffId && classroomIds.length > 0) {
        statusCountsQuery.andWhere('student.classroomId IN (:...classroomIds)', { classroomIds });
      } else if (staffId && classroomIds.length === 0) {
        return {
          success: true,
          message: 'Student statistics retrieved successfully',
          data: {
            total: 0,
            active: 0,
            inactive: 0,
            suspended: 0,
            xAxis: ['Male', 'Female', 'Other'],
            yAxis: [0, 0, 0]
          },
          metadata: {
            xAxisLabel: 'Gender',
            yAxisLabel: 'Count',
            percentageGrowth: 0
          },
        };
      }

      const prevQuery = this.studentRepository
        .createQueryBuilder('student')
        .where('student.createdAt <= :prevEnd', { prevEnd });

      if (schoolId) {
        prevQuery.andWhere('student.schoolId = :schoolId', { schoolId });
      }

      if (filterClassroomId) {
        prevQuery.andWhere('student.classroomId = :classroomId', { classroomId: filterClassroomId });
      }

      if (staffId && classroomIds.length > 0) {
        prevQuery.andWhere('student.classroomId IN (:...classroomIds)', { classroomIds });
      }

      const [prevTotal, result] = await Promise.all([
        prevQuery.getCount(),
        statusCountsQuery.getRawOne()
      ]);

      const total = result ? (parseInt(result.total, 10) || 0) : 0;
      const active = result ? (parseInt(result.active, 10) || 0) : 0;
      const inactive = result ? (parseInt(result.inactive, 10) || 0) : 0;
      const suspended = result ? (parseInt(result.suspended, 10) || 0) : 0;
      const male = result ? (parseInt(result.male, 10) || 0) : 0;
      const female = result ? (parseInt(result.female, 10) || 0) : 0;
      const other = result ? (parseInt(result.other, 10) || 0) : 0;
      const percentageGrowth = computeRelativeGrowthPercent(total, prevTotal);

      return {
        success: true,
        message: 'Student statistics retrieved successfully',
        data: {
          total,
          active,
          inactive,
          suspended,
          xAxis: ['Male', 'Female', 'Other'],
          yAxis: [male, female, other]
        },
        metadata: {
          xAxisLabel: 'Gender',
          yAxisLabel: 'Count',
          percentageGrowth: Math.round(percentageGrowth * 100) / 100
        },
      };
    } catch (error) {
      logger.error('Error fetching student statistics:', error);
      return {
        success: false,
        message: 'Failed to retrieve student statistics',
      };
    }
  }

  /**
   * Get admissions statistics with automatic period aggregation
   */
  async getAdmissionsStats(filters: AnalyticsFilters): Promise<AdmissionsStatsResponse> {
    try {
      const { schoolId, classroomId, staffId, periodType } = filters;
      const { start, end, prevStart, prevEnd } = this.getDateRange(filters);

      const optimalPeriodType = this.determineOptimalPeriodType(start, end, periodType);
      const periodLabel = optimalPeriodType === 'daily' ? 'Days' : optimalPeriodType === 'weekly' ? 'Weeks' : optimalPeriodType === 'monthly' ? 'Months' : 'Years';

      let staffClassroomIds: number[] | undefined;
      if (staffId) {
        staffClassroomIds = await this.getStaffClassroomIds(staffId);
        if (staffClassroomIds.length === 0) {
          return {
            success: true,
            message: 'Admissions statistics retrieved successfully',
            data: {
              total: 0,
              averagePerPeriod: 0,
              xAxis: [],
              yAxis: [],
            },
            metadata: {
              xAxisLabel: periodLabel,
              yAxisLabel: 'Admissions',
              percentageGrowth: 0,
            },
          };
        }
      }

      const dateFormat = this.getDateTruncExpression(optimalPeriodType, 'student.createdAt');

      // Query with GROUP BY at database level
      const queryBuilder = this.studentRepository
        .createQueryBuilder('student')
        .select([
          `${dateFormat} as period`,
          'COUNT(*) as count'
        ])
        .where('student.createdAt BETWEEN :start AND :end', { start, end })
        .groupBy(dateFormat)
        .orderBy(dateFormat, 'ASC');

      if (schoolId) {
        queryBuilder.andWhere('student.schoolId = :schoolId', { schoolId });
      }

      if (classroomId) {
        queryBuilder.andWhere('student.classroomId = :classroomId', { classroomId });
      }

      if (staffId && staffClassroomIds) {
        queryBuilder.andWhere('student.classroomId IN (:...staffClassroomIds)', { staffClassroomIds });
      }

      const totalQuery = this.studentRepository
        .createQueryBuilder('student')
        .where('student.createdAt BETWEEN :start AND :end', { start, end });

      const prevQuery = this.studentRepository
        .createQueryBuilder('student')
        .where('student.createdAt BETWEEN :prevStart AND :prevEnd', {
          prevStart,
          prevEnd
        });

      if (schoolId) {
        prevQuery.andWhere('student.schoolId = :schoolId', { schoolId });
        totalQuery.andWhere('student.schoolId = :schoolId', { schoolId });
      }

      if (classroomId) {
        totalQuery.andWhere('student.classroomId = :classroomId', { classroomId });
        prevQuery.andWhere('student.classroomId = :classroomId', { classroomId });
      }

      if (staffId && staffClassroomIds) {
        totalQuery.andWhere('student.classroomId IN (:...staffClassroomIds)', { staffClassroomIds });
        prevQuery.andWhere('student.classroomId IN (:...staffClassroomIds)', { staffClassroomIds });
      }

      const [periodResults, total, prevTotal] = await Promise.all([
        queryBuilder.getRawMany(),
        totalQuery.getCount(),
        prevQuery.getCount()
      ]);

      const rawPeriodBreakdown = periodResults.map(row => {
        const periodDate = new Date(row.period);
        let normalizedPeriod: string;

        switch (optimalPeriodType) {
          case 'daily':
            normalizedPeriod = formatDateKey(periodDate);
            break;
          case 'weekly':
            const weekStart = new Date(periodDate);
            const day = weekStart.getDay();
            const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
            weekStart.setDate(diff);
            weekStart.setHours(0, 0, 0, 0);
            normalizedPeriod = formatDateKey(weekStart);
            break;
          case 'monthly':
            normalizedPeriod = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}-01`;
            break;
          case 'yearly':
            normalizedPeriod = `${periodDate.getFullYear()}-01-01`;
            break;
          default:
            normalizedPeriod = formatDateKey(periodDate);
        }

        return {
          period: normalizedPeriod,
          count: parseInt(row.count, 10),
          date: periodDate,
        };
      });

      const periodBreakdown = this.fillMissingPeriods(
        start,
        end,
        optimalPeriodType,
        rawPeriodBreakdown
      );

      const averagePerPeriod = periodBreakdown.length > 0 ? total / periodBreakdown.length : 0;
      const percentageGrowth = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : (total > 0 ? 100 : 0);

      return {
        success: true,
        message: 'Admissions statistics retrieved successfully',
        data: {
          total,
          averagePerPeriod: Math.round(averagePerPeriod * 100) / 100,
          xAxis: periodBreakdown.map(item => this.formatDateLabel(item.period, optimalPeriodType)),
          yAxis: periodBreakdown.map(item => item.count)
        },
        metadata: {
          xAxisLabel: periodLabel,
          yAxisLabel: 'Admissions',
          percentageGrowth: Math.round(percentageGrowth * 100) / 100
        },
      };
    } catch (error) {
      logger.error('Error fetching admissions statistics:', error);
      return {
        success: false,
        message: 'Failed to retrieve admissions statistics',
      };
    }
  }

  /**
   * Per-form submission counts and FormResponse status breakdown for the school (date range from filters).
   */
  async getFormPerformanceReport(
    filters: AnalyticsFilters & { pos?: number; delta?: number }
  ): Promise<FormPerformanceReportResponse> {
    try {
      const { schoolId } = filters;
      if (!schoolId) {
        return { success: false, message: "School ID is required" };
      }

      const { start, end } = this.getDateRange(filters);
      const pos = typeof filters.pos === "number" && filters.pos >= 0 ? filters.pos : 0;
      const delta =
        typeof filters.delta === "number" && filters.delta >= 1 && filters.delta <= 100
          ? filters.delta
          : 20;

      const qb = this.formRepository
        .createQueryBuilder("form")
        .leftJoin(
          "form.formResponses",
          "fr",
          "fr.createdAt >= :rangeStart AND fr.createdAt <= :rangeEnd",
          { rangeStart: start, rangeEnd: end }
        )
        .where("form.schoolId = :schoolId", { schoolId })
        .andWhere("form.status != :deleted", { deleted: FormStatus.DELETED })
        .select("form.id", "formId")
        .addSelect("form.title", "formName")
        .addSelect(
          "COALESCE(SUM(CASE WHEN fr.id IS NOT NULL AND fr.status != :draft THEN 1 ELSE 0 END), 0)",
          "totalSubmissions"
        )
        .addSelect(
          "COALESCE(SUM(CASE WHEN fr.status = :accepted THEN 1 ELSE 0 END), 0)",
          "totalAccepted"
        )
        .addSelect(
          "COALESCE(SUM(CASE WHEN fr.status = :draft THEN 1 ELSE 0 END), 0)",
          "cDraft"
        )
        .addSelect(
          "COALESCE(SUM(CASE WHEN fr.status = :submitted THEN 1 ELSE 0 END), 0)",
          "cSubmitted"
        )
        .addSelect(
          "COALESCE(SUM(CASE WHEN fr.status = :reviewed THEN 1 ELSE 0 END), 0)",
          "cReviewed"
        )
        .addSelect(
          "COALESCE(SUM(CASE WHEN fr.status = :rejected THEN 1 ELSE 0 END), 0)",
          "cRejected"
        )
        .setParameter("draft", FormResponseStatus.DRAFT)
        .setParameter("submitted", FormResponseStatus.SUBMITTED)
        .setParameter("reviewed", FormResponseStatus.REVIEWED)
        .setParameter("accepted", FormResponseStatus.ACCEPTED)
        .setParameter("rejected", FormResponseStatus.REJECTED)
        .groupBy("form.id")
        .addGroupBy("form.title")
        .orderBy("form.title", "ASC");

      const rawRows = await qb.getRawMany();
      const count = rawRows.length;
      const slice = rawRows.slice(pos, pos + delta);
      const pick = (row: Record<string, unknown>, ...keys: string[]): string => {
        for (const k of keys) {
          const v = row[k];
          if (v !== undefined && v !== null) return String(v);
        }
        return "0";
      };
      const pickStr = (row: Record<string, unknown>, ...keys: string[]): string => {
        for (const k of keys) {
          const v = row[k];
          if (v !== undefined && v !== null) return String(v);
        }
        return "";
      };
      const data: FormPerformanceRow[] = slice.map((row: Record<string, unknown>) => {
        const totalAccepted = parseInt(pick(row, "totalAccepted", "totalaccepted"), 10) || 0;
        return {
          formId: parseInt(pick(row, "formId", "formid"), 10),
          formName: pickStr(row, "formName", "formname"),
          totalSubmissions: parseInt(pick(row, "totalSubmissions", "totalsubmissions"), 10) || 0,
          totalAccepted,
          status: {
            draft: parseInt(pick(row, "cDraft", "cdraft"), 10) || 0,
            submitted: parseInt(pick(row, "cSubmitted", "csubmitted"), 10) || 0,
            reviewed: parseInt(pick(row, "cReviewed", "creviewed"), 10) || 0,
            accepted: totalAccepted,
            rejected: parseInt(pick(row, "cRejected", "crejected"), 10) || 0,
          },
        };
      });

      return {
        success: true,
        message: "Form performance report retrieved successfully",
        data,
        metadata: {
          startDate: formatDateKey(start),
          endDate: formatDateKey(end),
        },
        pagination: { pos, delta, count },
      };
    } catch (error) {
      logger.error("Error in getFormPerformanceReport:", error);
      return {
        success: false,
        message: "Failed to retrieve form performance report",
      };
    }
  }

  /**
   * Get student attendance statistics
   */
  async getStudentAttendanceStats(filters: AnalyticsFilters): Promise<StudentAttendanceStatsResponse> {
    try {
      const { schoolId, classroomId, studentId, periodType, staffId } = filters;
      const { start, end, prevStart, prevEnd } = this.getDateRange(filters);

      const staffClassroomIdsForFilter = staffId ? await this.getStaffClassroomIds(staffId) : [];

      const studentPopulationQuery = this.studentRepository
        .createQueryBuilder('student')
        .select(['student.id as "studentId"', 'student.schedule as "schedule"'])
        .where('student.status = :status', { status: StudentStatus.ACTIVE });

      if (schoolId) studentPopulationQuery.andWhere('student.schoolId = :schoolId', { schoolId });
      if (classroomId) studentPopulationQuery.andWhere('student.classroomId = :classroomId', { classroomId });
      if (studentId) studentPopulationQuery.andWhere('student.id = :studentId', { studentId });
      if (staffId) {
        if (staffClassroomIdsForFilter.length > 0) {
          studentPopulationQuery.andWhere('student.classroomId IN (:...staffClassroomIds)', { staffClassroomIds: staffClassroomIdsForFilter });
        } else {
          studentPopulationQuery.andWhere('1 = 0');
        }
      }

      const activeStudents = await studentPopulationQuery.getRawMany();
      const totalPopulation = activeStudents.length;

      const optimalPeriodType = this.determineOptimalPeriodType(start, end, periodType);

      const dateExpr = this.getDateTruncExpression(optimalPeriodType);

      const studentDayKey = `CONCAT(CAST(attendance.studentId AS VARCHAR), '|', CAST(attendance.date AS VARCHAR))`;

      const studentDailyQuery = this.attendanceRepository
        .createQueryBuilder('attendance')
        .select([
          `${dateExpr} as date`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN ${studentDayKey} END) as present`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.ABSENT}' THEN ${studentDayKey} END) as reported_absent`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN ${studentDayKey} END) as late`,
        ])
        .where('attendance.date BETWEEN :start AND :end', { start, end })
        .andWhere('attendance.studentId IS NOT NULL')
        .groupBy(dateExpr)
        .orderBy(dateExpr, 'ASC');

      if (schoolId) studentDailyQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });
      if (classroomId) studentDailyQuery.andWhere('attendance.classroomId = :classroomId', { classroomId });
      if (studentId) studentDailyQuery.andWhere('attendance.studentId = :studentId', { studentId });
      if (staffId) {
        if (staffClassroomIdsForFilter.length > 0) {
          studentDailyQuery.innerJoin('attendance.student', 'student');
          studentDailyQuery.andWhere('student.classroomId IN (:...staffClassroomIds)', { staffClassroomIds: staffClassroomIdsForFilter });
        } else {
          studentDailyQuery.andWhere('1 = 0');
        }
      }

      const [metrics, prevMetrics, studentDailyResults] = await Promise.all([
        this.computeStudentAttendanceMetricsForRange(filters, start, end, activeStudents),
        this.computeStudentAttendanceMetricsForRange(filters, prevStart, prevEnd),
        studentDailyQuery.getRawMany()
      ]);

      const studentPresent = metrics.present;
      const studentAbsent = metrics.absent;
      const studentLate = metrics.late;
      const studentAttendanceRate = metrics.rate;
      const attendancePercentageGrowth = computeRelativeGrowthPercent(metrics.rate, prevMetrics.rate);

      const studentScheduleArrays = activeStudents.map(s => {
        const raw = s.schedule;
        const sched: string[] = typeof raw === 'string' && raw.length > 0 ? raw.split(',').map((d: string) => d.trim()) : (Array.isArray(raw) ? raw : []);
        return { schedule: sched.length > 0 ? sched : undefined };
      });

      const rawStudentDailyBreakdown = studentDailyResults.map(row => {
        const present = parseInt(row.present, 10) || 0;
        const reportedAbsent = parseInt(row.reported_absent, 10) || 0;
        const late = parseInt(row.late, 10) || 0;
        const dateObj = new Date(row.date);
        const periodKey = formatDateKey(dateObj);

        const scheduledForPeriod = this.countScheduledStudentsForDate(dateObj, studentScheduleArrays);
        const derivedAbsent = Math.max(reportedAbsent, scheduledForPeriod - (present + late));

        return {
          period: periodKey,
          present,
          absent: derivedAbsent,
          late,
          total: scheduledForPeriod,
          rate: scheduledForPeriod > 0 ? ((present + late) / scheduledForPeriod) * 100 : 0,
        };
      });

      const filledBreakdown = this.fillMissingAttendancePeriods(start, end, rawStudentDailyBreakdown, optimalPeriodType);

      const studentPeriodBreakdown = filledBreakdown.map(item => {
        if (item.present === 0 && item.late === 0 && item.absent === 0) {
          const periodDate = new Date(item.period);
          const scheduledForPeriod = this.countScheduledStudentsForDate(periodDate, studentScheduleArrays);
          return { ...item, absent: scheduledForPeriod };
        }
        return item;
      });

      const periodLabel = optimalPeriodType === 'daily' ? 'Days' : optimalPeriodType === 'weekly' ? 'Weeks' : optimalPeriodType === 'monthly' ? 'Months' : 'Years';
      const xAxisLabels = studentPeriodBreakdown.map(item => this.formatDateLabel(item.period, optimalPeriodType));

      return {
        success: true,
        message: 'Student attendance statistics retrieved successfully',
        data: {
          present: {
            xAxis: xAxisLabels,
            yAxis: studentPeriodBreakdown.map(item => item.present)
          },
          absent: {
            xAxis: xAxisLabels,
            yAxis: studentPeriodBreakdown.map(item => item.absent)
          },
          late: {
            xAxis: xAxisLabels,
            yAxis: studentPeriodBreakdown.map(item => item.late)
          }
        },
        metadata: {
          xAxisLabel: periodLabel,
          yAxisLabel: 'Count',
          percentageGrowth: Math.round(attendancePercentageGrowth * 100) / 100,
          totalRecords: totalPopulation,
          totalPresent: studentPresent,
          totalAbsent: studentAbsent,
          totalLate: studentLate,
          attendanceRate: Math.round(studentAttendanceRate * 100) / 100,
        },
      };
    } catch (error) {
      logger.error('Error fetching student attendance statistics:', error);
      return {
        success: false,
        message: 'Failed to retrieve student attendance statistics',
      };
    }
  }

  /**
   * Get staff attendance statistics
   */
  async getStaffAttendanceStats(filters: AnalyticsFilters): Promise<StaffAttendanceStatsResponse> {
    try {
      const { schoolId, staffId, periodType } = filters;
      const { start, end, prevStart, prevEnd } = this.getDateRange(filters);

      const staffPopulationQuery = this.staffRepository
        .createQueryBuilder('staff')
        .select(['staff.id as "staffId"', 'staff.daysPerWeek as "daysPerWeek"'])
        .where('staff.status = :status', { status: StaffStatus.ACTIVE });

      if (schoolId) staffPopulationQuery.andWhere('staff.schoolId = :schoolId', { schoolId });
      if (staffId) staffPopulationQuery.andWhere('staff.id = :staffId', { staffId });

      const activeStaff = await staffPopulationQuery.getRawMany();
      const totalPopulation = activeStaff.length;

      const optimalPeriodType = this.determineOptimalPeriodType(start, end, periodType);

      const dateExpr = this.getDateTruncExpression(optimalPeriodType);

      const staffDayKey = `CONCAT(CAST(attendance.teacherId AS VARCHAR), '|', CAST(attendance.date AS VARCHAR))`;

      const staffDailyQuery = this.attendanceRepository
        .createQueryBuilder('attendance')
        .select([
          `${dateExpr} as date`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN ${staffDayKey} END) as present`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.ABSENT}' THEN ${staffDayKey} END) as reported_absent`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN ${staffDayKey} END) as late`,
        ])
        .where('attendance.date BETWEEN :start AND :end', { start, end })
        .andWhere('attendance.teacherId IS NOT NULL')
        .groupBy(dateExpr)
        .orderBy(dateExpr, 'ASC');

      if (schoolId) staffDailyQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });
      if (staffId) staffDailyQuery.andWhere('attendance.teacherId = :staffId', { staffId });

      const [metrics, prevMetrics, staffDailyResults] = await Promise.all([
        this.computeStaffAttendanceMetricsForRange(filters, start, end, activeStaff),
        this.computeStaffAttendanceMetricsForRange(filters, prevStart, prevEnd),
        staffDailyQuery.getRawMany()
      ]);

      const staffPresent = metrics.present;
      const staffAbsent = metrics.absent;
      const staffLate = metrics.late;
      const staffAttendanceRate = metrics.rate;
      const attendancePercentageGrowth = computeRelativeGrowthPercent(metrics.rate, prevMetrics.rate);

      const staffScheduleArrays = activeStaff.map(s => {
        const raw = s.daysPerWeek;
        const sched: string[] = Array.isArray(raw) ? raw : (typeof raw === 'string' && raw.length > 0 ? raw.split(',').map((d: string) => d.trim()) : []);
        return { schedule: sched.length > 0 ? sched : undefined };
      });

      const rawStaffDailyBreakdown = staffDailyResults.map(row => {
        const present = parseInt(row.present, 10) || 0;
        const reportedAbsent = parseInt(row.reported_absent, 10) || 0;
        const late = parseInt(row.late, 10) || 0;
        const dateObj = new Date(row.date);
        const periodKey = formatDateKey(dateObj);

        const scheduledForPeriod = this.countScheduledStudentsForDate(dateObj, staffScheduleArrays);
        const derivedAbsent = Math.max(reportedAbsent, scheduledForPeriod - (present + late));

        return {
          period: periodKey,
          present,
          absent: derivedAbsent,
          late,
          total: scheduledForPeriod,
          rate: scheduledForPeriod > 0 ? ((present + late) / scheduledForPeriod) * 100 : 0,
        };
      });

      const filledBreakdown = this.fillMissingAttendancePeriods(start, end, rawStaffDailyBreakdown, optimalPeriodType);

      const staffPeriodBreakdown = filledBreakdown.map(item => {
        if (item.present === 0 && item.late === 0 && item.absent === 0) {
          const periodDate = new Date(item.period);
          const scheduledForPeriod = this.countScheduledStudentsForDate(periodDate, staffScheduleArrays);
          return { ...item, absent: scheduledForPeriod };
        }
        return item;
      });

      const periodLabel = optimalPeriodType === 'daily' ? 'Days' : optimalPeriodType === 'weekly' ? 'Weeks' : optimalPeriodType === 'monthly' ? 'Months' : 'Years';
      const xAxisLabels = staffPeriodBreakdown.map(item => this.formatDateLabel(item.period, optimalPeriodType));

      return {
        success: true,
        message: 'Staff attendance statistics retrieved successfully',
        data: {
          present: {
            xAxis: xAxisLabels,
            yAxis: staffPeriodBreakdown.map(item => item.present)
          },
          absent: {
            xAxis: xAxisLabels,
            yAxis: staffPeriodBreakdown.map(item => item.absent)
          },
          late: {
            xAxis: xAxisLabels,
            yAxis: staffPeriodBreakdown.map(item => item.late)
          }
        },
        metadata: {
          xAxisLabel: periodLabel,
          yAxisLabel: 'Count',
          percentageGrowth: Math.round(attendancePercentageGrowth * 100) / 100,
          totalRecords: totalPopulation,
          totalPresent: staffPresent,
          totalAbsent: staffAbsent,
          totalLate: staffLate,
          attendanceRate: Math.round(staffAttendanceRate * 100) / 100,
        },
      };
    } catch (error) {
      logger.error('Error fetching staff attendance statistics:', error);
      return {
        success: false,
        message: 'Failed to retrieve staff attendance statistics',
      };
    }
  }

  /**
   * Get comprehensive attendance statistics for both students and staff
   */
  async getAttendanceStats(filters: AnalyticsFilters): Promise<AttendanceStatsResponse> {
    try {
      const { start, end, prevStart, prevEnd } = this.getDateRange(filters);

      const [
        studentResult,
        staffResult,
        curStudent,
        prevStudent,
        curStaff,
        prevStaff,
      ] = await Promise.all([
        this.getStudentAttendanceStats(filters),
        this.getStaffAttendanceStats(filters),
        this.computeStudentAttendanceMetricsForRange(filters, start, end),
        this.computeStudentAttendanceMetricsForRange(filters, prevStart, prevEnd),
        this.computeStaffAttendanceMetricsForRange(filters, start, end),
        this.computeStaffAttendanceMetricsForRange(filters, prevStart, prevEnd),
      ]);

      if (!studentResult.success || !staffResult.success) {
        return {
          success: false,
          message: 'Failed to retrieve attendance statistics',
        };
      }

      const studentData = studentResult.data!;
      const staffData = staffResult.data!;
      const studentMeta = studentResult.metadata!;
      const staffMeta = staffResult.metadata!;

      const totalRecordsSum = (studentMeta.totalRecords || 0) + (staffMeta.totalRecords || 0);
      const combinedRate =
        totalRecordsSum > 0
          ? (((studentMeta.attendanceRate || 0) * studentMeta.totalRecords) +
            ((staffMeta.attendanceRate || 0) * staffMeta.totalRecords)) /
          totalRecordsSum
          : 0;
      const combinedPresent = (studentMeta.totalPresent || 0) + (staffMeta.totalPresent || 0);
      const combinedAbsent = (studentMeta.totalAbsent || 0) + (staffMeta.totalAbsent || 0);
      const combinedLate = (studentData.late.yAxis.reduce((a, b) => a + b, 0)) + (staffData.late.yAxis.reduce((a, b) => a + b, 0));

      const combinedExpected = curStudent.expectedRecords + curStaff.expectedRecords;
      const combinedAttended = (curStudent.present + curStudent.late) + (curStaff.present + curStaff.late);
      const slotBasedCombinedRate = combinedExpected > 0 ? (combinedAttended / combinedExpected) * 100 : 0;
      const prevCombinedExpected = prevStudent.expectedRecords + prevStaff.expectedRecords;
      const prevCombinedAttended = (prevStudent.present + prevStudent.late) + (prevStaff.present + prevStaff.late);
      const prevSlotBasedCombinedRate = prevCombinedExpected > 0 ? (prevCombinedAttended / prevCombinedExpected) * 100 : 0;
      const combinedPercentageGrowth = computeRelativeGrowthPercent(slotBasedCombinedRate, prevSlotBasedCombinedRate);

      return {
        success: true,
        message: 'Attendance statistics retrieved successfully',
        data: {
          combinedRate: Math.round(combinedRate * 100) / 100,
          combinedPresent,
          combinedAbsent,
          combinedLate,
          studentPresent: {
            xAxis: studentData.present.xAxis,
            yAxis: studentData.present.yAxis
          },
          studentAbsent: {
            xAxis: studentData.absent.xAxis,
            yAxis: studentData.absent.yAxis
          },
          studentLate: {
            xAxis: studentData.late.xAxis,
            yAxis: studentData.late.yAxis
          },
          staffPresent: {
            xAxis: staffData.present.xAxis,
            yAxis: staffData.present.yAxis
          },
          staffAbsent: {
            xAxis: staffData.absent.xAxis,
            yAxis: staffData.absent.yAxis
          },
          staffLate: {
            xAxis: staffData.late.xAxis,
            yAxis: staffData.late.yAxis
          }
        },
        metadata: {
          xAxisLabel: studentResult.metadata!.xAxisLabel,
          yAxisLabel: studentResult.metadata!.yAxisLabel,
          combinedPercentageGrowth: Math.round(combinedPercentageGrowth * 100) / 100,
        },
      };
    } catch (error) {
      logger.error('Error fetching combined attendance statistics:', error);
      return {
        success: false,
        message: 'Failed to retrieve attendance statistics',
      };
    }
  }

  /**
   * Get staff statistics including status and role distribution
   */
  async getStaffStats(filters: AnalyticsFilters): Promise<StaffStatsResponse> {
    try {
      const { schoolId, staffId, classroomId } = filters;
      const { end, prevEnd } = this.getDateRange(filters);

      const statusQuery = this.staffRepository
        .createQueryBuilder('staff')
        .select([
          'COUNT(*) as total',
          `SUM(CASE WHEN staff.status = '${StaffStatus.ACTIVE}' THEN 1 ELSE 0 END) as active`,
          `SUM(CASE WHEN staff.status = '${StaffStatus.SUSPENDED}' THEN 1 ELSE 0 END) as suspended`,
          `SUM(CASE WHEN staff.status = '${StaffStatus.INACTIVE}' THEN 1 ELSE 0 END) as inactive`,
        ])
        .where('staff.createdAt <= :end', { end });

      if (schoolId) {
        statusQuery.andWhere('staff.schoolId = :schoolId', { schoolId });
      }

      if (classroomId) {
        statusQuery.andWhere(
          `staff.id IN (SELECT DISTINCT "staffId" FROM "staffClassesAndSubject" WHERE "classroomId" = :classroomId)`,
          { classroomId }
        );
      }

      if (staffId) {
        statusQuery.andWhere('staff.id = :staffId', { staffId });
      }

      const roleQuery = this.staffRepository
        .createQueryBuilder('staff')
        .leftJoin('staff.user', 'user')
        .select('staff.staffRole as role')
        .addSelect('COUNT(*) as count')
        .where('staff.createdAt <= :end', { end })
        .groupBy('staff.staffRole');

      if (schoolId) {
        roleQuery.andWhere('staff.schoolId = :schoolId', { schoolId });
      }

      if (classroomId) {
        roleQuery.andWhere(
          `staff.id IN (SELECT DISTINCT "staffId" FROM "staffClassesAndSubject" WHERE "classroomId" = :classroomId)`,
          { classroomId }
        );
      }

      if (staffId) {
        roleQuery.andWhere('staff.id = :staffId', { staffId });
      }

      const prevQuery = this.staffRepository
        .createQueryBuilder('staff')
        .where('staff.createdAt <= :prevEnd', { prevEnd });

      if (schoolId) {
        prevQuery.andWhere('staff.schoolId = :schoolId', { schoolId });
      }

      if (classroomId) {
        prevQuery.andWhere(
          `staff.id IN (SELECT DISTINCT "staffId" FROM "staffClassesAndSubject" WHERE "classroomId" = :classroomId)`,
          { classroomId }
        );
      }

      if (staffId) {
        prevQuery.andWhere('staff.id = :staffId', { staffId });
      }

      // Execute all queries in parallel
      const [statusResult, roleResults, prevTotal] = await Promise.all([
        statusQuery.getRawOne(),
        roleQuery.getRawMany(),
        prevQuery.getCount()
      ]);

      const total = parseInt(statusResult.total, 10) || 0;
      const active = parseInt(statusResult.active, 10) || 0;
      const percentageGrowth = computeRelativeGrowthPercent(total, prevTotal);

      const byRole: Record<string, number> = {};
      roleResults.forEach(row => {
        const role = row.role || 'UNASSIGNED';
        byRole[role] = parseInt(row.count, 10);
      });

      const roleNames = Object.keys(byRole);
      const roleCounts = Object.values(byRole);

      return {
        success: true,
        message: 'Staff statistics retrieved successfully',
        data: {
          total,
          active,
          xAxis: roleNames,
          yAxis: roleCounts
        },
        metadata: {
          xAxisLabel: 'Roles',
          yAxisLabel: 'Count',
          percentageGrowth: Math.round(percentageGrowth * 100) / 100
        },
      };
    } catch (error) {
      logger.error('Error fetching staff statistics:', error);
      return {
        success: false,
        message: 'Failed to retrieve staff statistics',
      };
    }
  }

  /**
   * Get classroom statistics including capacity and utilization
   */
  async getClassroomStats(filters: AnalyticsFilters): Promise<ClassroomStatsResponse> {
    try {
      const { schoolId, classroomId, staffId } = filters;
      const { end } = this.getDateRange(filters);

      let staffClassroomIds: number[] | undefined;
      if (staffId) {
        staffClassroomIds = await this.getStaffClassroomIds(staffId);
        if (staffClassroomIds.length === 0) {
          return {
            success: true,
            message: 'Classroom statistics retrieved successfully',
            data: {
              total: 0,
              active: 0,
              averageUtilization: 0,
              xAxis: [],
              yAxis: [],
            },
            metadata: {
              xAxisLabel: 'Classrooms',
              yAxisLabel: 'Utilization (%)',
            },
          };
        }
      }

      // Build queries for stats and classroom details (aligned with getClassroomStatsDetailed / dashboard)
      const statsQuery = this.classroomRepository
        .createQueryBuilder('classroom')
        .select([
          'COUNT(*) as total',
          `SUM(CASE WHEN classroom.classroomStatus = '${ClassroomStatus.ACTIVE}' THEN 1 ELSE 0 END) as active`,
          `SUM(CASE WHEN classroom.classroomStatus = '${ClassroomStatus.INACTIVE}' THEN 1 ELSE 0 END) as inactive`,
          'SUM(classroom.maximumCapacity) as totalCapacity',
        ])
        .where('classroom.createdAt <= :end', { end });

      if (schoolId) {
        statsQuery.andWhere('classroom.schoolId = :schoolId', { schoolId });
      }

      if (classroomId) {
        statsQuery.andWhere('classroom.id = :classroomId', { classroomId });
      }

      if (staffId && staffClassroomIds) {
        statsQuery.andWhere('classroom.id IN (:...staffClassroomIds)', { staffClassroomIds });
      }

      const classroomsQuery = this.classroomRepository
        .createQueryBuilder('classroom')
        .select([
          'classroom.id as id',
          'classroom.classroomName as name',
          'classroom.maximumCapacity as capacity',
          '(SELECT COUNT(*) FROM student WHERE student."classroomId" = classroom.id) as enrolled',
        ])
        .where('classroom.createdAt <= :end', { end });

      if (schoolId) {
        classroomsQuery.andWhere('classroom.schoolId = :schoolId', { schoolId });
      }

      if (classroomId) {
        classroomsQuery.andWhere('classroom.id = :classroomId', { classroomId });
      }

      if (staffId && staffClassroomIds) {
        classroomsQuery.andWhere('classroom.id IN (:...staffClassroomIds)', { staffClassroomIds });
      }

      // Execute queries in parallel
      const [statsResult, classroomResults] = await Promise.all([
        statsQuery.getRawOne(),
        classroomsQuery.getRawMany()
      ]);

      const total = parseInt(statsResult.total, 10) || 0;
      const active = parseInt(statsResult.active, 10) || 0;
      const totalCapacity = parseInt(statsResult.totalcapacity, 10) || 0;

      let totalEnrolled = 0;
      const classroomDetails = classroomResults.map(row => {
        const capacity = parseInt(row.capacity, 10) || 0;
        const enrolled = parseInt(row.enrolled, 10) || 0;
        const utilization = capacity > 0 ? (enrolled / capacity) * 100 : 0;

        totalEnrolled += enrolled;

        return {
          id: row.id,
          name: row.name,
          capacity,
          enrolled,
          utilization: Math.round(utilization * 100) / 100,
        };
      });

      const averageUtilization = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;

      const top10Classrooms = classroomDetails
        .sort((a, b) => b.utilization - a.utilization)
        .slice(0, 10);

      return {
        success: true,
        message: 'Classroom statistics retrieved successfully',
        data: {
          total,
          active,
          averageUtilization: Math.round(averageUtilization * 100) / 100,
          xAxis: top10Classrooms.map(c => c.name),
          yAxis: top10Classrooms.map(c => c.utilization)
        },
        metadata: {
          xAxisLabel: 'Classrooms',
          yAxisLabel: 'Utilization (%)'
        },
      };
    } catch (error) {
      logger.error('Error fetching classroom statistics:', error);
      return {
        success: false,
        message: 'Failed to retrieve classroom statistics',
      };
    }
  }

  /**
   * Get comprehensive dashboard overview with all key metrics
   */
  async getDashboardOverview(filters: AnalyticsFilters): Promise<DashboardOverviewResponse> {
    try {
      const { schoolId, periodType } = filters;
      const { start, end } = this.getDateRange(filters);

      const attendanceFilters: AnalyticsFilters = {
        ...filters,
        // Attendance can be overridden independently from the dashboard global filter.
        // If the caller provides an explicit start/end, keep them; otherwise periodType
        // is used by getDateRange() to derive the window from endDate.
        startDate: filters.attendanceStartDate ?? filters.startDate,
        endDate: filters.attendanceEndDate ?? filters.endDate ?? end.toISOString(),
        periodType: filters.attendancePeriodType ?? filters.periodType ?? periodType,
        classroomId: filters.attendanceClassroomId ?? filters.classroomId,
      };

      // Execute all internal stat queries in parallel
      const [
        studentStats,
        admissionsStats,
        staffStats,
        classroomStats,
        attendanceStats,
        attendanceTrend,
      ] = await Promise.all([
        this.getStudentStatsDetailed({
          schoolId,
          staffId: filters.staffId,
          classroomId: filters.classroomId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          periodType
        }),
        this.getAdmissionsStatsDetailed({
          schoolId,
          staffId: filters.staffId,
          classroomId: filters.classroomId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          periodType
        }),
        this.getStaffStatsDetailed({
          schoolId,
          staffId: filters.staffId,
          classroomId: filters.classroomId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          periodType
        }),
        this.getClassroomStatsDetailed({
          schoolId,
          staffId: filters.staffId,
          classroomId: filters.classroomId,
          endDate: end.toISOString(),
          periodType
        }),
        this.getAttendanceStatsDetailed(attendanceFilters),
        this.getDashboardAttendanceTrend(attendanceFilters),
      ]);

      return {
        success: true,
        message: 'Dashboard overview retrieved successfully',
        data: {
          students: {
            total: studentStats.total,
            active: studentStats.active,
            male: studentStats.male,
            female: studentStats.female,
            other: studentStats.other,
            percentageGrowth: Math.round(studentStats.percentageGrowth * 100) / 100,
          },
          admissions: {
            total: admissionsStats.total,
            thisMonth: admissionsStats.thisMonth,
            percentageGrowth: Math.round(admissionsStats.percentageGrowth * 100) / 100,
          },
          staff: {
            total: staffStats.total,
            active: staffStats.active,
            percentageGrowth: Math.round(staffStats.percentageGrowth * 100) / 100,
          },
          classrooms: {
            total: classroomStats.total,
            active: classroomStats.active,
            utilizationRate: Math.round(classroomStats.utilizationRate * 100) / 100,
          },
          attendance: {
            student: {
              rate: Math.round(attendanceStats.student.rate * 100) / 100,
              present: attendanceStats.student.present,
              absent: attendanceStats.student.absent,
              late: attendanceStats.student.late,
              percentageGrowth: Math.round(attendanceStats.student.percentageGrowth * 100) / 100,
              expectedSlots: Math.round(attendanceStats.student.expectedSlots * 100) / 100,
            },
            staff: {
              rate: Math.round(attendanceStats.staff.rate * 100) / 100,
              present: attendanceStats.staff.present,
              absent: attendanceStats.staff.absent,
              late: attendanceStats.staff.late,
              percentageGrowth: Math.round(attendanceStats.staff.percentageGrowth * 100) / 100,
              expectedSlots: Math.round(attendanceStats.staff.expectedSlots * 100) / 100,
            },
            combined: {
              rate: Math.round(attendanceStats.combined.rate * 100) / 100,
              present: attendanceStats.combined.present,
              absent: attendanceStats.combined.absent,
              late: attendanceStats.combined.late,
              percentageGrowth: Math.round(attendanceStats.combined.percentageGrowth * 100) / 100,
              expectedSlots: Math.round(attendanceStats.combined.expectedSlots * 100) / 100,
            },
          },
          attendanceTrend,
        },
      };
    } catch (error) {
      logger.error('Error fetching dashboard overview:', error);
      return {
        success: false,
        message: 'Failed to retrieve dashboard overview',
      };
    }
  }


  /**
   * Get Parent Student Dashboard
   * Returns attendance trends and classroom activities for parent's children
   */
  async getParentDashboard(filters: AnalyticsFilters): Promise<ParentDashboardResponse> {
    try {
      const { periodType, parentId, studentIds, studentId } = filters;
      const { start, end } = this.getDateRange(filters);

      let targetStudentIds: number[] = studentIds || (studentId ? [studentId] : []);

      // Fetch parent pin if parentId is provided
      let kioskPin: string | undefined;
      if (parentId) {
        const parent = await this.parentRepository.findOne({ where: { id: parentId } });
        kioskPin = parent?.pin;
      }

      // If no specific students provided, find all children associated with this parent
      if (targetStudentIds.length === 0 && parentId) {
        const children = await this.studentRepository
          .createQueryBuilder('student')
          .innerJoin('student.parents', 'parent')
          .where('parent.id = :parentId', { parentId })
          .select('student.id', 'id')
          .getRawMany();

        targetStudentIds = children.map(c => c.id);
      }

      if (targetStudentIds.length === 0) {
        return {
          success: true,
          message: 'No students found for this parent',
          data: {
            attendance: { xAxis: [], present: [], absent: [], late: [] },
            activities: [],
            kioskPin
          },
          metadata: {
            date: formatDateKey(end),
            totalStudents: 0
          }
        };
      }

      const optimalPeriodType = this.determineOptimalPeriodType(start, end, periodType);

      const dateExpr = this.getDateTruncExpression(optimalPeriodType);

      // Attendance Trend for parent's children
      const attendanceTrend = await this.attendanceRepository
        .createQueryBuilder('attendance')
        .innerJoin('attendance.student', 'student')
        .select([
          `${dateExpr} as date`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN student.id END) as present`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.ABSENT}' THEN student.id END) as absent`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN student.id END) as late`,
        ])
        .where('student.id IN (:...targetStudentIds)', { targetStudentIds })
        .andWhere('attendance.date BETWEEN :start AND :end', {
          start: formatDateKey(start),
          end: formatDateKey(end)
        })
        .groupBy(dateExpr)
        .orderBy(dateExpr, 'ASC')
        .getRawMany();

      const totalChildren = targetStudentIds.length;

      const rawTrend = attendanceTrend.map(row => {
        const p = parseInt(row.present, 10) || 0;
        const rAbsent = parseInt(row.absent, 10) || 0;
        const l = parseInt(row.late, 10) || 0;
        const derivedAbsent = Math.max(rAbsent, totalChildren - (p + l));
        return {
          period: formatDateKey(new Date(row.date)),
          present: p,
          absent: derivedAbsent,
          late: l,
          total: totalChildren,
          rate: totalChildren > 0 ? ((p + l) / totalChildren) * 100 : 0,
        };
      });

      const filledTrend = this.fillMissingAttendancePeriods(start, end, rawTrend, optimalPeriodType);

      const finalTrend = filledTrend.map(item => {
        if (item.present === 0 && item.late === 0 && item.absent === 0) {
          return { ...item, absent: totalChildren };
        }
        return item;
      });

      // Fetch Recent Activities for parent's children
      const activities = await this.classroomActivityRepository
        .createQueryBuilder('activity')
        .leftJoinAndSelect("activity.studentActivities", "csa")
        .innerJoinAndSelect('csa.student', 'student')
        .innerJoinAndSelect('student.user', 'user')
        .where('student.id IN (:...targetStudentIds)', { targetStudentIds })
        .andWhere('activity.createdAt <= :end', { end })
        .orderBy('activity.createdAt', 'DESC')
        .limit(10)
        .getMany();

      const xAxis = finalTrend.map(item => this.formatDateLabel(item.period, optimalPeriodType));
      const present = finalTrend.map(item => item.present);
      const absent = finalTrend.map(item => item.absent);
      const late = finalTrend.map(item => item.late);

      const simplifiedActivities = activities
        .map(activity => {
          const studentActivity = activity.studentActivities?.find(sa => targetStudentIds.includes(sa.student?.id)) || activity.studentActivities?.[0];
          const student = studentActivity?.student;

          if (!student || !student.id) {
            return null;
          }

          return {
            id: activity.id,
            activityType: activity.activityType,
            startTime: activity.startTime,
            endTime: activity.endTime,
            mealType: activity.mealType,
            timeGiven: activity.timeGiven,
            bathroomType: activity.bathroomType,
            foodItems: activity.foodItems,
            medicationName: activity.medicationName,
            dosage: activity.dosage,
            notes: activity.notes,
            photoUrl: activity.photoUrl,
            createdAt: activity.createdAt,
            student: {
              id: student.id,
              firstName: student.user?.firstName || '',
              lastName: student.user?.lastName || '',
              photoUrl: student.photoUrl,
            },
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      return {
        success: true,
        message: 'Parent student dashboard retrieved successfully',
        data: {
          attendance: {
            xAxis,
            present,
            absent,
            late,
          },
          activities: simplifiedActivities,
          kioskPin,
        },
        metadata: {
          date: formatDateKey(end),
          totalStudents: targetStudentIds.length,
        },
      };
    } catch (error) {
      logger.error('Error fetching parent student dashboard:', error);
      return {
        success: false,
        message: 'Failed to retrieve parent student dashboard',
      };
    }
  }


  /**
   * Get student statistics Dashboard
   * Returns today's attendance data and class statistics by gender
   */
  async getStudentStatsDashboard(filters: AnalyticsFilters): Promise<StudentStatsDashboardResponse> {
    try {
      const { schoolId, periodType, staffId } = filters;
      const { start, end, prevStart, prevEnd } = this.getDateRange(filters);

      // If staffId is provided, get the classrooms assigned to this staff member
      let classroomIds: number[] = [];
      if (staffId) {
        classroomIds = await this.getStaffClassroomIds(staffId);
        if (classroomIds.length === 0) {
          return {
            success: true,
            message: 'No assigned classes found for this staff member',
            data: {
              totalStudents: 0,
              totalSignedIn: 0,
              totalLate: 0,
              totalAbsent: 0,
              percentageGrowth: 0,
              classStats: {
                byGender: {
                  xAxis: ['Boys', 'Girls', 'Other'],
                  yAxis: [0, 0, 0],
                  percentages: [0, 0, 0],
                },
              },
              attendance: {
                xAxis: [],
                present: [],
                absent: [],
                late: []
              },
            },
            metadata: {
              date: formatDateKey(end),
              attendanceRate: 0,
            },
          };
        }
      }

      const optimalPeriodType = this.determineOptimalPeriodType(start, end, periodType);

      const dateExpr = this.getDateTruncExpression(optimalPeriodType);

      // Calculate previous period for growth calculation - handled by getDateRange helper

      // Build all queries
      const totalStudentsQuery = this.studentRepository
        .createQueryBuilder('student')
        .where('student.status = :status', { status: StudentStatus.ACTIVE });

      if (schoolId) {
        totalStudentsQuery.andWhere('student.schoolId = :schoolId', { schoolId });
      }

      if (staffId && classroomIds.length > 0) {
        totalStudentsQuery.andWhere('student.classroomId IN (:...classroomIds)', { classroomIds });
      }

      // Period attendance data query (point-in-time metrics for current view)
      const periodAttendanceQuery = this.attendanceRepository
        .createQueryBuilder('attendance')
        .innerJoin('attendance.student', 'student')
        .select([
          'COUNT(DISTINCT student.id) as total',
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN student.id END) as present`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN student.id END) as late`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.ABSENT}' THEN student.id END) as absent`,
          `COUNT(DISTINCT CASE WHEN attendance.status IN ('${AttendanceStatus.PRESENT}', '${AttendanceStatus.LATE}') AND attendance.timeIn IS NOT NULL AND attendance.timeOut IS NULL THEN student.id END) as "signedIn"`,
        ])
        .where('attendance.date BETWEEN :start AND :end', { start, end })
        .andWhere('attendance.studentId IS NOT NULL');

      if (schoolId) {
        periodAttendanceQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });
      }

      if (staffId && classroomIds.length > 0) {
        periodAttendanceQuery.andWhere('student.classroomId IN (:...classroomIds)', { classroomIds });
      }

      // Gender statistics query
      const genderStatsQuery = this.studentRepository
        .createQueryBuilder('student')
        .leftJoin('student.user', 'user')
        .select([
          'COUNT(*) as total',
          `SUM(CASE WHEN user.gender = 'male' THEN 1 ELSE 0 END) as male`,
          `SUM(CASE WHEN user.gender = 'female' THEN 1 ELSE 0 END) as female`,
          `SUM(CASE WHEN user.gender NOT IN ('male', 'female') OR user.gender IS NULL THEN 1 ELSE 0 END) as other`,
        ])
        .where('student.status = :status', { status: StudentStatus.ACTIVE });

      if (schoolId) {
        genderStatsQuery.andWhere('student.schoolId = :schoolId', { schoolId });
      }

      if (staffId && classroomIds.length > 0) {
        genderStatsQuery.andWhere('student.classroomId IN (:...classroomIds)', { classroomIds });
      }

      // Attendance trend data query (grouped by period)
      const attendanceTrendQuery = this.attendanceRepository
        .createQueryBuilder('attendance')
        .innerJoin('attendance.student', 'student')
        .select([
          `${dateExpr} as date`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN student.id END) as present`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.ABSENT}' THEN student.id END) as absent`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN student.id END) as late`,
        ])
        .where('attendance.date BETWEEN :start AND :end', {
          start: formatDateKey(start),
          end: formatDateKey(end)
        })
        .andWhere('attendance.studentId IS NOT NULL')
        .groupBy(dateExpr)
        .orderBy(dateExpr, 'ASC');

      if (schoolId) {
        attendanceTrendQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });
      }

      if (staffId && classroomIds.length > 0) {
        attendanceTrendQuery.andWhere('student.classroomId IN (:...classroomIds)', { classroomIds });
      }

      // Previous period attendance query (for growth calculation)
      // Note: We compare the total signed-in for the current period vs the previous period
      const currentPeriodAttendanceQuery = this.attendanceRepository
        .createQueryBuilder('attendance')
        .innerJoin('attendance.student', 'student')
        .select('COUNT(DISTINCT student.id) as total')
        .where('attendance.date BETWEEN :start AND :end', {
          start: formatDateKey(start),
          end: formatDateKey(end)
        })
        .andWhere('attendance.studentId IS NOT NULL')
        .andWhere(`attendance.status IN ('${AttendanceStatus.PRESENT}', '${AttendanceStatus.LATE}')`);

      const prevAttendanceQuery = this.attendanceRepository
        .createQueryBuilder('attendance')
        .innerJoin('attendance.student', 'student')
        .select('COUNT(DISTINCT student.id) as total')
        .where('attendance.date BETWEEN :start AND :end', {
          start: formatDateKey(prevStart),
          end: formatDateKey(prevEnd)
        })
        .andWhere('attendance.studentId IS NOT NULL')
        .andWhere(`attendance.status IN ('${AttendanceStatus.PRESENT}', '${AttendanceStatus.LATE}')`);

      if (schoolId) {
        currentPeriodAttendanceQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });
        prevAttendanceQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });
      }

      if (staffId && classroomIds.length > 0) {
        currentPeriodAttendanceQuery.andWhere('student.classroomId IN (:...classroomIds)', { classroomIds });
        prevAttendanceQuery.andWhere('student.classroomId IN (:...classroomIds)', { classroomIds });
      }

      const [
        totalStudents,
        periodAttendance,
        genderStats,
        attendanceTrend,
        currentPeriodAttendance,
        prevAttendance
      ] = await Promise.all([
        totalStudentsQuery.getCount(),
        periodAttendanceQuery.getRawOne(),
        genderStatsQuery.getRawOne(),
        attendanceTrendQuery.getRawMany(),
        currentPeriodAttendanceQuery.getRawOne(),
        prevAttendanceQuery.getRawOne()
      ]);

      // Process period attendance data — derive absent from population baseline
      const totalSignedIn = periodAttendance ? (parseInt(periodAttendance.signedIn, 10) || 0) : 0;
      const totalLate = periodAttendance ? (parseInt(periodAttendance.late, 10) || 0) : 0;
      const reportedAbsent = periodAttendance ? (parseInt(periodAttendance.absent, 10) || 0) : 0;
      const totalAbsent = Math.max(reportedAbsent, totalStudents - (totalSignedIn + totalLate));

      // Process gender statistics
      const maleCount = genderStats ? (parseInt(genderStats.male, 10) || 0) : 0;
      const femaleCount = genderStats ? (parseInt(genderStats.female, 10) || 0) : 0;
      const totalForGender = maleCount + femaleCount;
      const malePercentage = totalForGender > 0 ? Math.round((maleCount / totalForGender) * 100) : 0;
      const femalePercentage = totalForGender > 0 ? Math.round((femaleCount / totalForGender) * 100) : 0;

      // Process attendance trend data — derive absent from population baseline per period
      const rawTrend = attendanceTrend.map(row => {
        const p = parseInt(row.present, 10) || 0;
        const rAbsent = parseInt(row.absent, 10) || 0;
        const l = parseInt(row.late, 10) || 0;
        const derivedAbsent = Math.max(rAbsent, totalStudents - (p + l));
        return {
          period: formatDateKey(new Date(row.date)),
          present: p,
          absent: derivedAbsent,
          late: l,
          total: totalStudents,
          rate: totalStudents > 0 ? ((p + l) / totalStudents) * 100 : 0,
        };
      });

      const filledTrend = this.fillMissingAttendancePeriods(start, end, rawTrend, optimalPeriodType);

      const finalTrend = filledTrend.map(item => {
        if (item.present === 0 && item.late === 0 && item.absent === 0) {
          return { ...item, absent: totalStudents };
        }
        return item;
      });

      const xAxis = finalTrend.map(item => this.formatDateLabel(item.period, optimalPeriodType));
      const present = finalTrend.map(item => item.present);
      const absent = finalTrend.map(item => item.absent);
      const late = finalTrend.map(item => item.late);

      // Calculate percentage growth
      const currentTotal = currentPeriodAttendance ? (parseInt(currentPeriodAttendance.total, 10) || 0) : 0;
      const prevTotal = prevAttendance ? (parseInt(prevAttendance.total, 10) || 0) : 0;
      const percentageGrowth = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : (currentTotal > 0 ? 100 : 0);

      const attendanceRate = totalStudents > 0 ? (totalSignedIn / totalStudents) * 100 : 0;

      return {
        success: true,
        message: 'Student dashboard statistics retrieved successfully',
        data: {
          totalStudents,
          totalSignedIn,
          totalLate,
          totalAbsent,
          percentageGrowth: Math.round(percentageGrowth * 100) / 100,
          classStats: {
            byGender: {
              xAxis: ['Boys', 'Girls', 'Other'],
              yAxis: [maleCount, femaleCount, (genderStats ? (parseInt(genderStats.other, 10) || 0) : 0)],
              percentages: [
                malePercentage,
                femalePercentage,
                totalForGender > 0 ? Math.round(((genderStats ? (parseInt(genderStats.other, 10) || 0) : 0) / totalForGender) * 100) : 0
              ],
            },
          },
          attendance: {
            xAxis,
            present,
            absent,
            late
          },
        },
        metadata: {
          date: formatDateKey(end),
          attendanceRate: Math.round(attendanceRate * 100) / 100,
        },
      };
    } catch (error) {
      logger.error('Error fetching student statistics dashboard:', error);
      return {
        success: false,
        message: 'Failed to retrieve student statistics dashboard',
      };
    }
  }

  /**
   * Get comprehensive attendance analytics report
   * Returns overall metrics, trends, and breakdowns by class and status
   */
  async getAttendanceAnalytics(filters: AnalyticsFilters): Promise<AttendanceAnalyticsResponse> {
    try {
      const { schoolId, periodType } = filters;
      const { start, end } = this.getDateRange(filters);

      const optimalPeriodType = this.determineOptimalPeriodType(start, end, periodType);

      const dateExpr = this.getDateTruncExpression(optimalPeriodType);

      // Fetch all active students with their schedules for population-aware absent derivation
      const allActiveStudentsQuery = this.studentRepository
        .createQueryBuilder('student')
        .innerJoin('student.user', 'user')
        .select([
          'student.id as "studentId"',
          "CONCAT(user.firstName, ' ', user.lastName) as \"studentName\"",
          'student.schedule as "schedule"',
        ])
        .where('student.status = :status', { status: StudentStatus.ACTIVE });
      if (schoolId) allActiveStudentsQuery.andWhere('student.schoolId = :schoolId', { schoolId });

      // One count per (student, calendar day) per status — multiple same-day clock-ins do not inflate totals.
      // Use CAST(... AS VARCHAR) instead of ::text — TypeORM treats ":foo" as bind params and breaks "::text".
      const studentDayKey = `CONCAT(CAST(attendance.studentId AS VARCHAR), '|', CAST(attendance.date AS VARCHAR))`;

      // Overall attendance statistics
      const overallStatsQuery = this.attendanceRepository
        .createQueryBuilder('attendance')
        .select([
          `COUNT(DISTINCT ${studentDayKey}) as total`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN ${studentDayKey} END) as present`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.ABSENT}' THEN ${studentDayKey} END) as reported_absent`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN ${studentDayKey} END) as late`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.EXCUSED}' THEN ${studentDayKey} END) as excused`,
        ])
        .where('attendance.date BETWEEN :start AND :end', { start, end })
        .andWhere('attendance.studentId IS NOT NULL');
      if (schoolId) overallStatsQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });

      // Attendance by classroom (kept for mostPresentClass / highestAbsenteeClass)
      const attendanceByClassQuery = this.attendanceRepository
        .createQueryBuilder('attendance')
        .innerJoin('attendance.classroom', 'classroom')
        .select([
          'classroom.id as classroomId',
          'classroom.classroomName as className',
          `COUNT(DISTINCT ${studentDayKey}) as total`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN ${studentDayKey} END) as present`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.ABSENT}' THEN ${studentDayKey} END) as absent`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN ${studentDayKey} END) as late`,
        ])
        .where('attendance.date BETWEEN :start AND :end', { start, end })
        .andWhere('attendance.studentId IS NOT NULL')
        .andWhere('attendance.classroomId IS NOT NULL')
        .groupBy('classroom.id, classroom.classroomName')
        .orderBy('classroom.classroomName', 'ASC');
      if (schoolId) attendanceByClassQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });

      // Attendance by student (for attendanceByStudent chart)
      const attendanceByStudentQuery = this.attendanceRepository
        .createQueryBuilder('attendance')
        .innerJoin('attendance.student', 'student')
        .innerJoin('student.user', 'user')
        .select([
          'student.id as "studentId"',
          "CONCAT(user.firstName, ' ', user.lastName) as \"studentName\"",
          'COUNT(DISTINCT attendance.date) as total',
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN attendance.date END) as present`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.ABSENT}' THEN attendance.date END) as reported_absent`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN attendance.date END) as late`,
        ])
        .where('attendance.date BETWEEN :start AND :end', { start, end })
        .andWhere('attendance.studentId IS NOT NULL')
        .groupBy('student.id, user.firstName, user.lastName')
        .orderBy('"studentName"', 'ASC');
      if (schoolId) attendanceByStudentQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });

      // Attendance trend over time
      const attendanceTrendQuery = this.attendanceRepository
        .createQueryBuilder('attendance')
        .select([
          `${dateExpr} as date`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN ${studentDayKey} END) as present`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.ABSENT}' THEN ${studentDayKey} END) as reported_absent`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN ${studentDayKey} END) as late`,
        ])
        .where('attendance.date BETWEEN :start AND :end', { start, end })
        .andWhere('attendance.studentId IS NOT NULL')
        .groupBy(dateExpr)
        .orderBy(dateExpr, 'ASC');
      if (schoolId) attendanceTrendQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });

      // Calendar-day aggregates for attendanceInsight (one extra round-trip, parallel with other reads)
      const attendanceByCalendarDayQuery = this.attendanceRepository
        .createQueryBuilder('attendance')
        .select([
          `DATE(attendance.date) as day`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN ${studentDayKey} END) as present`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN ${studentDayKey} END) as late`,
        ])
        .where('attendance.date BETWEEN :start AND :end', { start, end })
        .andWhere('attendance.studentId IS NOT NULL')
        .groupBy('DATE(attendance.date)')
        .orderBy('DATE(attendance.date)', 'ASC');
      if (schoolId) attendanceByCalendarDayQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });

      const [
        allActiveStudents,
        overallStats,
        attendanceByClass,
        attendanceByStudent,
        attendanceTrend,
        attendanceByCalendarDay,
      ] = await Promise.all([
        allActiveStudentsQuery.getRawMany(),
        overallStatsQuery.getRawOne(),
        attendanceByClassQuery.getRawMany(),
        attendanceByStudentQuery.getRawMany(),
        attendanceTrendQuery.getRawMany(),
        attendanceByCalendarDayQuery.getRawMany(),
      ]);

      // Parse schedules and compute per-student expected days
      const studentSchedules = allActiveStudents.map(s => {
        const raw = s.schedule;
        const schedule: string[] = typeof raw === 'string' && raw.length > 0 ? raw.split(',').map((d: string) => d.trim()) : (Array.isArray(raw) ? raw : []);
        const scheduledDays = this.countScheduledDays(start, end, schedule.length > 0 ? schedule : undefined);
        return { studentId: parseInt(s.studentId, 10), schedule, scheduledDays };
      });
      const expectedRecords = studentSchedules.reduce((sum, s) => sum + s.scheduledDays, 0);
      const scheduledDaysMap = new Map(studentSchedules.map(s => [s.studentId, s]));

      // --- Overall stats with derived absent ---
      const totalPresent = parseInt(overallStats.present, 10) || 0;
      const reportedAbsent = parseInt(overallStats.reported_absent, 10) || 0;
      const totalLate = parseInt(overallStats.late, 10) || 0;
      const totalExcused = parseInt(overallStats.excused, 10) || 0;
      const totalAttended = totalPresent + totalLate;
      const totalAbsent = Math.max(reportedAbsent, expectedRecords - totalAttended - totalExcused);
      const totalRecords = totalPresent + totalAbsent + totalLate + totalExcused;

      const overallAttendanceRate = expectedRecords > 0
        ? (totalAttended / expectedRecords) * 100
        : 0;

      const latenessRate = totalAttended > 0
        ? (totalLate / totalAttended) * 100
        : 0;

      // --- Process attendance by class (for mostPresentClass / highestAbsenteeClass) ---
      const classStats = attendanceByClass.map(row => {
        const total = parseInt(row.total, 10) || 0;
        const present = parseInt(row.present, 10) || 0;
        const late = parseInt(row.late, 10) || 0;
        const rate = total > 0 ? ((present + late) / total) * 100 : 0;

        return {
          className: row.classname || 'Unknown',
          total,
          present,
          absent: parseInt(row.absent, 10) || 0,
          late,
          rate
        };
      });

      const sortedByPresence = [...classStats].sort((a, b) => b.rate - a.rate);
      const mostPresentClass = sortedByPresence[0] || { className: 'N/A', rate: 0 };
      const highestAbsenteeClass = sortedByPresence[sortedByPresence.length - 1] || { className: 'N/A', rate: 0 };

      // --- By-student breakdown with derived absent + zero-record merge ---
      const attendanceStudentMap = new Map<number, { studentName: string; present: number; absent: number; late: number; total: number }>();
      for (const row of attendanceByStudent) {
        const sid = parseInt(row.studentId, 10);
        const present = parseInt(row.present, 10) || 0;
        const late = parseInt(row.late, 10) || 0;
        const rowReportedAbsent = parseInt(row.reported_absent, 10) || 0;
        const studentExpected = scheduledDaysMap.get(sid)?.scheduledDays ?? this.countCalendarDaysInRange(start, end);
        const derivedAbsent = Math.max(rowReportedAbsent, studentExpected - (present + late));
        attendanceStudentMap.set(sid, {
          studentName: row.studentName || 'Unknown',
          present,
          absent: derivedAbsent,
          late,
          total: parseInt(row.total, 10) || 0,
        });
      }

      for (const student of allActiveStudents) {
        const id = parseInt(student.studentId, 10);
        if (!attendanceStudentMap.has(id)) {
          const studentExpected = scheduledDaysMap.get(id)?.scheduledDays ?? this.countCalendarDaysInRange(start, end);
          attendanceStudentMap.set(id, {
            studentName: student.studentName || 'Unknown',
            present: 0,
            absent: studentExpected,
            late: 0,
            total: 0,
          });
        }
      }

      const studentStats = Array.from(attendanceStudentMap.values())
        .sort((a, b) => a.studentName.localeCompare(b.studentName));

      // --- Trend with derived absent per period (schedule-aware) ---
      const studentScheduleArrays = allActiveStudents.map(s => {
        const raw = s.schedule;
        const sched: string[] = typeof raw === 'string' && raw.length > 0 ? raw.split(',').map((d: string) => d.trim()) : (Array.isArray(raw) ? raw : []);
        return { schedule: sched.length > 0 ? sched : undefined };
      });

      const rawTrend = attendanceTrend.map(row => {
        const periodDate = new Date(row.date);
        const scheduledForPeriod = this.countScheduledStudentsForDate(periodDate, studentScheduleArrays);
        const present = parseInt(row.present, 10) || 0;
        const late = parseInt(row.late, 10) || 0;
        const rowReportedAbsent = parseInt(row.reported_absent, 10) || 0;
        const derivedAbsent = Math.max(rowReportedAbsent, scheduledForPeriod - (present + late));
        return {
          period: formatDateKey(periodDate),
          present,
          absent: derivedAbsent,
          late,
          total: scheduledForPeriod,
          rate: scheduledForPeriod > 0 ? ((present + late) / scheduledForPeriod) * 100 : 0,
        };
      });

      const filledTrend = this.fillMissingAttendancePeriods(start, end, rawTrend, optimalPeriodType);

      const finalTrend = filledTrend.map(item => {
        if (item.present === 0 && item.late === 0 && item.absent === 0) {
          const periodDate = new Date(item.period);
          const scheduledForPeriod = this.countScheduledStudentsForDate(periodDate, studentScheduleArrays);
          return { ...item, absent: scheduledForPeriod };
        }
        return item;
      });

      const trendXAxis = finalTrend.map((item, idx) => this.formatAnalyticsPeriodLabel(item.period, optimalPeriodType, idx));
      const trendPresent = finalTrend.map(item => item.present);
      const trendAbsent = finalTrend.map(item => item.absent);
      const trendLate = finalTrend.map(item => item.late);

      // --- Status distribution (always include all statuses) ---
      const statusData = [
        { name: 'Present', value: totalPresent },
        { name: 'Absent', value: totalAbsent },
        { name: 'Late', value: totalLate },
        { name: 'Excused', value: totalExcused },
      ];

      const statusXAxis = statusData.map(item => item.name);
      const statusYAxis = statusData.map(item => item.value);
      const statusPercentages = statusData.map(item =>
        totalRecords > 0 ? Math.round((item.value / totalRecords) * 100) : 0
      );

      const attendanceInsight = this.buildAttendanceInsight(
        start,
        end,
        attendanceByCalendarDay,
        studentScheduleArrays
      );

      return {
        success: true,
        message: 'Attendance analytics retrieved successfully',
        data: {
          overallAttendanceRate: Math.round(overallAttendanceRate * 100) / 100,
          mostPresentClass: {
            className: mostPresentClass.className,
            rate: Math.round(mostPresentClass.rate * 100) / 100,
          },
          highestAbsenteeClass: {
            className: highestAbsenteeClass.className,
            rate: Math.round(highestAbsenteeClass.rate * 100) / 100,
          },
          latenessRate: Math.round(latenessRate * 100) / 100,
          attendanceTrend: {
            xAxis: trendXAxis,
            present: trendPresent,
            absent: trendAbsent,
            late: trendLate,
          },
          attendanceByStudent: {
            xAxis: studentStats.map(s => s.studentName),
            present: studentStats.map(s => s.present),
            absent: studentStats.map(s => s.absent),
            late: studentStats.map(s => s.late),
          },
          statusDistribution: {
            xAxis: statusXAxis,
            yAxis: statusYAxis,
            percentages: statusPercentages,
          },
          attendanceInsight,
        },
        metadata: {
          startDate: formatDateKey(start),
          endDate: formatDateKey(end),
          totalRecords,
        },
      };
    } catch (error) {
      logger.error('Error fetching attendance analytics:', error);
      return {
        success: false,
        message: 'Failed to retrieve attendance analytics',
      };
    }
  }

  async getStaffAttendanceAnalytics(filters: AnalyticsFilters): Promise<StaffAttendanceAnalyticsResponse> {
    try {
      const { schoolId, staffId, periodType } = filters;
      const { start, end } = this.getDateRange(filters);

      const optimalPeriodType = this.determineOptimalPeriodType(start, end, periodType);

      const dateExpr = this.getDateTruncExpression(optimalPeriodType);

      const allActiveStaffQuery = this.staffRepository
        .createQueryBuilder('staff')
        .innerJoin('staff.user', 'user')
        .select([
          'staff.id as "teacherId"',
          "CONCAT(user.firstName, ' ', user.lastName) as \"staffName\"",
          'staff.daysPerWeek as "daysPerWeek"',
        ])
        .where('staff.status = :status', { status: StaffStatus.ACTIVE });
      if (schoolId) allActiveStaffQuery.andWhere('staff.schoolId = :schoolId', { schoolId });
      if (staffId) allActiveStaffQuery.andWhere('staff.id = :staffId', { staffId });

      const staffDayKey = `CONCAT(CAST(attendance.teacherId AS VARCHAR), '|', CAST(attendance.date AS VARCHAR))`;

      const overallStatsQuery = this.attendanceRepository
        .createQueryBuilder('attendance')
        .select([
          `COUNT(DISTINCT ${staffDayKey}) as total`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN ${staffDayKey} END) as present`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.ABSENT}' THEN ${staffDayKey} END) as reported_absent`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN ${staffDayKey} END) as late`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.EXCUSED}' THEN ${staffDayKey} END) as excused`,
        ])
        .where('attendance.date BETWEEN :start AND :end', { start, end })
        .andWhere('attendance.teacherId IS NOT NULL');
      if (schoolId) overallStatsQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });
      if (staffId) overallStatsQuery.andWhere('attendance.teacherId = :staffId', { staffId });

      const attendanceByStaffQuery = this.attendanceRepository
        .createQueryBuilder('attendance')
        .innerJoin('attendance.teacher', 'teacher')
        .innerJoin('teacher.user', 'user')
        .select([
          'teacher.id as "teacherId"',
          "CONCAT(user.firstName, ' ', user.lastName) as \"staffName\"",
          `COUNT(DISTINCT ${staffDayKey}) as total`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN ${staffDayKey} END) as present`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.ABSENT}' THEN ${staffDayKey} END) as reported_absent`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN ${staffDayKey} END) as late`,
        ])
        .where('attendance.date BETWEEN :start AND :end', { start, end })
        .andWhere('attendance.teacherId IS NOT NULL')
        .groupBy('teacher.id, user.firstName, user.lastName')
        .orderBy('"staffName"', 'ASC');
      if (schoolId) attendanceByStaffQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });
      if (staffId) attendanceByStaffQuery.andWhere('attendance.teacherId = :staffId', { staffId });

      const attendanceTrendQuery = this.attendanceRepository
        .createQueryBuilder('attendance')
        .select([
          `${dateExpr} as date`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.PRESENT}' THEN ${staffDayKey} END) as present`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.ABSENT}' THEN ${staffDayKey} END) as reported_absent`,
          `COUNT(DISTINCT CASE WHEN attendance.status = '${AttendanceStatus.LATE}' THEN ${staffDayKey} END) as late`,
        ])
        .where('attendance.date BETWEEN :start AND :end', { start, end })
        .andWhere('attendance.teacherId IS NOT NULL')
        .groupBy(dateExpr)
        .orderBy(dateExpr, 'ASC');
      if (schoolId) attendanceTrendQuery.andWhere('attendance.schoolId = :schoolId', { schoolId });
      if (staffId) attendanceTrendQuery.andWhere('attendance.teacherId = :staffId', { staffId });

      const [allActiveStaff, overallStats, attendanceByStaff, attendanceTrend] = await Promise.all([
        allActiveStaffQuery.getRawMany(),
        overallStatsQuery.getRawOne(),
        attendanceByStaffQuery.getRawMany(),
        attendanceTrendQuery.getRawMany(),
      ]);

      // Parse schedules and compute per-staff expected days
      const staffScheduleData = allActiveStaff.map(s => {
        const raw = s.daysPerWeek;
        const sched: string[] = Array.isArray(raw) ? raw : (typeof raw === 'string' && raw.length > 0 ? raw.split(',').map((d: string) => d.trim()) : []);
        const scheduledDays = this.countScheduledDays(start, end, sched.length > 0 ? sched : undefined);
        return { teacherId: parseInt(s.teacherId, 10), schedule: sched.length > 0 ? sched : undefined, scheduledDays };
      });
      const expectedRecords = staffScheduleData.reduce((sum, s) => sum + s.scheduledDays, 0);
      const scheduledDaysMap = new Map(staffScheduleData.map(s => [s.teacherId, s]));
      const staffScheduleArrays = staffScheduleData.map(s => ({ schedule: s.schedule }));

      // --- Overall stats with derived absent ---
      const totalPresent = parseInt(overallStats.present, 10) || 0;
      const reportedAbsent = parseInt(overallStats.reported_absent, 10) || 0;
      const totalLate = parseInt(overallStats.late, 10) || 0;
      const totalExcused = parseInt(overallStats.excused, 10) || 0;
      const totalAttended = totalPresent + totalLate;
      const totalAbsent = Math.max(reportedAbsent, expectedRecords - totalAttended - totalExcused);
      const totalRecords = totalPresent + totalAbsent + totalLate + totalExcused;

      const overallAttendanceRate = expectedRecords > 0
        ? (totalAttended / expectedRecords) * 100
        : 0;

      const latenessRate = totalAttended > 0
        ? (totalLate / totalAttended) * 100
        : 0;

      // --- By-staff breakdown with derived absent ---
      const attendanceStaffMap = new Map<number, { staffName: string; present: number; absent: number; late: number; total: number }>();
      for (const row of attendanceByStaff) {
        const tid = parseInt(row.teacherId, 10);
        const present = parseInt(row.present, 10) || 0;
        const late = parseInt(row.late, 10) || 0;
        const rowReportedAbsent = parseInt(row.reported_absent, 10) || 0;
        const staffExpected = scheduledDaysMap.get(tid)?.scheduledDays ?? this.countCalendarDaysInRange(start, end);
        const derivedAbsent = Math.max(rowReportedAbsent, staffExpected - (present + late));
        attendanceStaffMap.set(tid, {
          staffName: row.staffName || 'Unknown',
          present,
          absent: derivedAbsent,
          late,
          total: parseInt(row.total, 10) || 0,
        });
      }

      // Merge in active staff who had no attendance records (fully absent)
      for (const staff of allActiveStaff) {
        const id = parseInt(staff.teacherId, 10);
        if (!attendanceStaffMap.has(id)) {
          const staffExpected = scheduledDaysMap.get(id)?.scheduledDays ?? this.countCalendarDaysInRange(start, end);
          attendanceStaffMap.set(id, {
            staffName: staff.staffName || 'Unknown',
            present: 0,
            absent: staffExpected,
            late: 0,
            total: 0,
          });
        }
      }

      const staffStats = Array.from(attendanceStaffMap.values())
        .map(s => ({
          ...s,
          rate: (s.present + s.late + s.absent) > 0
            ? ((s.present + s.late) / (s.present + s.late + s.absent)) * 100
            : 0,
        }))
        .sort((a, b) => a.staffName.localeCompare(b.staffName));

      const sortedByPresence = [...staffStats].sort((a, b) => b.rate - a.rate);
      const mostPresentStaff = sortedByPresence[0] || { staffName: 'N/A', rate: 0 };
      const highestAbsenteeStaff = sortedByPresence[sortedByPresence.length - 1] || { staffName: 'N/A', rate: 0 };

      // --- Trend with derived absent per period (schedule-aware) ---
      const rawTrend = attendanceTrend.map(row => {
        const periodDate = new Date(row.date);
        const scheduledForPeriod = this.countScheduledStudentsForDate(periodDate, staffScheduleArrays);
        const present = parseInt(row.present, 10) || 0;
        const late = parseInt(row.late, 10) || 0;
        const rowReportedAbsent = parseInt(row.reported_absent, 10) || 0;
        const derivedAbsent = Math.max(rowReportedAbsent, scheduledForPeriod - (present + late));
        return {
          period: formatDateKey(periodDate),
          present,
          absent: derivedAbsent,
          late,
          total: scheduledForPeriod,
          rate: scheduledForPeriod > 0 ? ((present + late) / scheduledForPeriod) * 100 : 0,
        };
      });

      const filledTrend = this.fillMissingAttendancePeriods(start, end, rawTrend, optimalPeriodType);

      const finalTrend = filledTrend.map(item => {
        if (item.present === 0 && item.late === 0 && item.absent === 0) {
          const periodDate = new Date(item.period);
          const scheduledForPeriod = this.countScheduledStudentsForDate(periodDate, staffScheduleArrays);
          return { ...item, absent: scheduledForPeriod };
        }
        return item;
      });

      const trendXAxis = finalTrend.map((item, idx) => this.formatAnalyticsPeriodLabel(item.period, optimalPeriodType, idx));
      const trendPresent = finalTrend.map(item => item.present);
      const trendAbsent = finalTrend.map(item => item.absent);
      const trendLate = finalTrend.map(item => item.late);

      // --- Status distribution (always include all statuses) ---
      const statusData = [
        { name: 'Present', value: totalPresent },
        { name: 'Absent', value: totalAbsent },
        { name: 'Late', value: totalLate },
        { name: 'Excused', value: totalExcused },
      ];

      const statusXAxis = statusData.map(item => item.name);
      const statusYAxis = statusData.map(item => item.value);
      const statusPercentages = statusData.map(item =>
        totalRecords > 0 ? Math.round((item.value / totalRecords) * 100) : 0
      );

      return {
        success: true,
        message: 'Staff Attendance Analytics retrieved successfully',
        data: {
          overallAttendanceRate: Math.round(overallAttendanceRate * 100) / 100,
          mostPresentStaff: {
            staffName: mostPresentStaff.staffName,
            rate: Math.round(mostPresentStaff.rate * 100) / 100,
          },
          highestAbsenteeStaff: {
            staffName: highestAbsenteeStaff.staffName,
            rate: Math.round(highestAbsenteeStaff.rate * 100) / 100,
          },
          latenessRate: Math.round(latenessRate * 100) / 100,
          attendanceTrend: {
            xAxis: trendXAxis,
            present: trendPresent,
            absent: trendAbsent,
            late: trendLate,
          },
          attendanceByStaff: {
            xAxis: staffStats.map(s => s.staffName),
            present: staffStats.map(s => s.present),
            absent: staffStats.map(s => s.absent),
            late: staffStats.map(s => s.late),
          },
          statusDistribution: {
            xAxis: statusXAxis,
            yAxis: statusYAxis,
            percentages: statusPercentages,
          },
        },
        metadata: {
          startDate: formatDateKey(start),
          endDate: formatDateKey(end),
          totalRecords,
        },
      };
    } catch (error) {
      logger.error('Error fetching staff attendance analytics:', error);
      return {
        success: false,
        message: 'Failed to retrieve staff attendance analytics',
      };
    }
  }

  async getEarningsStats(filters: AnalyticsFilters): Promise<EarningsStatsResponse> {
    try {
      const { schoolId } = filters;
      const { start, end } = this.getDateRange(filters);

      const optimalPeriodType = this.determineOptimalPeriodType(
        start,
        end,
        filters.periodType as 'daily' | 'weekly' | 'monthly' | 'yearly' | undefined,
      );

      const dateTrunc = this.getDateTruncExpression(optimalPeriodType, 'payment.paymentDate');

      const rawData = await this.invoicePaymentRepository
        .createQueryBuilder('payment')
        .innerJoin('payment.invoice', 'invoice')
        .select([
          `${dateTrunc} as period`,
          'SUM(payment.amountPaid) as amount',
        ])
        .where('invoice.schoolId = :schoolId', { schoolId })
        .andWhere('payment.paymentDate BETWEEN :start AND :end', { start, end })
        .groupBy(dateTrunc)
        .orderBy(dateTrunc, 'ASC')
        .getRawMany();

      const mappedData = rawData.map(row => ({
        period: formatDateKey(new Date(row.period)),
        count: parseFloat(row.amount) || 0,
        date: new Date(row.period),
      }));

      const filledData = this.fillMissingPeriods(start, end, optimalPeriodType, mappedData);

      const xAxis = filledData.map((item, idx) =>
        this.formatAnalyticsPeriodLabel(item.period, optimalPeriodType, idx),
      );
      const yAxis = filledData.map(item => item.count);
      const totalEarnings = yAxis.reduce((sum, val) => sum + val, 0);

      return {
        success: true,
        message: 'Earnings statistics retrieved successfully',
        data: { xAxis, yAxis, periodType: optimalPeriodType },
        metadata: {
          unit: 'NGN',
          total: totalEarnings,
          startDate: formatDateKey(start),
          endDate: formatDateKey(end),
          periodType: optimalPeriodType,
        },
      };
    } catch (error) {
      logger.error('Error fetching earnings stats:', error);
      return {
        success: false,
        message: 'Failed to retrieve earnings statistics',
      };
    }
  }

  /**
   * Private helper methods
   */

  private getDateTruncExpression(periodType: 'daily' | 'weekly' | 'monthly' | 'yearly', column: string = 'attendance.date'): string {
    switch (periodType) {
      case 'daily':   return `DATE(${column})`;
      case 'weekly':  return `DATE_TRUNC('week', ${column})`;
      case 'monthly': return `DATE_TRUNC('month', ${column})`;
      case 'yearly':  return `DATE_TRUNC('year', ${column})`;
      default:        return `DATE(${column})`;
    }
  }

  /** Inclusive calendar days between start and end (matches full-week daily attendance series). */
  private countCalendarDaysInRange(start: Date, end: Date): number {
    const msPerDay = 86400000;
    const s = new Date(start); s.setHours(12, 0, 0, 0);
    const e = new Date(end); e.setHours(12, 0, 0, 0);
    const totalDays = Math.round((e.getTime() - s.getTime()) / msPerDay) + 1;
    return totalDays > 0 ? totalDays : 0;
  }

  private static readonly DAY_NAME_TO_DOW: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };

  /** Labels aligned with `Date.getDay()` indices 0–6 (matches `countScheduledStudentsForDate`). */
  private static readonly INSIGHT_JS_WEEKDAY_LABELS = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ] as const;

  /**
   * Expected active-student headcount for a calendar day with JS weekday `dow`,
   * identical to `countScheduledStudentsForDate` but precomputed in O(students) once.
   */
  private precomputeExpectedStudentCountByJsDow(students: { schedule?: string[] }[]): number[] {
    const usLong = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ] as const;
    const out = [0, 0, 0, 0, 0, 0, 0];
    for (let dow = 0; dow < 7; dow++) {
      const dayName = usLong[dow]!;
      let c = 0;
      for (let i = 0; i < students.length; i++) {
        const s = students[i]!;
        const sched = s.schedule;
        if (!sched || sched.length === 0) {
          c++;
          continue;
        }
        for (let j = 0; j < sched.length; j++) {
          if (sched[j]!.trim().toLowerCase() === dayName) {
            c++;
            break;
          }
        }
      }
      out[dow] = c;
    }
    return out;
  }

  private normalizeInsightSqlDayKey(raw: unknown): string {
    if (raw == null) return "";
    if (typeof raw === "string") {
      return raw.includes("T") ? raw.split("T")[0]! : raw.slice(0, 10);
    }
    if (raw instanceof Date) return formatDateKey(raw);
    return formatDateKey(new Date(String(raw)));
  }

  /**
   * Single pass over the report range: weekday pooled rates + first-half vs second-half trend.
   * Uses the same schedule semantics as `countScheduledStudentsForDate` via precomputed DOW counts.
   */
  private buildAttendanceInsight(
    rangeStart: Date,
    rangeEnd: Date,
    attendanceByDayRaw: Array<{ day?: unknown; present?: unknown; late?: unknown }>,
    studentScheduleArrays: { schedule?: string[] }[]
  ): AttendanceInsight {
    const expectedByDow = this.precomputeExpectedStudentCountByJsDow(studentScheduleArrays);
    const labels = AnalyticsService.INSIGHT_JS_WEEKDAY_LABELS;

    const daily = new Map<string, { present: number; late: number }>();
    for (let i = 0; i < attendanceByDayRaw.length; i++) {
      const row = attendanceByDayRaw[i]!;
      const key = this.normalizeInsightSqlDayKey(row.day);
      if (!key) continue;
      daily.set(key, {
        present: parseInt(String(row.present ?? "0"), 10) || 0,
        late: parseInt(String(row.late ?? "0"), 10) || 0,
      });
    }

    const dowExpected = [0, 0, 0, 0, 0, 0, 0];
    const dowAttended = [0, 0, 0, 0, 0, 0, 0];

    const totalDayCount = this.countCalendarDaysInRange(rangeStart, rangeEnd);
    const mid = Math.floor(totalDayCount / 2);
    let firstExpected = 0;
    let firstAttended = 0;
    let secondExpected = 0;
    let secondAttended = 0;

    const cursor = new Date(rangeStart);
    let dayIndex = 0;
    while (cursor <= rangeEnd) {
      const dateKey = formatDateKey(cursor);
      const slot = daily.get(dateKey);
      const attended = (slot?.present ?? 0) + (slot?.late ?? 0);
      const dow = cursor.getDay();
      const expectedToday = expectedByDow[dow] ?? 0;

      dowExpected[dow] = (dowExpected[dow] ?? 0) + expectedToday;
      dowAttended[dow] = (dowAttended[dow] ?? 0) + attended;

      if (dayIndex < mid) {
        firstExpected += expectedToday;
        firstAttended += attended;
      } else {
        secondExpected += expectedToday;
        secondAttended += attended;
      }

      dayIndex++;
      cursor.setDate(cursor.getDate() + 1);
    }

    const na = { dayName: "N/A", ratePercent: 0 };
    let bestDow = -1;
    let bestRate = -1;
    let worstDow = -1;
    let worstRate = 101;
    for (let d = 0; d < 7; d++) {
      const exp = dowExpected[d]!;
      if (exp <= 0) continue;
      const rate = (dowAttended[d]! / exp) * 100;
      if (rate > bestRate) {
        bestRate = rate;
        bestDow = d;
      }
      if (rate < worstRate) {
        worstRate = rate;
        worstDow = d;
      }
    }

    const bestDay =
      bestDow < 0 ? na : { dayName: labels[bestDow]!, ratePercent: Math.round(bestRate * 100) / 100 };
    const worstDay =
      worstDow < 0 ? na : { dayName: labels[worstDow]!, ratePercent: Math.round(worstRate * 100) / 100 };

    let weeklyTrend: AttendanceInsight["weeklyTrend"] = { direction: "stable", changePercent: 0 };
    if (totalDayCount >= 2) {
      const rateFirst = firstExpected > 0 ? (firstAttended / firstExpected) * 100 : 0;
      const rateSecond = secondExpected > 0 ? (secondAttended / secondExpected) * 100 : 0;
      const delta = rateSecond - rateFirst;
      const rounded = Math.round(delta * 100) / 100;
      const eps = 0.25;
      weeklyTrend = {
        direction: delta > eps ? "improving" : delta < -eps ? "declining" : "stable",
        changePercent: rounded,
      };
    }

    return { bestDay, worstDay, weeklyTrend };
  }

  private countScheduledDays(start: Date, end: Date, schedule?: string[]): number {
    if (!schedule || schedule.length === 0) {
      return this.countCalendarDaysInRange(start, end);
    }
    const scheduledDows = new Set(
      schedule.map(d => AnalyticsService.DAY_NAME_TO_DOW[d.trim().toLowerCase()]).filter(d => d !== undefined)
    );
    if (scheduledDows.size === 0) return this.countCalendarDaysInRange(start, end);

    const msPerDay = 86400000;
    const s = new Date(start); s.setHours(12, 0, 0, 0);
    const e = new Date(end); e.setHours(12, 0, 0, 0);
    const totalDays = Math.round((e.getTime() - s.getTime()) / msPerDay) + 1;
    if (totalDays <= 0) return 0;

    const startDow = s.getDay();
    const fullWeeks = Math.floor(totalDays / 7);
    const remainder = totalDays % 7;
    let count = scheduledDows.size * fullWeeks;
    for (let i = 0; i < remainder; i++) {
      if (scheduledDows.has((startDow + i) % 7)) count++;
    }
    return count;
  }

  private countScheduledStudentsForDate(date: Date, students: { schedule?: string[] }[]): number {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return students.filter(s => {
      if (!s.schedule || s.schedule.length === 0) {
        return true;
      }
      return s.schedule.some(d => d.trim().toLowerCase() === dayName);
    }).length;
  }

  private formatDateLabel(dateString: string, periodType: string = 'daily'): string {
    const date = new Date(dateString);

    switch (periodType) {
      case 'daily':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'weekly':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      case 'yearly':
        return date.getFullYear().toString();
      default:
        return dateString;
    }
  }

  private formatAnalyticsPeriodLabel(dateString: string, periodType: string, weekIndex?: number): string {
    const date = new Date(dateString);
    switch (periodType) {
      case 'daily': {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        return `${dayName} ${date.getDate()}`;
      }
      case 'weekly':
        return `Week ${(weekIndex ?? 0) + 1}`;
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'short' });
      case 'yearly':
        return date.getFullYear().toString();
      default:
        return dateString;
    }
  }

  private determineOptimalPeriodType(start: Date, end: Date, requestedType?: 'daily' | 'weekly' | 'monthly' | 'yearly'): 'daily' | 'weekly' | 'monthly' | 'yearly' {
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (requestedType) {
      // Cap granularity to prevent excessive gap-fill arrays
      if (requestedType === 'daily' && daysDiff > 90) return 'weekly';
      if (requestedType === 'weekly' && daysDiff > 365) return 'monthly';
      if (requestedType === 'monthly' && daysDiff > 1825) return 'yearly';
      return requestedType;
    }

    if (daysDiff <= 35) return 'daily';
    if (daysDiff <= 150) return 'weekly';
    if (daysDiff <= 365) return 'monthly';
    return 'yearly';
  }

  /**
   * Fill missing periods with zero counts for complete data series
   */
  private fillMissingPeriods(
    start: Date,
    end: Date,
    periodType: 'daily' | 'weekly' | 'monthly' | 'yearly',
    existingData: Array<{ period: string; count: number; date: Date }>
  ): Array<{ period: string; count: number; date: Date }> {
    const filledData: Array<{ period: string; count: number; date: Date }> = [];
    const dataMap = new Map(existingData.map(item => [item.period, item.count]));

    const currentDate = new Date(start);

    while (currentDate <= end) {
      let periodKey: string;
      const periodDate = new Date(currentDate);

      switch (periodType) {
        case 'daily':
          periodKey = formatDateKey(currentDate);
          break;
        case 'weekly':
          const weekStart = new Date(currentDate);
          const day = weekStart.getDay();
          const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
          weekStart.setDate(diff);
          weekStart.setHours(0, 0, 0, 0);
          periodKey = formatDateKey(weekStart);
          break;
        case 'monthly':
          periodKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
          break;
        case 'yearly':
          periodKey = `${currentDate.getFullYear()}-01-01`;
          break;
      }

      filledData.push({
        period: periodKey,
        count: dataMap.get(periodKey) || 0,
        date: periodDate,
      });

      switch (periodType) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }

    const uniqueData = Array.from(
      new Map(filledData.map(item => [item.period, item])).values()
    );

    return uniqueData.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Fill missing attendance periods with zero counts (daily includes Sat/Sun).
   */
  private fillMissingAttendancePeriods(
    start: Date,
    end: Date,
    existingData: Array<{ period: string; present: number; absent: number; late: number; total: number; rate: number }>,
    periodType: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'
  ): Array<{ period: string; present: number; absent: number; late: number; total: number; rate: number }> {
    const filledData: Array<{ period: string; present: number; absent: number; late: number; total: number; rate: number }> = [];
    const dataMap = new Map(existingData.map(item => [item.period, item]));

    const currentDate = new Date(start);

    while (currentDate <= end) {
      let periodKey: string;

      switch (periodType) {
        case 'daily':
          periodKey = formatDateKey(currentDate);
          break;
        case 'weekly':
          const weekStart = new Date(currentDate);
          const day = weekStart.getDay();
          const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
          weekStart.setDate(diff);
          weekStart.setHours(0, 0, 0, 0);
          periodKey = formatDateKey(weekStart);
          break;
        case 'monthly':
          periodKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
          break;
        case 'yearly':
          periodKey = `${currentDate.getFullYear()}-01-01`;
          break;
      }

      const existingRecord = dataMap.get(periodKey);

      const lastEntry = filledData[filledData.length - 1];
      if (filledData.length === 0 || !lastEntry || lastEntry.period !== periodKey) {
        filledData.push(existingRecord || {
          period: periodKey,
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
          rate: 0,
        });
      }

      switch (periodType) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }

    return filledData;
  }

  // ─── Billing Report ────────────────────────────────────────────────────────

  /**
   * Returns paginated billing rows for Deposits (Invoices).
   */
  async getBillingDeposits(
    filters: BillingReportFilters
  ): Promise<BillingReportResponse> {
    try {
      const { schoolId, startDate, endDate, classroomId, studentId, parentId, status } = filters;
      const pos = filters.pos ?? 0;
      const delta = filters.delta ?? 10;

      const formatDate = (d: Date | string): string => {
        const dt = d instanceof Date ? d : new Date(d);
        return dt.toISOString().split('T')[0]!;
      };

      const resolveName = (firstName?: string | null, lastName?: string | null): string =>
        [firstName, lastName].filter(Boolean).join(' ').trim() || 'N/A';

      const qb = this.invoiceRepository
        .createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.student', 'student')
        .leftJoinAndSelect('student.user', 'studentUser')
        .leftJoinAndSelect('invoice.parents', 'parent')
        .leftJoinAndSelect('parent.user', 'parentUser')
        .where('invoice.schoolId = :schoolId', { schoolId })
        .orderBy('invoice.id', 'DESC');

      if (startDate) {
        qb.andWhere('invoice.issueDate >= :startDate', { startDate: new Date(startDate) });
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        qb.andWhere('invoice.issueDate <= :endDate', { endDate: end });
      }
      if (classroomId) {
        qb.andWhere('invoice.classroomId = :classroomId', { classroomId });
      }
      if (studentId) {
        qb.andWhere('invoice.studentId = :studentId', { studentId });
      }
      if (parentId) {
        qb.andWhere('parent.id = :parentId', { parentId });
      }
      if (status) {
        qb.andWhere('invoice.status = :status', { status });
      }

      const [invoices, count] = await qb.skip(pos).take(delta).getManyAndCount();

      const data: BillingDepositItem[] = invoices.map((inv: Invoice) => {
        const su = (inv.student as any)?.user;
        const firstParent = Array.isArray(inv.parents) ? inv.parents[0] : undefined;
        const pu = (firstParent as any)?.user;

        return {
          id: inv.id,
          studentName: resolveName(su?.firstName, su?.lastName),
          parentName: resolveName(pu?.firstName, pu?.lastName),
          issueDate: formatDate(inv.issueDate),
          dueDate: formatDate(inv.dueDate),
          description: inv.notes ?? '',
          status: this.getComputedStatus(inv),
          totalFees: Number(inv.total),
          amountDeposited: Number(inv.amountPaid),
        };
      });

      return {
        success: true,
        message: `Found ${count} deposit(s)`,
        data,
        pagination: { pos, delta, count },
      };
    } catch (error) {
      logger.error('Error fetching billing deposits:', error);
      return {
        success: false,
        message: 'Failed to retrieve billing deposits',
      };
    }
  }

  /**
   * Helper to compute invoice status based on amounts and due date.
   */
  private getComputedStatus(invoice: Invoice): InvoiceStatus {
    const total = Number(invoice.total || 0);
    const paid = Number(invoice.amountPaid || 0);
    const balance = Number(invoice.balance ?? (total - paid));

    if (invoice.status === InvoiceStatus.VOID) return InvoiceStatus.VOID;
    if (balance <= 0 && total > 0) return InvoiceStatus.PAID;
    if (paid > 0 && balance > 0) return InvoiceStatus.PARTIALLY_PAID;
    
    // Check if overdue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(invoice.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today && balance > 0) return InvoiceStatus.OVERDUE;
    
    return InvoiceStatus.SENT;
  }

  /**
   * Returns paginated billing rows for Transactions (Invoice Payments).
   */
  async getBillingTransactions(
    filters: BillingReportFilters
  ): Promise<BillingReportResponse> {
    try {
      const { schoolId, startDate, endDate, classroomId, studentId, parentId, status } = filters;
      const pos = filters.pos ?? 0;
      const delta = filters.delta ?? 10;

      const formatDate = (d: Date | string): string => {
        const dt = d instanceof Date ? d : new Date(d);
        return dt.toISOString().split('T')[0]!;
      };

      const resolveName = (firstName?: string | null, lastName?: string | null): string =>
        [firstName, lastName].filter(Boolean).join(' ').trim() || 'N/A';

      const qb = this.invoicePaymentRepository
        .createQueryBuilder('payment')
        .innerJoinAndSelect('payment.invoice', 'invoice')
        .leftJoinAndSelect('invoice.student', 'student')
        .leftJoinAndSelect('student.user', 'studentUser')
        .leftJoinAndSelect('invoice.parents', 'parent')
        .leftJoinAndSelect('parent.user', 'parentUser')
        .where('invoice.schoolId = :schoolId', { schoolId })
        .orderBy('payment.id', 'DESC');

      if (startDate) {
        qb.andWhere('payment.paymentDate >= :startDate', { startDate: new Date(startDate) });
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        qb.andWhere('payment.paymentDate <= :endDate', { endDate: end });
      }
      if (classroomId) {
        qb.andWhere('invoice.classroomId = :classroomId', { classroomId });
      }
      if (studentId) {
        qb.andWhere('invoice.studentId = :studentId', { studentId });
      }
      if (parentId) {
        qb.andWhere('parent.id = :parentId', { parentId });
      }
      if (status) {
        qb.andWhere('invoice.status = :status', { status });
      }

      const [payments, count] = await qb.skip(pos).take(delta).getManyAndCount();

      const data: BillingTransactionItem[] = payments.map((pmt: any) => {
        const su = pmt.invoice?.student?.user ?? (pmt as any).studentUser;
        const firstParent = Array.isArray(pmt.invoice?.parents) ? pmt.invoice.parents[0] : undefined;
        const pu = (firstParent as any)?.user;

        return {
          id: pmt.id,
          studentName: resolveName(su?.firstName, su?.lastName),
          parentName: resolveName(pu?.firstName, pu?.lastName),
          paymentDate: formatDate(pmt.paymentDate),
          description: pmt.notes ?? pmt.purpose ?? '',
          amountPaid: Number(pmt.amountPaid),
        };
      });

      return {
        success: true,
        message: `Found ${count} transaction(s)`,
        data,
        pagination: { pos, delta, count },
      };
    } catch (error) {
      logger.error('Error fetching billing transactions:', error);
      return {
        success: false,
        message: 'Failed to retrieve billing transactions',
      };
    }
  }

  /**
   * Returns a rolled up summary of billing data grouped by student. Lists every
   * child in the school (paginated) and fills in invoice stats for the period;
   * children with no invoices in range appear with zeroed amounts.
   */
  async getBillingSummary(
    filters: BillingReportFilters
  ): Promise<BillingSummaryResponse> {
    try {
      const { schoolId, startDate, endDate, classroomId, studentId, parentId, status } = filters;
      const pos = filters.pos ?? 0;
      const delta = filters.delta ?? 10;

      const formatDate = (d: Date | string): string => {
        const dt = d instanceof Date ? d : new Date(d);
        return dt.toISOString().split('T')[0]!;
      };

      const resolveName = (firstName?: string | null, lastName?: string | null): string =>
        [firstName, lastName].filter(Boolean).join(' ').trim() || 'N/A';

      // Base student query: all children in the school, with optional filters.
      const buildStudentBaseQuery = () => {
        const qb = this.studentRepository
          .createQueryBuilder('student')
          .where('student.schoolId = :schoolId', { schoolId });

        if (classroomId) qb.andWhere('student.classroomId = :classroomId', { classroomId });
        if (studentId) qb.andWhere('student.id = :studentId', { studentId });
        if (parentId) {
          qb.innerJoin('student.parents', 'parentFilter', 'parentFilter.id = :parentId', { parentId });
        }

        return qb;
      };

      const totalChildrenCount = await buildStudentBaseQuery().getCount();

      // Aggregate invoice metadata across all matching children for the period.
      const buildInvoiceAggregateQuery = () => {
        const qb = this.invoiceRepository
          .createQueryBuilder('invoice')
          .innerJoin('invoice.student', 'student')
          .leftJoin('invoice.parents', 'parent')
          .where('invoice.schoolId = :schoolId', { schoolId });

        if (startDate) qb.andWhere('invoice.issueDate >= :startDate', { startDate: new Date(startDate) });
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          qb.andWhere('invoice.issueDate <= :endDate', { endDate: end });
        }
        if (classroomId) qb.andWhere('student.classroomId = :classroomId', { classroomId });
        if (studentId) qb.andWhere('student.id = :studentId', { studentId });
        if (parentId) qb.andWhere('parent.id = :parentId', { parentId });
        if (status) qb.andWhere('invoice.status = :status', { status });

        return qb;
      };

      const aggregateResult = await buildInvoiceAggregateQuery()
        .select([
          'COALESCE(SUM(invoice.balance), 0) as total_outstanding_balance_amount',
          'COALESCE(SUM(invoice.total), 0) as total_amount',
          'COALESCE(SUM(invoice.amountPaid), 0) as total_paid_amount',
          'COUNT(CASE WHEN COALESCE(invoice.balance, 0) > 0 THEN 1 END) as total_outstanding_balance_count',
        ])
        .getRawOne();

      const metadata = {
        totalOutstandingBalanceAmount: parseFloat(aggregateResult?.total_outstanding_balance_amount || '0') || 0,
        totalOutstandingBalanceCount: parseInt(aggregateResult?.total_outstanding_balance_count || '0', 10) || 0,
        totalAmount: parseFloat(aggregateResult?.total_amount || '0') || 0,
        totalPaidAmount: parseFloat(aggregateResult?.total_paid_amount || '0') || 0,
      };

      // Order children: those with invoices in the period first (by most recent
      // issueDate, then largest invoiced amount), then children without invoices
      // by student id. This drives a paginated list of student ids.
      const orderedIdRows = await buildStudentBaseQuery()
        .leftJoin(
          (sub) => {
            const s = sub
              .select('invoice.studentId', 'studentId')
              .addSelect('MAX(invoice.issueDate)', 'lastInvoiceDate')
              .addSelect('SUM(invoice.total)', 'totalAmount')
              .from(Invoice, 'invoice')
              .where('invoice.schoolId = :schoolId', { schoolId });
            if (startDate) s.andWhere('invoice.issueDate >= :startDate', { startDate: new Date(startDate) });
            if (endDate) {
              const end = new Date(endDate);
              end.setHours(23, 59, 59, 999);
              s.andWhere('invoice.issueDate <= :endDate', { endDate: end });
            }
            if (status) s.andWhere('invoice.status = :status', { status });
            return s.groupBy('invoice.studentId');
          },
          'inv_summary',
          'inv_summary."studentId" = student.id'
        )
        .select('student.id', 'id')
        .orderBy('inv_summary."lastInvoiceDate"', 'DESC', 'NULLS LAST')
        .addOrderBy('inv_summary."totalAmount"', 'DESC', 'NULLS LAST')
        .addOrderBy('student.id', 'ASC')
        .offset(pos)
        .limit(delta)
        .getRawMany();

      const orderedIds = orderedIdRows
        .map((r: { id: number | string }) => Number(r.id))
        .filter((id) => Number.isFinite(id) && id > 0);

      if (orderedIds.length === 0) {
        return {
          success: true,
          message: 'No records found',
          data: [],
          pagination: { pos, delta, count: totalChildrenCount },
          metadata,
        };
      }

      // Load full student rows for the page and re-apply the requested ordering.
      const studentsUnordered = await this.studentRepository
        .createQueryBuilder('student')
        .leftJoinAndSelect('student.user', 'user')
        .leftJoinAndSelect('student.parents', 'parent')
        .leftJoinAndSelect('parent.user', 'parentUser')
        .where('student.id IN (:...orderedIds)', { orderedIds })
        .getMany();

      const orderIndex = new Map<number, number>();
      orderedIds.forEach((id, idx) => orderIndex.set(id, idx));
      const studentsArr = studentsUnordered.sort(
        (a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0)
      );

      // Initialize a row for every child in the page with zeroed billing stats.
      const summaryMap = new Map<number, BillingSummaryItem>();
      const studentIdToUserId = new Map<number, number>();
      for (const st of studentsArr) {
        const uId = st.userId;
        if (!uId) continue;
        studentIdToUserId.set(st.id, uId);
        const su = st.user;
        const firstParent = Array.isArray(st.parents) ? st.parents[0] : undefined;
        const pu = (firstParent as { user?: { firstName?: string | null; lastName?: string | null } } | undefined)?.user;
        summaryMap.set(uId, {
          studentId: uId,
          studentName: resolveName(su?.firstName, su?.lastName),
          parentName: resolveName(pu?.firstName, pu?.lastName),
          invoiceDates: [],
          invoicesIssued: 0,
          totalInvoiceAmount: 0,
          outstandingBalance: 0,
          paid: 0,
        });
      }

      // Fetch invoices for the children on this page and accumulate stats.
      const studentIds = Array.from(studentIdToUserId.keys());
      if (studentIds.length > 0) {
        const invoicesQb = this.invoiceRepository
          .createQueryBuilder('invoice')
          .where('invoice.studentId IN (:...studentIds)', { studentIds })
          .andWhere('invoice.schoolId = :schoolId', { schoolId });

        if (startDate) invoicesQb.andWhere('invoice.issueDate >= :startDate', { startDate: new Date(startDate) });
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          invoicesQb.andWhere('invoice.issueDate <= :endDate', { endDate: end });
        }
        if (status) invoicesQb.andWhere('invoice.status = :status', { status });

        const invoicesArr = await invoicesQb.orderBy('invoice.issueDate', 'DESC').getMany();

        invoicesArr.forEach(inv => {
          const uId = studentIdToUserId.get(inv.studentId);
          if (!uId) return;
          const item = summaryMap.get(uId);
          if (!item) return;
          item.invoicesIssued += 1;
          item.totalInvoiceAmount += Number(inv.total);
          item.outstandingBalance += Number(inv.balance);
          item.paid += Number(inv.amountPaid);
          item.invoiceDates.push(formatDate(inv.issueDate));
        });
      }

      return {
        success: true,
        message: `Found summary for ${summaryMap.size} child(ren)`,
        data: Array.from(summaryMap.values()),
        pagination: { pos, delta, count: totalChildrenCount },
        metadata,
      };
    } catch (error) {
      logger.error('Error fetching billing summary:', error);
      return {
        success: false,
        message: 'Failed to retrieve billing summary',
      };
    }
  }

  /**
   * Admin student report: classroom activities or learning.
   * Learning lists active students in scope; period fields use latest milestone score in the date range when present.
   */
  async getAdminStudentReport(filters: AdminStudentReportFilters): Promise<AdminReportResponse> {
    try {
      const { start, end } = this.resolveAdminDateRange(filters.startDate, filters.endDate);
      const pos = filters.pos ?? 0;
      const delta = filters.delta ?? 25;
      const meta = {
        type: filters.type,
        startDate: formatDateKey(start),
        endDate: formatDateKey(end),
      };

      if (filters.type === "activities") {
        const base = this.classroomStudentActivityRepository
          .createQueryBuilder("csa")
          .innerJoinAndSelect("csa.classroomActivity", "activity")
          .innerJoinAndSelect("activity.classroom", "classroom")
          .innerJoinAndSelect("csa.student", "student")
          .innerJoinAndSelect("student.user", "user")
          .where("classroom.schoolId = :schoolId", { schoolId: filters.schoolId })
          .andWhere("activity.createdAt >= :start", { start })
          .andWhere("activity.createdAt <= :end", { end });

        if (filters.classroomId) {
          base.andWhere("classroom.id = :classroomId", { classroomId: filters.classroomId });
        }
        if (filters.studentId) {
          base.andWhere("student.id = :studentId", { studentId: filters.studentId });
        }
        if (filters.staffId) {
          base.andWhere(
            `EXISTS (SELECT 1 FROM "staffClassesAndSubject" scs WHERE scs."classroomId" = classroom.id AND scs."staffId" = :staffId)`,
            { staffId: filters.staffId }
          );
        }

        const total = await base.getCount();

        const rows = await base.orderBy("activity.createdAt", "DESC").skip(pos).take(delta).getMany();

        const data = rows.map((csa) => {
          const u = csa.student?.user;
          const childrenName = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() || "Unknown";
          const act = csa.classroomActivity;
          return {
            childrenName,
            dateTime: act?.createdAt,
            activityType: act?.activityType,
            notesOrDescription: act?.notes ?? null,
            classroomName: act?.classroom?.classroomName ?? null,
          };
        });

        return {
          success: true,
          message: "Student activities report retrieved successfully",
          data,
          metadata: meta,
          pagination: { pos, delta, total },
        };
      }

      const learningBase = this.studentRepository
        .createQueryBuilder("student")
        .where("student.schoolId = :schoolId", { schoolId: filters.schoolId })
        .andWhere("student.status = :status", { status: StudentStatus.ACTIVE });

      if (filters.classroomId) {
        learningBase.andWhere("student.classroomId = :classroomId", { classroomId: filters.classroomId });
      }
      if (filters.studentId) {
        learningBase.andWhere("student.id = :studentId", { studentId: filters.studentId });
      }
      if (filters.staffId) {
        learningBase.andWhere(
          `EXISTS (SELECT 1 FROM "staffClassesAndSubject" scs WHERE scs."classroomId" = student."classroomId" AND scs."staffId" = :staffId)`,
          { staffId: filters.staffId }
        );
      }

      const total = await learningBase.getCount();

      const idRows = await learningBase
        .clone()
        .select("student.id", "id")
        .orderBy("student.id", "ASC")
        .offset(pos)
        .limit(delta)
        .getRawMany();

      const studentIds = idRows
        .map((r: { id: string | number }) => Number(r.id))
        .filter((id) => !Number.isNaN(id));
      if (studentIds.length === 0) {
        return {
          success: true,
          message: "No students match this report",
          data: [],
          metadata: meta,
          pagination: { pos, delta, total },
        };
      }

      const studentsPage = await this.studentRepository
        .createQueryBuilder("student")
        .leftJoinAndSelect("student.user", "user")
        .leftJoinAndSelect("student.currentClassroom", "currentClassroom")
        .where("student.id IN (:...studentIds)", { studentIds })
        .orderBy("student.id", "ASC")
        .getMany();

      const studentById = new Map(studentsPage.map((st) => [st.id, st]));

      const scores = await this.studentAssessmentScoreRepository
        .createQueryBuilder("score")
        .leftJoinAndSelect("score.milestone", "milestone")
        .leftJoinAndSelect("milestone.subject", "subject")
        .leftJoinAndSelect("score.assessment", "assessment")
        .where("score.studentId IN (:...studentIds)", { studentIds })
        .andWhere("score.milestoneId IS NOT NULL")
        .andWhere("score.updatedAt >= :start", { start })
        .andWhere("score.updatedAt <= :end", { end })
        .orderBy("score.studentId", "ASC")
        .addOrderBy("score.updatedAt", "DESC")
        .getMany();

      const picked = new Map<number, (typeof scores)[0]>();
      for (const s of scores) {
        if (!picked.has(s.studentId)) {
          picked.set(s.studentId, s);
        }
      }

      const studentService = new StudentService();
      const averageDevelopmentPercentMap = await studentService.getGradedMilestonePerformancePercentMap(
        filters.schoolId,
        studentIds
      );

      const data = studentIds.map((sid) => {
        const st = studentById.get(sid);
        if (!st) {
          return null;
        }
        const scoreRow = picked.get(sid);
        const u = st.user;
        const childrenName = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() || "Unknown";
        const classroomName =
          st.currentClassroom?.classroomName ?? scoreRow?.assessment?.title ?? null;
        const performancePercentage = averageDevelopmentPercentMap.get(sid) ?? null;
        return {
          childrenName,
          classroomName,
          performancePercentage,
          lastAssessmentDate: scoreRow?.updatedAt ?? null,
          lastObservationSummary: scoreRow?.observation ?? null,
          milestoneTitle: scoreRow?.milestone?.title ?? null,
          subjectName: scoreRow?.milestone?.subject?.name ?? null,
        };
      }).filter((row): row is NonNullable<typeof row> => row != null);

      return {
        success: true,
        message: "Student learning report retrieved successfully",
        data,
        metadata: meta,
        pagination: { pos, delta, total },
      };
    } catch (error) {
      logger.error("Error in getAdminStudentReport:", error);
      return {
        success: false,
        message: "Failed to retrieve student report",
      };
    }
  }

  /**
   * Staff-to-child ratio for one classroom from roster: active students assigned to the room vs staff assigned via SCS (not attendance).
   */
  private async getClassroomAssignmentRatio(
    schoolId: number,
    classroomId: number
  ): Promise<{ studentsAssigned: number; staffAssigned: number; ratio: string }> {
    const studentsRow = await this.studentRepository
      .createQueryBuilder("student")
      .select("COUNT(student.id)", "cnt")
      .where("student.schoolId = :schoolId", { schoolId })
      .andWhere("student.classroomId = :classroomId", { classroomId })
      .andWhere("student.status = :status", { status: StudentStatus.ACTIVE })
      .getRawOne();

    const staffRow = await this.classroomRepository
      .createQueryBuilder("classroom")
      .innerJoin("classroom.staffClassesAndSubject", "scs")
      .select("COUNT(DISTINCT scs.staffId)", "cnt")
      .where("classroom.id = :classroomId", { classroomId })
      .andWhere("classroom.schoolId = :schoolId", { schoolId })
      .getRawOne();

    const studentsAssigned = parseInt(String(studentsRow?.cnt ?? "0"), 10) || 0;
    const staffAssigned = parseInt(String(staffRow?.cnt ?? "0"), 10) || 0;
    const ratio =
      staffAssigned > 0 ? `1:${Math.ceil(studentsAssigned / staffAssigned) || 1}` : "0:0";
    return { studentsAssigned, staffAssigned, ratio };
  }

  /**
   * Admin staff report: hours (timecard), SCS room assignments, role, ratio from assigned students vs SCS staff per room.
   */
  async getAdminStaffReport(filters: AdminStaffReportFilters): Promise<AdminReportResponse> {
    try {
      const { start, end } = this.resolveAdminDateRange(filters.startDate, filters.endDate);
      const pos = filters.pos ?? 0;
      const delta = filters.delta ?? 25;

      const countQb = this.staffRepository
        .createQueryBuilder("staff")
        .where("staff.schoolId = :schoolId", { schoolId: filters.schoolId });

      if (filters.staffId) {
        countQb.andWhere("staff.id = :staffId", { staffId: filters.staffId });
      }
      if (filters.classroomId) {
        countQb.innerJoin(
          "staff.staffClassesAndSubject",
          "scsCount",
          "scsCount.classroomId = :classroomId",
          { classroomId: filters.classroomId }
        );
      }

      const total = await countQb.getCount();

      const staffQb = this.staffRepository
        .createQueryBuilder("staff")
        .leftJoinAndSelect("staff.user", "user")
        .where("staff.schoolId = :schoolId", { schoolId: filters.schoolId });

      if (filters.staffId) {
        staffQb.andWhere("staff.id = :staffId", { staffId: filters.staffId });
      }
      if (filters.classroomId) {
        staffQb
          .innerJoinAndSelect(
            "staff.staffClassesAndSubject",
            "scs",
            "scs.classroomId = :classroomId",
            { classroomId: filters.classroomId }
          )
          .leftJoinAndSelect("scs.classroom", "classroom");
      } else {
        staffQb
          .leftJoinAndSelect("staff.staffClassesAndSubject", "scs")
          .leftJoinAndSelect("scs.classroom", "classroom");
      }

      const staffRows = await staffQb.orderBy("staff.id", "ASC").skip(pos).take(delta).getMany();

      const staffIds = staffRows.map((s) => s.id);
      const hoursByStaff = new Map<number, number>();
      if (staffIds.length > 0) {
        const logs = await this.attendanceRepository
          .createQueryBuilder("attendance")
          .where("attendance.schoolId = :schoolId", { schoolId: filters.schoolId })
          .andWhere("attendance.teacherId IN (:...staffIds)", { staffIds })
          .andWhere("attendance.date >= :startDate", { startDate: formatDateKey(start) })
          .andWhere("attendance.date <= :endDate", { endDate: formatDateKey(end) })
          .select(["attendance.teacherId", "attendance.timeIn", "attendance.timeOut"])
          .getMany();

        for (const row of logs) {
          if (!row.teacherId) continue;
          const h = calculateHours(row.timeIn, row.timeOut);
          hoursByStaff.set(row.teacherId, (hoursByStaff.get(row.teacherId) ?? 0) + h);
        }
      }

      const data = await Promise.all(
        staffRows.map(async (staff) => {
          const u = staff.user;
          const staffName = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() || "Unknown";
          const rooms = (staff.staffClassesAndSubject ?? [])
            .map((x) => x.classroom)
            .filter(Boolean) as Classroom[];
          const roomAssignment = rooms.map((c) => c.classroomName).filter(Boolean).join(", ") || null;

          const ratioParts: string[] = [];
          const seen = new Set<number>();
          let totalChildrenInClasses = 0;
          for (const c of rooms) {
            if (!c?.id || seen.has(c.id)) continue;
            seen.add(c.id);
            const snap = await this.getClassroomAssignmentRatio(filters.schoolId, c.id);
            totalChildrenInClasses += snap.studentsAssigned;
            ratioParts.push(
              `${c.classroomName}: ${snap.ratio} (${snap.studentsAssigned} students assigned / ${snap.staffAssigned} staff assigned)`
            );
          }

          const timecardHours = Number((hoursByStaff.get(staff.id) ?? 0).toFixed(2));

          return {
            staffName,
            role: staff.staffRole,
            roomAssignment,
            timecardHours,
            totalChildrenInClasses,
            staffToChildRatioByRoom: ratioParts.length > 0 ? ratioParts.join(" | ") : "0:0",
          };
        })
      );

      return {
        success: true,
        message: "Staff admin report retrieved successfully",
        data,
        metadata: {
          startDate: formatDateKey(start),
          endDate: formatDateKey(end),
          staffToChildRatioBasis: "assignment" as const,
        },
        pagination: { pos, delta, total },
      };
    } catch (error) {
      logger.error("Error in getAdminStaffReport:", error);
      return {
        success: false,
        message: "Failed to retrieve staff report",
      };
    }
  }

  /**
   * Action center: high-signal alerts for the school (attendance, billing, admissions pipeline).
   */
  async getActionCenter(schoolId: number): Promise<ActionCenterResponse> {
    try {
      const items: ActionCenterItem[] = [];
      const today = formatDateKey(new Date());
      const { start: weekStart, end: weekEnd } = getNigeriaWeekRangeContaining(new Date());
      const weekStartKey = formatDateKey(weekStart);
      const weekEndKey = formatDateKey(weekEnd);

      const absentRow = await this.attendanceRepository
        .createQueryBuilder("a")
        .select("COUNT(DISTINCT a.studentId)", "cnt")
        .where("a.schoolId = :schoolId", { schoolId })
        .andWhere("a.studentId IS NOT NULL")
        .andWhere("a.status = :absent", { absent: AttendanceStatus.ABSENT })
        .andWhere("a.date = :today", { today: today })
        .getRawOne();
      const absentCount = parseInt(String(absentRow?.cnt ?? "0"), 10) || 0;
      if (absentCount > 11) {
        items.push({
          message: `${absentCount} children absent today`,
          context: "Need follow-up",
        });
      }

      const lateRow = await this.attendanceRepository
        .createQueryBuilder("a")
        .select("COUNT(DISTINCT a.studentId)", "cnt")
        .where("a.schoolId = :schoolId", { schoolId })
        .andWhere("a.studentId IS NOT NULL")
        .andWhere("a.status = :late", { late: AttendanceStatus.LATE })
        .andWhere("a.date >= :weekStart", { weekStart: weekStartKey })
        .andWhere("a.date <= :weekEnd", { weekEnd: weekEndKey })
        .getRawOne();
      const latePeopleCount = parseInt(String(lateRow?.cnt ?? "0"), 10) || 0;
      if (latePeopleCount > 8) {
        items.push({
          message: `${latePeopleCount} late arrivals this week`,
          context: "Monitor trend",
        });
      }

      const unpaidRow = await this.invoiceRepository
        .createQueryBuilder("inv")
        .select("COALESCE(SUM(inv.balance), 0)", "total")
        .where("inv.schoolId = :schoolId", { schoolId })
        .andWhere("inv.balance > 0")
        .getRawOne();
      const unpaidTotal = Number(unpaidRow?.total ?? 0);
      const unpaidThreshold = 1_500_000;
      if (unpaidTotal >= unpaidThreshold) {
        const formatted = new Intl.NumberFormat("en-NG").format(Math.round(unpaidTotal));
        items.push({
          message: `${formatted} unpaid invoice`,
          context: "Payment overdue",
        });
      }

      const offerSentCount = await this.tourBookingRepository.count({
        where: { schoolId, status: BookingStatus.OFFER_SENT, isAdmission: true },
      });
      if (offerSentCount >= 10) {
        items.push({
          message: `${offerSentCount} admission offers sent`,
          context: "awaiting approval",
        });
      }

      return {
        success: true,
        message: "Action center retrieved successfully",
        data: items,
      };
    } catch (error) {
      logger.error("Error in getActionCenter:", error);
      return {
        success: false,
        message: "Failed to retrieve action center",
        data: [],
      };
    }
  }

}
