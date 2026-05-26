/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

// ========================
// CHILD ROOT
// ========================
const childRoot = "/api/v1/students";

// ========================
// TYPES
// ========================
export interface Parent {
  suffix: string;
  id: number;
  userId: number;
  relationship: string;
  notes?: string;
  photoUrl: string;
  schoolId?: number | null;
  user: {
    id: number;
    uuid: string;
    email: string | null;
    phone: string | null;
    firstName: string;
    lastName: string;
    middleName?: string | null;
    address?: string | null;
    role: string;
    tempPassword: boolean;
    createdAt: string;
    updatedAt: string;
    [key: string]: any;
  };
  email?: string;
}

export interface Medical {
  id?: number;
  allergies: string;
  medications: string;
  foodPreferences: string;
  dietRestriction: string;
  notes?: string;
  studentId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmergencyContact {
  id?: number;
  suffix?: string;
  contactName: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
  studentId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface School {
  id: number;
  schoolName: string;
  schoolLogoUrl?: string;
  address: string;
  country?: string;
  email?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface Document {
  docName: string;
  documentUrl: string;
}

export interface MedicalInfo {
  allergies?: string;
  medications?: string;
  foodPreferences?: string;
  dietRestriction?: string;
  notes: string;
}

export interface Student {
  id: number;
  userId: number;
  admissionNumber: string;
  enrolmentDate: string;
  schedule: string[];
  photoUrl: string;
  schoolId: number;
  classroomId: number | null;
  attendance: {
    currentAttendance: {
      status: string;
    };
    previousAttendance: {
      status: string;
    };
  };

  user: {
    id: number;
    uuid: string;
    email?: string | null;
    phone?: string | null;
    firstName: string;
    lastName: string;
    middleName: string;
    dateOfBirth: string;
    address: string;
    gender?: string | null;
    role: "student";
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
  };
  createdAt: string;
  updatedAt: string;
  medicalRecord: Medical;
  parents: Parent[];
  emergencyContact: EmergencyContact;
  documents: Document[];
}

export interface CreateStudentRequest {
  schoolId: number;
  schedule: string[];
  generalInfo: {
    firstName: string;
    lastName: string;
    middleName?: string;
    address: string;
    dateOfBirth: string;
    enrolmentDate: string;
    photoUrl?: string;
  };
  medicalInfo?: {
    allergies?: string;
    medications?: string;
    foodPreferences?: string;
    dietRestriction?: string;
    notes?: string;
  };
  emergencyContact?: {
    suffix?: string;
    contactName: string;
    relationship: string;
    phone: string;
    email: string;
    address: string;
  };
  parents?: Array<{
    title?: string;
    firstName: string;
    lastName: string;
    relationship: string;
    phone: string;
    email: string;
    address: string;
    photoUrl?: string;
    notes?: string;
  }>;
  documents?: Array<{
    docName: string;
    documentUrl: string;
  }>;
}

export interface CreateStudentResponse {
  success: boolean;
  message: string;
  data: {
    student: Student;
    parents: Parent[];
    medical: Medical;
    emergencyContact: EmergencyContact;
    school: School;
  };
}

export const childDynamicEndpoints = {
  getChildById: (id: string | number) => ({ path: `${childRoot}/${id}`, method: ApiMethods.GET }),
  updateChild: (id: string | number) => ({ path: `${childRoot}/${id}`, method: ApiMethods.PUT }),
  deleteChild: (id: string | number) => ({ path: `${childRoot}/${id}`, method: ApiMethods.DELETE }),
};
export interface GetAllChildsResponse {
  status: string;
  message: string;
  data: Student[];
  total?: number;
}

// ---- Get Child By ID ----
export interface GetChildByIdResponse {
  status: string;
  message: string;
  data: Student;
}

// ---- Delete Child ----
export interface DeleteChildResponse {
  status: string;
  message: string;
  data: Student;
}

// ========================
// CONFIG: Endpoints & Methods
// ========================
const childEndpoints = {
  createChild: { path: `${childRoot}`, method: ApiMethods.POST },
  getAllChilds: { path: `${childRoot}`, method: ApiMethods.GET },
  getChildrenAttendance: { path: "/api/v1/attendance/students", method: ApiMethods.GET },
};

// Dynamic endpoints (require ChildId)
export const ChildDynamicEndpoints = {
  getChildById: (ChildId: string | number) => ({
    path: `${childRoot}/${ChildId}`,
    method: ApiMethods.GET,
  }),
  updateChild: (ChildId: string | number) => ({
    path: `${childRoot}/${ChildId}`,
    method: ApiMethods.PUT,
  }),
  changeChildStatus: (ChildId: string | number) => ({
    path: `${childRoot}/${ChildId}/status`,
    method: ApiMethods.PATCH,
  }),
  deleteChild: (ChildId: string | number) => ({
    path: `${childRoot}/${ChildId}`,
    method: ApiMethods.DELETE,
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

export const childServices = generateServices(childEndpoints);
