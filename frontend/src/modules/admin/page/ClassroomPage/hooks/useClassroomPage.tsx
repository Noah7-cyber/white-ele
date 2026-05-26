/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ITEMS_PER_PAGE } from "@/constants";
import ClassroomRowActions from "@/modules/admin/component/ClassroomRowActions";
import { showToast } from "@/modules/shared/component/Toast";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { classroomDynamicEndpoints, classroomServices } from "@/services/classroom.service";

import { useFilter } from "@/utils/hooks/useFilter";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";

import { ChangeEvent, useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { useRouter } from "next/navigation";
import { useDebouncer } from "@/utils/hooks/useDebouncer";
import { usePermissionGuide } from "@/utils/hooks/usePermissionGuide";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-red-50 text-red-600",
};

const useClassroomPage = () => {
  const router = useRouter();

  const { filters, applyFilters } = useFilter({
    search: "",
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });

  const [selectedClassroomIdx, setSelectedClassroomIdx] = useState<number | null>(null);
  const [selectedClassroomStatus, setSelectedClassroomStatus] = useState<"active" | "inactive">(
    "active",
  );
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const { debouncedSearch, setSearch } = useDebouncer();
  const { hasPermission, ensurePermission } = usePermissionGuide({ enabled: true });

  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
  };

  const {
    data: { classrooms: classroomList = [], pagination = {} } = {} as any,
    isLoading,
    refetch,
  } = useQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
      data: {
        ...(filters?.search ? { search: filters?.search } : {}),
        sortBy: "level",
        sortOrder: "ASC",
        ...(filters?.delta ? { delta: filters?.delta } : {}),
        ...(filters?.pos ? { pos: filters?.pos } : {}),
        search: debouncedSearch,
      },
    },
  });

  const { mutateAsync: getClassrooms } = useMutationService({
    service: classroomServices.getAllClassrooms,
    options: {
      disableToast: true,
    },
  });

  const [allClassrooms, setAllClassrooms] = useState<any[]>([]);

  const fetchAllClassroomsMetrics = useCallback(async () => {
    try {
      const DELTA = 100;
      let merged: any[] = [];
      const firstRes: any = await getClassrooms({
        delta: DELTA,
        pos: 0,
        sortBy: "level",
        sortOrder: "ASC",
      });
      const firstList = firstRes?.classrooms || firstRes?.data || [];
      const totalCount = firstRes?.pagination?.count || firstList.length;
      if (Array.isArray(firstList)) merged = [...firstList];
      if (totalCount > DELTA) {
        const totalPages = Math.ceil(totalCount / DELTA);
        const promises = [];
        for (let page = 2; page <= totalPages; page++) {
          promises.push(
            getClassrooms({
              delta: DELTA,
              pos: (page - 1) * DELTA,
              sortBy: "level",
              sortOrder: "ASC",
            }),
          );
        }
        const pages = await Promise.all(promises);
        pages.forEach((res: any) => {
          const list = res?.classrooms || res?.data || [];
          if (Array.isArray(list)) merged = [...merged, ...list];
        });
      }
      setAllClassrooms(merged);
    } catch {
      setAllClassrooms([]);
    }
  }, [getClassrooms]);

  useEffect(() => {
    fetchAllClassroomsMetrics();
  }, [fetchAllClassroomsMetrics]);

  /** ---- DELETE ---- */
  const { mutateAsync: deleteClassroomAsync } = useMutationService({
    service: classroomDynamicEndpoints.deleteClassroom(selectedClassroomIdx!),
  });

  const { mutateAsync: changeClassroomStatusAsync } = useMutationService({
    service: classroomDynamicEndpoints.changeClassroomStatus(selectedClassroomIdx!),
  });

  const handleDelete = async () => {
    if (!selectedClassroomIdx) return;
    if (!ensurePermission("classroom", "delete")) return;

    try {
      await deleteClassroomAsync({});
      showToast({
        message: "Classroom Deleted",
        description: "The classroom has been successfully deleted.",
        severity: "success",
        duration: 3000,
      });
      setDeleteModalOpen(false);
      refetch();
      fetchAllClassroomsMetrics();
    } catch (error: any) {
      showToast({
        message: "Error",
        description: error?.response?.data?.message || "Unable to delete classroom.",
        severity: "error",
        duration: 3000,
      });
    }
  };

  /** ---- STATUS TOGGLE ---- */
  const handleDeactivate = async () => {
    if (!selectedClassroomIdx) return;
    if (!ensurePermission("classroom", "update")) return;

    try {
      const nextStatus = selectedClassroomStatus === "inactive" ? "active" : "inactive";
      await changeClassroomStatusAsync({ status: nextStatus, classroomStatus: nextStatus });
      showToast({
        message:
          nextStatus === "active" ? "Classroom Activated" : "Classroom Deactivated",
        description:
          nextStatus === "active"
            ? "The classroom has been successfully activated."
            : "The classroom has been successfully deactivated.",
        severity: "success",
        duration: 3000,
      });
      setDeactivateModalOpen(false);
      refetch();
      fetchAllClassroomsMetrics();
    } catch (error: any) {
      showToast({
        message: "Error",
        description: error?.response?.data?.message || "Unable to deactivate classroom.",
        severity: "error",
        duration: 3000,
      });
    }
  };

  /** ---- ROW ACTIONS ---- */
  const renderRowActions = (classroom: any) => (
    <ClassroomRowActions
      onView={() => router.push(`${DashboardRoutes.classRooms}/${classroom.id}`)}
      onEdit={
        hasPermission("classroom", "update")
          ? () => {
              if (!ensurePermission("classroom", "update")) return;
              router.push(`${DashboardRoutes.classRooms}/${classroom.id}/edit`);
            }
          : undefined
      }
      onManageStudents={() => console.log("manage students for", classroom.id)}
      onManageStaffs={() => console.log("manage staffs for", classroom.id)}
      onToggleStatus={
        hasPermission("classroom", "update")
          ? () => {
              if (!ensurePermission("classroom", "update")) return;
              setSelectedClassroomIdx(classroom.id);
              setSelectedClassroomStatus(
                String(classroom?.status || classroom?.classroomStatus).toLowerCase() === "inactive"
                  ? "inactive"
                  : "active",
              );
              setDeactivateModalOpen(true);
            }
          : undefined
      }
      statusActionLabel={
        String(classroom?.status || classroom?.classroomStatus).toLowerCase() === "inactive"
          ? "Activate"
          : "Deactivate"
      }
      onDelete={
        hasPermission("classroom", "delete")
          ? () => {
              if (!ensurePermission("classroom", "delete")) return;
              setSelectedClassroomIdx(classroom.id);
              setDeleteModalOpen(true);
            }
          : undefined
      }
    />
  );
  /** ---- METRICS FOR INSIGHT CARDS ---- */
  const metricsSource = (allClassrooms.length ? allClassrooms : classroomList) as any[];

  const activeClassroomCount = metricsSource.filter(
    (classroom: any) => classroom?.status === "active" || classroom?.classroomStatus === "active",
  ).length;

  const totalEnrolled = metricsSource.reduce((sum: number, classroom: any) => {
    const count = Array.isArray(classroom.studentsCurrentClass)
      ? classroom.studentsCurrentClass.length
      : 0;
    return sum + count;
  }, 0);

  const totalCapacity = metricsSource.reduce((sum: number, classroom: any) => {
    const capacity = Number(classroom.maximumCapacity || 0);
    return sum + (Number.isNaN(capacity) ? 0 : capacity);
  }, 0);

  const uniqueStaffIds = new Set<number>();
  metricsSource.forEach((classroom: any) => {
    if (Array.isArray(classroom.assignedStaff)) {
      classroom.assignedStaff.forEach((staff: any) => {
        const id = typeof staff === "number" ? staff : staff?.id;
        if (typeof id === "number") uniqueStaffIds.add(id);
      });
    }
  });
  const totalStaff = uniqueStaffIds.size;

  /** ---- MAP TABLE DATA (NO client pagination) ---- */
  const ClassroomList = classroomList?.map((classroom: any) => ({
    0: classroom.classroomName,
    1: `${classroom.minimumAge} - ${classroom.maximumAge} years`,
    2: classroom.maximumCapacity,
    3: Array.isArray(classroom.studentsCurrentClass) ? classroom.studentsCurrentClass.length : 0,
    4: (
      <Box
        sx={{
          // maxWidth: 160,
          // width: "100%",
          // whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "flex",
          alignItems: "center",
          justifyContent: "start",
        }}
        className="w-ful"
      >
        <span className="truncate max-w-[180px] block w-full text-start">
          {Array.isArray(classroom?.assignedStaff) && classroom.assignedStaff.length > 0
            ? classroom.assignedStaff
              .map((staff: any) =>
                staff?.user
                  ? `${staff.user.firstName} ${staff.user.lastName}`
                  : staff?.firstName && staff?.lastName
                    ? `${staff.firstName} ${staff.lastName}`
                    : "",
              )
              .filter(Boolean)
              .join(", ")
            : "None"}
        </span>
      </Box>
    ),
    5: (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES?.[classroom?.status || classroom?.classroomStatus || "active"]}`}
      >
        {String(classroom?.status || classroom?.classroomStatus || "active")}
      </span>
    ),
    6: renderRowActions(classroom),
  }));

  /** ---- CURRENT PAGE (SAME AS TEACHERS) ---- */
  const currentPage =
    Math.floor((pagination?.pos || 0) / (pagination?.delta || ITEMS_PER_PAGE)) + 1;

  const classroomIds = (classroomList || []).map((c: any) => c?.id);
  const mobileClassroomData = (classroomList || []).map((classroom: any) => {
    const teachers =
      Array.isArray(classroom?.assignedStaff) && classroom.assignedStaff.length > 0
        ? classroom.assignedStaff
          .map((staff: any) =>
            staff?.user
              ? `${staff.user.firstName} ${staff.user.lastName}`
              : staff?.firstName && staff?.lastName
                ? `${staff.firstName} ${staff.lastName}`
                : "",
          )
          .filter(Boolean)
          .join(", ")
        : "None";

    return {
      id: classroom?.id,
      className: classroom?.classroomName || "N/A",
      teachers,
      status: String(classroom?.status || classroom?.classroomStatus || "N/A"),
    };
  });

  return {
    filters,
    applyFilters,
    pagination,
    ClassroomList,
    mobileClassroomData,
    classroomIds,
    currentPage,
    isLoading,
    activeClassroomCount,
    totalEnrolled,
    totalCapacity,
    totalStaff,
    deactivateModalOpen,
    deleteModalOpen,
    setDeactivateModalOpen,
    setDeleteModalOpen,
    handleSearch,
    handleDeactivate,
    handleDelete,
    selectedClassroomStatus,
    canCreateClassroom: hasPermission("classroom", "create"),
  };
};

export default useClassroomPage;
