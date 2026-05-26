/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

// ========================
// Teacher ROOT
// ========================
const announcementRoot = "/api/v1/announcements";

export type AnnouncementStatus = "draft" | "published" | "archived" | "scheduled" | "deleted";
export type AnnouncementType = "general" | "urgent" | "event" | "academic" | "administrative";
export type SortOrder = "ASC" | "DESC";

export interface ListAnnouncementsQuery {
  search?: string;
  schoolId?: number;
  announcementStatus?: AnnouncementStatus;
  announcementType?: AnnouncementType;
  pos?: number;
  delta?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

const announcementEndpoints = {
  getAnnouncement: { path: `${announcementRoot}`, method: ApiMethods.GET },
  createAnnouncement: { path: `${announcementRoot}`, method: ApiMethods.POST },
};

// Dynamic endpoints (require AnnouncementId)
export const announcementDynamicEndpoints = {
  getAnnouncementById: (announcementId: string | number) => ({
    path: `${announcementRoot}/${announcementId}`,
    method: ApiMethods.GET,
  }),
  deleteAnnouncement: (announcementId: string | number) => ({
    path: `${announcementRoot}/${announcementId}`,
    method: ApiMethods.DELETE,
  }),
  updateAnnouncement: (announcementId: string | number) => ({
    path: `${announcementRoot}/${announcementId}`,
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
export const announcementServices = generateServices(announcementEndpoints);
