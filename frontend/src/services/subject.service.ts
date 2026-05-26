/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";
import type { Subject, SubjectScheduleItem } from "./curriculum.service";

// ========================
// Subject ROOT
// ========================
const subjectRoot = "/api/v1/subjects";

// ========================
// TYPES
// ========================

// ---- Create Subject ----

export interface MinimumAgeMaximumAge {
  minimumAge: number;
  maximumAge: number;
}
export interface CreateSubjectRequest {
  name: string;
  description?: string;
  curriculumId: number;
  subjectSchedule?: SubjectScheduleItem[];
  skills?: string[];
  assignedTeachers?: number[];
}

export interface CreateSubjectResponse {
  status: string;
  message: string;
  data: Subject;
}

// ---- Update Subject ----
export interface UpdateSubjectRequest {
  name?: string;
  description?: string;
  subjectSchedule?: SubjectScheduleItem[];
  skills?: string[];
  assignedTeachers?: number[];
}

export interface UpdateSubjectResponse {
  status: string;
  message: string;
  data: Subject;
}

// ---- Get All Subjects ----
export interface GetAllSubjectsParams {
  curriculumId?: number;
  search?: string;
  pos?: number;
  delta?: number;
  [key: string]: any;
}

export interface GetAllSubjectsResponse {
  success?: boolean;
  status?: string;
  message: string;
  subject?: Subject[];
  subjects?: Subject[];
  total?: number;
  minAge?: number;
  maxAge?: number;
  pagination?: { pos: number; delta: number; count?: number; total?: number; totalPages?: number };
}

// ---- Get Subject By ID ----
export interface GetSubjectByIdResponse {
  success?: boolean;
  status?: string;
  message: string;
  data: Subject;
}

// ---- Delete Subject ----
export interface DeleteSubjectResponse {
  status: string;
  message: string;
}

// ========================
// CONFIG: Endpoints & Methods
// ========================
const subjectEndpoints = {
  createSubject: { path: `${subjectRoot}`, method: ApiMethods.POST },
  getAllSubjects: { path: `${subjectRoot}`, method: ApiMethods.GET },
};

// Dynamic endpoints (require SubjectId)
export const subjectDynamicEndpoints = {
  getSubjectById: (subjectId: string | number) => ({
    path: `${subjectRoot}/${subjectId}`,
    method: ApiMethods.GET,
  }),
  updateSubject: (subjectId: string | number) => ({
    path: `${subjectRoot}/${subjectId}`,
    method: ApiMethods.PUT,
  }),
  deleteSubject: (subjectId: string | number) => ({
    path: `${subjectRoot}/${subjectId}`,
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
export const subjectServices = generateServices(subjectEndpoints);
