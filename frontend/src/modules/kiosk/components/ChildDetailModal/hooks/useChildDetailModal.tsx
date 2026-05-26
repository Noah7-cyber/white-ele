"use client";

import { useState, useCallback } from "react";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { AttendanceServices, ClockInChildRequest, ClockOutChildRequest } from "@/services/attendance.service";
import { showToast } from "@/modules/shared/component/Toast";

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
export default function useChildDetailModal({
  child,
  parentId,
  isClockedIn,
  onClose,
  onClockIn,
  onClockOut,
}: {
  child: Child | null;
  parentId: number;
  isClockedIn: boolean;
  onClose: () => void;
  onClockIn: (notes: string) => void;
  onClockOut: (notes: string) => void;
}) {
  const [notes, setNotes] = useState("");

  const { mutateAsync: clockInAsync, isPending: isClockInPending } = useMutationService<ClockInChildRequest, unknown>({
    service: AttendanceServices.clockInChild,
    options: { disableToast: true },
  });

  const { mutateAsync: clockOutAsync, isPending: isClockOutPending } = useMutationService<ClockOutChildRequest, unknown>({
    service: AttendanceServices.clockOutChild,
    options: { disableToast: true },
  });

  const isRecording = isClockInPending || isClockOutPending;
  const isScheduledForToday = useCallback((schedule: string[]) => {
    const normalizedSchedule = Array.isArray(schedule) ? schedule : [];
    if (normalizedSchedule.length === 0) return false;

    const now = new Date();
    const weekdayLong = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const weekdayShort = now.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();
    const isoDate = now.toISOString().split("T")[0];
    const localDate = now.toLocaleDateString("en-CA");
    const normalizedWeekday = weekdayLong.slice(0, 3);

    return normalizedSchedule.some((entry) => {
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
  const isClockInBlockedBySchedule = Boolean(child && !isClockedIn && !isScheduledForToday(child.schedule));

  const handleAction = useCallback(async () => {
    if (!child) return;

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    try {
      if (isClockedIn) {
        // Clock out - send parentId, studentIds array, timeOut, and notes
        const payload: ClockOutChildRequest = {
          parentId: parentId,
          studentIds: [Number(child.id)],
          timeOut: timeStr,
          notes: notes || undefined,
        };

        await clockOutAsync(payload);
        onClockOut(notes || "");
        showToast({
          message: `Clocked out ${child.name}`,
          description: `Your child has been successfully clocked out.`,
          severity: "success",
        });
        onClose();
      } else {
        // Clock in - check schedule first
        const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
        if (!isScheduledForToday(child.schedule)) {
          showToast({
            message: "Schedule Constraint",
            description: `${child.name} is not scheduled for clock-in today (${today}).`,
            severity: "error",
          });
          return;
        }

        // Clock in - send parentId, studentIds array, and notes
        const payload: ClockInChildRequest = {
          parentId: parentId,
          studentIds: [Number(child.id)],
          notes: notes || undefined,
        };

        await clockInAsync(payload);
        onClockIn(notes || "");
        showToast({
          message: `Clocked in ${child.name}`,
          description: `Your child has been successfully clocked in.`,
          severity: "success",
        });
        onClose();
      }

      setNotes("");
    } catch (err: unknown) {
      let description = isClockedIn ? "Failed to clock out." : "Failed to clock in.";
      if (typeof err === "object" && err !== null) {
        const e = err as { response?: { data?: { message?: string } } };
        description = e.response?.data?.message ?? description;
      }

      showToast({
        message: "Attendance Error",
        description,
        severity: "error",
      });
    }
  }, [child, parentId, isClockedIn, notes, clockInAsync, clockOutAsync, onClockIn, onClockOut, isScheduledForToday]);

  const formatLastClockIn = useCallback((time: string, date: string) => {
    if (!time || !date) return "";

    try {
      const dateObj = new Date(date);
      const formattedTime = time.toUpperCase();
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      return `${formattedTime} (${formattedDate})`;
    } catch (error) {
      return `${time} (${date})`;
    }
  }, []);

  const handleClose = useCallback(() => {
    setNotes("");
    onClose();
  }, [onClose]);

  return {
    notes,
    setNotes,
    isRecording,
    isClockInBlockedBySchedule,
    handleAction,
    handleClose,
    formatLastClockIn,
  } as const;
}
