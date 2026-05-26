export type SubjectAttachment = {
  name: string;
  size: number;
  type: string;
};

export type MilestoneStatus = "daily" | "weekly" | "termly";
export type AssessmentStatus = "active" | "draft" | "archived" | "graded" | "inactive";

export interface SubjectMilestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: MilestoneStatus;
  successCriteria: string;
  resources?: string[];
  lastUpdated: string;
}

export interface SubjectAssessment {
  id: string;
  title: string;
  type: string;
  description: string;
  dueDate: string;
  noOfMilestones: number;
  status: AssessmentStatus;
  rubric?: string;
  weight?: number;
}

export interface SubjectDetail {
  id: string;
  name: string;
  description: string;
  attachments: SubjectAttachment[];
  assignedStaff: string;
  lastUpdated: string;
  status: "active" | "inactive" | "archived";
  milestones: SubjectMilestone[];
  assessments: SubjectAssessment[];
}

export interface CurriculumDetailData {
  id: string;
  title: string;
  classes: string[];
  academicYear: string;
  term: string;
  assignedStaff: string;
  startDate: string;
  endDate: string;
  description: string;
  subjects: SubjectDetail[];
  status: string;
}

const sharedAssessments: SubjectAssessment[] = [
  {
    id: "1",
    title: "Countinous Assessment 1",
    type: "daily",
    description: "Short comprehension test covering weeks 1-4 phonics",
    dueDate: "10 Jan, 2025",
    noOfMilestones: 2,
    weight: 0.2,
    status: "graded",
    rubric: "Accuracy of sounds, blending, and sentence reading",
  },
  {
    id: "2",
    title: "Countinous Assessment 2",
    type: "daily",
    description: "Short comprehension test covering weeks 1-4 phonics",
    dueDate: "22 Feb, 2025",
    noOfMilestones: 3,
    weight: 0.2,
    status: "graded",
    rubric: "Accuracy of sounds, blending, and sentence reading",
  },
  {
    id: "3",
    title: "Countinous Assessment 3",
    type: "termly",
    description: "Short comprehension test covering weeks 1-4 phonics",
    dueDate: "13 Mar, 2025",
    noOfMilestones: 2,
    weight: 0.2,
    status: "graded",
    rubric: "Accuracy of sounds, blending, and sentence reading",
  },
  {
    id: "4",
    title: "Final Examination",
    type: "termly",
    description: "Short comprehension test covering weeks 1-4 phonics",
    dueDate: "24 Apr, 2025",
    noOfMilestones: 2,
    weight: 0.2,
    status: "graded",
    rubric: "Accuracy of sounds, blending, and sentence reading",
  },
  {
    id: "5",
    title: "Quiz",
    type: "weekly",
    description: "Stations-based activity for addition and subtraction",
    dueDate: "2025-02-22",
    noOfMilestones: 30,
    weight: 0.3,
    status: "active",
  },
];

const sharedMilestones: SubjectMilestone[] = [
  {
    id: "1",
    title: "Identify Letter A",
    description: "Recognize uppercase and lowercase letter A.",
    dueDate: "2025-01-20",
    status: "daily",
    successCriteria: "95% accuracy in sound identification",
    resources: ["Alphabet flash cards", "Jolly Phonics audio"],
    lastUpdated: "2025-01-19",
  },
  {
    id: "2",
    title: "Identify Letter B",
    description: "Recognize uppercase and lowercase letter B.",
    dueDate: "2025-02-14",
    status: "weekly",
    successCriteria: "Compose at least three sentences independently",
    resources: ["Sentence strips", "Mini whiteboards"],
    lastUpdated: "2025-01-30",
  },
  {
    id: "3",
    title: "Sound Recognition",
    description: "Identify phonetic sounds of letter A-E.",
    dueDate: "2025-03-12",
    status: "termly",
    successCriteria: "Identify beginning, middle, and end",
    lastUpdated: "2025-01-05",
  },
];

