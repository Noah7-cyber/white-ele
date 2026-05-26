/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";
import PortfolioRowActions from "../PortfolioRowActions";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { useLearningActions } from "@/layout/Shared/LearningActionsContext";
import type { PortfolioRow } from "../../learning.constants";
import {
  portfolioDynamicEndpoints,
  portfolioServices,
  type GetAllPortfoliosResponse,
  type PortfolioListItem,
} from "@/services/portfolio.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { showToast } from "@/modules/shared/component/Toast";
import { useDebouncer } from "@/utils/hooks/useDebouncer";
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";
import { useMutationService } from "@/utils/hooks/useMutationService";

const DATE_DISPLAY_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

function formatPortfolioDate(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", DATE_DISPLAY_OPTIONS);
  } catch {
    return dateStr;
  }
}

function getStatus(item: PortfolioListItem): "Published" | "Draft" | "Archived" {
  const normalized = String(item?.status ?? "").toLowerCase();
  if (normalized === "published") return "Published";
  if (normalized === "draft") return "Draft";
  return "Archived";
}

function getDuration(item: PortfolioListItem): string {
  const start = formatPortfolioDate(item?.startDate);
  const end = formatPortfolioDate(item?.endDate);
  return `${start}\n${end}`;
}

function mapPortfolioToRow(p: PortfolioListItem): PortfolioRow {
  const firstName = p.student?.firstName ?? "Unknown";
  const lastName = p.student?.lastName ?? "Student";
  const displayName = `${firstName} ${lastName}`.trim();

  return {
    id: String(p.id),
    childName: displayName,
    class: p.student?.classroom?.name ?? "—",
    sections: p.sectionCount ?? 0,
    duration: getDuration(p),
    status: getStatus(p),
    raw: p,
  };
}

export default function usePortfolioPage(teacherId?: number | null) {
  const router = useRouter();
  const { filterState } = useLearningActions();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioRow | null>(null);
  const [statusTargetPortfolio, setStatusTargetPortfolio] = useState<PortfolioRow | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<"publish" | "draft" | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<number | null>(null);

  const { debouncedSearch, setSearch } = useDebouncer();

  const { filters, applyFilters } = useFilter({
    search: debouncedSearch,
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });

  const { data, isLoading, refetch } = useQueryService<
    {
      pos?: number;
      delta?: number;
      status?: string;
      classroomId?: number;
      teacherId?: number;
      startDate?: string;
      endDate?: string;
    },
    GetAllPortfoliosResponse
  >({
    service: {
      ...portfolioServices.getAllPortfolios,
      data: {
        pos: filters?.pos ?? 0,
        delta: filters?.delta ?? ITEMS_PER_PAGE,
        ...(filterState.status !== "all" ? { status: filterState.status } : {}),
        ...(filterState.classroomId ? { classroomId: Number(filterState.classroomId) } : {}),
        ...(filterState.startDate ? { startDate: filterState.startDate } : {}),
        ...(filterState.endDate ? { endDate: filterState.endDate } : {}),
        ...(teacherId != null ? { teacherId, staffId: teacherId } : {}),
        search: debouncedSearch,
      },
    },
  });

  const isCreating = false;
  const isDeleting = false;
  const { mutateAsync: updatePortfolioStatus, isPending: isUpdatingStatus } = useMutationService<
    { status: "published" | "draft" },
    any
  >({
    service: () => portfolioDynamicEndpoints.patchPortfolio(statusTargetPortfolio?.raw?.id || 0),
  });
  const deletePortfolioAsync = useCallback(async () => {}, []);

  const apiList = useMemo(() => {
    const raw = data?.data ?? data?.portfolios ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const filteredList = useMemo(() => apiList.map(mapPortfolioToRow), [apiList]);
  const totalItems = data?.pagination?.total ?? filteredList.length;
  const currentPage = Math.max(
    1,
    Math.floor((filters?.pos ?? 0) / (filters?.delta ?? ITEMS_PER_PAGE)) + 1,
  );
  const paginatedList = filteredList;

  const statusBadgeClass = (status: "Published" | "Draft" | "Archived") => {
    switch (status) {
      case "Published":
        return "!bg-success-green/15 !text-success-green";
      case "Draft":
        return "!bg-gray-100 !text-gray-700";
      default:
        return "!bg-gray-100 !text-gray-700";
    }
  };

  const PortfolioList = useMemo(
    () =>
      paginatedList.map((row) => ({
        0: (
          <div className="flex items-center gap-3">
            <InitialsAvatar
              src={row.raw?.student?.profileUrl}
              name={row.childName}
              className="w-9 h-9"
              initialsClassName="text-xs"
            />
            <span className="font-medium text-gray-900">{row.childName}</span>
          </div>
        ),
        1: row.class,
        2: row.sections,
        3: <span className="whitespace-pre-line">{row.duration}</span>,
        4: (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClass(row.status)}`}
          >
            {row.status}
          </span>
        ),
        5: (
          <PortfolioRowActions
            portfolio={row}
            onView={() =>
              router.push(DashboardRoutes.viewReport.replace(":id", String(row?.raw?.id ?? "")))
            }
            onEdit={() =>
              setEditingPortfolio(row)
            }
            onPublishDraftToggle={() => {
              setStatusTargetPortfolio(row);
              setStatusAction(row.status === "Published" ? "draft" : "publish");
              setUpdateStatusModalOpen(true);
            }}
            onDelete={() => {
              setEditingPortfolio(row);
              setDeleteModalOpen(true);
            }}
          />
        ),
      })),
    [paginatedList, router],
  );

  const handleDeletePortfolio = useCallback(async () => {
    try {
      await deletePortfolioAsync();
      showToast({ message: "Portfolio deleted successfully", severity: "success" });
      setDeleteModalOpen(false);
      setEditingPortfolio(null);
      refetch();
    } catch {
      showToast({ message: "Failed to delete portfolio", severity: "error" });
    }
  }, [deletePortfolioAsync, refetch]);

  const handleConfirmStatusUpdate = useCallback(async () => {
    if (!statusTargetPortfolio?.raw?.id || !statusAction) return;
    try {
      const nextStatus = statusAction === "publish" ? "published" : "draft";
      await updatePortfolioStatus({ status: nextStatus });
      showToast({
        message: `Report ${statusAction === "publish" ? "published" : "moved to draft"} successfully`,
        severity: "success",
      });
      setUpdateStatusModalOpen(false);
      setStatusTargetPortfolio(null);
      setStatusAction(null);
      refetch();
    } catch {
      showToast({ message: "Failed to update report status", severity: "error" });
    }
  }, [statusTargetPortfolio?.raw?.id, refetch, statusAction, updatePortfolioStatus]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
  };

  const portfolioIds = paginatedList.map((r) => r?.raw?.id);

  return {
    filters,
    applyFilters,
    PortfolioList,
    mobilePortfolioData: paginatedList,
    portfolioIds,
    currentPage,
    totalItems,
    isLoading,
    createModalOpen,
    setCreateModalOpen,
    editingPortfolio,
    setEditingPortfolio,
    isSubmitting: isCreating || isDeleting,
    isUpdatingStatus,
    deleteModalOpen,
    setDeleteModalOpen,
    handleDeletePortfolio,
    updateStatusModalOpen,
    setUpdateStatusModalOpen,
    statusAction,
    setStatusAction,
    statusTargetPortfolio,
    setStatusTargetPortfolio,
    handleConfirmStatusUpdate,
    selectedClassroom,
    setSelectedClassroom,
    handleSearch,
    refetch,
  };
}
