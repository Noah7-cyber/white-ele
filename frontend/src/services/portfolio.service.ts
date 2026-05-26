/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";
import type { Portfolio } from "./curriculum.service";

// ========================
// Milestone ROOT
// ========================
const portfolioRoot = "/api/v1/portfolio";

// ========================
// TYPES
// ========================

// ---- Create Portfolio ----
export interface CreatePortfolioRequest {
  studentId: number;
  classroomId: number;
  startDate: string;
  endDate: string;
}

export interface CreatePortfolioFromLibraryRequest {
  portfolioIds: number[];
  classroomId: number;
  staffId: number;
}

export interface CreatePortfolioResponse {
  success?: boolean;
  status?: string;
  message: string;
  data: Portfolio;
}

// ---- Update Portfolio ----
export interface UpdatePortfolioRequest {
  studentId?: number;
  classroomId?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface UpdatePortfolioResponse {
  success?: boolean;
  status?: string;
  message: string;
  data: Portfolio;
}

// ---- Get All Milestones ----
export interface GetAllPortfoliosParams {
  subjectId?: number;
  curriculumId?: number;
  status?: string;
  search?: string;
  pos?: number;
  delta?: number;
  [key: string]: any;
}

export interface PortfolioStudent {
  id: number;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  classroom: {
    id: number;
    name: string;
  };
  profileUrl: string;
}
export interface PortfolioListItem {
  student: PortfolioStudent | null;
  sections: any[];
  sectionCount: number;
  id: number;
  updatedAt: string;
  createdAt: string;
  status: string;
  startDate: string;
  endDate: string;
  lastGradedMilestoneScore?: string | null;
}

export interface GetAllPortfoliosResponse {
  success?: boolean;
  status?: string;
  message: string;
  data: PortfolioListItem[];
  portfolios?: PortfolioListItem[];
  total?: number;
  pagination?: { pos: number; delta: number; total: number; totalPages: number };
}

// ---- Get Milestone By ID ----
export interface GetPortfolioByIdResponse {
  status: string;
  message: string;
  data: Portfolio;
}

// ---- Delete Milestone ----
export interface DeletePortfolioResponse {
  status: string;
  message: string;
}

// ---- Portfolio Section ----
export interface PortfolioSection {
  id?: number;
  portfolioId?: number;
  content: string;
  mediaUrls?: string[] | null;
  contentEntryDate?: string | null;
  contentEntryTime?: string | null;
  mediaEntryDate?: string | null;
  mediaEntryTime?: string | null;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSectionRequest {
  portfolioId: number;
  content: string;
  mediaUrls?: string[];
}

export interface CreateSectionResponse {
  status: string;
  message: string;
  data: PortfolioSection;
}

export interface UpdateSectionRequest {
  content?: string;
  mediaUrls?: string[];
}

export interface UpdateSectionResponse {
  status: string;
  message: string;
  data: PortfolioSection;
}

export interface GetSectionsResponse {
  status: string;
  message: string;
  data: PortfolioSection[];
}

export interface DeleteSectionResponse {
  status: string;
  message: string;
}

// ========================
// CONFIG: Endpoints & Methods
// ========================
const portfolioEndpoints = {
  createPortfolio: { path: `${portfolioRoot}`, method: ApiMethods.POST },
  createPortfolioFromLibrary: { path: `${portfolioRoot}/from-library`, method: ApiMethods.POST },
  getAllPortfolios: { path: `${portfolioRoot}`, method: ApiMethods.GET },
  getStudentGrades: {
    path: `${portfolioRoot}/grades`,
    method: ApiMethods.GET,
  },
};

// Dynamic endpoints (require PortfolioId)
export const portfolioDynamicEndpoints = {
  getPortfolioById: (portfolioId: string | number) => ({
    path: `${portfolioRoot}/${portfolioId}`,
    method: ApiMethods.GET,
  }),
  updatePortfolio: (portfolioId: string | number) => ({
    path: `${portfolioRoot}/${portfolioId}`,
    method: ApiMethods.PUT,
  }),
  patchPortfolio: (portfolioId: string | number) => ({
    path: `${portfolioRoot}/${portfolioId}`,
    method: ApiMethods.PATCH,
  }),
  deletePortfolio: (portfolioId: string | number) => ({
    path: `${portfolioRoot}/${portfolioId}`,
    method: ApiMethods.DELETE,
  }),
  // Section endpoints
  createSection: (_portfolioId: string | number) => ({
    path: `${portfolioRoot}/section`,
    method: ApiMethods.POST,
  }),
  getSections: (portfolioId: string | number) => ({
    path: `${portfolioRoot}/${portfolioId}/sections`,
    method: ApiMethods.GET,
  }),
  updateSection: (portfolioId: string | number, sectionId: string | number) => ({
    path: `${portfolioRoot}/section/${sectionId}`,
    method: ApiMethods.PUT,
  }),
  deleteSection: (portfolioId: string | number, sectionId: string | number) => ({
    path: `${portfolioRoot}/${portfolioId}/section/${sectionId}`,
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
export const portfolioServices = generateServices(portfolioEndpoints);
