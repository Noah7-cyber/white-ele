/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { AttendanceServices, ClockInChildRequest, ClockOutChildRequest } from "@/services/attendance.service";
import { ParentDynamicEndpoints } from "@/services/parent.service";
import { showToast } from "@/modules/shared/component/Toast";
import useKioskVerify, { removeParentUid, getParentId } from "@/modules/kiosk/hooks/useKioskVerify";

export interface Child {
  id: string;
  name: string;
  studentId: string;
  classroom: string;
  age: string;
  photoUrl?: string;
  currentStatus: "Signed In" | "Signed Out";
  status: "Punctual" | "Late";
  lastClockInTime?: string;
  lastClockInDate?: string;
  currentClockInTime?: string;
  schedule: string[];
}

type AttendanceApiError = {
  response?: {
    data?: {
      message?: string;
      errors?: Array<{
        studentId?: number | string;
        name?: string;
        reason?: string;
      }>;
    };
  };
};
// Helper function to calculate age from date of birth
export const calculateAge = (dateOfBirth: string): string => {
  if (!dateOfBirth) return "N/A";
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  if (birthDate > today) return "0 months";
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (dayDiff < 0) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years > 0) return `${years} ${years === 1 ? "year" : "years"}`;
  return `${Math.max(0, months)} ${Math.max(0, months) === 1 ? "month" : "months"}`;
};

