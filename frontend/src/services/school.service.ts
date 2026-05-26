/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";
import { Classroom } from "./classroom.service";
import { Parent } from "./child.service";
import { Teacher } from "./teacher.service";

// ========================
// School ROOT
// ========================
const schoolRoot = "/api/v1/school";

// ========================
// TYPES
// ========================

export interface User {
  id: number;
  uuid: string;
  email?: string | null;
  phone?: string | null;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  dateOfBirth: string;
  address: string;
  role: string;
  tempPassword?: boolean;
  emailVerified: false;
  phoneVerified: false;
  lastLogin: string;
  loginAttempts: number;
  lockedUntil: string;
  termsAccepted: boolean;
  termsAcceptedAt: string;
  mfaEnabled: boolean;
  enableEmailNotification: boolean;
  enableSmsNotification: boolean;
  enableInAppNotification: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface SchoolStudent {
  id: number;
  userId: number;
  admissionNumber: string;
  enrolmentDate: string;
  schedule: string[];
  photoUrl: string;
  schoolId: number;
  classroomId: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: number;
  subDomain?: string | null;
  schoolName: string;
  schoolMotto: string;
  schoolType: string;
  schoolLogoUrl: string | null;
  address: string;
  country: string;
  email: string;
  phoneNumber: string;
  x?: string | null;
  facebook?: string | null;
  tikTok?: string | null;
  instagram?: string | null;
  description?: string | null;
  studentResumptionTime: string | null;
  staffResumptionTime: string | null;
  schoolClosingTime: string | null;
  staffClosingTime: string | null;
  createdAt: string;
  updatedAt: string;
  students?: SchoolStudent[];
  classrooms?: Classroom[];
  parents?: Parent[];
  teacher?: Teacher[];
  users?: User[];
  classroomCount?: number;
  PaystackPublicKey?: string | null;
  PaystackSecretKey?: string | null;
}

export interface GetSchoolResponse {
  success: boolean;
  message: string;
  school: School;
  admins: any[]; // Using any for now to match the user's snippet, but could be User interface if complete
}

export interface CreateSchoolRequest {
  schoolName: string;
  schoolMotto?: string;
  schoolType: string;
  schoolLogoUrl?: string;
  maxiumumNumberOfStudents?: number | string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  phoneNumber?: string;
  subDomain?: string;
  x?: string;
  facebook?: string;
  tikTok?: string;
  instagram?: string;
  description?: string;
  studentResumptionTime?: string;
  staffResumptionTime?: string;
  schoolClosingTime?: string;
  staffClosingTime?: string;
}

export interface CreateSchoolResponse {
  success: boolean;
  message: string;
  school: School;
}

export interface UpdateSchoolRequest {
  schoolName?: string;
  schoolMotto?: string;
  schoolType?: string;
  schoolLogoUrl?: string;
  address?: string;
  country?: string;
  email?: string;
  phoneNumber?: string;
  x?: string;
  facebook?: string;
  tikTok?: string;
  instagram?: string;
  description?: string;
  studentResumptionTime?: string;
  staffResumptionTime?: string;
  schoolClosingTime?: string;
  staffClosingTime?: string;
}

export interface UpdateSchoolResponse {
  success: boolean;
  message: string;
  school: School;
}

export interface GetClassroomByIdResponse {
  status: string;
  message: string;
  classroom: School;
}

export interface DeleteClassroomResponse {
  status: string;
  message: string;
}

// ========================
// NOTIFICATION SETTINGS
// ========================
export interface NotificationSettings {
  id: number;
  schoolId: number;
  adminEmail: boolean;
  adminSms: boolean;
  adminWhatsApp: boolean;
  parentEmail: boolean;
  parentSms: boolean;
  parentWhatsApp: boolean;
  staffEmail: boolean;
  staffSms: boolean;
  staffWhatsApp: boolean;
  dailyReportFrequency: "daily" | "weekly" | "monthly";
  createdAt: string;
  updatedAt: string;
}

export interface GetNotificationSettingsResponse {
  success: boolean;
  message: string;
  settings: NotificationSettings;
}

export interface UpdateNotificationSettingsRequest {
  adminEmail: boolean;
  adminSms: boolean;
  adminWhatsApp: boolean;
  parentEmail: boolean;
  parentSms: boolean;
  parentWhatsApp: boolean;
  staffEmail: boolean;
  staffSms: boolean;
  staffWhatsApp: boolean;
  dailyReportFrequency: "daily" | "weekly" | "monthly";
}

export interface UpdateNotificationSettingsResponse {
  success: boolean;
  message: string;
  settings: NotificationSettings;
}

// ========================
// CONFIG: Endpoints & Methods
// ========================
const schoolEndpoints = {
  createSchool: { path: `${schoolRoot}`, method: ApiMethods.POST },
  createClassroom: { path: `${schoolRoot}`, method: ApiMethods.POST },
  getAllSchool: { path: `${schoolRoot}`, method: ApiMethods.GET },
};

// Dynamic Endpoints (if needed later)
export const schoolDynamicEndpoints = {
  getSchoolById: (id: string | number) => ({
    path: `${schoolRoot}/${id}`,
    method: ApiMethods.GET,
  }),
  getParticularSchool: () => ({
    path: `${schoolRoot}/getSchool`,
    method: ApiMethods.GET,
  }),
  updateSchool: (schoolId: string | number) => ({
    path: `${schoolRoot}/${schoolId}`,
    method: ApiMethods.PUT,
  }),
  changeSchoolStatus: (schoolId: string | number) => ({
    path: `${schoolRoot}/${schoolId}/status`,
    method: ApiMethods.PATCH,
  }),
  deleteSchool: (id: string | number) => ({
    path: `${schoolRoot}/${id}`,
    method: ApiMethods.DELETE,
  }),
  getNotificationSettings: (schoolId: string | number) => ({
    path: `${schoolRoot}/${schoolId}/settings/notifications`,
    method: ApiMethods.GET,
  }),
  updateNotificationSettings: (schoolId: string | number) => ({
    path: `${schoolRoot}/${schoolId}/settings/notifications`,
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
export const schoolServices = generateServices(schoolEndpoints);
