/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { teacherServices } from "@/services/teacher.service";
import {
  adminServices,
  type AdminKioskEntity,
  type GetAdminsResponse,
} from "@/services/admin.service";
import { schoolDynamicEndpoints } from "@/services/school.service";
import type { GetSchoolResponse } from "@/services/school.service";
import { showToast } from "@/modules/shared/component/Toast";
import useKioskVerify from "@/modules/kiosk/hooks/useKioskVerify";

export type KioskTeacher = {
  id: string;
  entityType: "staff" | "admin";
  roleLabel: "Teacher" | "Admin";
  recordId: number;
  name: string;
  email: string;
  photoUrl?: string;
  pin?: string;
  currentStatus?: string;
  status: string;
  lastClockInTime?: string;
  lastClockInDate?: string;
  currentClockInTime?: string;
};

type AttendanceLike = {
  status?: string;
  date?: string;
  timeIn?: string | null;
  timeOut?: string | null;
};

function formatTimeToAMPM(timeStr: string): string {
  if (!timeStr) return "";

  try {
    if (timeStr.toLowerCase().includes("am") || timeStr.toLowerCase().includes("pm")) {
      return timeStr
        .replace(/\s*(AM|PM|am|pm)\s*/i, (match) => ` ${match.trim().toLowerCase()}`)
        .trim();
    }

    const timeParts = timeStr.split(":");
    if (timeParts.length >= 2) {
      let hours = parseInt(timeParts[0], 10);
      const minutes = timeParts[1];
      const period = hours >= 12 ? "pm" : "am";

      if (hours === 0) {
        hours = 12;
      } else if (hours > 12) {
        hours -= 12;
      }

      return `${hours}:${minutes} ${period}`;
    }

    return timeStr;
  } catch {
    return timeStr;
  }
}

function mapKioskEntity(
  entity: any,
  entityType: "staff" | "admin",
): KioskTeacher {
  const photo =
    entity?.user?.profile?.photo ||
    entity?.user?.profile?.photoUrl ||
    entity?.photoUrl ||
    entity?.photo;
  const first = entity?.user?.firstName || entity?.firstName || "";
  const last = entity?.user?.lastName || entity?.lastName || "";

  const currentAttendance: AttendanceLike | null =
    entity?.attendance?.currentAttendance ?? entity?.currentAttendance ?? null;
  const previousAttendance: AttendanceLike | null =
    entity?.attendance?.previousAttendance ?? entity?.previousAttendance ?? null;

  const attendanceStatus = currentAttendance?.status || previousAttendance?.status || "punctual";

  let currentStatus = "Signed Out";
  if (entityType === "admin") {
    const adminCurrentStatus = entity?.attendance?.currentStatus;
    const normalizedAdminStatus =
      typeof adminCurrentStatus === "string" ? adminCurrentStatus.trim().toLowerCase() : "";

    if (normalizedAdminStatus === "clocked in" || normalizedAdminStatus === "signed in") {
      currentStatus = "Clocked In";
    } else if (normalizedAdminStatus === "clocked out" || normalizedAdminStatus === "signed out") {
      currentStatus = "Clocked Out";
    } else if (currentAttendance?.timeIn && !currentAttendance?.timeOut) {
      currentStatus = "Clocked In";
    } else {
      currentStatus = "Clocked Out";
    }
  } else if (currentAttendance?.timeIn && !currentAttendance?.timeOut) {
    currentStatus = "Signed In";
  }

  const lastClockInDate = currentAttendance?.date || previousAttendance?.date || "";
  const lastClockInTimeRaw = currentAttendance?.timeIn || previousAttendance?.timeIn || "";
  const lastClockInTime = lastClockInTimeRaw
    ? formatTimeToAMPM(lastClockInTimeRaw).toUpperCase()
    : "";

  const currentClockInTimeRaw = currentAttendance?.timeIn || "";
  const currentClockInTime = formatTimeToAMPM(currentClockInTimeRaw);

  return {
    id: `${entityType}-${String(entity?.id ?? entity?.user?.id ?? "")}`,
    entityType,
    roleLabel: entityType === "admin" ? "Admin" : "Teacher",
    recordId: Number(entity?.id ?? entity?.user?.id ?? 0),
    name: `${first} ${last}`.trim() || entity?.name || "",
    email: entity?.user?.email || entity?.email || "",
    photoUrl: photo || undefined,
    status: attendanceStatus.charAt(0).toUpperCase() + attendanceStatus.slice(1),
    currentStatus,
    lastClockInTime,
    lastClockInDate,
    currentClockInTime,
  };
}

