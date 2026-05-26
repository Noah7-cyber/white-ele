import { ApiMethods } from "@/utils/client";

const adminRoot = "/api/v1/admins";

export interface UpdateAdminPinRequest {
  pin: string;
}

export interface AdminKioskVerifyRequest {
  id: string;
  pin: string;
}

export interface AdminAttendanceRecord {
  id: number;
  adminId: number;
  schoolId: number;
  status: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminKioskUser {
  id?: number;
  uuid?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  schoolId?: number;
  role?: string;
  profile?: {
    photo?: string | null;
  } | null;
}

export interface AdminKioskEntity {
  id: number;
  userId?: number;
  schoolId?: number;
  role?: string;
  status?: string;
  notes?: string | null;
  photoUrl?: string | null;
  user?: AdminKioskUser | null;
  currentAttendance?: AdminAttendanceRecord | null;
  previousAttendance?: AdminAttendanceRecord | null;
  attendance?: {
    currentStatus?: string | null;
    currentAttendance?: AdminAttendanceRecord | null;
    previousAttendance?: AdminAttendanceRecord | null;
  } | null;
}

export interface GetAdminsResponse {
  success: boolean;
  message: string;
  admins: AdminKioskEntity[];
  pagination?: {
    pos: number;
    delta: number;
    count: number;
  };
}

export interface AdminKioskVerifyResponse {
  success: boolean;
  message?: string;
  data?: AdminKioskEntity;
}

const adminEndpoints = {
  getAllAdmins: { path: `${adminRoot}`, method: ApiMethods.GET },
  kioskVerify: { path: `${adminRoot}/kiosk-verify`, method: ApiMethods.POST },
};

export const adminDynamicEndpoints = {
  updateAdminPin: (adminId: string | number) => ({
    path: `${adminRoot}/${adminId}/pin`,
    method: ApiMethods.PUT,
  }),
};

type ServiceInterface = {
  path: string;
  method: ApiMethods;
};

function generateServices<T extends Record<string, { path: string; method: ApiMethods }>>(
  endpoints: T,
) {
  const services: Record<keyof T, ServiceInterface> = {} as Record<keyof T, ServiceInterface>;
  for (const key in endpoints) {
    services[key] = {
      path: endpoints[key].path,
      method: endpoints[key].method,
    };
  }
  return services;
}

export const adminServices = generateServices(adminEndpoints);
