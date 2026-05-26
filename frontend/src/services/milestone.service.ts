/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";
import type { Milestone } from "./curriculum.service";

// ========================
// Milestone ROOT
// ========================
const milestoneRoot = "/api/v1/milestones";

// ========================
// TYPES
// ========================

// ---- Create Milestone ----
export interface CreateMilestoneRequest {
  title: string;
  description?: string | null;
  curriculumId: number;
  subjectId: number;
  gradingType?: string;
  milestonePeriodId?: number;
  milestonePeriod?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  dueDate?: string;
  successCriteria?: string;
  resources?: string;
}

export interface CreateMilestoneFromLibraryRequest {
  milestoneIds: number[];
  classroomId: number;
  staffId: number;
}

export interface CreateMilestoneResponse {
  success?: boolean;
  status?: string;
  message: string;
  data: Milestone;
}

// ---- Update Milestone ----
export interface UpdateMilestoneRequest {
  title?: string;
  description?: string | null;
  gradingType?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  dueDate?: string;
  successCriteria?: string;
  resources?: string;
}

export interface UpdateMilestoneResponse {
  success?: boolean;
  status?: string;
  message: string;
  data: Milestone;
}

// ---- Get All Milestones ----
export interface GetAllMilestonesParams {
  subjectId?: number;
  curriculumId?: number;
  status?: string;
  search?: string;
  pos?: number;
  delta?: number;
  [key: string]: any;
}

export interface GetAllMilestonesResponse {
  success?: boolean;
  status?: string;
  message: string;
  data: Milestone[];
  milestones?: Milestone[];
  total?: number;
  pagination?: { pos: number; delta: number; total: number; totalPages: number };
}

// ---- Get Milestone By ID ----
export interface GetMilestoneByIdResponse {
  status: string;
  message: string;
  data: Milestone;
}

// ---- Delete Milestone ----
export interface DeleteMilestoneResponse {
  status: string;
  message: string;
}

// ========================
// CONFIG: Endpoints & Methods
// ========================
const milestoneEndpoints = {
  createMilestone: { path: `${milestoneRoot}`, method: ApiMethods.POST },
  createMilestoneFromLibrary: { path: `${milestoneRoot}/from-library`, method: ApiMethods.POST },
  getAllMilestones: { path: `${milestoneRoot}`, method: ApiMethods.GET },
};

// Dynamic endpoints (require MilestoneId)
export const milestoneDynamicEndpoints = {
  getMilestoneById: (milestoneId: string | number) => ({
    path: `${milestoneRoot}/${milestoneId}`,
    method: ApiMethods.GET,
  }),
  updateMilestone: (milestoneId: string | number) => ({
    path: `${milestoneRoot}/${milestoneId}`,
    method: ApiMethods.PUT,
  }),
  deleteMilestone: (milestoneId: string | number) => ({
    path: `${milestoneRoot}/${milestoneId}`,
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
export const milestoneServices = generateServices(milestoneEndpoints);
