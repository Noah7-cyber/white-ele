/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

// ========================
// PROFILE ROOT
// ========================
const profileRoot = "/api/v1/profile";

// ========================
// TYPES
// ========================
export interface ProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      uuid: string;
      email: string;
      phone: string;
      firstName: string;
      lastName: string;
      middleName: string | null;
      dateOfBirth: string | null;
      address: string;
      emailVerified: boolean;
      phoneVerified: boolean;
      isActive: boolean;
      role: string;
      createdAt: string;
      updatedAt: string;
      profile: {
        id: number;
        userId: number;
        suffix: string;
        photo?: string;
        address: string;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        countryCode: string | null;
        [key: string]: any;
      };
      [key: string]: any;
    };
  };
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  middleName?: string | null;
  phone: string;
  dateOfBirth?: string | null;
  address: string;
  city: string;
  state: string;
  countryCode?: string | null;
  postalCode?: string | null;
  photo?: string | null;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: ProfileResponse["data"];
}

// ========================
// CONFIG: Endpoints & Methods
// ========================
const profileEndpoints = {
  getProfile: { path: profileRoot, method: ApiMethods.GET },
  updateProfile: { path: profileRoot, method: ApiMethods.PUT },
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
export const profileServices = generateServices(profileEndpoints);
