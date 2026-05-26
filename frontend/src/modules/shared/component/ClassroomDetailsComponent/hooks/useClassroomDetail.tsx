/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import {
  classroomDynamicEndpoints,
  classroomServices,
  GetAllClassroomsResponse,
  GetClassroomByIdResponse,
} from "@/services/classroom.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { ApiMethods } from "@/utils/client";
import { childServices, Student } from "@/services/child.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useUser } from "@/utils/hooks/useUser";
import { ITEMS_PER_PAGE } from "@/constants";
import { useFilter } from "@/utils/hooks/useFilter";
import { Typography } from "@mui/material";
import { useDebouncer } from "@/utils/hooks/useDebouncer";
import { showToast } from "../../Toast";
import InitialsAvatar from "../../InitialsAvatar/InitialsAvatar";

export interface AssignedClassroom {
  id: number;
  classroomName: string;
}

export const useClassroomDetail = (
  classId: string | undefined,
  role: "admin" | "staff" = "admin",
) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classroomData, setClassroomData] = useState<GetClassroomByIdResponse["classroom"] | null>(
    null,
  );
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | undefined>(
    classId || (role === "staff" ? "all" : undefined),
  );
  const { debouncedSearch, setSearch } = useDebouncer();

  // Staff-only: assigned classrooms and teacher (staff) ID from profile (useUser)
  const { staffClassesAndSubject, staffId } = useUser();
  // Pagination filters
  const { filters, applyFilters } = useFilter({
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });

  const { data: staffClassroomsResponse, isLoading: isClassroomsLoading } = useQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
      data: {
        ...(role === "staff" && staffId != null ? { staffId } : {}),
        search: debouncedSearch,
        ...(filters?.delta ? { delta: filters?.delta } : {}),
        ...(filters?.pos ? { pos: filters?.pos } : {}),
      },
    },
    options: {
      enabled: true,
    },
  });

  const classrooms = staffClassroomsResponse?.classrooms || [];

  const assignedClassrooms = useMemo((): AssignedClassroom[] => {
    if (role !== "staff") return [];
    const apiClassrooms =
      staffClassroomsResponse?.data ??
      staffClassroomsResponse?.classrooms ??
      (staffClassroomsResponse as any)?.classrooms ??
      [];
    if (Array.isArray(apiClassrooms) && apiClassrooms.length > 0) {
      return apiClassrooms.map((c: any) => ({
        id: c.id,
        classroomName: c.classroomName ?? c.name ?? "Classroom",
      }));
    }
    if (!staffClassesAndSubject?.length) return [];
    return staffClassesAndSubject
      .filter((item) => item.classroom)
      .map((item) => ({
        id: item.classroom.id,
        classroomName: item.classroom.classroomName,
      }));
  }, [role, staffClassesAndSubject, staffClassroomsResponse]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
  };

  // Sync selectedClassroomId for staff: use classId from URL or "all"
  useEffect(() => {
    if (role !== "staff") return;
    if (classId) {
      setSelectedClassroomId(classId);
    } else {
      setSelectedClassroomId("all");
    }
  }, [role, classId]);


  // Use selectedClassroomId for fetching (for staff) or classId (for admin)
  const activeClassId = role === "staff" ? selectedClassroomId : classId;
  const isAllClassrooms = activeClassId === "all";

  // Reset pagination when classroom changes
  useEffect(() => {
    if (activeClassId) {
      applyFilters({
        delta: ITEMS_PER_PAGE,
        pos: 0,
      });
    }
  }, [activeClassId]);

  // Memoize the service to recreate it when activeClassId changes
  const classroomService = useMemo(() => {
    if (!activeClassId || isAllClassrooms) return null;
    return classroomDynamicEndpoints.getClassroomById(activeClassId);
  }, [activeClassId, isAllClassrooms]);

  const { mutateAsync: getClassroomById, isPending } = useMutationService<
    any,
    GetClassroomByIdResponse
  >({
    service: classroomService || { path: "", method: ApiMethods.GET },
    options: { disableToast: true },
  });
  const { mutateAsync: changeClassroomStatusAsync, isPending: isChangingStatus } = useMutationService({
    service:
      activeClassId != null
        ? classroomDynamicEndpoints.changeClassroomStatus(activeClassId)
        : { path: "", method: ApiMethods.PUT },
    options: { disableToast: true },
  });
  const { mutateAsync: deleteClassroomAsync, isPending: isDeletingClassroom } = useMutationService({
    service:
      activeClassId != null
        ? classroomDynamicEndpoints.deleteClassroom(activeClassId)
        : { path: "", method: ApiMethods.DELETE },
    options: { disableToast: true },
  });

  useEffect(() => {
    if (!activeClassId || !classroomService) return;

    const fetchClassroom = async () => {
      setLoading(true);
      try {
        const res = await getClassroomById({});
        if (res.classroom) {
          setClassroomData(res.classroom);
        }
      } catch (error) {
        console.error("Failed to fetch classroom:", error);
        setClassroomData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchClassroom();
  }, [activeClassId, classroomService]);

  // Compute stats
  const stats = useMemo(() => {
    let totalStudents = 0;
    let numStaff = 0;
    let maxCapacity = 0;

    if (activeClassId && !isAllClassrooms) {
      // Single classroom mode
      totalStudents = classroomData?.studentsCurrentClass?.length || 0;
      maxCapacity = Number(classroomData?.maximumCapacity ?? 0);
      numStaff = Array.isArray(classroomData?.assignedStaff) ? classroomData?.assignedStaff.length : 0;
    } else {
      // All classrooms mode - aggregate from classrooms list
      classrooms.forEach((room: any) => {
        totalStudents += room?.studentsCurrentClass?.length || 0;
        maxCapacity += Number(room?.maximumCapacity ?? 0);
        numStaff += Array.isArray(room?.assignedStaff) ? room?.assignedStaff.length : 0;
      });
    }

    let staffChildRatio = "N/A";
    if (numStaff > 0) {
      const getGcd = (a: number, b: number): number => (b === 0 ? a : getGcd(b, a % b));
      const gcd = getGcd(numStaff, totalStudents);
      staffChildRatio = `${numStaff / gcd}:${totalStudents / gcd}`;
    }
    const enrollment = maxCapacity > 0 ? `${totalStudents}/${maxCapacity}` : "N/A";

    return { staffChildRatio, enrollment, numStaff, totalStudents };
  }, [classroomData, classrooms, activeClassId, isAllClassrooms]);

  const handleDeactivate = async () => {
    if (!activeClassId) return;
    try {
      await changeClassroomStatusAsync({ status: classroomData?.classroomStatus === "active" ? "inactive" : "active", classroomStatus: classroomData?.classroomStatus === "active" ? "inactive" : "active" });
      showToast({
        message: classroomData?.classroomStatus === "active" ? "Classroom activated" : "Classroom deactivated",
        description: classroomData?.classroomStatus === "active" ? "The classroom has been successfully activated." : "The classroom has been successfully deactivated.",
        severity: "success",
        duration: 3000,
      });
      setDeactivateModalOpen(false);
      router.push(DashboardRoutes.classRooms);
    } catch (error: any) {
      showToast({
        message: "Unable to deactivate classroom",
        description: error?.response?.data?.message || "Please try again.",
        severity: "error",
        duration: 3000,
      });
    }
  };

  const handleDelete = async () => {
    if (!activeClassId) return;
    try {
      await deleteClassroomAsync({});
      showToast({
        message: "Classroom deleted",
        description: "The classroom has been successfully deleted.",
        severity: "success",
        duration: 3000,
      });
      setDeleteModalOpen(false);
      router.push(DashboardRoutes.classRooms);
    } catch (error: any) {
      showToast({
        message: "Unable to delete classroom",
        description: error?.response?.data?.message || "Please try again.",
        severity: "error",
        duration: 3000,
      });
    }
  };

  // Pagination calculations
  const classroomPagination = staffClassroomsResponse?.pagination || {};
  const totalItems = classroomPagination?.count || classrooms.length;
  const posVal = Number(filters?.pos ?? classroomPagination?.pos ?? 0) || 0;
  const deltaVal =
    Number(filters?.delta ?? classroomPagination?.delta ?? ITEMS_PER_PAGE) || ITEMS_PER_PAGE;
  const currentPage = Math.floor(posVal / deltaVal) + 1;
  const totalPages = Math.ceil(totalItems / deltaVal) || 1;

  // Handle page change
  const handlePageChange = ({ page, rowsPerPage }: { page: number; rowsPerPage: number }) => {
    applyFilters({
      ...filters,
      delta: rowsPerPage,
      pos: (page - 1) * rowsPerPage,
    });
  };

  return {
    classroomData,
    classrooms,
    loading,
    deactivateModalOpen,
    setDeactivateModalOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    handleDeactivate,
    handleDelete,
    stats,
    isLoading: isPending || isClassroomsLoading || isChangingStatus || isDeletingClassroom,
    assignedClassrooms,
    selectedClassroomId,
    setSelectedClassroomId,
    // Pagination
    currentPage,
    totalItems,
    totalPages,
    rowsPerPage: deltaVal,
    handlePageChange,
    handleSearch,
  };
};
