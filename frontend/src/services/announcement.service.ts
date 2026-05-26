/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";
import { School } from "./teacher.service";

// ========================
// Announcement ROOT
// ========================
const announcementRoot = "/api/v1/announcement";

// ========================
// TYPES
// ========================
// --- Nested Subtypes ---

// ---- Base Announcement Model ----
export interface Announcement {
  id: number;
  announcementName: string;
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

// ---- Create Announcement ----
export interface CreateAnnouncementRequest {
  announcementName: string;
  minimumAge: string;
  maximumAge: string;
  maximumCapacity: string;
  tuitionFee: number;
  assignedStaff: string[];
  schoolId?: number;
}

export interface CreateAnnouncementResponse {
  status: string;
  message: string;
  data: Announcement;
}

// ---- Update Announcement ----
export interface UpdateAnnouncementRequest {
  announcementName?: string;
  minimumAge?: string;
  maximumAge?: string;
  maximumCapacity?: string;
  tuitionFee?: number;
  schoolId?: number;
  notes?: string;
}

export interface UpdateAnnouncementResponse {
  status: string;
  message: string;
  data: Announcement;
}

// ---- Change Announcement Status ----
export interface ChangeAnnouncementStatusRequest {
  status: string | "new" | "contacted" | "viewing_scheduled";
}

export interface ChangeAnnouncementStatusResponse {
  status: string;
  message: string;
  data?: Announcement;
}

// ---- Get All Announcements ----
export interface GetAllAnnouncementsParams {
  search?: string;
  limit?: number;
  offset?: number;
  status?: string | "new" | "contacted" | "viewing_scheduled";
  schoolId?: number;
  [key: string]: any;
}

export interface GetAllAnnouncementsResponse {
  status: string;
  message: string;
  data: Announcement[];
  Announcements?: Announcement[];
  total?: number;
}

// ---- Get Announcement By ID ----
export interface GetAnnouncementByIdResponse {
  status: string;
  message: string;
  data: Announcement;
}

// ---- Delete Announcement ----
export interface DeleteAnnouncementResponse {
  status: string;
  message: string;
}

// ========================
// CONFIG: Endpoints & Methods
// ========================
const announcementEndpoints = {
  createAnnouncement: { path: `${announcementRoot}`, method: ApiMethods.POST },
  getAllAnnouncements: { path: `${announcementRoot}`, method: ApiMethods.GET },
};

// Dynamic endpoints (require AnnouncementId)
export const AnnouncementDynamicEndpoints = {
  getAnnouncementById: (AnnouncementId: string | number) => ({
    path: `${announcementRoot}/${AnnouncementId}`,
    method: ApiMethods.GET,
  }),
  updateAnnouncement: (AnnouncementId: string | number) => ({
    path: `${announcementRoot}/${AnnouncementId}`,
    method: ApiMethods.PUT,
  }),
  changeAnnouncementStatus: (AnnouncementId: string | number) => ({
    path: `${announcementRoot}/${AnnouncementId}/status`,
    method: ApiMethods.PATCH,
  }),
  deleteAnnouncement: (AnnouncementId: string | number) => ({
    path: `${announcementRoot}/${AnnouncementId}`,
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
export const announcementServices = generateServices(announcementEndpoints);
