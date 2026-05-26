/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback } from "react";
import { useMutationService } from "@/utils/hooks/useMutationService";
import {
  AttendanceServices,
  ClockInAdminRequest,
  ClockInStaffRequest,
  ClockOutAdminRequest,
  ClockOutStaffRequest,
} from "@/services/attendance.service";
import { showToast } from "@/modules/shared/component/Toast";
import { KioskTeacher } from "../../TeachersKiosk/hooks/useTeachersKiosk";

export default function useTeacherDetailModal({
  teacher,
  isClockedIn,
  onClose,
  onClockIn,
  onClockOut,
}: {
  teacher: KioskTeacher | null;
  isClockedIn: boolean;
  onClose: () => void;
  onClockIn: (notes: string) => void;
  onClockOut: (notes: string) => void;
}) {
  const [notes, setNotes] = useState("");

  const { mutateAsync: clockInAsync, isPending: isClockInPending } = useMutationService<ClockInStaffRequest, unknown>({
    service: AttendanceServices.clockInStaff,
    options: { disableToast: true },
  });

  const { mutateAsync: clockOutAsync, isPending: isClockOutPending } = useMutationService<ClockOutStaffRequest, unknown>({
    service: AttendanceServices.clockOutStaff,
    options: { disableToast: true },
  });

  const { mutateAsync: clockInAdminAsync, isPending: isClockInAdminPending } = useMutationService<
    ClockInAdminRequest,
    unknown
  >({
    service: AttendanceServices.clockInAdmin,
    options: { disableToast: true },
  });

  const { mutateAsync: clockOutAdminAsync, isPending: isClockOutAdminPending } = useMutationService<
    ClockOutAdminRequest,
    unknown
  >({
    service: AttendanceServices.clockOutAdmin,
    options: { disableToast: true },
  });

  const isRecording =
    isClockInPending || isClockOutPending || isClockInAdminPending || isClockOutAdminPending;

  const handleAction = useCallback(async () => {
    if (!teacher) return;

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    try {
      if (isClockedIn) {
        if (teacher.entityType === "admin") {
          const payload: ClockOutAdminRequest = {
            adminId: teacher.recordId,
            timeOut: timeStr,
            notes: notes || undefined,
          };
          await clockOutAdminAsync(payload);
        } else {
          const payload: ClockOutStaffRequest = {
            teacherId: teacher.recordId,
            timeOut: timeStr,
            notes: notes || undefined,
          };
          await clockOutAsync(payload);
        }
        onClockOut(notes || "");
      } else {
        if (teacher.entityType === "admin") {
          const payload: ClockInAdminRequest = {
            adminId: teacher.recordId,
            notes: notes || undefined,
          };
          await clockInAdminAsync(payload);
        } else {
          const payload: ClockInStaffRequest = {
            teacherId: teacher.recordId,
            notes: notes || undefined,
          };
          await clockInAsync(payload);
        }
        onClockIn(notes || "");
      }

      setNotes("");
    } catch (err: any) {
      let description = isClockedIn ? "Failed to clock out." : "Failed to clock in.";
      if (typeof err === "object" && err !== null) {
        const e = err as { response?: { data?: { message?: string } } };
        description = e.response?.data?.message ?? description;
      }

      showToast({
        message: err?.message || "Attendance Error",
        description,
        severity: "error",
      });
    }
  }, [
    teacher,
    isClockedIn,
    notes,
    clockInAdminAsync,
    clockInAsync,
    clockOutAdminAsync,
    clockOutAsync,
    onClockIn,
    onClockOut,
  ]);

  const formatLastClockIn = useCallback((time: string, date: string) => {
    if (!time || !date) return "";
    
    try {
      // Parse the date string
      const dateObj = new Date(date);
      
      // Format time (ensure uppercase AM/PM)
      const formattedTime = time.toUpperCase();
      
      // Format date as "Tues, Jan 12, 2026"
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      
      return `${formattedTime} (${formattedDate})`;
    } catch {
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
    handleAction,
    handleClose,
    formatLastClockIn,
  } as const;
}
