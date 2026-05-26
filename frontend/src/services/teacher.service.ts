/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

// ========================
// Teacher ROOT
// ========================
const teacherRoot = "/api/v1/staff";

// ========================
// TYPES
// ========================
// --- Nested Subtypes ---

export interface Profile {
  id: number;
  userId: number;
  suffix: string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  photo: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  uuid: string;
  email: string;
  phone: string;
  role: "staff";
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  profile: Profile;
  staff:{
    id: number;
    
  }
}
export interface School {
  id: number;
  schoolName: string;
  schoolLogoUrl: null;
  address: string;
  county: null;
  email: string;
  phoneNumber: string;
  studentResumptionTime: null;
  staffResumptionTime: null;
  schoolCosingTime: null;
  staffClosingTime: null;
  createdAt: string;
  updatedAt: string;
}
export interface EmergencyContact {
  id: number;
  suffix: string;
  contactName: string;
  relationship: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
}
// ---- Base Teacher Model ----
export interface Teacher {
  id: number;
  userId: number;
  suffix: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  photo: string;
  qualification: string;
  role: string;
  schoolId?: number;
  assignedClassrooms: number[];
  emergencyContact: EmergencyContact;
  staffRole: "teacher" | string;
  note?: string;
  status?: string | "active" | "inactive" | "viewing_scheduled";
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: null;
  school?: School;
  startDate: "2024-09-01";
  user: User;
  [key: string]: any;
}

// ---- Create Teacher ----
export interface CreateTeacherRequest {
  suffix: string;
  firstName: string;
  middleName?:string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  photo: string;
  qualification: string;
  role: string;
  schoolId: number;
  assignedClassrooms: number[];
  emergencyContact?: EmergencyContact;
}

export interface CreateTeacherResponse {
  status: string;
  message: string;
  data: Teacher;
}

// ---- Update Teacher ----
export interface UpdateTeacherRequest {
  name?: string;
  email?: string;
  phone?: string;
  listingType?: "sale" | "rent";
  note?: string;
  source?: string | "website" | "referral" | "direct_contact";
  agentId?: number;
  pin? : string;
}

export interface UpdateTeacherResponse {
  status: string;
  message: string;
  data: Teacher;
}

// ---- Change Teacher Status ----
export interface ChangeTeacherStatusRequest {
  status: string | "new" | "contacted" | "viewing_scheduled";
}

export interface ChangeTeacherStatusResponse {
  status: string;
  message: string;
  data?: Teacher;
}

// ---- Get All Teachers ----
export interface GetAllTeachersParams {
  search?: string;
  limit?: number;
  offset?: number;
  source?: string | "website" | "referral" | "direct_contact";
  status?: string | "new" | "contacted" | "viewing_scheduled";
  agentId?: number;
  [key: string]: any;
}

export interface GetAllTeachersResponse {
  status: string;
  message: string;
  data: Teacher[];
  total?: number;
}

// ---- Get Teacher By ID ----
export interface GetTeacherByIdResponse {
  status: string;
  message: string;
  data?: Teacher;
  staff?: Teacher;
}

// ---- Delete Teacher ----
export interface DeleteTeacherResponse {
  status: string;
  message: string;
}

// ---- Kiosk PIN Verify ----
export interface KioskVerifyRequest {
  id: string; // could be email or identifier
  pin: string;
}

export interface KioskVerifyResponse {
  status: string;
  message: string;
  data?: any;
}

// ========================
// CONFIG: Endpoints & Methods
// ========================
const teacherEndpoints = {
  createTeacher: { path: `${teacherRoot}`, method: ApiMethods.POST },
  getAllTeachers: { path: `${teacherRoot}`, method: ApiMethods.GET },
  kioskVerify: { path: `${teacherRoot}/kiosk-verify`, method: ApiMethods.POST },
};

// Dynamic endpoints (require TeacherId)
export const teacherDynamicEndpoints = {
  getTeacherById: (TeacherId: string | number) => ({
    path: `${teacherRoot}/${TeacherId}`,
    method: ApiMethods.GET,
  }),
  updateTeacher: (TeacherId: string | number) => ({
    path: `${teacherRoot}/${TeacherId}`,
    method: ApiMethods.PUT,
  }),
  changeTeacherStatus: (TeacherId: string | number) => ({
    path: `${teacherRoot}/${TeacherId}`,
    method: ApiMethods.PATCH,
  }),
  deleteTeacher: (TeacherId: string | number) => ({
    path: `${teacherRoot}/${TeacherId}`,
    method: ApiMethods.DELETE,
  }),
  resendTeacherInvite: (TeacherId: string | number) => ({
    path: `${teacherRoot}/${TeacherId}/resend-invite`,
    method: ApiMethods.POST,
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
export const teacherServices = generateServices(teacherEndpoints);
