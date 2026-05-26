"use client";

import { useState, useMemo, ChangeEvent } from "react";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";
import MilestoneRowActions from "../MilestoneRowActions";
import { useLearningActions } from "@/layout/Shared/LearningActionsContext";
import { AddEditMilestoneFormValues } from "@/modules/admin/component/ManageMilestoneModal";
import type { Milestone } from "@/services/curriculum.service";
import type { MilestoneRow } from "../../learning.constants";
import {
  milestoneServices,
  milestoneDynamicEndpoints,
  type GetAllMilestonesResponse,
  type CreateMilestoneRequest,
  type UpdateMilestoneRequest,
  type CreateMilestoneFromLibraryRequest,
} from "@/services/milestone.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { showToast } from "@/modules/shared/component/Toast";
import { GRADING_TYPE_OPTIONS } from "@/constants/learning.enums";
import { Box } from "@mui/material";
import { AddMilestoneFromLibraryFormValues } from "@/modules/admin/component/AddMilestoneFromLibraryModal";
import { useDebouncer } from "@/utils/hooks/useDebouncer";
import { useModalRoute } from "@/utils/hooks/useModalRoute";
import { ModalRoute } from "@/routes/modalRoutes";

const DATE_DISPLAY_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

function formatMilestoneDate(dateStr?: string | null): string | undefined {
  if (!dateStr) return undefined;
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", DATE_DISPLAY_OPTIONS);
  } catch {
    return dateStr;
  }
}

function formatDuration(start?: string, end?: string): string {
  if (!start && !end) return "—";
  const startFormatted = formatMilestoneDate(start);
  const endFormatted = formatMilestoneDate(end);
  if (!startFormatted && !endFormatted) return "—";
  if (!startFormatted) return endFormatted ?? "—";
  if (!endFormatted) return startFormatted;
  return `${startFormatted} - ${endFormatted}`;
}

function gradingTypeLabel(value: string): string {
  const opt = GRADING_TYPE_OPTIONS.find((o) => o.value === value);
  return opt?.label ?? value;
}

function mapMilestoneToRow(m: Milestone): MilestoneRow {
  const classroomNames =
    Array.isArray(m.classrooms) && m.classrooms.length > 0
      ? m.classrooms.map((c: { name: string }) => c.name).join(", ")
      : "—";
  const period = formatDuration(m.startDate ?? undefined, m.endDate ?? undefined);
  return {
    id: String(m.id),
    milestoneName: m.title ?? "",
    // gradingType: gradingTypeLabel(m.gradingType ?? ""),
    class: classroomNames,
    milestonePeriod: period,
    startDate: m.startDate ?? undefined,
    endDate: m.endDate ?? undefined,
    status: (m.status as "draft" | "active" | "completed") ?? "draft",
    duration: period,
    raw: m,
  };
}

