"use client";

import { useRouter } from "next/navigation";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import {
  type GradeAssessmentFormData,
  gradeValidationSchema,
  initialGradeValues,
  mockStudents,
  calculateGrade,
} from "../grade.constant";
import { showToast } from "@/modules/shared/component/Toast";
import { useState } from "react";
import { DashboardRoutes } from "@/routes/dashboard.routes";

const useGradeAssessmentPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formInstance = useFormValidator<GradeAssessmentFormData>({
    validationSchema: gradeValidationSchema,
    defaultValues: {
      ...initialGradeValues,
      assessmentTitle: "Mid-Term Test Scoreboard",
      subject: "English",
      totalMarks: 20,
      students: mockStudents.map((student) => ({
        ...student,
        score: 0,
        grade: "-",
      })),
    },
    reValidateMode: "onChange",
  });

  const { control, setValue, getValues } = formInstance;

  const studentsData = getValues("students");
  const totalMarks = getValues("totalMarks");

  // Update grade when score changes
  const handleScoreChange = (studentIndex: number, newScore: number | string) => {
    const clampedScore = newScore === "" ? "" : Math.max(0, Math.min(100, Number(newScore)));

    setValue(`students.${studentIndex}.score`, clampedScore, {
      shouldValidate: true,
      shouldDirty: true,
    });

    setValue(`students.${studentIndex}.grade`, calculateGrade(clampedScore), {
      shouldValidate: false,
      shouldDirty: false,
    });
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Save grades
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const formData = getValues();

      // Filter students with scores
      const submittedScores = formData.students.filter(
        (s) => s.score !== "" && s.score !== undefined,
      );

      if (submittedScores.length === 0) {
        showToast({
          message: "No Scores Submitted",
          description: "Please add at least one score before saving.",
          severity: "warning",
          duration: 3000,
        });
        setIsSubmitting(false);
        return;
      }

      showToast({
        message: "Grades Saved Successfully",
        description: `${submittedScores.length} student grades have been saved.`,
        severity: "success",
        duration: 3000,
      });

      // Here you would typically make an API call to save the grades
      // await saveGradesToAPI(submittedScores);

      setTimeout(() => {
        router.push(DashboardRoutes.assessments);
      }, 1500);
    } catch (error) {
      showToast({
        message: "Error Saving Grades",
        description: "An error occurred while saving the grades.",
        severity: "error",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    ...formInstance,
    control,
    setValue,
    getValues,
    studentsData,
    totalMarks,
    handleScoreChange,
    handleBack,
    handleSave,
    isSubmitting,
  };
};

export default useGradeAssessmentPage;
