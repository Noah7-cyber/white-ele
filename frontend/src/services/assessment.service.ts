/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";
import type { Assessment } from "./curriculum.service";

// ========================
// Assessment ROOT
// ========================
const assessmentRoot = "/api/v1/assessment";

// ========================
// TYPES
// ========================

// ---- Create Assessment ----
export interface CreateAssessmentRequest {
  title: string;
  description?: string;
  subjectId: number;
  type?: string;
  dueDate?: string;
  totalMarks?: number;
}

export interface CreateAssessmentResponse {
  status: string;
  message: string;
  data: Assessment;
}

// ---- Update Assessment ----
export interface UpdateAssessmentRequest {
  title?: string;
  description?: string;
  type?: string;
  dueDate?: string;
  totalMarks?: number;
  status?: string;
}

export interface UpdateAssessmentResponse {
  status: string;
  message: string;
  data: Assessment;
}

// ---- Get All Assessments ----
export interface GetAllAssessmentsParams {
  subjectId?: number;
  status?: string;
  search?: string;
  [key: string]: any;
}

export interface GetAllAssessmentsResponse {
  status: string;
  message: string;
  data: Assessment[];
  assessments?: Assessment[];
  total?: number;
  pagination?: { count: number; delta: number; pos: number };
}

// ---- Get Assessment By ID ----
export interface GetAssessmentByIdResponse {
  status: string;
  message: string;
  data: Assessment;
}

// ---- Delete Assessment ----
export interface DeleteAssessmentResponse {
  status: string;
  message: string;
}

// ========================
// CONFIG: Endpoints & Methods
// ========================
const assessmentEndpoints = {
  createAssessment: { path: `${assessmentRoot}`, method: ApiMethods.POST },
  getAllAssessments: { path: `${assessmentRoot}`, method: ApiMethods.GET },
};

// Dynamic endpoints (require AssessmentId)
export const assessmentDynamicEndpoints = {
  getAssessmentById: (assessmentId: string | number) => ({
    path: `${assessmentRoot}/${assessmentId}`,
    method: ApiMethods.GET,
  }),
  updateAssessment: (assessmentId: string | number) => ({
    path: `${assessmentRoot}/${assessmentId}`,
    method: ApiMethods.PUT,
  }),
  deleteAssessment: (assessmentId: string | number) => ({
    path: `${assessmentRoot}/${assessmentId}`,
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
export const assessmentServices = generateServices(assessmentEndpoints);
