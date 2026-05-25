import { UserRole } from "../entities/EntityEnums";

export type SearchProviderId =
  | "student"
  | "classroom"
  | "staff"
  | "admin"
  | "parent"
  | "announcement"
  | "curriculum"
  | "subject"
  | "milestone"
  | "assessment";



export interface SearchResultItem {
  type: SearchProviderId;
  id: number | string;
  display: Record<string, any>;
  timestamp?: string;
}

export interface SearchGroupedItem {
  id: number | string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileUrl?: string | null;
}

export interface ProviderResult {
  providerId: SearchProviderId;
  items: SearchResultItem[];
  total: number;
}

export interface SearchUserContext {
  id: number;
  role: UserRole;
  schoolId?: number;
  staffId?: number;
  parentId?: number;
  studentId?: number;
}

export interface SearchParams {
  q: string;
  user: SearchUserContext;
  schoolId: number;
  limit: number;
  offset: number;
}

export interface SearchProvider {
  id: SearchProviderId;
  search(params: SearchParams): Promise<ProviderResult>;
}

export interface GlobalSearchOptions {
  page?: number;
}

export interface GlobalSearchResponse {
  results: Record<SearchProviderId, SearchGroupedItem[]>;
  pagination: {
    perProvider: Record<SearchProviderId, number>;
    limits: Record<SearchProviderId, number>;
    page: number;
  };
}
