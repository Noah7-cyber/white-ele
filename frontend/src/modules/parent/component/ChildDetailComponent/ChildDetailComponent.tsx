"use client";

import type React from "react";
import Link from "next/link";
import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
import { useParams, usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { useChildDetail } from "./hooks/useChildDetail";
import { createContext, useContext, useMemo, useState } from "react";
import CaretDown from "@/modules/shared/assets/svgs/caretDown.svg";
import TimeRangeFilterPopover from "@/modules/shared/component/FilterPopover/timeRangeFilterPopover";
import { PERIOD_OPTIONS } from "@/constants";
import { getDateRangeByPeriodType } from "@/utils/helpers";
import ScrollableTabBar from "@/layout/Shared/ScrollableTabBar";
import { Button } from "@/modules/shared/component/Button";
import {
  AttendanceServices,
  ClockInChildRequest,
  ClockOutChildRequest,
} from "@/services/attendance.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { showToast } from "@/modules/shared/component/Toast";
import { useUser } from "@/utils/hooks/useUser";

type ChildPageKey = "profile" | "activities" | "attendance" | "invoices" | "results";

type AttendanceApiError = {
  success?: boolean;
  code?: string;
  message?: string;
  errors?: Array<{
    studentId?: number | string;
    name?: string;
    reason?: string;
  }>;
  data?: {
    code?: string;
    message?: string;
    errors?: Array<{
      studentId?: number | string;
      name?: string;
      reason?: string;
    }>;
  };
  error?: {
    code?: string;
    message?: string;
    errors?: Array<{
      studentId?: number | string;
      name?: string;
      reason?: string;
    }>;
  };
  response?: {
    data?: {
      code?: string;
      message?: string;
      errors?: Array<{
        studentId?: number | string;
        name?: string;
        reason?: string;
      }>;
    };
  };
};

const CHILD_NAV: Array<{ key: ChildPageKey; label: string }> = [
  { key: "profile", label: "Profile" },
  { key: "activities", label: "Activities" },
  { key: "attendance", label: "Attendance" },
  { key: "invoices", label: "Invoices" },
  { key: "results", label: "Results" },
];

type ChildDateFilterContextValue = {
  currentPeriod: string;
  startDate: string;
  endDate: string;
  setPeriod: (period: string) => void;
  setCustomRange: (startDate: string, endDate: string) => void;
};

type AttendanceErrorPayload = {
  code?: string;
  message?: string;
  errors?: Array<{
    studentId?: number | string;
    name?: string;
    reason?: string;
  }>;
};

const ChildDateFilterContext = createContext<ChildDateFilterContextValue | null>(null);

export function useChildDateFilter() {
  const ctx = useContext(ChildDateFilterContext);
  if (!ctx) throw new Error("useChildDateFilter must be used within ChildDetailShell");
  return ctx;
}

export function ChildDetailShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { id } = useParams() as { id: string };

  const { childData, loading, refetchChild } = useChildDetail(id as string);
  const { parentId } = useUser();
  const { mutateAsync: clockInAsync, isPending: isClockInPending } = useMutationService<
    ClockInChildRequest,
    unknown
  >({
    service: AttendanceServices.clockInChild,
    options: { disableToast: true },
  });
  const { mutateAsync: clockOutAsync, isPending: isClockOutPending } = useMutationService<
    ClockOutChildRequest,
    unknown
  >({
    service: AttendanceServices.clockOutChild,
    options: { disableToast: true },
  });

  // ---- Header filter (AdminHome style) ----
  const [periodAnchorEl, setPeriodAnchorEl] = useState<HTMLElement | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<string>("This week");
  const initialRange = useMemo(() => getDateRangeByPeriodType(currentPeriod), [currentPeriod]);
  const [startDate, setStartDate] = useState<string>(initialRange.startDate);
  const [endDate, setEndDate] = useState<string>(initialRange.endDate);

  const currentKey: ChildPageKey = (() => {
    const last = pathname?.split("/").filter(Boolean).pop();
    if (!last) return "profile";
    if (["profile", "activities", "attendance", "invoices", "results"].includes(last)) {
      return last as ChildPageKey;
    }
    return "profile";
  })();

  const ctxValue: ChildDateFilterContextValue = useMemo(
    () => ({
      currentPeriod,
      startDate,
      endDate,
      setPeriod: (p) => {
        setCurrentPeriod(p);
        if (p !== "Custom") {
          const r = getDateRangeByPeriodType(p);
          setStartDate(r.startDate);
          setEndDate(r.endDate);
        }
      },
      setCustomRange: (s, e) => {
        setCurrentPeriod("Custom");
        setStartDate(s);
        setEndDate(e);
      },
    }),
    [currentPeriod, startDate, endDate],
  );

  if (loading) {
    return (
      <Box className="p-8 flex items-center justify-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  if (!childData) {
    router.back();
    return null;
  }

  const fullName = `${childData.user.firstName} ${childData.user.lastName}`;
  const currentAttendance = childData.attendance?.currentAttendance;
  const currentStatus = String(currentAttendance?.status || "absent").toLowerCase();
  const isClockedIn = currentStatus === "present" || currentStatus === "late";
  const statusClassName =
    currentStatus === "present"
      ? "bg-[#E6FFF3] text-[#0A8A4C]"
      : currentStatus === "late"
        ? "bg-[#FFF6DD] text-[#A88400]"
        : "bg-[#FFE6E6] text-[#C74444]";
  const statusLabel = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);
  const isScheduledForToday = (() => {
    const schedule = Array.isArray(childData.schedule) ? childData.schedule : [];
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
  })();
  const isClockInBlockedBySchedule = !isClockedIn && !isScheduledForToday;

  const handleClockAction = async () => {
    if (!parentId || !childData?.id) return;
    if (isClockInBlockedBySchedule) {
      const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
      showToast({
        message: "Schedule Constraint",
        description: `${fullName} is not scheduled for clock-in today (${today}).`,
        severity: "error",
      });
      return;
    }
    try {
      if (isClockedIn) {
        const now = new Date();
        const timeOut = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        await clockOutAsync({
          parentId,
          studentIds: [Number(childData.id)],
          timeOut,
        });
        showToast({
          message: `${fullName} clocked out`,
          severity: "success",
        });
      } else {
        await clockInAsync({
          parentId,
          studentIds: [Number(childData.id)],
        });
        showToast({
          message: `${fullName} clocked in`,
          severity: "success",
        });
      }
      await refetchChild();
    } catch (error) {
      const fallbackMessage = isClockedIn
        ? "Failed to clock out child."
        : "Failed to clock in child.";
      const e = error as AttendanceApiError;
      const getAttendanceErrorPayload = (err: AttendanceApiError): AttendanceErrorPayload => {
        const responseData = err?.response?.data;
        const possiblePayloads: AttendanceErrorPayload[] = [
          {
            code: err?.code,
            message: err?.message,
            errors: err?.errors,
          },
          responseData as AttendanceErrorPayload,
          (responseData as { data?: AttendanceErrorPayload })?.data ?? {},
          err?.data ?? {},
          err?.error ?? {},
        ];

        return (
          possiblePayloads.find(
            (payload) =>
              Array.isArray(payload?.errors) || Boolean(payload?.message) || Boolean(payload?.code),
          ) ?? {}
        );
      };

      const payload = getAttendanceErrorPayload(e);
      const childId = Number(childData.id);
      const apiErrors = Array.isArray(payload?.errors) ? payload.errors : [];
      const specificReason = apiErrors.find((item) => Number(item?.studentId) === childId)?.reason?.trim();
      const firstAvailableReason = apiErrors.find((item) => item?.reason?.trim())?.reason?.trim();
      const resolvedReason = specificReason || firstAvailableReason;

      showToast({
        message: "Attendance Error",
        description: resolvedReason || payload?.message || fallbackMessage,
        severity: "error",
      });
    }
  };

  const periodOptions = PERIOD_OPTIONS.map((o) => ({ label: o.name, value: o.name }));
  const showHeaderFilter = currentKey !== "profile";

  return (
    <ChildDateFilterContext.Provider value={ctxValue}>
      <Box className="p-5 flex flex-col gap-6 w-full">
        <Box className="flex items-center w-full justify-between">
          <Box className="flex items-start sm:items-center w-full gap-5 justify-between">
            <Box className="flex items-center gap-3">
              <IconButton
                onClick={() => router.back()}
                className="rounded-full! border! border-brandColor-active/20!"
              >
                <Image src={LeftIcon || "/placeholder.svg"} alt="back" width={20} height={20} />
              </IconButton>

              <Box className="flex items-center gap-2">
                <Typography className="!text-base sm:!text-xl !font-semibold">
                  {fullName}
                </Typography>
              </Box>
            </Box>

            <Box className="flex gap-3 items-center justify-between">
              <Box
                className={`${isClockInBlockedBySchedule ? "hidden " : "inline-flex"}  px-3 py-1 rounded-full text-xs font-semibold ${statusClassName}`}
              >
                {statusLabel}
              </Box>
              <Box className="flex flex-col sm:flex-row items-center gap-2">
                <Button
                  onClick={handleClockAction}
                  disabled={!parentId || isClockInPending || isClockOutPending}
                  className={`!rounded-lg !px-4 !py-2 !text-sm !font-medium !bg-brandColor-active !text-white ${
                    isClockInBlockedBySchedule ? "!bg-gray-300 !text-gray-600" : ""
                  }`}
                >
                  {isClockInPending || isClockOutPending ? (
                    <CircularProgress size={20} className="!text-white" />
                  ) : isClockedIn ? (
                    "Clock Out"
                  ) : (
                    "Clock In"
                  )}
                </Button>
                {isClockInBlockedBySchedule && (
                  <Typography className="!text-xs !font-medium !text-red-600">
                    Not scheduled for today
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {showHeaderFilter && (
            <Box className="hidden md:flex gap-3">
              <button
                type="button"
                onClick={(e) => setPeriodAnchorEl(e.currentTarget)}
                className="!rounded-lg !border !border-[#D0D5DD] !text-[#022F2F] !bg-transparent text-sm flex items-center gap-2 px-3 py-2"
              >
                {currentPeriod} <CaretDown className="ml-2" />
              </button>
              <TimeRangeFilterPopover
                open={Boolean(periodAnchorEl)}
                anchorEl={periodAnchorEl}
                onClose={() => setPeriodAnchorEl(null)}
                options={periodOptions}
                onSelect={(value) => {
                  ctxValue.setPeriod(value);
                  setPeriodAnchorEl(null);
                }}
                onCustomApply={(s, e) => {
                  ctxValue.setCustomRange(s, e);
                  setPeriodAnchorEl(null);
                }}
                currentStartDate={startDate}
                currentEndDate={endDate}
                customButtonLabel="OK"
                width={140}
              />
            </Box>
          )}
        </Box>

        {/* --- Tabs (but routed pages) --- */}
        <ScrollableTabBar className="border-b border-border-lightGray">
          {CHILD_NAV.map((item) => {
            const href = `/parent/children/${id}/${item.key}`;
            const isActive = currentKey === item.key;
            return (
              <Link
                key={item.key}
                href={href}
                className={`shrink-0 whitespace-nowrap pb-2 px-3 hover:cursor-pointer ${
                  isActive
                    ? "!text-brandColor-active border-b border-brandColor-active font-medium"
                    : "text-gray-500"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </ScrollableTabBar>

        <Box className="min-w-0">{children}</Box>
      </Box>
    </ChildDateFilterContext.Provider>
  );
}
