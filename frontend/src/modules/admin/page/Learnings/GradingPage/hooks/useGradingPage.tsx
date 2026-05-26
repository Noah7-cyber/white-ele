"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";
import { GradingRow } from "../../learning.constants";
import GradingRowActions from "../GradingRowActions";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { StaffRoutes } from "@/routes/staff.routes";
import { usePathname, useRouter } from "next/navigation";
import { milestoneServices, type GetAllMilestonesResponse } from "@/services/milestone.service";
import type { Milestone } from "@/services/curriculum.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { GRADING_TYPE_OPTIONS } from "@/constants/learning.enums";
import { useDebouncer } from "@/utils/hooks/useDebouncer";
import { useLearningActions } from "@/layout/Shared/LearningActionsContext";

function gradingTypeLabel(value: string): string {
  const opt = GRADING_TYPE_OPTIONS.find((o) => o.value === value);
  return opt?.label ?? value;
}

function formatDuration(start?: string, end?: string): string {
  if (!start && !end) return "—";
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const fmt = (d?: string) => {
    if (!d) return undefined;
    try {
      return new Date(d).toLocaleDateString("en-GB", opts);
    } catch {
      return d;
    }
  };
  const s = fmt(start);
  const e = fmt(end);
  if (!s && !e) return "—";
  if (!s) return e ?? "—";
  if (!e) return s;
  return `${s} - ${e}`;
}

function mapMilestoneToGradingRow(m: Milestone): GradingRow {
  const classroomNames =
    Array.isArray(m.classrooms) && m.classrooms.length > 0
      ? m.classrooms.map((c: { name: string }) => c.name).join(", ")
      : "—";

  const noOfStudents =
    Array.isArray(m.classrooms) && m.classrooms.length > 0
      ? m.classrooms.reduce(
          (total: number, c: { studentCount?: number }) => total + (c.studentCount ?? 0),
          0,
        )
      : 0;

  // Determine grading status from grades array
  const grades = Array.isArray(m.grades) ? m.grades : [];
  const allGraded =
    grades.length > 0 && grades.every((g: { status: string }) => g.status !== "NOT_GRADED");

  let status: "in progress" | "completed" = "in progress";
  if (allGraded && grades.length > 0) status = "completed";

  return {
    id: String(m.id),
    milestoneTitle: m.title ?? "",
    gradingType: gradingTypeLabel(m.gradingType ?? ""),
    class: classroomNames,
    duration: formatDuration(m.startDate ?? undefined, m.endDate ?? undefined),
    status,
    noOfStudents: noOfStudents,
  };
}

export default function useGradingPage(teacherId?: number | null) {
  const router = useRouter();
  const pathname = usePathname();
  const isStaffPath = pathname?.startsWith("/staff/learning");
  const { filterState } = useLearningActions();
  const { filters, applyFilters } = useFilter({
    search: "",
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const { debouncedSearch, setSearch } = useDebouncer();

  const { data, isLoading } = useQueryService<
    { pos?: number; delta?: number; teacherId?: number },
    GetAllMilestonesResponse
  >({
    service: {
      ...milestoneServices.getAllMilestones,
      data: {
        pos: filters?.pos ?? 0,
        delta: filters?.delta ?? ITEMS_PER_PAGE,
        ...(teacherId != null ? { teacherId, staffId: teacherId } : {}),
        ...(filterState.classroomId ? { classroomId: Number(filterState.classroomId) } : {}),
        search: debouncedSearch,
        excludeStatus: "draft",
      },
    },
  });

  const apiList = useMemo(() => {
    const raw = data?.data ?? data?.milestones ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const filteredList = useMemo(() => apiList.map(mapMilestoneToGradingRow), [apiList]);
  const totalItems = data?.pagination?.total ?? filteredList.length;
  const currentPage = Math.max(
    1,
    Math.floor((filters?.pos ?? 0) / (filters?.delta ?? ITEMS_PER_PAGE)) + 1,
  );

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "!bg-[#EDFFF7] !text-success-green";
      case "in progress":
        return "!bg-brandColor-yellow/15 !text-brandColor-yellow";
      default:
        return "!bg-gray-100 !text-gray-700";
    }
  };

  const GradingList = useMemo(
    () =>
      filteredList.map((row) => ({
        0: row.milestoneTitle,
        1: <span className="!truncate !max-w-[100px]">{row.class}</span>,
        2: row.noOfStudents,
        3: (
          <span
            className={`${statusBadgeClass(row.status)} px-5 py-[3px] !w-[100px] text-xs font-medium rounded-full text-center`}
          >
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </span>
        ),
        4: (
          <GradingRowActions
            row={row}
            onView={() =>
              router.push(
                (isStaffPath ? StaffRoutes.learningViewGradeDetail : DashboardRoutes.learningViewGradeDetail).replace(
                  ":id",
                  String(row.id),
                ),
              )
            }
            onGrade={() =>
              router.push(
                (isStaffPath ? StaffRoutes.learningViewGrade : DashboardRoutes.learningViewGrade).replace(
                  ":id",
                  String(row.id),
                ),
              )
            }
            onDeleteGrade={() => setDeleteModalOpen(true)}
          />
        ),
      })),
    [filteredList, isStaffPath, router],
  );

  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
  };

  return {
    filters,
    applyFilters,
    GradingList,
    mobileGradingData: filteredList,
    gradingIds: filteredList.map((row) => row.id),
    currentPage,
    totalItems,
    isLoading,
    deleteModalOpen,
    setDeleteModalOpen,
    handleSearch,
  };
}
