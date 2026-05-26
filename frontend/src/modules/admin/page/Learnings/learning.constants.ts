import {
  GRADING_TYPE_OPTIONS as ENUM_GRADING_TYPE_OPTIONS,
  MILESTONE_STATUS_OPTIONS as ENUM_MILESTONE_STATUS_OPTIONS,
} from "@/constants/learning.enums";

export const MILESTONE_STATUS_OPTIONS = ENUM_MILESTONE_STATUS_OPTIONS;
export const GRADING_TYPE_OPTIONS = ENUM_GRADING_TYPE_OPTIONS;

/** Dummy milestone period data (to be replaced with API fetch later) */
export const DUMMY_MILESTONE_PERIODS = [
  { id: 1, name: "Term 1" },
  { id: 2, name: "Term 2" },
  { id: 3, name: "Term 3" },
  { id: 4, name: "Mid-Year" },
  { id: 5, name: "End of Year" },
] as const;

/** Dummy milestones grouped by milestone period ID (to be replaced with API) */
export const DUMMY_MILESTONES_BY_PERIOD: Record<number, { id: number; name: string }[]> = {
  1: [
    { id: 4, name: "Reading Assessment - Term 1" },
    { id: 2, name: "Math Progress Check - Term 1" },
    { id: 1, name: "Science Lab Review - Term 1" },
  ],
  2: [
    { id: 4, name: "Reading Assessment - Term 2" },
    { id: 3, name: "Math Progress Check - Term 2" },
  ],
  3: [
    { id: 5, name: "Final Reading Assessment" },
    { id: 6, name: "Final Math Assessment" },
    { id: 7, name: "Final Science Assessment" },
  ],
  4: [{ id: 8, name: "Mid-Year Comprehensive Review" }],
  5: [
    { id: 9, name: "End of Year Portfolio" },
    { id: 10, name: "End of Year Presentation" },
  ],
};

export const CLASSROOM_FILTER_OPTIONS = [
  { label: "All Classroom", value: "all" },
  { label: "Grade 1", value: "grade_1" },
  { label: "Grade 2", value: "grade_2" },
  { label: "Grade 3", value: "grade_3" },
  { label: "Grade 4", value: "grade_4" },
] as const;

export const STATUS_FILTER_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
] as const;

/** Display row for milestones table (mapped from API Milestone) */
export interface MilestoneRow {
  id: string;
  milestoneName: string;
  gradingType?: string;
  class: string;
  milestonePeriod: string;
  startDate?: string;
  endDate?: string;
  status: "draft" | "active" | "completed";
  duration: string;
  /** API milestone for edit/delete */
  raw?: import("@/services/curriculum.service").Milestone;
}

export interface SubjectRow {
  id: string;
  subjectName: string;
  teacherName: string;
  class: string;
  ageRange: string;
  skills: string[];
  /** API subject for edit/delete */
  raw?: import("@/services/curriculum.service").Subject;
}

export interface PortfolioRow {
  id: string;
  childName: string;
  class: string;
  sections: number;
  duration: string;
  status: "Published" | "Draft" | "Archived";
  raw?: import("@/services/portfolio.service").PortfolioListItem;
}

export interface SkillTag {
  name: string;
  color: { bg: string; text: string };
}

export interface CurriculumCard {
  id: string;
  title: string;
  description: string;
  tag?: string;
  tagColor?: string;
  skillTags?: SkillTag[];
  ageRange: string;
  subjectCount: number;
}

export interface GradingRow {
  id: string;
  milestoneTitle: string;
  gradingType: string;
  class: string;
  duration: string;
  status: "in progress" | "completed";
  noOfStudents: number;
}

export interface ViewGradeStudent {
  id: string;
  name: string;
  avatar?: string;
  grade: string;
  observation: string;
}

/** @deprecated Use API data; empty fallback only */
export const MOCK_MILESTONES: MilestoneRow[] = [];

/** @deprecated Use API data; empty fallback only */
export const MOCK_SUBJECTS: SubjectRow[] = [];

/** @deprecated Use API data; empty fallback only */
export const MOCK_CURRICULUM_CARDS: CurriculumCard[] = [];

export const MOCK_GRADING_ROWS: GradingRow[] = [
  {
    id: "1",
    milestoneTitle: "Reading Project",
    gradingType: "Two level Type",
    class: "Grade 1",
    duration: "Jan 15 - Jan 16, 2025",
    status: "in progress",
    noOfStudents: 20,
  },
  {
    id: "2",
    milestoneTitle: "Continuous Assessment 2",
    gradingType: "Checklist",
    class: "Grade 2",
    duration: "Jan 17 - Jan 17, 2025",
    status: "completed",
    noOfStudents: 20,
  },
  {
    id: "3",
    milestoneTitle: "Continuous Assessment 3",
    gradingType: "Observation",
    class: "Grade 3",
    duration: "Mar 15 - Mar 18, 2025",
    status: "in progress",
    noOfStudents: 20,
  },
  {
    id: "4",
    milestoneTitle: "Final Examination",
    gradingType: "Score Type",
    class: "Grade 4",
    duration: "Feb 20 - Feb 28, 2025",
    status: "completed",
    noOfStudents: 20,
  },
];

export const MOCK_VIEW_GRADE_STUDENTS: ViewGradeStudent[] = [
  {
    id: "1",
    name: "Kwame Nkrumah",
    grade: "",
    observation: "Shows excellent number recognition skills",
  },
  {
    id: "2",
    name: "Amina Diallo",
    grade: "",
    observation: "Shows excellent number recognition skills",
  },
  { id: "3", name: "Zuri Mwangi", grade: "", observation: "No observation" },
  { id: "4", name: "Kofi Mensah", grade: "", observation: "No observation" },
  { id: "5", name: "Fatoumata Sow", grade: "", observation: "No observation" },
  { id: "6", name: "Juma Karanja", grade: "", observation: "No observation" },
  { id: "7", name: "Nia Chikezie", grade: "", observation: "No observation" },
];
