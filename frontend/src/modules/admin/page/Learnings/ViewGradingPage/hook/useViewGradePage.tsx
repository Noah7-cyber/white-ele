"use client";

import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Box, TextField, Typography } from "@mui/material";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import {
  milestoneDynamicEndpoints,
  type GetMilestoneByIdResponse, 
} from "@/services/milestone.service";
import { ApiMethods } from "@/utils/client";
import { showToast } from "@/modules/shared/component/Toast";
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";
import { useRouter } from "next/navigation";

type MilestoneStudent = {
  id: number;
  name: string;
  photoUrl?: string | null;
};

type GradeRecordPayload = {
  milestoneId: number;
  studentIds: number[];
  grades: number[];
  observations?: string[];
};

function sanitizeGradeInput(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return "";
  const singleDigit = digitsOnly.charAt(0);
  return Number(singleDigit) <= 3 ? singleDigit : "";
}

interface GradeInputProps {
  studentId: number;
  value: string;
  onChange: (studentId: number, value: string) => void;
}

const GradeInput = memo(function GradeInput({ studentId, value, onChange }: GradeInputProps) {
  return (
    <TextField
      size="small"
      placeholder="0-3"
      value={value}
      onChange={(e) => onChange(studentId, e.target.value)}
      inputProps={{
        inputMode: "numeric",
        pattern: "[0-3]*",
        maxLength: 1,
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: "8px",
          height: "36px",
          fontSize: "13px",
          backgroundColor: "transparent",
          width: "120px",
        },
      }}
    />
  );
});

export default function useViewGradePage(milestoneId: string) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [gradeByStudentId, setGradeByStudentId] = useState<Record<number, string>>({});
  const [dirtyStudentIds, setDirtyStudentIds] = useState<Record<number, boolean>>({});

  const numericMilestoneId = Number(milestoneId);
  const hasValidMilestoneId = Number.isFinite(numericMilestoneId);

  const { data, isLoading } = useQueryService<object, GetMilestoneByIdResponse>({
    service: hasValidMilestoneId
      ? milestoneDynamicEndpoints.getMilestoneById(numericMilestoneId)
      : milestoneDynamicEndpoints.getMilestoneById(""),
    options: {
      enabled: hasValidMilestoneId,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  });
  const router = useRouter();
  const { mutateAsync: saveAllGrades, isPending: isSaving } = useMutationService<
    GradeRecordPayload,
    { success?: boolean; message?: string }
  >({
    service: {
      path: "api/v1/assessments/record-score",
      method: ApiMethods.PUT,
    },
  });

  const milestone = data?.data;
  const assessmentTitle = milestone?.title ?? "Milestone Grading";
  const primaryClassroom = useMemo(() => {
    const groupedClassrooms = Array.isArray(milestone?.classrooms) ? milestone.classrooms : [];
    if (groupedClassrooms.length > 0) return groupedClassrooms[0];
    return milestone?.classroom;
  }, [milestone]);

  const allStudents: MilestoneStudent[] = useMemo(() => {
    const students = primaryClassroom?.students;
    if (!Array.isArray(students)) return [];
    return students.map((student) => ({
      id: Number(student?.id),
      name: String(student?.name ?? "Unknown learner"),
      photoUrl: typeof student?.photoUrl === "string" ? student.photoUrl.trim() : null,
    }));
  }, [primaryClassroom]);

  useEffect(() => {
    if (!allStudents.length) return;
    setGradeByStudentId((prev) => {
      const hasAnyExisting = Object.keys(prev).length > 0;
      if (hasAnyExisting) return prev;

      const classroomStudents = Array.isArray(primaryClassroom?.students)
        ? primaryClassroom.students
        : [];
      const fromApiGrades = Array.isArray(milestone?.grades) ? milestone?.grades : [];
      const initialGrades: Record<number, string> = {};
      for (const student of allStudents) {
        const matchedStudent = classroomStudents.find(
          (classroomStudent: Record<string, unknown>) =>
            Number(classroomStudent?.id) === student.id,
        );
        const scoreFromStudent = matchedStudent?.score;
        const matched = fromApiGrades?.find((gradeItem: Record<string, unknown>) => {
          const childId = Number(
            gradeItem?.studentId ??
              gradeItem?.childId ??
              (gradeItem?.student as { id: number })?.id,
          );
          return childId === student.id;
        });
        const value = scoreFromStudent ?? matched?.score;
        if (value !== undefined && value !== null && value !== "") {
          initialGrades[student.id] = sanitizeGradeInput(String(value));
        } else {
          initialGrades[student.id] = "";
        }
      }
      return initialGrades;
    });
  }, [allStudents, milestone?.grades, primaryClassroom?.students]);

  const totalItems = allStudents.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedStudents = useMemo(
    () => allStudents.slice(startIndex, endIndex),
    [allStudents, startIndex, endIndex],
  );

  const hasUnsavedChanges = useMemo(
    () => Object.values(dirtyStudentIds).some(Boolean),
    [dirtyStudentIds],
  );

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const onPageChange = ({
    page,
    rowsPerPage: newRowsPerPage,
  }: {
    page: number;
    rowsPerPage: number;
  }) => {
    setCurrentPage(page);
    if (newRowsPerPage !== rowsPerPage) {
      setRowsPerPage(newRowsPerPage);
      setCurrentPage(1);
    }
  };

  const onGradeChange = useCallback((studentId: number, rawValue: string) => {
    const sanitized = sanitizeGradeInput(rawValue);
    setGradeByStudentId((prev) => ({ ...prev, [studentId]: sanitized }));
    setDirtyStudentIds((prev) => ({ ...prev, [studentId]: true }));
  }, []);

  const handleBack = (onConfirmLeave: () => void) => {
    onConfirmLeave();
  };

  const handleSaveAll = async () => {
    if (!hasValidMilestoneId) return;
    if (!allStudents.length) {
      showToast({
        message: "No students to grade",
        description: "This milestone has no students attached.",
        severity: "error",
      });
      return;
    }

    const studentIds = allStudents.map((student) => student.id);
    const grades = studentIds.map((studentId) => gradeByStudentId[studentId] ?? "");

    const hasEmptyGrade = grades.some((grade) => grade === "");
    if (hasEmptyGrade) {
      showToast({
        message: "Incomplete grades",
        description: "Enter a grade (0-3) for every learner before saving.",
        severity: "error",
      });
      return;
    }

    await saveAllGrades({
      milestoneId: numericMilestoneId,
      studentIds,
      grades: grades.map((grade) => Number(grade)),
      // observations: [],
    });
    router.back();
    setDirtyStudentIds({});
  };

  const GradingStudentList = useMemo(
    () =>
      paginatedStudents.map((student) => ({
        0: (
          <Box className="flex items-center gap-3">
            <InitialsAvatar
              src={student.photoUrl}
              name={student.name}
              className="w-10 h-10"
              initialsClassName="text-xs"
            />
            <Typography className="!text-sm !font-medium !text-primary-dark">
              {student.name}
            </Typography>
          </Box>
        ),
        1: (
          <GradeInput
            studentId={student.id}
            value={gradeByStudentId[student.id] ?? ""}
            onChange={onGradeChange}
          />
        ),
      })),
    [paginatedStudents, gradeByStudentId, onGradeChange],
  );

  return {
    assessmentTitle,
    currentPage,
    rowsPerPage,
    totalItems,
    onPageChange,
    GradingStudentList,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    handleSaveAll,
    handleBack,
    paginatedStudents,
    gradeByStudentId,
    onGradeChange,
  };
}