export default function useParentsDashboard() {
  const router = useRouter();
  const storedParentId = getParentId();

  // Fetch parent data with children and attendance
  const { data: parentResponse, isLoading: isParentLoading, refetch: refetchParent } = useQueryService<any, any>({
    service: ParentDynamicEndpoints.getParentById(storedParentId || ""),
    options: {
      enabled: !!storedParentId,
      refetchOnWindowFocus: false
    },
  });

  const parentData = parentResponse?.data;

  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clockedInChildren, setClockedInChildren] = useState<Record<string, string>>({});
  const [clockedOutChildren, setClockedOutChildren] = useState<Record<string, string>>({});

  const isChildScheduledForToday = useCallback((child: Child) => {
    const schedule = Array.isArray(child.schedule) ? child.schedule : [];
    if (schedule.length === 0) return false;

    const now = new Date();
    const weekdayLong = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const weekdayShort = now.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();
    const isoDate = now.toISOString().split("T")[0];
    const localDate = now.toLocaleDateString("en-CA");
    const normalizedWeekday = weekdayLong.slice(0, 3);

    return schedule.some((entry) => {
      const normalizedEntry = String(entry).trim().toLowerCase();
      if (!normalizedEntry) return false;

      return (
        normalizedEntry === weekdayLong ||
        normalizedEntry === weekdayShort ||
        normalizedEntry === normalizedWeekday ||
        normalizedEntry === isoDate ||
        normalizedEntry === localDate
      );
    });
  }, []);

  const canSelectChildForAttendance = useCallback(
    (child: Child) => child.currentStatus === "Signed In" || isChildScheduledForToday(child),
    [isChildScheduledForToday],
  );

  // Helper function to format time to "7:00 am" format
  const formatTimeToAMPM = useCallback((timeStr: string): string => {
    if (!timeStr) return "";

    try {
      if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
        return timeStr.replace(/\s*(AM|PM|am|pm)\s*/i, (match) => ` ${match.trim().toLowerCase()}`).trim();
      }

      const timeParts = timeStr.split(':');
      if (timeParts.length >= 2) {
        let hours = parseInt(timeParts[0], 10);
        const minutes = timeParts[1];
        const period = hours >= 12 ? 'pm' : 'am';

        if (hours === 0) {
          hours = 12;
        } else if (hours > 12) {
          hours = hours - 12;
        }

        return `${hours}:${minutes} ${period}`;
      }
      return timeStr;
    } catch (error) {
      return timeStr;
    }
  }, []);

  // Transform API children data to match Child interface
  const children = useMemo<Child[]>(() => {
    if (!parentData?.children) {
      return [];
    }

    return parentData.children.map((child: any) => {
      const fullName = `${child.user.firstName} ${child.user.middleName ? child.user.middleName + " " : ""}${child.user.lastName}`.trim();
      const age = child.user.dateOfBirth ? calculateAge(child.user.dateOfBirth) : "N/A";

      // Extract attendance data (added as per user request)
      const currentAttendance = child?.currentAttendance;
      const previousAttendance = child?.previousAttendance;

      // Determine status (Signed In/Signed Out)
      let currentStatus: "Signed In" | "Signed Out" = "Signed Out";
      if (currentAttendance?.timeIn && !currentAttendance?.timeOut) {
        currentStatus = "Signed In";
      }

      // Format current clock-in time
      const currentClockInTimeRaw = currentAttendance?.timeIn || "";
      const currentClockInTime = formatTimeToAMPM(currentClockInTimeRaw);

      // Get last clock-in time and date
      const lastClockInDate = previousAttendance?.date || "";
      const lastClockInTimeRaw = previousAttendance?.timeIn || "";
      const lastClockInTime = lastClockInTimeRaw ? formatTimeToAMPM(lastClockInTimeRaw).toUpperCase() : "";

      return {
        id: child.id.toString(),
        name: fullName,
        studentId: child.admissionNumber,
        classroom: child.classroom?.classroomName || "N/A",
        age: age,
        photoUrl: child.photoUrl || undefined,
        currentStatus,
        status: (currentAttendance?.status || previousAttendance?.status || "punctual") === "late" ? "Late" : "Punctual",
        lastClockInTime,
        lastClockInDate,
        currentClockInTime,
        schedule: child.schedule || [],
      };
    });
  }, [parentData, formatTimeToAMPM]);

  // Get parent name for greeting
  const parentName = useMemo(() => {
    if (!parentData?.user) return "Parent";
    return `${parentData.user.firstName} ${parentData.user.lastName}`.trim();
  }, [parentData]);

  const parentId = useMemo(() => parentData?.id || Number(storedParentId) || 0, [parentData, storedParentId]);

  // Clock-in mutation
  const { mutateAsync: clockInAsync, isPending: isClockInPending } = useMutationService<ClockInChildRequest, unknown>({
    service: AttendanceServices.clockInChild,
    options: { disableToast: true },
  });

  // Clock-out mutation
  const { mutateAsync: clockOutAsync, isPending: isClockOutPending } = useMutationService<ClockOutChildRequest, unknown>({
    service: AttendanceServices.clockOutChild,
    options: { disableToast: true },
  });

  const handleSelectAll = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedChildren(children.filter(canSelectChildForAttendance).map((child) => child.id));
    } else {
      setSelectedChildren([]);
    }
  }, [children, canSelectChildForAttendance]);

  const handleChildSelect = useCallback((childId: string) => {
    const child = children.find((item) => item.id === childId);
    if (!child) return;
    if (!canSelectChildForAttendance(child)) {
      const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
      showToast({
        message: "Schedule Constraint",
        description: `${child.name} is not scheduled for clock-in today (${today}).`,
        severity: "error",
      });
      return;
    }

    setSelectedChildren((prev) => {
      const newSelection = prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId];
      const selectableCount = children.filter(canSelectChildForAttendance).length;
      setSelectAll(selectableCount > 0 && newSelection.length === selectableCount);
      return newSelection;
    });
  }, [children, canSelectChildForAttendance]);

  const handleLogout = useCallback(() => {
    // Clear sessionStorage on logout
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("kiosk_verify_data");
    }
    removeParentUid();
    router.push("/kiosk/parents/login");
  }, [router]);

  const handleChildClick = useCallback((child: Child) => {
    setSelectedChild(child);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedChild(null);
  }, []);

  const getCurrentTime = useCallback(() => {
    const now = new Date();
    return now
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
  }, []);


  const onAttendanceSuccess = useCallback(() => {
    refetchParent();
    setSelectedChildren([]);
    setSelectAll(false);
  }, [refetchParent]);

  const handleBulkClockIn = useCallback(async () => {
    if (selectedChildren.length === 0 || !parentId) return;

    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const unscheduledChildrenNames = selectedChildren
      .map((id) => children.find((c) => c.id === id))
      .filter((child): child is Child => Boolean(child && !isChildScheduledForToday(child)))
      .map((child) => child?.name);

    if (unscheduledChildrenNames.length > 0) {
      showToast({
        message: "Schedule Constraint",
        description: `${unscheduledChildrenNames.join(", ")} ${unscheduledChildrenNames.length > 1 ? "are" : "is"} not scheduled for clock-in today (${today}).`,
        severity: "error",
      });
      return;
    }

    try {
      // Prepare clock-in payload with new structure
      const payload: ClockInChildRequest = {
        parentId: parentId,
        studentIds: selectedChildren.map((childId) => Number(childId)),
        notes: undefined,
      };

      await clockInAsync(payload);
      refetchParent();
      // Update UI state
      const newClockedIn: Record<string, string> = {};
      selectedChildren.forEach((childId) => {
        newClockedIn[childId] = getCurrentTime();
        // Remove from clocked out if they were clocked out
        setClockedOutChildren((prev) => {
          const updated = { ...prev };
          delete updated[childId];
          return updated;
        });
      });

      setClockedInChildren((prev) => ({
        ...prev,
        ...newClockedIn,
      }));

      showToast({
        message: `Clocked In Successful`,
        description: `Your children have been successfully clocked in.`,
        severity: "success",
      });

      setSelectedChildren([]);
      setSelectAll(false);

    } catch (err: unknown) {
      let description = "Failed to clock in children.";
      if (typeof err === "object" && err !== null) {
        const e = err as AttendanceApiError;
        const reasons = (e?.response?.data?.errors ?? [])
          .map((item) => {
            const person = item?.name || `Student ${item?.studentId ?? ""}`.trim();
            const reason = item?.reason?.trim();
            if (!reason) return null;
            return `${person}: ${reason}`;
          })
          .filter(Boolean)
          .join(" | ");
        description = reasons || e.response?.data?.message || description;
      }

      showToast({
        message: "Bulk Clock-In Error",
        description,
        severity: "error",
      });
    }
  }, [selectedChildren, parentId, children, getCurrentTime, clockInAsync, refetchParent, isChildScheduledForToday]);

  const handleBulkClockOut = useCallback(async () => {
    if (selectedChildren.length === 0 || !parentId) return;

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    try {
      // Prepare clock-out payload with new structure
      const payload: ClockOutChildRequest = {
        parentId: parentId,
        studentIds: selectedChildren.map((childId) => Number(childId)),
        timeOut: timeStr,
        notes: undefined,
      };

      await clockOutAsync(payload);
      refetchParent();
      // Update UI state
      const newClockedOut: Record<string, string> = {};
      selectedChildren.forEach((childId) => {
        newClockedOut[childId] = getCurrentTime();
        // Remove from clocked in if they were clocked in
        setClockedInChildren((prev) => {
          const updated = { ...prev };
          delete updated[childId];
          return updated;
        });
      });

      setClockedOutChildren((prev) => ({
        ...prev,
        ...newClockedOut,
      }));

      showToast({
        message: `Clocked out Successful`,
        description: `Your children have been successfully clocked out.`,
        severity: "success",
      });

      setSelectedChildren([]);
      setSelectAll(false);
    } catch (err: unknown) {
      let description = "Failed to clock out children.";
      if (typeof err === "object" && err !== null) {
        const e = err as { response?: { data?: { message?: string } } };
        description = e.response?.data?.message ?? description;
      }

      showToast({
        message: "Bulk Clock-Out Error",
        description,
        severity: "error",
      });
    }
  }, [selectedChildren, parentId, children, getCurrentTime, clockOutAsync, refetchParent]);

  // Check if any selected children are clocked in (for showing clock out option)
  const hasClockedInSelected = useMemo(() =>
    selectedChildren.length > 0 &&
    selectedChildren.some((id) => {
      const child = children.find(c => c.id === id);
      return child?.currentStatus === "Signed In";
    }),
    [selectedChildren, children]
  );

  // Check if any selected children are clocked out or not clocked in (for showing clock in option)
  const hasNotClockedInSelected = useMemo(() =>
    selectedChildren.length > 0 &&
    selectedChildren.some((id) => {
      const child = children.find(c => c.id === id);
      return child?.currentStatus === "Signed Out";
    }),
    [selectedChildren, children]
  );

  const handleClearSelection = useCallback(() => {
    setSelectedChildren([]);
    setSelectAll(false);
  }, []);

  const hasUnscheduledClockInSelected = useMemo(
    () =>
      selectedChildren.some((id) => {
        const child = children.find((item) => item.id === id);
        return Boolean(child && child.currentStatus === "Signed Out" && !isChildScheduledForToday(child));
      }),
    [selectedChildren, children, isChildScheduledForToday],
  );

  const isChildClockedIn = useCallback((childId: string) => {
    const child = children.find(c => c.id === childId);
    if (child) return child.currentStatus === "Signed In";
    return !!clockedInChildren[childId] && !clockedOutChildren[childId];
  }, [children, clockedInChildren, clockedOutChildren]);

  return {
    children,
    parentName,
    parentId,
    selectedChildren,
    selectAll,
    selectedChild,
    isModalOpen,
    clockedInChildren,
    clockedOutChildren,
    hasClockedInSelected,
    hasNotClockedInSelected,
    isClockInPending,
    isClockOutPending,
    isParentLoading,
    handleSelectAll,
    handleChildSelect,
    handleLogout,
    handleChildClick,
    handleCloseModal,
    handleBulkClockIn,
    handleBulkClockOut,
    onAttendanceSuccess,
    handleClearSelection,
    isChildClockedIn,
    isChildScheduledForToday,
    canSelectChildForAttendance,
    hasUnscheduledClockInSelected,
  } as const;
}