const baseCurriculum: CurriculumDetailData = {
  id: "1",
  title: "Grade 1 Core Curriculum",
  classes: ["Grade 1 (6-7yrs)"],
  academicYear: "2024/2025",
  term: "First Term",
  assignedStaff: "Mrs Sarah Johnson",
  startDate: "2024-09-01",
  endDate: "2024-12-15",
  description:
    "Comprehensive curriculum focusing on foundational literacy, numeracy, STEAM, and socio-emotional learning.",
  status: "active",
  subjects: [
    {
      id: "1",
      name: "English Language",
      description: "Phonics, guided reading, handwriting, and comprehension.",
      attachments: [{ name: "English Syllabus.pdf", size: 1024000, type: "application/pdf" }],
      assignedStaff: "Mrs. Sarah Johnson",
      lastUpdated: "2025-01-19",
      status: "active",
      milestones: sharedMilestones,
      assessments: sharedAssessments,
    },
    {
      id: "2",
      name: "Mathematics",
      description: "Number sense, basic operations, measurement, and data.",
      attachments: [{ name: "Math Curriculum.docx", size: 512000, type: "application/vnd.msword" }],
      assignedStaff: "Mr. Daniel Adeoye",
      lastUpdated: "2025-01-17",
      status: "active",
      milestones: [
        {
          id: "4",
          title: "Number Bonds to 20",
          description: "Recall number bonds fluently.",
          dueDate: "2025-02-01",
          status: "daily",
          successCriteria: "Complete 20 mixed questions in 5 minutes",
          lastUpdated: "2025-01-25",
        },
        {
          id: "5",
          title: "Measurement Foundations",
          description: "Use rulers and compare lengths.",
          dueDate: "2025-02-28",
          status: "weekly",
          successCriteria: "Measure classroom objects within 0.5cm accuracy",
          lastUpdated: "2025-01-12",
        },
      ],
      assessments: [
        {
          id: "3",
          title: "Number Patterns Quiz",
          type: "Quiz",
          description: "Identify and extend patterns up to 100.",
          dueDate: "2025-02-18",
          noOfMilestones: 20,
          status: "active",
        },
      ],
    },
    {
      id: "3",
      name: "STEAM for Early Years",
      description: "Hands-on explorations combining science, art, and engineering.",
      attachments: [{ name: "STEAM Projects.pdf", size: 2048000, type: "application/pdf" }],
      assignedStaff: "Ms. Amina Diallo",
      lastUpdated: "2025-01-10",
      status: "active",
      milestones: [
        {
          id: "6",
          title: "Simple Machines Exploration",
          description: "Identify levers, pulleys, and inclined planes.",
          dueDate: "2025-03-01",
          status: "weekly",
          successCriteria: "Complete journal entry describing two machines",
          lastUpdated: "2025-01-02",
        },
      ],
      assessments: [
        {
          id: "4",
          title: "Design Challenge Submission",
          type: "Project",
          description: "Build a bridge using craft materials.",
          dueDate: "2025-03-15",
          noOfMilestones: 40,
          status: "inactive",
          rubric: "Stability, creativity, teamwork, presentation",
        },
      ],
    },
  ],
};

export const mockCurriculums: CurriculumDetailData[] = [baseCurriculum];

export const getMockCurriculumById = (id: string): CurriculumDetailData => {
  return (
    mockCurriculums.find((curriculum) => curriculum.id === id) ?? {
      ...baseCurriculum,
      id,
      title: `Curriculum ${id}`,
    }
  );
};

export const getMockSubjectById = (_curriculumId: string, _subjectId: string) => {
  // Return the first subject from base curriculum, ignoring IDs completely
  const curriculum = baseCurriculum;
  const subject = curriculum.subjects.length > 0 ? curriculum.subjects[0] : undefined;
  return {
    curriculum,
    subject,
  };
};
