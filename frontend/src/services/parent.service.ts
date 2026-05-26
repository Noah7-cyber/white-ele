/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

// ========================
// CHILD ROOT
// ========================
const parentRoot = "/api/v1/parents";

// ---- Kiosk PIN Verify ----
export interface KioskVerifyRequest {
  id: string; // could be email or identifier
  pin: string;
}

export interface KioskVerifyResponse {
  success: boolean;
  data?: {
    id: number;
    userId: number;
    suffix: string;
    relationship: string;
    notes?: string | null;
    photoUrl: string;
    username: string | null;
    schoolId: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    user: {
      id: number;
      uuid: string;
      email: string;
      phone: string;
      tempPassword: boolean;
      role: string;
      firstName: string;
      lastName: string;
      middleName: string | null;
      dateOfBirth: string | null;
      gender: string | null;
      address: string;
      emailVerified: boolean;
      phoneVerified: boolean;
      lastLogin: string;
      loginAttempts: number;
      lockedUntil: string | null;
      termsAccepted: boolean;
      termsAcceptedAt: string | null;
      mfaEnabled: boolean;
      enableEmailNotification: boolean;
      enableSmsNotification: boolean;
      enableInAppNotification: boolean;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
      schoolId: number;
    };
    children: Array<{
      id: number;
      userId: number;
      admissionNumber: string;
      enrolmentDate: string;
      schedule: string[];
      photoUrl: string;
      schoolId: number;
      classroomId: number;
      status: string;
      createdAt: string;
      updatedAt: string;
      attendancePercentage: number;
      user: {
        id: number;
        uuid: string;
        email: string | null;
        phone: string | null;
        tempPassword: boolean;
        role: string;
        firstName: string;
        lastName: string;
        middleName: string | null;
        dateOfBirth: string;
        gender: string | null;
        address: string;
        emailVerified: boolean;
        phoneVerified: boolean;
        lastLogin: string | null;
        loginAttempts: number;
        lockedUntil: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: string | null;
        mfaEnabled: boolean;
        enableEmailNotification: boolean;
        enableSmsNotification: boolean;
        enableInAppNotification: boolean;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        schoolId: number;
      };
      classroom: {
        id: number;
        classroomName: string;
        minimumAge: number;
        maximumAge: number;
        maximumCapacity: number;
        description: string | null;
        tuitionFee: string;
        classroomStatus: string;
        schoolId: number;
        createdAt: string;
        updatedAt: string;
      };
      currentAttendance: {
        id: number;
        date: string;
        status: string;
        timeIn: string;
        timeOut: string | null;
        notes: string | null;
        recordedBy: number;
        classroomId: number;
        studentId: number;
        teacherId: number | null;
        parentId: number;
        schoolId: number;
        createdAt: string;
        updatedAt: string;
      } | null;
      previousAttendance: {
        id: number;
        date: string;
        status: string;
        timeIn: string;
        timeOut: string | null;
        notes: string | null;
        recordedBy: number;
        classroomId: number;
        studentId: number;
        teacherId: number | null;
        parentId: number;
        schoolId: number;
        createdAt: string;
        updatedAt: string;
      } | null;
    }>;
  };
}

const parentEndpoints = {
  getAllParents: { path: `${parentRoot}`, method: ApiMethods.GET },
  getImageGallery: { path: `${parentRoot}/image-gallery`, method: ApiMethods.GET },
  kioskVerify: { path: `${parentRoot}/kiosk-verify`, method: ApiMethods.POST },
};

// Dynamic endpoints (require ChildId)
export const ParentDynamicEndpoints = {
  getParentById: (parentId: string | number) => ({
    path: `${parentRoot}/${parentId}`,
    method: ApiMethods.GET,
  }),
  /** Get parents, optionally filtered by classroomId (parents with students in that classroom). */
  getParents: (classroomId?: number | string) => ({
    path: classroomId ? `${parentRoot}?classroomId=${classroomId}` : `${parentRoot}`,
    method: ApiMethods.GET,
  }),
  deleteParent: (parentId: string | number) => ({
    path: `${parentRoot}/${parentId}`,
    method: ApiMethods.DELETE,
  }),
  updateParent: (parentId: string | number) => ({
    path: `${parentRoot}/${parentId}`,
    method: ApiMethods.PUT,
  }),
  changeParentStatus: (parentId: string | number) => ({
    path: `${parentRoot}/${parentId}/status`,
    method: ApiMethods.PATCH,
  }),
  resendInvite: () => ({
    path: `${parentRoot}/resend`,
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

export const parentServices = generateServices(parentEndpoints);