export default function useMilestonesPage(teacherId?: number | null) {
  const { filterState } = useLearningActions();
  const { openModal } = useModalRoute(true);
  const { filters, applyFilters } = useFilter({
    search: "",
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });
  const { debouncedSearch, setSearch } = useDebouncer();

  const [addModalOpen, setAddModalOpen] = useState(false);

  const [milestoneStatus, setMilestoneStatus] = useState<string>("");

  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneRow | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addFromLibraryModalOpen, setAddFromLibraryModalOpen] = useState(false);
  const { data, isLoading, refetch } = useQueryService<
    { pos?: number; delta?: number; status?: string; classroomId?: number; teacherId?: number },
    GetAllMilestonesResponse
  >({
    service: {
      ...milestoneServices.getAllMilestones,
      data: {
        pos: filters?.pos ?? 0,
        delta: filters?.delta ?? ITEMS_PER_PAGE,
        ...(filterState.status !== "all" ? { status: filterState.status } : {}),
        ...(filterState.classroomId ? { classroomId: Number(filterState.classroomId) } : {}),
        ...(teacherId != null ? { teacherId, staffId: teacherId } : {}),
        search: debouncedSearch,
      },
    },
  });

  const { mutateAsync: createMilestone, isPending: isCreating } = useMutationService<
    CreateMilestoneRequest,
    { data: Milestone }
  >({
    service: milestoneServices.createMilestone,
  });

  const { mutateAsync: createMilestoneFromLibrary, isPending: isCreatingFromLibrary } =
    useMutationService<CreateMilestoneFromLibraryRequest, { data: Milestone }>({
      service: milestoneServices.createMilestoneFromLibrary,
    });

  const editingId = editingMilestone?.raw?.id ?? 0;
  const { mutateAsync: updateMilestoneAsync, isPending: isUpdating } = useMutationService<
    UpdateMilestoneRequest,
    { data: Milestone }
  >({
    service: milestoneDynamicEndpoints.updateMilestone(editingId),
  });

  const { mutateAsync: deactivateMilestoneAsync, isPending: isDeactivatingMilestone } = useMutationService<
    UpdateMilestoneRequest,
    { data: Milestone }
  >({
    service: milestoneDynamicEndpoints.updateMilestone(selectedMilestoneId ?? 0),
  });

  const apiList = useMemo(() => {
    const raw = data?.data ?? data?.milestones ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const filteredList = useMemo(() => apiList.map(mapMilestoneToRow), [apiList]);
  const totalItems =
    data?.pagination?.total ?? data?.total ?? filteredList.length;
  const currentPage = Math.max(
    1,
    Math.floor((filters?.pos ?? 0) / (filters?.delta ?? ITEMS_PER_PAGE)) + 1,
  );
  const paginatedList = filteredList;

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "!bg-success-green/5 !text-success-green";
      case "active":
        return "!bg-success-green/15 !text-success-green";
      case "draft":
        return "!bg-primary-dark/10 !text-primary-dark";
      default:
        return "!bg-gray-100 !text-gray-700";
    }
  };

  const handleAddMilestone = async (values: AddEditMilestoneFormValues) => {
    try {
      await createMilestone({
        title: values.milestoneName,
        subjectId: Number(values.subject),
        curriculumId: Number(values.curriculum),
        // gradingType: values.gradingType || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      });
      showToast({ message: "Milestone created successfully", severity: "success", duration: 3000 });
      setAddModalOpen(false);
      refetch();
    } catch (err: unknown) {
      showToast({
        message: (err as { message?: string })?.message ?? "Failed to create milestone",
        severity: "error",
        duration: 3000,
      });
    }
  };

  const handleAddMilestoneFromLibrary = async (values: AddMilestoneFromLibraryFormValues) => {
    try {
      const milestoneIds = Array.isArray(values.milestoneIds)
        ? values.milestoneIds
            .map((id) => Number(String(id).replace(/"/g, "").trim()))
            .filter((id) => Number.isFinite(id) && id > 0)
        : [];
      await createMilestoneFromLibrary({
        milestoneIds,
        classroomId: Number(values.classroom),
        staffId: Number(values.staff),
      });
      showToast({
        message: "Milestone added from library successfully",
        severity: "success",
        duration: 3000,
      });
      setAddFromLibraryModalOpen(false);
      refetch();
    } catch (err: unknown) {
      showToast({
        message: (err as { message?: string })?.message ?? "Failed to add milestone from library",
        severity: "error",
        duration: 3000,
      });
    }
  };

  const handleEditMilestone = async (values: AddEditMilestoneFormValues) => {
    const id = editingMilestone?.raw?.id;
    if (id == null) return;
    try {
      await updateMilestoneAsync({
        title: values.milestoneName,
        // gradingType: values.gradingType || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      });
      showToast({ message: "Milestone updated successfully", severity: "success", duration: 3000 });
      setEditingMilestone(null);
      refetch();
    } catch (err: unknown) {
      showToast({
        message: (err as { message?: string })?.message ?? "Failed to update milestone",
        severity: "error",
        duration: 3000,
      });
    }
  };

  const handleDeactivateMilestone = async () => {
    const id = selectedMilestoneId;
    const normalizedStatus = String(milestoneStatus || "").toLowerCase();
    if (id == null) return;

    const nextStatus = normalizedStatus === "active" ? "draft" : "active";
    try {
      await deactivateMilestoneAsync({ status: nextStatus });
      showToast({
        message:
          nextStatus === "active"
            ? "Milestone activated successfully"
            : "Milestone deactivated successfully",
        severity: "success",
        duration: 3000,
      });
      setDraftModalOpen(false);
      refetch();
    } catch (err: unknown) {
      showToast({
        message: (err as { message?: string })?.message ?? "Failed to update milestone status",
        severity: "error",
        duration: 3000,
      });
    }
  };

  // Helper to determine if row actions should show activate/deactivate
  const getRowActionType = (status: string) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "completed") return null;
    if (normalized === "active") return "deactivate";
    if (normalized === "draft") return "activate";
    return null;
  };

  const MilestoneList = useMemo(
    () =>
      paginatedList.map((row) => {
        const actionType = getRowActionType(row.status);
        return {
          0: (
            <Box className="flex justify-start items-center">
              <Box className="truncate max-w-[180px] text-start">{row.milestoneName}</Box>
            </Box>
          ),
          1: (
            <Box className="flex justify-start items-center">
              <Box className="truncate max-w-[150px] text-start">{row.class}</Box>
            </Box>
          ),
          2: formatDuration(row.startDate ?? undefined, row.endDate ?? undefined),
          3: (
            <span
              className={`flex items-center justify-center gap-2 px-2 py-1 rounded-full min-w-[90px] w-1/2 text-center mx-auto font-medium ${statusBadgeClass(row.status)}`}
            >
              <span>{row.status.charAt(0).toUpperCase() + row.status.slice(1)}</span>
            </span>
          ),
          4: (
            <MilestoneRowActions
              milestone={row}
              onView={() => openModal(ModalRoute.viewMilestone, { milestoneId: row.id })}
              onEdit={(m) => setEditingMilestone(m)}
              onDelete={() => setDeleteModalOpen(true)}
              onDeactivate={
                actionType
                  ? () => {
                      setSelectedMilestoneId(Number(row.id));
                      setMilestoneStatus(row.status);
                      setDraftModalOpen(true);
                    }
                  : undefined
              }
              deactivateLabel={
                actionType === "activate"
                  ? "Activate"
                  : actionType === "deactivate"
                    ? "Deactivate"
                    : undefined
              }
              hideDeactivate={!actionType}
            />
          ),
        };
      }),
    [paginatedList, openModal],
  );

  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
  };

  return {
    filters,
    applyFilters,
    MilestoneList,
    mobileMilestoneData: paginatedList,
    milestoneIds: paginatedList.map((row) => row.id),
    currentPage,
    totalItems,
    isLoading: isLoading || isCreating || isUpdating || isCreatingFromLibrary,
    addModalOpen,
    setAddModalOpen,
    draftModalOpen,
    setDraftModalOpen,
    editingMilestone,
    setEditingMilestone,
    handleAddMilestone,
    handleEditMilestone,
    handleDeactivateMilestone,
    isSubmitting: isCreating || isUpdating || isCreatingFromLibrary,
    deleteModalOpen,
    setDeleteModalOpen,
    refetch,
    addFromLibraryModalOpen,
    setAddFromLibraryModalOpen,
    handleAddMilestoneFromLibrary,
    handleSearch,
    isDeactivatingMilestone,
    milestoneStatus,
    setMilestoneStatus,
  };
}
