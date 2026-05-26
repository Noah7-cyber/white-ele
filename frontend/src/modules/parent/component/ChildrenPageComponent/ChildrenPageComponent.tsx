"use client";

import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ParentRoutes } from "@/routes/parent.routes";
import { useChildren } from "./hooks/useChildren";
import { calculateAge } from "@/modules/kiosk/components/ParentsDashboard/hooks/useParentsDashboard";
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";
import { Modal } from "@/modules/shared/component/modal";
import { Button } from "@/modules/shared/component/Button";
import { useMutationService } from "@/utils/hooks/useMutationService";
import {
  AttendanceServices,
  ClockInChildRequest,
  ClockOutChildRequest,
} from "@/services/attendance.service";
import { showToast } from "@/modules/shared/component/Toast";

export function ChildrenPageComponent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { children, isLoading, error, parentId, refetchChildren } = useChildren();
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = React.useState(false);
  const [pendingChildIds, setPendingChildIds] = React.useState<Record<number, boolean>>({});

  const shouldOpenAttendanceModal = React.useMemo(
    () => searchParams?.get("openAttendanceModal") === "1",
    [searchParams],
  );

  const hasAutoOpenedAttendanceModalRef = React.useRef(false);

  React.useEffect(() => {
    if (!shouldOpenAttendanceModal || hasAutoOpenedAttendanceModalRef.current) return;
    hasAutoOpenedAttendanceModalRef.current = true;
    setIsAttendanceModalOpen(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.delete("openAttendanceModal");
      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      window.history.replaceState({}, "", nextUrl);
    }
  }, [pathname, searchParams, shouldOpenAttendanceModal]);

  const clearOpenAttendanceModalQuery = React.useCallback(() => {
    if (!pathname || typeof window === "undefined") return;
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("openAttendanceModal");
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    window.history.replaceState({}, "", nextUrl);
  }, [pathname, searchParams]);

  const closeAttendanceModal = React.useCallback(() => {
    setIsAttendanceModalOpen(false);
    if (shouldOpenAttendanceModal) {
      clearOpenAttendanceModalQuery();
    }
  }, [clearOpenAttendanceModalQuery, shouldOpenAttendanceModal]);

  const { mutateAsync: clockInChildAsync } = useMutationService<ClockInChildRequest, unknown>({
    service: AttendanceServices.clockInChild,
    options: { disableToast: true },
  });

  const { mutateAsync: clockOutChildAsync } = useMutationService<ClockOutChildRequest, unknown>({
    service: AttendanceServices.clockOutChild,
    options: { disableToast: true },
  });

  const formatTimeForClockOut = React.useCallback(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }, []);

  const isChildClockedIn = React.useCallback((child: (typeof children)[number]) => {
    return Boolean(child?.currentAttendance?.timeIn && !child?.currentAttendance?.timeOut);
  }, []);

  const isChildScheduledForToday = React.useCallback((child: (typeof children)[number]) => {
    const schedule = Array.isArray(child?.schedule) ? child?.schedule : [];
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

      if (
        normalizedEntry === weekdayLong ||
        normalizedEntry === weekdayShort ||
        normalizedEntry === normalizedWeekday
      ) {
        return true;
      }

      if (normalizedEntry === isoDate || normalizedEntry === localDate) {
        return true;
      }

      return false;
    });
  }, []);

  const getChildAdmissionBadge = React.useCallback((child: (typeof children)[number]) => {
    const normalizedStatus = String(child?.status || "")
      .trim()
      .toLowerCase()
      .replace(/[_-]/g, " ");

    if (
      normalizedStatus.includes("offer not accepted") ||
      normalizedStatus.includes("offer pending") ||
      normalizedStatus.includes("pending offer")
    ) {
      return "Offer Not Accepted";
    }

    if (!child?.user?.isActive || normalizedStatus.includes("inactive")) {
      return "Inactive";
    }

    return null;
  }, []);

  const getChildFullName = React.useCallback((child: (typeof children)[number]) => {
    const firstName = child?.user?.firstName?.trim() || "";
    const middleName = child?.user?.middleName?.trim() || "";
    const lastName = child?.user?.lastName?.trim() || "";
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
    return fullName || "Unnamed child";
  }, []);

  const getChildClassroomName = React.useCallback((child: (typeof children)[number]) => {
    return child?.classroom?.classroomName || "No class assigned";
  }, []);

  const getAttendancePercentageText = React.useCallback((child: (typeof children)[number]) => {
    const attendancePercentage =
      typeof child?.attendancePercentage === "number" ? child.attendancePercentage : 0;
    return `${attendancePercentage.toFixed(2)}% attendance`;
  }, []);

  const handleChildAttendanceAction = React.useCallback(
    async (child: (typeof children)[number]) => {
      if (!parentId) return;
      const childId = child?.id;
      const clockedIn = isChildClockedIn(child);
      const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
      const isScheduledForToday = isChildScheduledForToday(child);

      if (!clockedIn && !isScheduledForToday) {
        showToast({
          message: "Schedule Constraint",
          description: `${child?.user.firstName} is not scheduled for clock-in today (${today}).`,
          severity: "error",
        });
        return;
      }

      setPendingChildIds((prev) => ({ ...prev, [childId]: true }));
      try {
        if (clockedIn) {
          await clockOutChildAsync({
            parentId,
            studentIds: [childId],
            timeOut: formatTimeForClockOut(),
          });
          showToast({
            message: "Clocked out",
            description: `${child?.user.firstName} has been clocked out successfully.`,
            severity: "success",
          });
        } else {
          await clockInChildAsync({
            parentId,
            studentIds: [childId],
          });
          showToast({
            message: "Clocked in",
            description: `${child?.user.firstName} has been clocked in successfully.`,
            severity: "success",
          });
        }
        await refetchChildren();
      } catch (err) {
        const e = err as { response?: { data?: { message?: string } } };
        showToast({
          message: "Action failed",
          description: e?.response?.data?.message || "Unable to update attendance right now.",
          severity: "error",
        });
      } finally {
        setPendingChildIds((prev) => {
          const next = { ...prev };
          delete next[childId];
          return next;
        });
      }
    },
    [
      clockInChildAsync,
      clockOutChildAsync,
      formatTimeForClockOut,
      isChildClockedIn,
      isChildScheduledForToday,
      parentId,
      refetchChildren,
    ],
  );

  if (isLoading) {
    return (
      <Box className="flex flex-col gap-4 p-4 md:p-5 h-full items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="flex flex-col gap-4 p-4 md:p-5 h-full">
        <Typography className="hidden md:block !text-xl !font-semibold">Children</Typography>
        <Box className="bg-red-50 border border-red-200 rounded-lg p-4">
          <Typography className="!text-sm !text-red-600">{error}</Typography>
        </Box>
      </Box>
    );
  }

  if (children.length === 0) {
    return (
      <Box className="flex flex-col gap-4 p-4 md:p-5 h-full">
        <Typography className="hidden md:block !text-xl !font-semibold">Children</Typography>
        <Box className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Typography className="!text-sm !text-gray-500">No children found</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col gap-4 p-4 md:p-5 h-full">
      <Typography className="hidden md:block !text-xl !text-text-primary !font-semibold">
        Children
      </Typography>
      <div className="grid lg:grid-cols-2 grid-cols-1 gap-3">
        {children.map((child) => {
          const fullName = getChildFullName(child);
          const age = calculateAge(child?.user.dateOfBirth);
          const classroomName = getChildClassroomName(child);
          const admissionBadge = getChildAdmissionBadge(child);
          const isClickable = !admissionBadge;

          return (
            <Box
              key={child?.id}
              className={`rounded-xl md:rounded-2xl p-4 relative bg-white border border-[#E4E7EC] shadow-sm ${
                isClickable ? "cursor-pointer active:opacity-95" : "cursor-not-allowed opacity-85"
              }`}
              onClick={() => {
                if (!isClickable) return;
                router.push(`${ParentRoutes.children}/${child?.id}`);
              }}
            >
              <div className="flex items-center gap-3">
                <InitialsAvatar
                  src={child?.photoUrl}
                  name={fullName}
                  className="w-15 h-15 shrink-0"
                  initialsClassName="text-sm"
                />
                <div className="flex-1 min-w-0">
                  <Typography className="text-base! font-medium! text-gray-800! mb-0.5!">
                    {fullName}
                  </Typography>
                  <Typography className="text-xs! text-[#02273ACC] font-normal! mb-3!">
                    {child?.admissionNumber}
                  </Typography>
                  <Typography className={`text-sm! font-normal! mb-0.5!`}>
                    {classroomName}
                  </Typography>
                  <Typography className="text-xs! text-gray-500! font-normal!">{age}</Typography>
                </div>
                {admissionBadge && (
                    <Box className="inline-flex rounded-full bg-red-50 px-2.5 py-1 mb-2 border border-red-200">
                      <Typography className="!text-[11px] !font-semibold !text-red-700 whitespace-nowrap">
                        {admissionBadge}
                      </Typography>
                    </Box>
                  )}
                <div className="hidden md:block bg-[#EDFFF7] rounded-full px-4 py-2 self-center">
                  {" "}
                  <Typography className="!text-[12px] !font-medium !text-[#057646] whitespace-nowrap">
                    {getAttendancePercentageText(child)}
                  </Typography>
                  
                </div>
              </div>
            </Box>
          );
        })}
      </div>

      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={closeAttendanceModal}
        className="md:w-[700px] w-[92vw] p-6! rounded-md!"
      >
        <Box className="flex flex-col gap-4">
          <Box className="flex flex-col gap-1">
            <Typography className="text-xl! font-bold! text-primary-dark!">
              Children Attendance
            </Typography>
            <Typography className="text-sm! text-text-tertiary/70!">
              Clock in or out each child directly from this page.
            </Typography>
          </Box>

          <Box className="flex flex-col gap-3 max-h-[65vh] overflow-y-auto pr-1">
            {children.map((child) => {
              const fullName = getChildFullName(child);
              const age = calculateAge(child?.user.dateOfBirth);
              const classroomName = getChildClassroomName(child);
              const clockedIn = isChildClockedIn(child);
              const isPending = Boolean(pendingChildIds[child?.id]);
              const isScheduledForToday = isChildScheduledForToday(child);
              const isClockInDisabled = !clockedIn && !isScheduledForToday;

              return (
                <Box
                  key={`attendance-modal-${child?.id}`}
                  className="rounded-xl border border-[#E4E7EC] bg-white p-3 flex items-center justify-between gap-3"
                >
                  <Box className="flex items-center justify-between gap-3 min-w-0">
                    <InitialsAvatar
                      src={child?.photoUrl}
                      name={fullName}
                      className="w-12 h-12 shrink-0"
                      initialsClassName="text-xs"
                    />
                    <Box className="min-w-0">
                      <Typography className="text-sm! font-semibold! text-primary-dark! truncate">
                        {fullName}
                      </Typography>
                      <Typography className="text-xs! text-text-tertiary/70! truncate">
                        {classroomName} • {age}
                      </Typography>
                      {!clockedIn && !isScheduledForToday && (
                        <Typography className="text-xs! !font-medium !text-red-600">
                          Not scheduled for today
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Button
                    onClick={() => void handleChildAttendanceAction(child)}
                    disabled={isPending || isClockInDisabled}
                    className={
                      clockedIn
                        ? "rounded-lg! bg-gray-600! text-white! px-4 py-2 min-w-[112px]"
                        : isClockInDisabled
                          ? "rounded-lg! bg-gray-300! text-gray-600! px-4 py-2 min-w-[112px]"
                          : "rounded-lg! bg-brandColor-active! text-white! px-4 py-2 min-w-[112px]"
                    }
                  >
                    {isPending ? "Please wait..." : clockedIn ? "Clock Out" : "Clock In"}
                  </Button>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
