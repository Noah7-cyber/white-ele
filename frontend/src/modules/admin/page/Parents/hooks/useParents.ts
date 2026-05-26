/* eslint-disable @typescript-eslint/no-explicit-any */

import { ParentDynamicEndpoints } from "@/services/parent.service";
import { classroomServices } from "@/services/classroom.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { unwrapQueryDataBody } from "@/utils/unwrapQueryResponse";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useCallback, ChangeEvent } from "react";
import { ITEMS_PER_PAGE } from "@/constants";
import { useFilter } from "@/utils/hooks/useFilter";
import { useDebouncer } from "@/utils/hooks/useDebouncer";
import { showToast } from "@/modules/shared/component/Toast";
import { usePermissionGuide } from "@/utils/hooks/usePermissionGuide";

const ALL_CLASSROOMS_VALUE = "";
const ALL_STATUS_VALUE = "all";

export function useParents() {
  const queryClient = useQueryClient();
  const [classRoomAnchorEl, setClassRoomAnchorEl] = useState<HTMLElement | null>(null);
  const [statusAnchorEl, setStatusAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedClassRoomFilter, setSelectedClassRoomFilter] =
    useState<string>(ALL_CLASSROOMS_VALUE);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>(ALL_STATUS_VALUE);
  const [deleteAccount, setDeleteAccount] = useState<any>(null);
  const [statusAccount, setStatusAccount] = useState<any>(null);
  const { debouncedSearch, setSearch } = useDebouncer();
  const { hasPermission, ensurePermission } = usePermissionGuide({ enabled: true });

  const { filters, applyFilters } = useFilter({
    search: "",
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });

  const STATUS_CONSTANT: Record<string, { chip: string }> = {
    active: {
      chip: "bg-green-100 text-green-700",
    },
    inactive: {
      chip: "bg-[#CF000B]/10 text-[#CF000B]",
    },
  };

  const getStatusConfig = (status: string) =>
    STATUS_CONSTANT[status?.toLowerCase()] ?? { chip: "bg-gray-100 text-gray-700" };

  const handleOpenClassRoomFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setClassRoomAnchorEl(event.currentTarget);
  };
  const handleOpenStatusFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setStatusAnchorEl(event.currentTarget);
  };

  const {
    data: classRoomData,
    hasNextPage: hasMoreClassRoom,
    fetchNextPage: fetchNextClassPage,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
    },
  });

  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
  };

  const classRoomOptions = useMemo(() => {
    const list =
      classRoomData?.pages?.reduce<any[]>((acc, page) => {
        return acc.concat(page?.classrooms ?? page?.data ?? []);
      }, []) ?? [];
    const options = [{ label: "All Classrooms", value: ALL_CLASSROOMS_VALUE }];
    list.forEach((c: any) => {
      options.push({ label: c.classroomName ?? c.name ?? String(c.id), value: String(c.id) });
    });
    return options;
  }, [classRoomData]);

  const fetchMoreClassRoom = async (): Promise<void> => {
    if (!hasMoreClassRoom) return;
    fetchNextClassPage();
  };

  const selectedClassRoomLabel =
    classRoomOptions.find((o) => o.value === selectedClassRoomFilter)?.label ?? "All Classrooms";
  const statusOptions = useMemo(
    () => [
      { label: "All Status", value: ALL_STATUS_VALUE },
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
    [],
  );
  const selectedStatusLabel =
    statusOptions.find((o) => o.value === selectedStatusFilter)?.label ?? "All Status";

  const setClassroomFilter = useCallback(
    (value: string) => {
      setSelectedClassRoomFilter(value);
      applyFilters({ ...filters, pos: 0 });
    },
    [filters, applyFilters],
  );
  const setStatusFilter = useCallback(
    (value: string) => {
      setSelectedStatusFilter(value);
      applyFilters({ ...filters, pos: 0 });
    },
    [filters, applyFilters],
  );

  const classroomIdParam =
    selectedClassRoomFilter && selectedClassRoomFilter !== ALL_CLASSROOMS_VALUE
      ? Number(selectedClassRoomFilter)
      : undefined;
  const statusParam =
    selectedStatusFilter && selectedStatusFilter !== ALL_STATUS_VALUE
      ? selectedStatusFilter
      : undefined;

  const parentsQuery = useQueryService({
    service: {
      ...ParentDynamicEndpoints.getParents(classroomIdParam),
      data: {
        ...(classroomIdParam != null ? { classroomId: classroomIdParam } : {}),
        ...(statusParam ? { status: statusParam } : {}),
        pos: filters?.pos ?? 0,
        sortBy: "lastName",
        sortOrder: "DESC",
        delta: filters?.delta ?? ITEMS_PER_PAGE,
        search: debouncedSearch,
      },
    },
    options: {
      keys: ["parents", selectedClassRoomFilter, selectedStatusFilter, filters?.pos, filters?.delta],
    },
  });

  const { isLoading, refetch } = parentsQuery;
  const parentData = unwrapQueryDataBody<Record<string, any>>(parentsQuery.data);

  const metadata = parentData?.metadata;
  const pagination = parentData?.pagination;
  const parentsList = parentData?.parents ?? [];

  const { mutateAsync, isPending } = useMutationService({
    service: ParentDynamicEndpoints.deleteParent(deleteAccount?.id),
  });
  const { mutateAsync: changeParentStatusAsync, isPending: isStatusPending } = useMutationService({
    service: ParentDynamicEndpoints.changeParentStatus(statusAccount?.id),
    options: {
      disableToast: true,
    },
  });
  const { mutateAsync: resendParentInviteAsync, isPending: isResendInvitePending } = useMutationService({
    service: ParentDynamicEndpoints.resendInvite(),
  });

  async function handleDelete() {
    if (!ensurePermission("parent", "delete")) return;
    if ((deleteAccount?.childrenCount ?? 0) > 0) {
      showToast({
        message: "Cannot delete parent",
        description: "This parent is linked to at least one child. Reassign guardianship first.",
        severity: "warning",
        duration: 3500,
      });
      setDeleteAccount(null);
      return;
    }
    try {
      await mutateAsync({});
      setDeleteAccount(null);
      refetch();
      // Invalidate child-by-id queries so child edit page no longer shows the deleted parent
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            key != null &&
            typeof key === "object" &&
            "path" in key &&
            String((key as { path?: string }).path ?? "").includes("/students/")
          );
        },
      });
    } catch {
      // Error handled by mutation options / toast
    }
  }

  async function handleToggleStatus() {
    if (!statusAccount?.id) return;
    if (!ensurePermission("parent", "update")) return;
    const currentStatus = String(statusAccount?.status || "").toLowerCase();
    const nextStatus =
      currentStatus === "active" ? "inactive" : currentStatus === "inactive" ? "active" : "active";

    try {
      await changeParentStatusAsync({ status: nextStatus });
      showToast({
        message: nextStatus === "active" ? "Parent Activated" : "Parent Deactivated",
        description:
          nextStatus === "active"
            ? "The parent has been successfully activated."
            : "The parent has been successfully deactivated.",
        severity: "success",
        duration: 3000,
      });
      setStatusAccount(null);
      refetch();
    } catch (error: any) {
      showToast({
        message: "Error",
        description: error?.response?.data?.message || "Unable to update parent status.",
        severity: "error",
        duration: 3000,
      });
    }
  }

  async function handleResendInvite(parentId: number) {
    if (!parentId) return;
    if (!ensurePermission("parent", "create")) return;
    try {
      await resendParentInviteAsync({ parentId });
      showToast({
        message: "Invite sent",
        description: "Parent invite has been resent successfully.",
        severity: "success",
        duration: 3000,
      });
    } catch {
      showToast({
        message: "Resend failed",
        description: "Unable to resend parent invite at the moment.",
        severity: "error",
        duration: 3000,
      });
    }
  }

  const totalItems = pagination?.total ?? pagination?.count ?? parentsList?.length ?? 0;
  const currentPage =
    Math.floor((pagination?.pos ?? filters?.pos ?? 0) / (filters?.delta ?? ITEMS_PER_PAGE)) + 1;
  const handlePageChange = useCallback(
    ({ page, rowsPerPage }: { page: number; rowsPerPage: number }) => {
      applyFilters({
        ...filters,
        delta: rowsPerPage,
        pos: (page - 1) * rowsPerPage,
      });
    },
    [filters, applyFilters],
  );

  return {
    classRoomAnchorEl,
    statusAnchorEl,
    selectedClassRoomFilter,
    setSelectedClassRoomFilter: setClassroomFilter,
    selectedClassRoomLabel,
    selectedStatusFilter,
    setSelectedStatusFilter: setStatusFilter,
    selectedStatusLabel,
    statusOptions,
    classRoomOptions,
    fetchMoreClassRoom,
    hasMoreClassRoom,
    isLoading,
    parentsList,
    pagination,
    setClassRoomAnchorEl,
    handleOpenClassRoomFilter,
    setStatusAnchorEl,
    handleOpenStatusFilter,
    deleteAccount,
    isPending,
    isStatusPending,
    isResendInvitePending,
    setDeleteAccount,
    handleDelete,
    statusAccount,
    setStatusAccount,
    handleToggleStatus,
    handleResendInvite,
    metadata,
    totalItems,
    currentPage,
    rowsPerPage: filters?.delta ?? ITEMS_PER_PAGE,
    handlePageChange,
    getStatusConfig,
    handleSearch,
    hasPermission,
  };
}
