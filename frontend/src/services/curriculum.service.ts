/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";
import { MinimumAgeMaximumAge } from "./subject.service";
import { PortfolioSection } from "./portfolio.service";
// import { Student } from "./child.service";

// ========================
// Curriculum ROOT
// ========================
const curriculumRoot = "/api/v1/curriculums";

// ========================
// TYPES
// ========================

// ---- Subject Document Model ----
export interface SubjectDocument {
  fileName?: string;
  url?: string;
  [key: string]: any;
}

// ---- Assigned Teacher Model (for API response) ----
export interface AssignedTeacher {
  id: number;
  name: string;
}

// ---- Classroom Model (for API response) ----
export interface CurriculumClassroom {
  id: number;
  name: string;
}

// ---- Subject Schedule (for API) ----
export interface SubjectScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
}

// ---- Teacher with classrooms (for Subject response) ----
export interface SubjectTeacher {
  id: number;
  name: string;
  staffRole: string;
  classrooms: CurriculumClassroom[];
}

// ---- Legacy alias (classroomName for some APIs) ----
export type Classroom = CurriculumClassroom & { classroomName?: string };

// ---- Subject Model (for API payload) ----

interface SubjectAttachment {
  url: string; // existing uploaded file URL
  name: string;
  type?: string;
}
export interface CurriculumSubject {
  title: string;
  assignedTeachers?: number; // Single teacher ID (only one teacher can be assigned)
  description?: string;
  skills?: string[];
  documents?: SubjectDocument[];
  attachments?: SubjectAttachment[]; // Array of attachments
}

// ---- Subject Model (for API response) ----
export interface SubjectResponse {
  id: number;
  name: string;
  assignedTeachers?: AssignedTeacher[];
  classrooms?: Classroom[];
  description?: string;
  documents?: SubjectDocument[];
}

// ---- Base Curriculum Model ----
export interface Curriculum {
  id: number;
  title?: string;
  name?: string;
  description?: string;
  status?: string | "active" | "draft" | "archived";
  academicYear?: string;
  term?: string;
  startDate?: string;
  endDate?: string;
  classroomId?: number;
  classroomIds?: number[];
  classIds?: number[]; // API uses classIds
  subjectCount?: number;
  schoolId?: number;
  creatorId?: number;
  creatorType?: string;
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  school?: {
    id: number;
    schoolName: string;
    schoolType: string;
  };
  subjects?: CurriculumSubject[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

// ---- Subject Model (for response) ----
export interface Subject {
  id: number;
  title?: string;
  name?: string;
  description?: string;
  curriculum?: Curriculum;
  ageRange: MinimumAgeMaximumAge;
  attachmentsUrl?: string | null;
  schedule?: SubjectScheduleItem[];
  assignedTeachers?: number[] | AssignedTeacher[];
  teacherAssignments?: SubjectTeacher[];
  documents?: SubjectDocument[];
  milestones?: Milestone[];
  assessments?: Assessment[];
  // curriculums?: Curriculum[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

// ---- Milestone Model (base; list item may include subject/curriculum) ----
export interface Milestone {
  id: number;
  title: string;
  description?: string | null;
  subjectId?: number;
  gradingType?: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  status?: string;
  successCriteria?: string;
  resources?: string;
  subject?: { id: number; name: string; curriculumId: number };
  curriculum?: { id: number; title: string; academicYear?: string | null; term?: string | null };
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface Portfolio {
  id: number;
  title: string;
  description?: string | null;
  childName?: string;
  classIds?: number[];
  classrooms?: { id: number; name: string }[];
  ageRange?: { minimumAge?: number; maximumAge?: number };
  skills?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  startDate?: string;
  endDate?: string;
  sections?: PortfolioSection[];
  milestones?: any[];
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    sectionCount: string;
    classroom: {
      id: string;
      name: string;
    };
  };
}

// ---- Assessment Model ----
export interface Assessment {
  id: number;
  title: string;
  description?: string;
  subjectId: number;
  type?: string;
  dueDate?: string;
  totalMarks?: number;
  status?: "scheduled" | "in_review" | "graded";
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

// ---- Curriculum attachment (e.g. for create) ----
export interface CurriculumAttachmentItem {
  fileName: string;
  fileUrl: string;
}

// ---- Create Curriculum ----
export interface CreateCurriculumRequest {
  title: string;
  description?: string;
  academicYear?: string;
  term?: string;
  startDate?: string;
  endDate?: string;
  classroomIds?: number[];
  subjects?: CurriculumSubject[];
  attachments?: CurriculumAttachmentItem[];
}

export interface CreateCurriculumResponse {
  success: boolean;
  message: string;
  curriculum: Curriculum;
  subjects: SubjectResponse[];
}

// ---- Update Curriculum ----
export interface UpdateCurriculumRequest {
  title?: string;
  academicYear?: string;
  term?: string;
  startDate?: string;
  endDate?: string;
  classroomIds?: number[];
  description?: string;
  status?: string;
  subjects?: CurriculumSubject[];
}

export interface UpdateCurriculumResponse {
  success: boolean;
  message: string;
  curriculum: Curriculum;
  subjects: SubjectResponse[];
}

// ---- Get All Curriculums ----
export interface GetAllCurriculumsParams {
  search?: string;
  status?: string;
  classroomId?: number;
  [key: string]: any;
}

export interface GetAllCurriculumsResponse {
  success?: boolean;
  message?: string;
  curriculums?: Curriculum[];
  data?: Curriculum[];
  pagination?: { count?: number; delta?: number; pos?: number; total?: number };
}

// ---- Get Curriculum By ID ----
export interface GetCurriculumByIdResponse {
  success: boolean;
  message: string;
  curriculum: Curriculum;
  subjects: SubjectResponse[];
}

// ---- Delete Curriculum ----
export interface DeleteCurriculumResponse {
  status: string;
  message: string;
}

// ========================
// CONFIG: Endpoints & Methods
// ========================
const curriculumEndpoints = {
  createCurriculum: { path: `${curriculumRoot}`, method: ApiMethods.POST },
  getAllCurriculums: { path: `${curriculumRoot}`, method: ApiMethods.GET },
};

// Dynamic endpoints (require CurriculumId)
export const curriculumDynamicEndpoints = {
  getCurriculumById: (curriculumId: string | number) => ({
    path: `${curriculumRoot}/${curriculumId}`,
    method: ApiMethods.GET,
  }),
  updateCurriculum: (curriculumId: string | number) => ({
    path: `${curriculumRoot}/${curriculumId}`,
    method: ApiMethods.PUT,
  }),
  deleteCurriculum: (curriculumId: string | number) => ({
    path: `${curriculumRoot}/${curriculumId}`,
    method: ApiMethods.DELETE,
  }),
};

// ========================
// GRADING Endpoints
// ========================
const gradingRoot = "/api/v1/grading";

export const gradingDynamicEndpoints = {
  saveGrade: (childId: string | number) => ({
    path: `${gradingRoot}/${childId}`,
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
export const curriculumServices = generateServices(curriculumEndpoints);
