"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";
import SubjectRowActions from "../SubjectRowActions";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { useLearningActions } from "@/layout/Shared/LearningActionsContext";
import type { Subject } from "@/services/curriculum.service";
import type { SubjectRow } from "../../learning.constants";
import { subjectServices, type GetAllSubjectsResponse } from "@/services/subject.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { SKILL_LABEL_MAP, SKILL_COLOR_MAP } from "@/constants/learning.enums";
import { useDebouncer } from "@/utils/hooks/useDebouncer";

function mapSubjectToRow(s: Subject): SubjectRow {
  const firstTeacher = Array.isArray(s.teacherAssignments) ? s.teacherAssignments[0] : undefined;
  const firstClass = firstTeacher?.classrooms?.[0];
  const ageRange = s.ageRange as { minimumAge?: number; maximumAge?: number } | undefined;
  const min = ageRange?.minimumAge ?? "";
  const max = ageRange?.maximumAge ?? "";
  return {
    id: String(s.id),
    subjectName: s.name ?? "",
    teacherName: firstTeacher?.name ?? "—",
    class: firstClass?.name ?? "—",
    ageRange: min !== "" && max !== "" ? `${min} - ${max}` : "—",
    skills: (s as { skills?: string[] }).skills ?? [],
    raw: s,
  };
}

export default function useSubjectsPage(teacherId?: number | null) {
  const router = useRouter();
  const { filterState } = useLearningActions();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { filters, applyFilters } = useFilter({
    search: "",
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });
  const { debouncedSearch, setSearch } = useDebouncer();

  const { data, isLoading } = useQueryService<
    { pos?: number; delta?: number; curriculumId?: number; teacherId?: number },
    GetAllSubjectsResponse
  >({
    service: {
      ...subjectServices.getAllSubjects,
      data: {
        pos: filters?.pos ?? 0,
        delta: filters?.delta ?? ITEMS_PER_PAGE,
        ...(teacherId != null ? { teacherId, staffId: teacherId } : {}),
        search: debouncedSearch,
      },
    },
  });

  const apiList = useMemo(() => {
    const raw = data?.subjects ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const filteredList = useMemo(() => {
    const rows = apiList.map(mapSubjectToRow);
    if (filterState.classroom !== "All Classroom") {
      return rows.filter((r) => r.class === filterState.classroom);
    }
    return rows;
  }, [apiList, filterState.classroom]);

  const totalItems =
    data?.pagination?.count ?? data?.pagination?.total ?? data?.total ?? filteredList.length;
  const currentPage = Math.max(
    1,
    Math.floor((filters?.pos ?? 0) / (filters?.delta ?? ITEMS_PER_PAGE)) + 1,
  );
  const start = (currentPage - 1) * (filters?.delta ?? ITEMS_PER_PAGE);
  const paginatedList = filteredList.slice(start, start + (filters?.delta ?? ITEMS_PER_PAGE));

  const SubjectList = useMemo(
    () =>
      paginatedList.map((row) => ({
        0: row.subjectName,
        1: row.teacherName,
        2: row.class,
        3: row.ageRange,
        4: (
          <div className="flex flex-wrap gap-1 items-center">
            {row.skills.slice(0, 2).map((skill) => {
              const label =
                SKILL_LABEL_MAP[skill] ??
                skill.charAt(0).toUpperCase() + skill.slice(1).replace(/_/g, " ");
              const colorClasses = SKILL_COLOR_MAP[skill] ?? {
                bg: "!bg-brandColor-active/10",
                text: "!text-brandColor-active",
              };
              return (
                <span
                  key={skill}
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses.bg} ${colorClasses.text}`}
                >
                  {label}
                </span>
              );
            })}
            {row.skills.length > 2 && (
              <span className="text-xs! bg-gray-100 !text-gray-600 px-2 py-0.5 rounded-full">
                +{row.skills.length - 2}
              </span>
            )}
          </div>
        ),
        5: (
          <SubjectRowActions
            subject={row}
            onView={(s) => router.push(DashboardRoutes.learningViewSubject.replace(":id", s.id))}
            onEdit={(s) => router.push(DashboardRoutes.learningEditSubject.replace(":id", s.id))}
            onDelete={() => setDeleteModalOpen(true)}
          />
        ),
      })),
    [paginatedList, router],
  );

  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
  };

  return {
    filters,
    applyFilters,
    SubjectList,
    mobileSubjectData: paginatedList,
    subjectIds: paginatedList.map((row) => row.id),
    currentPage,
    totalItems,
    isLoading,
    deleteModalOpen,
    setDeleteModalOpen,
    handleSearch,
  };
}
