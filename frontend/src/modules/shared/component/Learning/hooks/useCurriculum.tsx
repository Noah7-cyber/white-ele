/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";

import CurriculumRowActions from "@/modules/shared/component/Learning/CurriculumRowActions/curriculumRowActions";
import { showToast } from "@/modules/shared/component/Toast";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { StaffRoutes } from "@/routes/staff.routes";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useQueryService } from "@/utils/hooks/useQueryService";
import {
  curriculumServices,
  GetAllCurriculumsResponse,
  Curriculum,
  curriculumDynamicEndpoints,
} from "@/services/curriculum.service";
import { classroomServices } from "@/services/classroom.service";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";
import { useMutationService } from "@/utils/hooks/useMutationService";

const gradeOptions = [
  { label: "All Classrooms", value: "All Classrooms" },
  { label: "Pre K", value: "Pre K" },
  { label: "Grade 1", value: "Grade 1" },
  { label: "Grade 2", value: "Grade 2" },
  { label: "Grade 3", value: "Grade 3" },
];

const statusOptions = [
  { label: "All Status", value: "All Status" },
  { label: "Pass", value: "Pass" },
  { label: "Failed", value: "Failed" },
];

interface CurriculumItem {
  id: string;
  subject: string;
  classes: string;
  name: string;
  subjects: number;
  lastUpdated: string;
  status: string;
}

