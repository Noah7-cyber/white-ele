import * as Yup from "yup";

export const lessonDuration = [
  "5 minutes",
  "10 minutes",
  "15 minutes",
  "20 minutes",
  "25 minutes",
  "30 minutes",
  "35 minutes",
  "40 minutes",
  "45 minutes",
  "50 minutes",
  "55 minutes",
  "60 minutes",
];

export const classOptions = [
  "Toddlers (Age 2-3)",
  "Pre K (Age 4-5)",
  "Grade 1 (Age 6-7)",
  "Grade 2 (Age 8-9)",
  "Grade 3 (Age 10-11)",
];

export const lessonSubjects = ["English", "Mathematics", "Sciences", "Literature"];

export const terms = [
  { label: "First Term", value: "first_term" },
  { label: "Second Term", value: "second_term" },
  { label: "Third Term", value: "third_term" },
];

export const academicYear = [
  { label: "2024-2025", value: "2024-2025" },
  { label: "2025-2026", value: "2025-2026" },
  { label: "2026-2027", value: "2026-2027" },
  { label: "2027-2028", value: "2027-2028" },
];

export const assignedStaff = [
  "Mrs Sarah Johnson",
  "Mrs Sarah Johnson",
  "Mrs Sarah Johnson",
  "Mrs Sarah Johnson",
  "Mrs Sarah Johnson",
  "Mrs Sarah Johnson",
];

export interface SubjectAttachment {
  file?: File; // new uploads
  url?: string; // existing uploaded file URL
  name: string;
  size: number;
  type?: string;
  isExisting?: boolean;
}

export interface Subject {
  id: string | number; // Can be string (temporary) or number (from API)
  name: string;
  title?: string; // For API payload
  assignedStaff?: number[];
  assignedTeachers?:
    | number
    | number[]
    | { id: number; name: string }
    | Array<{ id: number; name: string }>; // Can be single value or array (only one teacher allowed)
  description: string;
  attachments: File[] | SubjectAttachment[];
  documents?: Array<{ fileName?: string; url?: string }>; // For API payload
  classrooms?: Array<{ id: number; classroomName: string }>; // For API response
}

export interface SubjectFormValues {
  name: string;
  description: string;
  attachments: SubjectAttachment[];
  assignedStaff?: number[];
}

export const subjectInitialValues: SubjectFormValues = {
  name: "",
  description: "",
  attachments: [],
  assignedStaff: [],
};

export const subjectValidationSchema = Yup.object({
  name: Yup.string().required("Subject name is required"),
  description: Yup.string().required("Description is required"),
  attachments: Yup.array().max(5, "Maximum 5 attachments allowed").of(Yup.mixed<File>()),
});

export const MAX_ATTACHMENT_SIZE = 3 * 1024 * 1024; // 3MB in bytes
export const MAX_ATTACHMENTS = 5;
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export interface LessonFormValues {
  title: string;
  academicYear: string;
  term: string;
  classroomIds: number[];
  startDate: string | Date | null;
  endDate: string | Date | null;
  description: string;
  subjects: Subject[];
}

export const initialValue: LessonFormValues = {
  title: "",
  academicYear: "",
  term: "",
  classroomIds: [],
  startDate: null,
  endDate: null,
  description: "",
  subjects: [],
};

export const validationSchema = Yup.object({
  title: Yup.string().required("Curriculum title is required"),
  academicYear: Yup.string().required("Academic year is required"),
  term: Yup.string().required("Term is required"),
  classroomIds: Yup.array().of(Yup.number()).min(1, "Select at least one class"),
  startDate: Yup.mixed().required("Start date is required"),
  endDate: Yup.mixed().required("End date is required"),
  description: Yup.string().optional(),
  subjects: Yup.array().of(Yup.object<Subject>()).min(1, "At least one subject is required"),
});
