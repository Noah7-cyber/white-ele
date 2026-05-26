/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";
import { School } from "./teacher.service";

// ========================
// Classroom ROOT
// ========================
const classroomRoot = "/api/v1/classroom";

// ========================
// TYPES
// ========================
// --- Nested Subtypes ---

// ---- Base Classroom Model ----
export interface Classroom {
  id: number;
  classroomName: string ;
  minimumAge: string | number;
  maximumAge: string | number;
  maximumCapacity: string | number;
  tuitionFee: number | string;
  assignedStaff: number[];
  schoolId?: number;
  status?: string | "new" | "contacted" | "viewing_scheduled";
  createdAt?: string;
  updatedAt?: string;
  school?: School;
  [key: string]: any;
}

// ---- Create Classroom ----
export interface CreateClassroomRequest {
  classroomName: string;
  minimumAge: string;
  maximumAge: string;
  maximumCapacity: string;
  tuitionFee: number;
  assignedStaff: string[]
  schoolId?: number;
}

export interface CreateClassroomResponse {
  status: string;
  message: string;
  data: Classroom;
}

// ---- Update Classroom ----
export interface UpdateClassroomRequest {
  classroomName?: string;
  minimumAge?: string;
  maximumAge?: string;
  maximumCapacity?: string;
  tuitionFee?: number;
  schoolId?: number;
  notes?: string;
}

export interface UpdateClassroomResponse {
  status: string;
  message: string;
  data: Classroom;
}

// ---- Change Classroom Status ----
export interface ChangeClassroomStatusRequest {
  status: string | "new" | "contacted" | "viewing_scheduled";
}

export interface ChangeClassroomStatusResponse {
  status: string;
  message: string;
  data?: Classroom;
}

// ---- Get All Classrooms ----
export interface GetAllClassroomsParams {
  search?: string;
  limit?: number;
  offset?: number;
  status?: string | "new" | "contacted" | "viewing_scheduled";
  schoolId?: number;
  [key: string]: any;
}

export interface GetAllClassroomsResponse {
  status: string;
  message: string;
  data: Classroom[];
  classrooms?: Classroom[];
  total?: number;
}

// ---- Get Classroom By ID ----
export interface GetClassroomByIdResponse {
  status: string;
  message: string;
  classroom: Classroom;
}

// ---- Delete Classroom ----
export interface DeleteClassroomResponse {
  status: string;
  message: string;
}

// ========================
// CONFIG: Endpoints & Methods
// ========================
const classroomEndpoints = {
  createClassroom: { path: `${classroomRoot}`, method: ApiMethods.POST },
  getAllClassrooms: { path: `${classroomRoot}`, method: ApiMethods.GET },
};

// Dynamic endpoints (require ClassroomId)
export const classroomDynamicEndpoints = {
  getClassroomById: (ClassroomId: string | number) => ({
    path: `${classroomRoot}/${ClassroomId}`,
    method: ApiMethods.GET,
  }),
  updateClassroom: (ClassroomId: string | number) => ({
    path: `${classroomRoot}/${ClassroomId}`,
    method: ApiMethods.PUT,
  }),
  changeClassroomStatus: (ClassroomId: string | number) => ({
    path: `${classroomRoot}/${ClassroomId}`,
    method: ApiMethods.PUT,
  }),
  deleteClassroom: (ClassroomId: string | number) => ({
    path: `${classroomRoot}/${ClassroomId}`,
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

// ========================
// EXPORTS
// ========================
export const classroomServices = generateServices(classroomEndpoints);
