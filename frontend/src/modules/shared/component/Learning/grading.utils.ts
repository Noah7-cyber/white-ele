import * as Yup from "yup";

// Grade calculation mapping based on score percentage
export const GRADE_MAPPING = {
  A: { min: 80, max: 100, displayLabel: "A" },
  B: { min: 70, max: 79, displayLabel: "B" },
  C: { min: 60, max: 69, displayLabel: "C" },
  D: { min: 50, max: 59, displayLabel: "D" },
  F: { min: 0, max: 49, displayLabel: "F" },
} as const;

// Calculate grade from score and total marks
export const calculateGrade = (score: number | string): string => {
  if (score === "" || score === undefined || score === null) {
    return "-";
  }

  const numScore = typeof score === "string" ? Number.parseFloat(score) : score;

  if (isNaN(numScore) || numScore < 0 || numScore > 100) return "-";

  for (const [, gradeRange] of Object.entries(GRADE_MAPPING)) {
    if (numScore >= gradeRange.min && numScore <= gradeRange.max) {
      return gradeRange.displayLabel;
    }
  }

  return "-";
};

// Get percentage from score
export const calculatePercentage = (score: number | string, totalMarks: number): number => {
  if (!score || !totalMarks || totalMarks === 0) return 0;

  const numScore = typeof score === "string" ? Number.parseFloat(score) : score;
  if (isNaN(numScore) || numScore < 0 || numScore > totalMarks) return 0;

  return Math.round((numScore / totalMarks) * 100);
};

// Student score form data interface
export interface StudentScore {
  studentId: string;
  studentName: string;
  score: string | number;
  grade?: string;
}

// Form data interface
export interface GradeAssessmentFormData {
  assessmentTitle: string;
  subject: string;
  totalMarks: number | string;
  students: StudentScore[];
}

// Validation schema
export const gradeValidationSchema = Yup.object({
  assessmentTitle: Yup.string().required("Assessment title is required"),
  subject: Yup.string().required("Subject is required"),
  totalMarks: Yup.number()
    .min(1, "Total marks must be greater than 0")
    .required("Total marks is required"),
  students: Yup.array().of(
    Yup.object({
      studentId: Yup.string().required("Student ID is required"),
      studentName: Yup.string().required("Student name is required"),
      score: Yup.mixed().test(
        "valid-score",
        "Score must be a valid number between 0 and 100",
        function (value) {
          if (value === "" || value === undefined || value === null) return true; // Allow empty
          const numValue = typeof value === "string" ? Number.parseFloat(value) : value;
          return (
            typeof numValue === "number" && !isNaN(numValue) && numValue >= 0 && numValue <= 100
          );
        },
      ),
    }),
  ),
});
