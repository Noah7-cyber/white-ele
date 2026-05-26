/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import TeacherRowActions from "@/modules/admin/component/TeacherRowActions/teacherRowActions";
import { DashboardRoutes } from "@/routes/dashboard.routes";

import { showToast } from "@/modules/shared/component/Toast";
import { teacherDynamicEndpoints, teacherServices } from "@/services/teacher.service";
import { ITEMS_PER_PAGE } from "@/constants";
import Box from "@mui/material/Box";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useFilter } from "@/utils/hooks/useFilter";
import { classroomServices } from "@/services/classroom.service";
import { useDebouncer } from "@/utils/hooks/useDebouncer";
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";
import { usePermissionGuide } from "@/utils/hooks/usePermissionGuide";

const useTeachersPage = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>("Filter");
  const { filters, applyFilters } = useFilter({
    search: "",
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });
  const router = useRouter();
  const [selectedTeacherIdx, setSelectedTeacherIdx] = useState<number | null>(null);
  const [selectedTeacherStatus, setSelectedTeacherStatus] = useState<string>("");
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const { debouncedSearch, setSearch } = useDebouncer();
  const { hasPermission, ensurePermission } = usePermissionGuide({ enabled: true });

  const { mutateAsync: getAllClassrooms } = useMutationService({
    service: classroomServices.getAllClassrooms,
    options: {
      disableToast: true,
    },
  });

  const {
    data: { staff: allTeacherList = [], pagination = {} } = {} as any,
    isLoading,
    refetch,
  } = useQueryService<any, any>({
    service: {
      ...teacherServices.getAllTeachers,
      data: {
        ...(filters?.search ? { search: filters?.search } : {}),
        ...(filters?.delta ? { delta: filters?.delta } : {}),
        ...(filters?.pos ? { pos: filters?.pos } : {}),
        search: debouncedSearch,
        sortBy: "firstName",
      },
    },
  });

  const STATUS_CONSTANT: Record<string, { chip: string }> = {
    active: {
      chip: "bg-green-100 text-green-700",
    },
    inactive: {
      chip: "bg-[#CF000B]/10 text-[#CF000B]",
    },
    suspended: {
      chip: "bg-[#FFF6DD] text-[#A88400]",
    },
  };

  const getStatusConfig = (status: string) =>
    STATUS_CONSTANT[status?.toLowerCase()] ?? { chip: "bg-gray-100 text-gray-700" };

  const { mutateAsync: deactivateTeacherAsync, isPending: isDeactivatingTeacher } =
    useMutationService({
      service: teacherDynamicEndpoints.changeTeacherStatus(selectedTeacherIdx!),
      options: {
        disableToast: true,
      }, // /staff/:id  DELETE
    });
  const { mutateAsync: deleteTeacherAsync, isPending: isDeletingTeacher } = useMutationService({
    service: teacherDynamicEndpoints.deleteTeacher(selectedTeacherIdx!), // /staff/:id  DELETE
  });
  const { mutateAsync: resendTeacherInviteAsync } = useMutationService<{ id: number }>({
    service: (variables) => teacherDynamicEndpoints.resendTeacherInvite(variables.id),
    options: {
      disableToast: true,
    },
  });

  /** ---- METRICS SOURCE: FETCH ALL TEACHERS (no pagination, for cards) ---- */
  const { mutateAsync: getAllTeachers } = useMutationService({
    service: teacherServices.getAllTeachers,
    options: {
      disableToast: true,
    },
  });

  const [allTeachers, setAllTeachers] = useState<any[]>([]);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await getAllClassrooms({
          delta: 100,
          pos: 0,
          sortBy: "createdAt",
          sortOrder: "ASC",
        });
        const data = res as { classrooms?: any[]; data?: any[] };
        setClassrooms(data.classrooms || data.data || []);
      } catch {
        setClassrooms([]);
      }
    };
    fetchClassrooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build a map of classroomId -> classroomName
  const classroomMap = useMemo(() => {
    const map = new Map<number, string>();
    (classrooms || []).forEach((c: any) => {
      if (c?.id != null && c.classroomName) {
        map.set(c.id, c.classroomName);
      }
    });
    return map;
  }, [classrooms]);

  const fetchAllTeachersMetrics = useCallback(async () => {
    try {
      const DELTA = 100;
      let allTeachersList: any[] = [];
      let pos = 0;
      let totalCount = 0;
      const firstPageRes: any = await getAllTeachers({ delta: DELTA, pos: 0 });
      const firstPageList = firstPageRes?.staff || firstPageRes?.data || [];
      const paginationInfo = firstPageRes?.pagination || {};
      totalCount = paginationInfo?.count || firstPageList.length;
      if (Array.isArray(firstPageList)) allTeachersList = [...firstPageList];
      if (totalCount > DELTA) {
        const totalPages = Math.ceil(totalCount / DELTA);
        const remainingPagePromises = [];
        for (let page = 2; page <= totalPages; page++) {
          pos = (page - 1) * DELTA;
          remainingPagePromises.push(getAllTeachers({ delta: DELTA, pos }));
        }
        const remainingPages = await Promise.all(remainingPagePromises);
        remainingPages.forEach((res: any) => {
          const list = res?.staff || res?.data || [];
          if (Array.isArray(list)) allTeachersList = [...allTeachersList, ...list];
        });
      }
      setAllTeachers(allTeachersList);
    } catch {
      setAllTeachers([]);
    }
  }, [getAllTeachers]);

  useEffect(() => {
    fetchAllTeachersMetrics();
  }, [fetchAllTeachersMetrics]);

  const handleDeactivate = async () => {
    if (!selectedTeacherIdx) return;
    if (!ensurePermission("staff", "update")) return;
    const normalizedStatus = String(selectedTeacherStatus || "").toLowerCase();
    const nextStatus = normalizedStatus === "active" ? "suspended" : "active";

    try {
      await deactivateTeacherAsync({ status: nextStatus });

      showToast({
        message: nextStatus === "active" ? "Teacher Activated" : "Teacher Deactivated",
        description:
          nextStatus === "active"
            ? "The teacher has been successfully activated."
            : "The teacher has been successfully suspended.",
        severity: "success",
        duration: 3000,
      });

      setDeactivateModalOpen(false);

      refetch();
      fetchAllTeachersMetrics();
    } catch (error: any) {
      showToast({
        message: "Error",
        description: error?.response?.data?.message || "Unable to deactivate teacher.",
        severity: "error",
        duration: 3000,
      });
    }
  };

  const renderRowActions = (teacherId: number, teacherStatus?: string) => (
    <TeacherRowActions
      onView={() => {
        router.push(`${DashboardRoutes.teachers}/${teacherId}`);
      }}
      onEdit={
        hasPermission("staff", "update")
          ? () => {
              if (!ensurePermission("staff", "update")) return;
              router.push(`${DashboardRoutes.teachers}/${teacherId}/edit`);
            }
          : undefined
      }
      onDeactivate={
        hasPermission("staff", "update")
          ? () => {
              if (!ensurePermission("staff", "update")) return;
              setSelectedTeacherIdx(teacherId);
              setSelectedTeacherStatus(String(teacherStatus || ""));
              setDeactivateModalOpen(true);
            }
          : undefined
      }
      onDelete={
        hasPermission("staff", "delete")
          ? () => {
              if (!ensurePermission("staff", "delete")) return;
              setSelectedTeacherIdx(teacherId);
              setDeleteModalOpen(true);
            }
          : undefined
      }
      onResendInvite={
        hasPermission("staff", "create")
          ? async () => {
              if (!ensurePermission("staff", "create")) return;
              try {
                await resendTeacherInviteAsync({ id: teacherId });
                showToast({
                  message: "Invite Sent",
                  description: "Teacher invite has been resent successfully.",
                  severity: "success",
                  duration: 3000,
                });
              } catch (error: any) {
                const statusCode = error?.response?.status;
                const apiMessage =
                  error?.response?.data?.message ||
                  error?.response?.data?.errors?.[0]?.msg ||
                  error?.message;
                const debugHint =
                  statusCode === 404
                    ? "Staff record was not found."
                    : statusCode === 409
                      ? "Invite may have already been accepted."
                      : statusCode === 422
                        ? "Staff email is missing/invalid."
                        : "Please verify staff status and email setup.";
                console.error("Resend invite failed", {
                  teacherId,
                  statusCode,
                  apiMessage,
                  response: error?.response?.data,
                });
                showToast({
                  message: "Unable to resend invite",
                  description: `${apiMessage || "Request failed."} ${debugHint}`.trim(),
                  severity: "error",
                  duration: 3000,
                });
              }
            }
          : undefined
      }
      showResendInvite={
        hasPermission("staff", "create") && String(teacherStatus || "").toLowerCase() === "inactive"
      }
      deactivateActionLabel={
        String(teacherStatus || "").toLowerCase() === "active" ? "Deactivate" : "Activate"
      }
    />
  );

  const handleDelete = async () => {
    if (!selectedTeacherIdx) return;
    if (!ensurePermission("staff", "delete")) return;

    try {
      await deleteTeacherAsync({});

      showToast({
        message: "Teacher Deleted",
        description: "The teacher has been successfully deleted.",
        severity: "success",
        duration: 3000,
      });

      setDeleteModalOpen(false);

      refetch();
      fetchAllTeachersMetrics();
    } catch (error: any) {
      showToast({
        message: "Error",
        description: error?.response?.data?.message || "Unable to delete teacher.",
        severity: "error",
        duration: 3000,
      });
    }
  };

  const StatusCell = ({ status }: { status: string }) => {
    const { chip } = getStatusConfig(status);

    return (
      <Box
        className={`flex items-center justify-center gap-2 px-2 py-1 rounded-full min-w-[80px] w-1/2 ${chip}`}
      >
        <span className="text-xs! font-normal! capitalize ">{status}</span>
      </Box>
    );
  };

  const TeacherList = allTeacherList?.map((owner: any) => {
    // Map assignedClasses (array of IDs or objects) to classroom names
    let classroomNames = "N/A";
    if (owner?.assignedClasses && owner.assignedClasses.length > 0) {
      // If assignedClasses is array of IDs
      if (typeof owner.assignedClasses[0] === "number") {
        classroomNames = owner.assignedClasses
          .map((id: number) => classroomMap.get(id) || id)
          .join(", ");
      } else {
        // If assignedClasses is array of objects with id
        classroomNames = owner.assignedClasses
          .map(
            (c: any) =>
              classroomMap.get(c.classroomId || c.id) || c.classroomName || c.name || c.id,
          )
          .join(", ");
      }
    }

    return {
      0: (
        <Box className="flex items-center gap-2">
          <InitialsAvatar
            src={owner?.user?.profile?.photo || ""}
            name={`${owner?.user?.firstName || ""} ${owner?.user?.lastName || ""}`.trim()}
            className="w-10 h-10"
            initialsClassName="text-[10px]"
          />
          <span>
            {owner?.user?.firstName} {owner?.user?.lastName}
          </span>
        </Box>
      ),
      1: <Box className="truncate max-w-[150px] !text-start">{"None"}</Box>,
      2: (
        <Box
          sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          className="truncate max-w-[150px] !text-start"
        >
          {classroomNames}
        </Box>
      ),
      3: (
        <Box className="flex justify-start items-center">
          <Box className="truncate max-w-[150px] text-start">{owner?.user?.profile?.address}</Box>
        </Box>
      ),
      4: (
        <Box className="flex justify-center items-center">
          <StatusCell status={owner?.status || "N/A"} />
        </Box>
      ),

      5: renderRowActions(owner?.id, owner?.status),
    };
  });

  const mobileTeachersData = allTeacherList?.map((owner: any) => {
    let classroomNames = "N/A";
    if (owner?.assignedClasses && owner.assignedClasses.length > 0) {
      if (typeof owner.assignedClasses[0] === "number") {
        classroomNames = owner.assignedClasses
          .map((id: number) => classroomMap.get(id) || id)
          .join(", ");
      } else {
        classroomNames = owner.assignedClasses
          .map(
            (c: any) =>
              classroomMap.get(c.classroomId || c.id) || c.classroomName || c.name || c.id,
          )
          .join(", ");
      }
    }

    return {
      id: owner?.id,
      name: `${owner?.user?.firstName || ""} ${owner?.user?.lastName || ""}`.trim() || "N/A",
      classes: classroomNames,
    };
  });

  const currentPage =
    Math.floor((pagination?.pos || 0) / (pagination?.delta || ITEMS_PER_PAGE)) + 1;

  /** ---- METRICS FOR INSIGHT CARDS ---- */
  const metricsSource = (allTeachers.length ? allTeachers : allTeacherList) as any[];

  const totalStaffCount = metricsSource.length;
  const leadTeachersCount = metricsSource.filter(
    (t: any) => t?.role === "lead_teacher" || t?.staffRole === "lead_teacher",
  ).length;
  const assistantTeachersCount = metricsSource.filter(
    (t: any) => t?.role === "assistant_teacher" || t?.staffRole === "assistant_teacher",
  ).length;

  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
  };

  return {
    router,
    selectedFilter,
    setSelectedFilter,
    handleDeactivate,
    handleDelete,
    deactivateModalOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    setDeactivateModalOpen,
    currentPage,
    filters,
    applyFilters,
    isLoading,
    totalStaff: pagination?.count || 0,
    totalStaffCount,
    leadTeachersCount,
    assistantTeachersCount,
    pagination,
    TeacherList,
    mobileTeachersData,
    teacherIds: (allTeacherList || []).map((t: any) => t?.id),
    isDeactivatingTeacher,
    isDeletingTeacher,
    handleSearch,
    selectedTeacherStatus,
    canCreateTeacher: hasPermission("staff", "create"),
  };
};

export default useTeachersPage;
