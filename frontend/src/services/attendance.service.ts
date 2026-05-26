/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

// ========================
// Teacher ROOT
// ========================
const attendanceRoot = "/api/v1/attendance";

export interface ClockInStaffRequest {
  teacherId: number;
  notes?: string;
}

export interface ClockOutStaffRequest {
  teacherId: number;
  timeOut: string;
  notes?: string;
}

export interface ClockInChildRequest {
  parentId: number;
  studentIds: number[];
  notes?: string;
}

export interface ClockOutChildRequest {
  parentId: number;
  studentIds: number[];
  timeOut: string;
  notes?: string;
}

export interface ClockInAdminRequest {
  adminId: number;
  notes?: string;
}

export interface ClockOutAdminRequest {
  adminId: number;
  timeOut?: string;
  notes?: string;
}

export interface RecordAdminAttendanceRequest {
  adminId: number;
  date: string;
  timeIn?: string;
  timeOut?: string;
  notes?: string;
}

export interface UpdateStaffAttendanceRequest {
  date?: string;
  status?: string;
  timeIn?: string;
  timeOut?: string;
  hoursWorked?: number;
  reason?: string;
}

export interface UpdateChildAttendanceRequest {
  date?: string;
  status?: string;
  timeIn?: string;
  timeOut?: string;
  reason?: string;
}

// ========================
// CONFIG: Endpoints & Methods
// ========================
const attendanceEndpoints = {
  getChildrenAttendance: { path: `${attendanceRoot}/students`, method: ApiMethods.GET },
  getStaffAttendance: { path: `${attendanceRoot}/staff`, method: ApiMethods.GET },
  getChildAttendanceSummary: { path: `${attendanceRoot}/students/summary`, method: ApiMethods.GET },
  getStaffAttendanceSummary: { path: `${attendanceRoot}/staff/summary`, method: ApiMethods.GET },
  recordStaffAttendance: { path: `${attendanceRoot}/staff`, method: ApiMethods.POST },
  clockInStaff: { path: `${attendanceRoot}/staff/clock-in`, method: ApiMethods.POST },
  clockOutStaff: { path: `${attendanceRoot}/staff/clock-out`, method: ApiMethods.POST },
  recordAdminAttendance: { path: `${attendanceRoot}/admin`, method: ApiMethods.POST },
  clockInAdmin: { path: `${attendanceRoot}/admin/clock-in`, method: ApiMethods.POST },
  clockOutAdmin: { path: `${attendanceRoot}/admin/clock-out`, method: ApiMethods.POST },
  clockInChild: { path: `${attendanceRoot}/students/clock-in`, method: ApiMethods.POST },
  clockOutChild: { path: `${attendanceRoot}/students/clock-out`, method: ApiMethods.POST },
};

export interface TeacherAttendanceSummaryResponse {
  metadata: {
    totalWorkingDays: number;
    totalSchoolDays: number;
    totalPotentialSchoolDays: number;
    PresentDays: number;
    AbsentDays: number;
    LateDays: number;
    LeaveDays: number;
    daysPerWeekCount: number;
  };
  attendances: any[];
}

export interface AdminAttendanceResponse {
  success: boolean;
  message: string;
  attendances: any[];
  metadata: {
    totalSchoolDays: number;
    PresentDays: number;
    AbsentDays: number;
    LateDays: number;
    ExcusedDays: number;
    LeaveDays: number;
    totalPotentialSchoolDays: number;
  };
  pagination: {
    pos: number;
    delta: number;
    count: number;
  };
}

// Dynamic endpoints (require ChildId)
export const AttendanceDynamicEndpoints = {
  getChildAttendanceById: (studentId: string | number) => ({
    path: `${attendanceRoot}/students/${studentId}`,
    method: ApiMethods.GET,
  }),
  getTeacherAttendanceById: (teacherId: string | number) => ({
    path: `${attendanceRoot}/staff/${teacherId}`,
    method: ApiMethods.GET,
  }),
  deleteTeacherAttendance: (attendanceId: string | number) => ({
    path: `${attendanceRoot}/staff/${attendanceId}`,
    method: ApiMethods.DELETE,
  }),
  deleteChildAttendance: (attendanceId: string | number) => ({
    path: `${attendanceRoot}/students/${attendanceId}`,
    method: ApiMethods.DELETE,
  }),
  updateStaffAttendance: (attendanceId: string | number) => ({
    path: `${attendanceRoot}/staff/${attendanceId}`,
    method: ApiMethods.PUT,
  }),
  updateChildAttendance: (attendanceId: string | number) => ({
    path: `${attendanceRoot}/students/${attendanceId}`,
    method: ApiMethods.PUT,
  }),
  getAdminAttendanceList: (schoolId: string | number) => ({
    path: `${attendanceRoot}/admin/${schoolId}`,
    method: ApiMethods.GET,
  }),
  deleteAdminAttendance: (attendanceId: string | number) => ({
    path: `${attendanceRoot}/admin/${attendanceId}`,
    method: ApiMethods.DELETE,
  }),
  updateAdminAttendance: (attendanceId: string | number) => ({
    path: `${attendanceRoot}/admin/${attendanceId}`,
    method: ApiMethods.PUT,
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
export const AttendanceServices = generateServices(attendanceEndpoints);
