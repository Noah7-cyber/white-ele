/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

// ========================
// GLOBAL SEARCH ROOT
// ========================
const globalSearchRoot = "/api/v1/global-search";

// ========================
// TYPES
// ========================
export interface GlobalSearchPerson {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profileUrl: string | null;
}

export interface GlobalSearchNamedItem {
  id: number;
  name: string;
}

export interface GlobalSearchResults {
  student: GlobalSearchPerson[];
  classroom: GlobalSearchNamedItem[];
  staff: GlobalSearchPerson[];
  admin: GlobalSearchPerson[];
  parent: GlobalSearchPerson[];
  announcement: GlobalSearchNamedItem[];
  curriculum: GlobalSearchNamedItem[];
  subject: GlobalSearchNamedItem[];
  milestone: GlobalSearchNamedItem[];
  assessment: GlobalSearchNamedItem[];
}

export interface GlobalSearchPagination {
  perProvider: Record<string, number>;
  limits: Record<string, number>;
  page: number;
}

export interface GlobalSearchResponse {
  success: boolean;
  message: string;
  results: GlobalSearchResults;
  pagination: GlobalSearchPagination;
}

// ========================
// SERVICE
// ========================
export const getGlobalSearchEndpoint = (query: string) => ({
  path: globalSearchRoot,
  method: ApiMethods.GET as const,
  data: { q: query } as any,
});
