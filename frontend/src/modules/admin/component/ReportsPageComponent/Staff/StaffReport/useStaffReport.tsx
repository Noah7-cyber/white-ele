/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from "react";
import { capitalizeFirstLetter } from "@/utils/helpers";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useFilter } from "@/utils/hooks/useFilter";
import { ITEMS_PER_PAGE } from "@/constants";
import { analyticsServices } from "@/services/analytics.service";
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";

interface SummaryRow {
  studentName: string;
  totalPresentHours: number;
  totalAbsentHours: number;
  [key: string]: any;
}

function formatReportStaffRole(raw: string): string {
  if (!raw || raw === "N/A") return raw || "N/A";
  return capitalizeFirstLetter(raw.replace(/_/g, " "));
}

function normalizeRoomAssignmentList(raw: unknown): string[] {
  if (raw == null || raw === "") return [];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => (typeof x === "string" ? x.trim() : String(x ?? "").trim()))
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s || s === "N/A") return [];
    const parts = s.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
    return parts.length ? parts : [s];
  }
  return [];
}

function renderRoomAssignmentCell(item: SummaryRow): ReactNode {
  const rooms = normalizeRoomAssignmentList(
    item?.roomAssignment ?? item?.roomAssignments ?? item?.classrooms ?? item?.assignedRooms,
  );
  if (rooms.length === 0) return "N/A";
  if (rooms.length === 1) return rooms[0];
  const extraCount = rooms.length - 1;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span>{rooms[0]}</span>
      <span className="inline-flex shrink-0 items-center rounded-full bg-[#F2F4F7] px-2 py-0.5 text-xs font-medium text-secondary-text-gray">
        +{extraCount}
      </span>
    </div>
  );
}

const CHILD_COUNT_KEYS = [
  "childrenCount",
  "childCount",
  "studentCount",
  "students",
  "totalChildren",
  "enrolledChildren",
  "numberOfChildren",
  "children",
  "activeStudents",
] as const;

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (!Number.isNaN(n) && Number.isFinite(n)) return n;
  }
  return null;
}

function pickChildCountFromRecord(obj: Record<string, unknown>): number | null {
  for (const key of CHILD_COUNT_KEYS) {
    const n = parseFiniteNumber(obj[key]);
    if (n != null) return n;
  }
  return null;
}

/** Sum children across assigned classes from per-class entries or a single total from the API. */
function sumChildrenInAssignedClasses(raw: unknown): number | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    let sum = 0;
    let found = false;
    for (const entry of raw) {
      if (entry == null) continue;
      const asNum = parseFiniteNumber(entry);
      if (asNum != null) {
        sum += asNum;
        found = true;
        continue;
      }
      if (typeof entry === "object") {
        const n = pickChildCountFromRecord(entry as Record<string, unknown>);
        if (n != null) {
          sum += n;
          found = true;
        }
      }
    }
    return found ? sum : null;
  }
  if (typeof raw === "object") {
    let sum = 0;
    let found = false;
    for (const v of Object.values(raw as Record<string, unknown>)) {
      const asNum = parseFiniteNumber(v);
      if (asNum != null) {
        sum += asNum;
        found = true;
        continue;
      }
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const n = pickChildCountFromRecord(v as Record<string, unknown>);
        if (n != null) {
          sum += n;
          found = true;
        }
      }
    }
    return found ? sum : null;
  }
  return null;
}

function formatTotalChildrenInClass(item: SummaryRow): ReactNode | string | number {
  const direct =
    item?.totalChildrenInAssignedClasses ??
    item?.totalChildrenInClasses ??
    item?.totalChildrenInClass ??
    item?.totalChildren ??
    item?.childrenInAssignedClasses;
  const directNum = parseFiniteNumber(direct);
  if (directNum != null) return directNum;

  const fromRatioByRoom = sumChildrenInAssignedClasses(item?.staffToChildRatioByRoom);
  if (fromRatioByRoom != null) return fromRatioByRoom;

  const fromClassrooms = sumChildrenInAssignedClasses(
    item?.assignedClassrooms ??
      item?.classroomsWithChildren ??
      item?.classroomBreakdown ??
      item?.classroomChildCounts,
  );
  if (fromClassrooms != null) return fromClassrooms;

  return "N/A";
}

export function useStaffReport(classroomId?: number | null, startDate?: string, endDate?: string) {
  const { filters, applyFilters } = useFilter({
    delta: ITEMS_PER_PAGE,
    pos: 0,
  });

  // Re-using student summary endpoint if appropriate, or check if there's a specific report endpoint
  const { data: response = {} as any, isLoading } = useQueryService({
    service: {
      ...analyticsServices.getStaffReport,
      data: {
        ...(filters?.delta ? { delta: filters?.delta } : {}),
        ...(filters?.pos ? { pos: filters?.pos } : {}),
        ...(classroomId ? { classroomId } : {}),
        ...(startDate && endDate ? { startDate, endDate } : {}),
      },
    },
    options: {
      keys: ["attendance-hours", filters.pos, filters.delta],
    },
  });

  // Handle both response structures: { data: [], pagination: {} } or just { data: [] }
  const summaryData = response?.data || [];
  const pagination = response?.pagination || {
    pos: filters?.pos || 0,
    delta: filters?.delta || ITEMS_PER_PAGE,
    count: summaryData.length,
  };

  const tableData = summaryData.map((item: SummaryRow) => ({
    staffName: (
      <div className="flex items-center gap-2">
        <InitialsAvatar
          src={String(item?.photoUrl || item?.staffPhoto || item?.profilePhoto || "")}
          name={String(item?.staffName || "")}
          className="w-10 h-10"
          initialsClassName="text-[10px]"
        />
        <span>{item?.staffName || "N/A"}</span>
      </div>
    ),
    role: formatReportStaffRole(
      String(item?.role || item?.staffRole || item?.jobRole || "N/A"),
    ),
    roomAssignment: renderRoomAssignmentCell(item),
    timecardHours: item?.timecardHours,
    totalChildrenInClass: formatTotalChildrenInClass(item),
  }));

  const currentPage =
    Math.floor((pagination?.pos || 0) / (pagination?.delta || ITEMS_PER_PAGE)) + 1;

  return {
    isLoading,
    tableData,
    currentPage,
    pagination,
    filters,
    applyFilters,
  };
}