export default function useTeachersKiosk() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTeacher, setSelectedTeacher] = useState<KioskTeacher | null>(null);
  const [isPINModalOpen, setIsPINModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const {
    data: teachersResponse,
    isLoading: isTeachersLoading,
    error: staffError,
    refetch: refetchTeachers,
  } = useQueryService<any, any>({
    service: {
      ...teacherServices.getAllTeachers,
      data: {
        delta: 100,
        pos: 0,
        status: "active",
      },
    },
    options: { refetchOnWindowFocus: false },
  });

  const {
    data: adminsResponse,
    isLoading: isAdminsLoading,
    error: adminsError,
    refetch: refetchAdmins,
  } = useQueryService<any, GetAdminsResponse>({
    service: {
      ...adminServices.getAllAdmins,
      data: {
        delta: 100,
        pos: 0,
      },
    },
    options: { refetchOnWindowFocus: false },
  });
  const {
    data: schoolResponse,
    error: schoolError,
  } = useQueryService<Record<string, never>, GetSchoolResponse>({
    service: schoolDynamicEndpoints.getParticularSchool(),
    options: { refetchOnWindowFocus: false },
  });
  const schoolName = schoolResponse?.school?.schoolName ?? "";
  const schoolLogoUrl = schoolResponse?.school?.schoolLogoUrl ?? null;

  const staffFromApi = useMemo(() => {
    const staff = teachersResponse?.staff || teachersResponse?.data || [];
    if (!Array.isArray(staff)) return [];
    return staff.map((teacher: any) => mapKioskEntity(teacher, "staff"));
  }, [teachersResponse]);

  const adminsFromApi = useMemo(() => {
    const admins = adminsResponse?.admins || [];
    if (!Array.isArray(admins)) return [];
    return admins.map((admin: AdminKioskEntity) => mapKioskEntity(admin, "admin"));
  }, [adminsResponse]);

  const combinedPeople = useMemo(
    () => [...adminsFromApi, ...staffFromApi],
    [adminsFromApi, staffFromApi],
  );

  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return combinedPeople;
    const query = searchQuery.toLowerCase();
    return combinedPeople.filter(
      (person) =>
        (person.name || "").toLowerCase().includes(query) ||
        (person.email || "").toLowerCase().includes(query) ||
        person.roleLabel.toLowerCase().includes(query),
    );
  }, [searchQuery, combinedPeople]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedTeachers = filteredTeachers.slice(startIndex, startIndex + rowsPerPage);

  const handlePageChange = ({
    page,
    rowsPerPage: newRowsPerPage,
  }: {
    page: number;
    rowsPerPage: number;
  }) => {
    setCurrentPage(page);
    if (newRowsPerPage !== rowsPerPage) {
      setRowsPerPage(newRowsPerPage);
      setCurrentPage(1);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleTeacherClick = (teacher: KioskTeacher) => {
    setSelectedTeacher(teacher);
    setIsPINModalOpen(true);
  };

  const { verify: verifyStaff } = useKioskVerify({ target: "staff" });
  const { verify: verifyAdmin } = useKioskVerify({ service: adminServices.kioskVerify });

  const handlePINConfirm = async (enteredPin: string) => {
    if (!selectedTeacher) return;

    try {
      const payload = { id: selectedTeacher.email || String(selectedTeacher.recordId), pin: enteredPin };
      if (selectedTeacher.entityType === "admin") {
        await verifyAdmin(payload);
      } else {
        await verifyStaff(payload);
      }

      setIsPINModalOpen(false);
      setIsDetailModalOpen(true);
    } catch (err: any) {
      showToast({
        message: "Invalid PIN",
        description:
          err?.response?.data?.message || "The PIN you entered is incorrect. Please try again.",
        severity: "error",
      });
    }
  };

  const handleClosePINModal = () => {
    setIsPINModalOpen(false);
    setSelectedTeacher(null);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTeacher(null);
  };

  const refetchAll = async () => {
    await Promise.all([refetchAdmins(), refetchTeachers()]);
  };

  const handleClockIn = async (notes: string) => {
    void notes;
    if (selectedTeacher) {
      showToast({
        message: `Clock in for: ${selectedTeacher.name}`,
        description: `You have been successfully clocked in.`,
        severity: "success",
      });
      handleCloseDetailModal();
      await refetchAll();
    }
  };

  const handleClockOut = async (notes: string) => {
    void notes;
    if (selectedTeacher) {
      showToast({
        message: `Clock out for: ${selectedTeacher.name}`,
        description: `You have been successfully clocked out.`,
        severity: "success",
      });
      handleCloseDetailModal();
      await refetchAll();
    }
  };

  return {
    searchQuery,
    handleSearchChange,
    currentPage,
    rowsPerPage,
    paginatedTeachers,
    filteredTeachers,
    handlePageChange,
    isTeachersLoading: isTeachersLoading || isAdminsLoading,
    selectedTeacher,
    handleTeacherClick,
    isPINModalOpen,
    isDetailModalOpen,
    handlePINConfirm,
    handleClosePINModal,
    handleCloseDetailModal,
    handleClockIn,
    handleClockOut,
    schoolName,
    schoolLogoUrl,
    teachersError: staffError ?? adminsError,
    schoolError,
  };
}