const useCurriculum = (role: "admin" | "staff" = "admin") => {
  const routes = role === "admin" ? DashboardRoutes : (StaffRoutes as any);
  const [selectedFilter, setSelectedFilter] = useState<string>("Filter");
  const [gradeAnchorEl, setGradeAnchorEl] = useState<HTMLElement | null>(null);
  const [statusAnchorEl, setStatusAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState(gradeOptions?.[0].label);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(statusOptions?.[0].label);
  const router = useRouter();
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [archiveModal, setArchiveModal] = useState(false);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null);

  const { filters, applyFilters } = useFilter({
    search: "",
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });

  // Fetch curriculums with pagination
  const {
    data: curriculumData,
    isLoading: isLoadingCurriculums,
    refetch,
  } = useQueryService<Record<string, never>, GetAllCurriculumsResponse>({
    service: {
      ...curriculumServices.getAllCurriculums,
      data: {
        ...(filters?.search ? { search: filters.search } : {}),
        ...(filters?.delta ? { delta: filters.delta } : {}),
        ...(filters?.pos ? { pos: filters.pos } : {}),
      },
    },
  });

  // Fetch classrooms for mapping class IDs to names
  const { data: classroomData } = useQueryService<
    Record<string, never>,
    { classrooms?: Array<{ id: number; classroomName: string }>; pagination: PaginationData }
  >({
    service: {
      ...classroomServices.getAllClassrooms,
      data: {
        delta: 100,
        status: "active",
      },
    },
  });

  // Map API response to CurriculumItem format
  const curriculumList: CurriculumItem[] = useMemo(() => {
    const curriculums = curriculumData?.curriculums || [];

    const classrooms = classroomData?.classrooms || [];

    const classroomMap = new Map(classrooms.map((c) => [c.id, c.classroomName]));

    return curriculums.map((curriculum: Curriculum) => {
      // Format date
      const lastUpdated = curriculum.updatedAt
        ? new Date(curriculum.updatedAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        : "N/A";

      // Get class names from classIds
      const classNames =
        curriculum.classIds?.map((id) => classroomMap.get(id) || `Class ${id}`).join(", ") || "N/A";

      // Get creator name
      const creatorName = curriculum.creator ? "N/A" : `N/A`;
      // `${curriculum.creator.firstName} ${curriculum.creator.lastName}`.trim()
      // Determine status (default to active if not provided)
      const status = curriculum.status || "active";
      // If curriculum.subjects exists, get the first teacher's name for display
      const assignedStaff = "N/A";
      // If CurriculumSubject does not have 'teacher', assignedStaff remains "N/A"
      // You may update this block if CurriculumSubject has another property for staff/teacher
      // Example: if (firstSubject.staffName) { assignedStaff = firstSubject.staffName; }

      return {
        id: String(curriculum.id),
        subject: curriculum.title || "Untitled",
        classes: classNames,
        name: creatorName,
        subjects: curriculum.subjectCount || 0,
        lastUpdated,
        status: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
        assignedStaff,
      };
    });
  }, [curriculumData, classroomData]);

  const { mutateAsync: deactivateCurriculumAsync, isPending: isDeactivatingCurriculum } =
    useMutationService({
      service: curriculumDynamicEndpoints.deleteCurriculum(selectedCurriculumId!), // /staff/:id  DELETE
    });

  // Filter by classroom if selected (client-side filtering for display)
  const filteredCurriculum = useMemo(() => {
    if (selectedClassroom) {
      return curriculumList.filter((item: CurriculumItem) => item.classes === selectedClassroom);
    }
    return curriculumList;
  }, [curriculumList, selectedClassroom]);

  const getStatusBadge = (status: string) => {
    const base =
      "px-4 py-[3px] !max-w-[100px] text-xs font-medium rounded-full !w-full text-center";
    switch (status.toLowerCase()) {
      case "archived":
        return (
          <span className={`${base} !bg-badge-blue/15 w-full !text-badge-blue`}>Archived</span>
        );
      case "active":
        return <span className={`${base} bg-success-green/15 text-success-green`}>Active</span>;
      case "draft":
        return <span className={`${base} bg-badge-red/15 w-full text-badge-red`}>Draft</span>;
      default:
        return status;
    }
  };

  const handleDeactivate = async () => {
    if (!selectedCurriculumId) return;

    try {
      await deactivateCurriculumAsync({});

      showToast({
        message: "Curriculum Deactivated",
        description: "The curriculum has been successfully suspended.",
        severity: "success",
        duration: 3000,
      });

      setDeleteModal(false);

      refetch();
    } catch (error: any) {
      showToast({
        message: "Error",
        description: error?.response?.data?.message || "Unable to deactivate curriculum.",
        severity: "error",
        duration: 3000,
      });
    }
  };

  const renderRowActions = (curriculum: CurriculumItem) => {
    return (
      <CurriculumRowActions
        status={curriculum.status.toLowerCase() as "active" | "draft" | "archived"}
        onView={() => {
          router.push(`${routes.viewCurriculum.replace(":id", curriculum.id)}`);
        }}
        onEdit={() => {
          router.push(`${routes.editCurriculum.replace(":id", curriculum.id)}`);
        }}
        onPublish={() => {
          showToast({
            message: "Curriculum Published",
            description: "The curriculum has been successfully published.",
            severity: "success",
            duration: 3000,
          });
        }}
        onRestore={() => {
          showToast({
            message: "Curriculum Restored",
            description: "The curriculum has been successfully restored.",
            severity: "success",
            duration: 3000,
          });
        }}
        onArchive={() => {
          setSelectedCurriculumId(curriculum.id);
          setArchiveModal(true);
        }}
        onDuplicate={() => {
          showToast({
            message: "Curriculum Duplicated",
            description: "The curriculum has been successfully duplicated.",
            severity: "success",
            duration: 3000,
          });
        }}
        onDelete={() => {
          setSelectedCurriculumId(curriculum.id);
          setDeleteModal(true);
        }}
      />
    );
  };

  const rows = filteredCurriculum.map((curriculum: CurriculumItem) => ({
    0: curriculum.subject,
    1: curriculum.classes,
    2: curriculum.name,
    3: curriculum.subjects,
    4: curriculum.lastUpdated,
    5: getStatusBadge(curriculum.status),
    6: renderRowActions(curriculum),
  }));
  const [gradeFilters, setGradeFilters] = useState(
    gradeOptions.map((opt, index) => ({
      ...opt,
      isActive: index === 0,
    })),
  );
  const [statusFilters, setStatusFilters] = useState(
    statusOptions.map((opt, index) => ({
      ...opt,
      isActive: index === 0,
    })),
  );

  const handleOpenGradeFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setGradeAnchorEl(event.currentTarget);
  };
  const handleOpenStatusFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setStatusAnchorEl(event.currentTarget);
  };

  const classrooms = useMemo(
    () => Array.from(new Set(curriculumList.map((item) => item.classes))).sort(),
    [curriculumList],
  );

  // Get pagination info from API
  const pagination = (curriculumData?.pagination || {}) as PaginationData;
  const currentPage =
    Math.floor((pagination?.pos || 0) / (pagination?.delta || ITEMS_PER_PAGE)) + 1;

  return {
    selectedFilter,
    setSelectedFilter,
    curriculumList: filteredCurriculum,
    classrooms,
    gradeAnchorEl,
    setGradeAnchorEl,
    gradeFilters,
    statusFilters,
    setStatusFilters,
    setGradeFilters,
    handleOpenGradeFilter,
    selectedGradeFilter,
    setSelectedGradeFilter,
    statusAnchorEl,
    setStatusAnchorEl,
    selectedStatusFilter,
    setSelectedStatusFilter,
    handleOpenStatusFilter,
    filters,
    applyFilters,
    paginatedData: rows,
    totalItems: pagination?.count || 0,
    rowsPerPage: filters?.delta || ITEMS_PER_PAGE,
    currentPage,
    deleteModal,
    archiveModal,
    setArchiveModal,
    setDeleteModal,
    isLoading: isLoadingCurriculums,
    pagination,
    refetch,
    handleDeactivate,
  };
};

export default useCurriculum;
