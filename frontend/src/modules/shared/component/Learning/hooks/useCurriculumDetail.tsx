/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import SubjectRowActions from "@/modules/shared/component/Learning/SubjectRowActions/subjectRowActions";
import { showToast } from "@/modules/shared/component/Toast";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { StaffRoutes } from "@/routes/staff.routes";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useQueryService } from "@/utils/hooks/useQueryService";
import {
  curriculumDynamicEndpoints,
  GetCurriculumByIdResponse,
  SubjectResponse,
} from "@/services/curriculum.service";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";

interface UseCurriculumDetailArgs {
  curriculumId: number;
  role?: "admin" | "staff";
}

export interface SubjectDetail {
  id: number;
  subject: string;
  assignedTeacher: string;
  milestones: number;
  assessments: number;
  lastUpdated: string;
  status: string;
}

const useCurriculumDetail = ({ curriculumId, role = "admin" }: UseCurriculumDetailArgs) => {
  const routes = role === "admin" ? DashboardRoutes : (StaffRoutes as any);
  const [selectedFilter, setSelectedFilter] = useState<string>("Filter");
  const [gradeAnchorEl, setGradeAnchorEl] = useState<HTMLElement | null>(null);
  const [statusAnchorEl, setStatusAnchorEl] = useState<HTMLElement | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [archiveModal, setArchiveModal] = useState(false);
  const [selectedSubjectForDelete, setSelectedSubjectForDelete] = useState<SubjectDetail | null>(
    null,
  );
  const [selectedClassroom] = useState<string | null>(null);

  const router = useRouter();

  const { filters, applyFilters } = useFilter({
    search: "",
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });

  // Fetch curriculum detail
  const { data: curriculumDetailData, isLoading: isLoadingCurriculum } = useQueryService<
    Record<string, never>,
    GetCurriculumByIdResponse
  >({
    service: curriculumDynamicEndpoints.getCurriculumById(curriculumId),
    options: {
      enabled: !!curriculumId,
    },
  });

  // Map API response to SubjectDetail format
  const curriculumList: SubjectDetail[] = useMemo(() => {
    // Handle both response structures: curriculum.subjects (actual API) or subjects at root (interface)
    // Type assertion needed because curriculum.subjects is typed as CurriculumSubject[] but actually returns SubjectResponse[]
    const curriculumSubjects = curriculumDetailData?.curriculum?.subjects
      ? (curriculumDetailData.curriculum.subjects as unknown as SubjectResponse[])
      : undefined;
    const subjects = curriculumSubjects || curriculumDetailData?.subjects || [];
    const curriculumUpdatedAt = curriculumDetailData?.curriculum?.updatedAt;

    return subjects.map(
      (
        subject: SubjectResponse & {
          teachers?: Array<{ id: number; name: string }>;
          milestoneCount?: number;
          assessmentCount?: number;
        },
      ) => {
        // Use curriculum's updatedAt since subjects don't have updatedAt in the response
        const lastUpdated = curriculumUpdatedAt
          ? new Date(curriculumUpdatedAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          : "N/A";

        // Get assigned teacher name - handle both array format and single object
        // Also handle 'teachers' field which exists in actual API response but not in type definition
        let assignedTeacher = "N/A";
        if (
          subject.assignedTeachers &&
          Array.isArray(subject.assignedTeachers) &&
          subject.assignedTeachers.length > 0
        ) {
          const teacher = subject.assignedTeachers[0];
          assignedTeacher =
            typeof teacher === "object" && "name" in teacher && teacher.name ? teacher.name : "N/A";
        } else if (
          subject.teachers &&
          Array.isArray(subject.teachers) &&
          subject.teachers.length > 0
        ) {
          // Handle alternative field name from API (teachers field exists in actual response)
          const teacher = subject.teachers[0];
          assignedTeacher =
            typeof teacher === "object" && "name" in teacher && teacher.name ? teacher.name : "N/A";
        }

        // Use milestoneCount and assessmentCount from API if available, otherwise default to 0
        const milestones = subject.milestoneCount ?? 0;
        const assessments = subject.assessmentCount ?? 0;

        // Default status (not in API response)
        const status = "Active"; // Defaulting to Active

        return {
          id: subject.id,
          subject: subject.name,
          assignedTeacher,
          milestones,
          assessments,
          lastUpdated,
          status,
        };
      },
    );
  }, [curriculumDetailData]);

  const filteredCurriculum = selectedClassroom ? curriculumList : curriculumList;

  // ======== Helper function to render row actions ========
  const renderRowActions = (subject: SubjectDetail) => (
    <SubjectRowActions
      onView={() =>
        router.push(
          routes.curriculumSubject
            .replace(":curriculumId", String(curriculumId))
            .replace(":subjectId", String(subject.id)),
        )
      }
      onAddMilestone={() =>
        router.push(
          routes.curriculumSubjectAddMilestone
            .replace(":curriculumId", String(curriculumId))
            .replace(":subjectId", String(subject.id)),
        )
      }
      onAddAssessment={() =>
        router.push(
          routes.curriculumSubjectAddAssessment
            .replace(":curriculumId", String(curriculumId))
            .replace(":subjectId", String(subject.id)),
        )
      }
      onDelete={() => {
        setSelectedSubjectForDelete(subject);
        setDeleteModal(true);
      }}
    />
  );

  const rows = filteredCurriculum.map((subject) => ({
    0: subject.subject,
    1: subject.assignedTeacher,
    2: subject.milestones,
    3: subject.assessments,
    4: subject.lastUpdated,
    5: renderRowActions(subject),
  }));

  // Client-side pagination for subjects (since API doesn't paginate subjects)
  const currentPage = Math.floor((filters?.pos || 0) / (filters?.delta || ITEMS_PER_PAGE)) + 1;
  const rowsPerPage = filters?.delta || ITEMS_PER_PAGE;
  const paginatedData = rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalItems = filteredCurriculum.length;

  const handleDeleteSubject = () => {
    if (selectedSubjectForDelete) {
      showToast({
        message: "Subject Deleted",
        description: `${selectedSubjectForDelete.subject} has been removed from the curriculum`,
        severity: "success",
        duration: 4000,
      });
      setDeleteModal(false);
      setSelectedSubjectForDelete(null);
    }
  };

  return {
    selectedFilter,
    setSelectedFilter,
    curriculumList,
    gradeAnchorEl,
    setGradeAnchorEl,
    statusAnchorEl,
    setStatusAnchorEl,
    filters,
    applyFilters,
    paginatedData,
    totalItems,
    rowsPerPage,
    currentPage,
    deleteModal,
    archiveModal,
    setArchiveModal,
    setDeleteModal,
    selectedSubjectForDelete,
    setSelectedSubjectForDelete,
    handleDeleteSubject,
    isLoading: isLoadingCurriculum,
  };
};

export default useCurriculumDetail;
