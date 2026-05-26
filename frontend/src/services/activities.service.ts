/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

// ========================
// Activities ROOT
// ========================
const activitiesRoot = "/api/v1/classroom-activity";

// ========================
// TYPES
// ========================
// --- Nested Subtypes ---

// ---- Base Actvities Model ----
export interface ActivityParent {
  id: number;
  userId: number;
  relationship: string;
  notes?: string | null;
  photoUrl?: string | null;
  schoolId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityStudent {
  id: number;
  userId: number;
  admissionNumber: string;
  enrolmentDate?: string;
  schedule?: string[];
  photoUrl?: string | null;
  schoolId?: number | null;
  classroomId?: number | null;
  classrooms?: unknown[];
  parents?: ActivityParent[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityTeacher {
  id: number;
  userId: number;
  staffRole: string;
  qualification?: string | null;
  startDate?: string | null;
  schoolId?: number | null;
  status?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Activities {
  id: number;
  activityType: string;
  studentId: number | number[];
  classroomId: number ;
  teacherId?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
  notifyParent?: boolean | null;
  medicationName?: string | null;
  dosage?: string | null;
  timeGiven?: string | Date | null;
  bathroomType?: "potty" | "toilet" | "diaper_change" | string | null;
  mealType?: "Breakfast" | "Lunch" | "Dinner" | string | null;
  foodItem?: string | null;
  foodItems?: string | null;
  photoUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  student?: ActivityStudent | null;
  teacher?: ActivityTeacher | null;
  [key: string]: any;
}
// ---- Create Activities ----
export interface CreateActivitiesRequest {
  activiytType: string;
  studentId: number[];
  classroomId: number;
  startTime?: string;
  endTime?: string;
  notes?: string;
  notifyParent?: boolean;
  medicationName?: string;
  dosage?: string;
  timeGiven?: string | Date;
  bathroomType?: "potty" | "toilet" | "diaper_change" | string;
  mealType?: "Breakfast" | "Lunch" | "Dinner" | string;
  foodItem?: string;
  photoUrl?: string | null;
}

export interface CreateActivitiesResponse {
  status: string;
  message: string;
  data: Activities;
}


// ---- Get All Activities ----
export interface GetAllActivitiesParams {
  schoolId?: number;
  [key: string]: any;
}

export interface GetAllActivitiesResponse {
  success: boolean;
  message: string;
  activities: Activities[];
}

// ---- Get Activity By Activity type ----
export interface GetActivityByTypeResponse {
  success: boolean;
  message: string;
  activities: Activities[];
}

// ---- Get Activity By ID ----
export interface GetActivityByIdResponse {
  success: boolean;
  message: string;
  activity: {
    id: number;
    activityType: string;
    notes?: string | null;
    notifyParent?: boolean;
    createdAt: string;
    startTime?: string | null;
    endTime?: string | null;
    classroom: {
      id: number;
      name: string;
    };
    creator: {
      id: number;
      name: string;
      role: string;
      profileUrl: string | null;
    };
    students: Array<{
      id: number;
      name: string;
      photoUrl: string | null;
    }>;
    // Include other fields from Activities interface as needed
    mealType?: string | null;
    bathroomType?: string | null;
    timeGiven?: string | null;
    medicationName?: string | null;
    dosage?: string | null;
    foodItem?: string | null;
    photoUrl?: string | null;
  };
}

// // ---- Delete Classroom ----
// export interface DeleteClassroomResponse {
//   status: string;
//   message: string;
// }

// ========================
// CONFIG: Endpoints & Methods
// ========================
const activitiesEndpoints = {
  createActivities: { path: `${activitiesRoot}`, method: ApiMethods.POST },
  getAllActivities: { path: `${activitiesRoot}`, method: ApiMethods.GET },
  getAllActivityLogs: { path: `/api/v1/activity-logs`, method: ApiMethods.GET },
};

// Filter parameters interface for activities
export interface ActivitiesFilterParams {
  teacherId?: number;
  classroomId?: number;
  activityType?: string;
  startDate?: string;
  endDate?: string;
  delta?: number;
  pos?: number;
}

// Dynamic endpoints
export const activitiesDynamicEndpoints = {
  // Get single activity by ID
  getActivityById: (activityId: string | number) => ({
    path: `${activitiesRoot}/${activityId}`,
    method: ApiMethods.GET,
  }),
  // Unified endpoint that accepts all filter params (teacherId, classroomId, activityType, dates, pagination)
  // Use: client.request({ path, method, data: filters })
  getActivitiesWithFilters: (filters: ActivitiesFilterParams) => ({
    path: activitiesRoot,
    method: ApiMethods.GET,
    filters: {
      ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
      ...(filters.classroomId ? { classroomId: filters.classroomId } : {}),
      ...(filters.activityType ? { activityType: filters.activityType } : {}),
      ...(filters.startDate ? { startDate: filters.startDate } : {}),
      ...(filters.endDate ? { endDate: filters.endDate } : {}),
      ...(filters.delta ? { delta: filters.delta } : {}),
      ...(filters.pos ? { pos: filters.pos } : {}),
    },
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
export const activitiesServices = generateServices(activitiesEndpoints);
