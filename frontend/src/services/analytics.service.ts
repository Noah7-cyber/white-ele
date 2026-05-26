/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

/** Attendance period type for dashboard API */
export type DashboardAttendancePeriodType = "daily" | "weekly" | "monthly" | "yearly";

export interface AdminDashboardAnalyticsParams {
  startDate: string;
  endDate: string;
  attendancePeriodType?: DashboardAttendancePeriodType;
  periodType?: string;
  classroomId?: number | string;
  attendanceTrendType?: "student" | "staff";
}

export interface StaffDashboardAnalyticsParams {
  startDate: string;
  endDate: string;
  periodType?: DashboardAttendancePeriodType;
  classroomId?: number | string;
  staffId?: number;
}

export interface DashboardAnalyticsResponse {
  success: boolean;
  message: string;
  data: {
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
      percentageGrowth?: number;
    };
    attendance: {
      student: {
        rate: number;
        present: number;
        absent: number;
        late: number;
        percentageGrowth: number;
      };
      staff: {
        rate: number;
        present: number;
        absent: number;
        late: number;
        percentageGrowth: number;
      };
      combined: {
        rate: number;
        present: number;
        absent: number;
        late: number;
      };
    };
    attendanceTrend?: {
      periodType: string;
      xAxis: string[];
      present: number[];
      absent: number[];
      late: number[];
    };
  };
}

export interface StaffDashboardAnalyticsResponse {
  success: boolean;
  message: string;
  data: {
    totalStudents: number;
    totalSignedIn: number;
    totalLate: number;
    totalAbsent: number;
    percentageGrowth: number;
    classStats: {
      byGender: {
        xAxis: string[];
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
    kioskPin?: string;
  };
  metadata: {
    date: string;
    attendanceRate: number;
  };
}

export interface GetAnalyticsResponse {
  success: boolean;
  message: string;
  school: DashboardAnalyticsResponse;
}

export interface EarningsAnalyticsResponse {
  success: boolean;
  message: string;
  data: {
    xAxis: string[];
    yAxis: number[];
  };
  metadata: {
    unit: string;
    total: number;
    startDate: string;
    endDate: string;
  };
}

export interface ParentDashboardResponse {
  success: boolean;
  message: string;
  data: {
    attendance: {
      xAxis: string[];
      present: number[];
      absent: number[];
      late: number[];
      percentageGrowth?: number;
    };
    activities: Array<{
      id: number;
      activityType: string;
      startTime?: string;
      endTime?: string;
      mealType?: string | null;
      timeGiven?: string | null;
      bathroomType?: string | null;
      foodItems?: string | null;
      medicationName?: string | null;
      dosage?: string | null;
      notes?: string;
      photoUrl?: string | null;
      createdAt: string;
      student?: {
        id: number;
        firstName: string;
        lastName: string;
        photoUrl?: string;
      };
    }>;
    kioskPin?: string;
    kioskLink?: string;
    kioskUrl?: string;
    attendanceKioskLink?: string;
    kioskQrCode?: string;
    kioskQrCodeUrl?: string;
    attendanceKioskQrCode?: string;
  };
  metadata: {
    date: string;
    totalStudents: number;
  };
}

// ========================
// Subject ROOT
// ========================
const analyticsRoot = "/api/v1/analytics";
const staffAnalyticsRoot = "/api/v1/analytics/staff";

// ========================
// CONFIG: Endpoints & Methods
// ========================
const analyticsEndpoints = {
  getAllAnalytics: { path: `${analyticsRoot}`, method: ApiMethods.GET },
  generateAnalyticsNumber: { path: `${analyticsRoot}/generate`, method: ApiMethods.POST },
  getStaffDashboardAnalytics: { path: `${staffAnalyticsRoot}/dashboard`, method: ApiMethods.GET },
  getAttendanceReport: { path: `${analyticsRoot}/attendance/report`, method: ApiMethods.GET },
  getStaffAttendanceReport: { path: `${analyticsRoot}/attendance/staff/analytics`, method: ApiMethods.GET },
  getBillingReport: { path: `${analyticsRoot}/billing`, method: ApiMethods.GET },
  getBillingSummery: { path: `${analyticsRoot}/billing/summary`, method: ApiMethods.GET },
  getStudentReport: { path: `${analyticsRoot}/reports/students`, method: ApiMethods.GET },
  getStaffReport: { path: `${analyticsRoot}/reports/staff`, method: ApiMethods.GET },
  getFormPerformance: { path: `${analyticsRoot}/forms/performance`, method: ApiMethods.GET },
  getAttendanceReportDownload: { path: `${analyticsRoot}/attendance/report/download`, method: ApiMethods.GET },
  actionCenter: { path: `${analyticsRoot}/action-center `, method: ApiMethods.GET },
};

function buildDashboardQuery(params: AdminDashboardAnalyticsParams): string {
  const search = new URLSearchParams();
  search.set("startDate", params.startDate);
  search.set("endDate", params.endDate);
  if (params.attendancePeriodType) {
    search.set("attendancePeriodType", params.attendancePeriodType);
  }
  if (params.periodType) {
    search.set("periodType", params.periodType);
  }
  if (params.classroomId != null && params.classroomId !== "") {
    search.set("classroomId", String(params.classroomId));
  }
  if (params.attendanceTrendType) {
    search.set("attendanceTrendType", params.attendanceTrendType);
  }
  return search.toString();
}

function buildStaffDashboardQuery(params: StaffDashboardAnalyticsParams): string {
  const search = new URLSearchParams();
  search.set("startDate", params.startDate);
  search.set("endDate", params.endDate);
  if (params.periodType) {
    search.set("periodType", params.periodType);
  }
  if (params.classroomId != null && params.classroomId !== "") {
    search.set("classroomId", String(params.classroomId));
  }
  if (params.staffId != null) {
    search.set("staffId", String(params.staffId));
  }
  return search.toString();
}

export interface ParentDashboardAnalyticsParams {
  startDate: string;
  endDate: string;
  periodType?: "daily" | "weekly" | "monthly";
}

function buildParentDashboardQuery(params: ParentDashboardAnalyticsParams): string {
  const search = new URLSearchParams();
  search.set("startDate", params.startDate);
  search.set("endDate", params.endDate);
  if (params.periodType) {
    search.set("periodType", params.periodType);
  }
  return search.toString();
}

// Dynamic endpoints (require SubjectId)
export const analyticsDynamicEndpoints = {
  getAdminDashboardAnalytics: (params: AdminDashboardAnalyticsParams) => ({
    path: `${analyticsRoot}/dashboard?${buildDashboardQuery(params)}`,
    method: ApiMethods.GET,
  }),
  getAdminEarningAnalytics: (params: AdminDashboardAnalyticsParams) => ({
    path: `${analyticsRoot}/earnings?${buildDashboardQuery(params)}`,
    method: ApiMethods.GET,
  }),
  getParentDashboardAnalytics: (params: ParentDashboardAnalyticsParams) => ({
    path: `${analyticsRoot}/parent/dashboard?${buildParentDashboardQuery(params)}`,
    method: ApiMethods.GET,
  }),
  getStaffDashboardAnalytics: (params: StaffDashboardAnalyticsParams) => ({
    path: `${staffAnalyticsRoot}/dashboard?${buildStaffDashboardQuery(params)}`,
    method: ApiMethods.GET,
  }),
};

// ========================
// SERVICE GENERATOR
// ========================
type ServiceInterface = {
  path: string;
  method: ApiMethods;
};

function generateServices<T extends Record<string, { path: string; method: ApiMethods }>>(
  endpoints: T,
) {
  const services: Record<keyof T, ServiceInterface> = {} as any;
  for (const key in endpoints) {
    services[key] = {
      path: endpoints[key].path,
      method: endpoints[key].method,
    };
  }
  return services;
}

// ========================
// EXPORTS
// ========================
export const analyticsServices = generateServices(analyticsEndpoints);
