"use client";

import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { useRouter, useParams } from "next/navigation";
import { useQueryService } from "@/utils/hooks/useQueryService";
import {
  milestoneDynamicEndpoints,
  type GetMilestoneByIdResponse,
} from "@/services/milestone.service";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";
import { Table } from "@/modules/shared/component/Table";
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";
import { Button } from "@/modules/shared/component/Button";
// import EditIcon from "@/modules/shared/assets/svgs/edit-icon.svg";
// import PrintIcon from "@/modules/shared/assets/svgs/printer.svg";
// import ShareIcon from "@/modules/shared/assets/svgs/share.svg";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import EllipsesIcon from "@/modules/shared/assets/svgs/ellipses.svg";
import PersonIcon from "@/modules/shared/assets/svgs/person-icon.svg";

function dayOrdinal(n: number): string {
  if (n > 3 && n < 21) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${weekday}, ${month} ${dayOrdinal(day)}, ${year}`;
  } catch {
    return dateStr;
  }
}

function getStatusLabel(score: number | null | undefined, threshold: number): string {
  if (score === null || score === undefined || score === -1) return "Not yet";
  if (score === 0) return "Not yet";
  if (score < threshold) return "Emerging";
  if (score === threshold) return "Developing";
  return "Secure";
}

function getStatusColor(status: string): string {
  switch (status) {
    case "Secure":
      return "!text-success-green";
    case "Developing":
      return "!text-brandColor-active";
    case "Emerging":
      return "!text-amber-500";
    case "Not yet":
      return "!text-gray-500";
    default:
      return "!text-gray-500";
  }
}

function statusBadgeClass(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed") return "bg-[#EDFFF7] text-success-green";
  if (normalized === "active") return "bg-success-green/15 text-success-green";
  if (normalized === "draft") return "bg-primary-dark/10 text-primary-dark";
  return "bg-gray-100 text-gray-700";
}

export default function ViewGradeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isMobile = useMediaQuery("(max-width:768px)");
  const [mobileActionsOpen, setMobileActionsOpen] = React.useState(false);

  const { data, isLoading } = useQueryService<object, GetMilestoneByIdResponse>({
    service: milestoneDynamicEndpoints.getMilestoneById(Number(id)),
    options: {
      enabled: !!id,
    },
  });

  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const milestone = data?.data;
  const title = milestone?.title ?? "Grading Detail";
  const status = milestone?.status ?? "";
  const gradingScale = "0 - 3";
  const passingThreshold = 2;

  const primaryClassroom = useMemo(() => {
    const classrooms = milestone?.classrooms;
    const groupedClassrooms = Array.isArray(classrooms) ? classrooms : [];
    if (groupedClassrooms.length > 0) return groupedClassrooms[0];
    return milestone?.classroom;
  }, [milestone]);

  const className = primaryClassroom?.name ?? "—";

  const allStudents = useMemo(() => {
    const students = primaryClassroom?.students;
    if (!Array.isArray(students)) return [];
    return students.map((student: Record<string, unknown>) => ({
      id: Number(student?.id),
      name: String(student?.name ?? "Unknown learner"),
      photoUrl: typeof student?.photoUrl === "string" ? student.photoUrl.trim() : null,
      score: student?.score != null ? Number(student.score) : null,
    }));
  }, [primaryClassroom]);

  const numberOfStudents = allStudents.length;
  const primaryStaff = Array.isArray(milestone?.staff) ? milestone.staff[0] : undefined;
  const teacherName =
    primaryStaff && typeof primaryStaff === "object" && primaryStaff !== null && "name" in primaryStaff
      ? String((primaryStaff as { name?: string }).name ?? "—")
      : "—";
  const teacherRole =
    primaryStaff &&
    typeof primaryStaff === "object" &&
    primaryStaff !== null &&
    ("role" in primaryStaff || "staffRole" in primaryStaff)
      ? String(
          (primaryStaff as { role?: string; staffRole?: string }).role ??
            (primaryStaff as { staffRole?: string }).staffRole ??
            "Teacher",
        )
      : "Teacher";
  const teacherPhoto =
    primaryStaff &&
    typeof primaryStaff === "object" &&
    primaryStaff !== null &&
    "photoUrl" in primaryStaff
      ? String((primaryStaff as { photoUrl?: string }).photoUrl ?? "").trim() || null
      : null;

  const totalItems = allStudents.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedStudents = useMemo(
    () => allStudents.slice(startIndex, endIndex),
    [allStudents, startIndex, endIndex],
  );

  const onPageChange = ({
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

  const GradingStudentList = useMemo(
    () =>
      paginatedStudents.map((student) => {
        const statusLabel = getStatusLabel(student.score, passingThreshold);
        const scoreDisplay = student.score !== null ? `${student.score}/3` : "—";
        return {
          0: (
            <Box className="flex items-center gap-3">
              <InitialsAvatar
                src={student.photoUrl}
                name={student.name}
                className="!w-10 !h-10"
                initialsClassName="text-xs"
              />
              <Typography className="!text-sm !font-medium !text-primary-dark">
                {student.name}
              </Typography>
            </Box>
          ),
          1: (
            <Typography className="!text-sm !font-medium !text-primary-dark text-center">
              {scoreDisplay}
            </Typography>
          ),
          2: (
            <Typography
              className={`!text-sm !font-medium text-center ${getStatusColor(statusLabel)}`}
            >
              {statusLabel}
            </Typography>
          ),
        };
      }),
    [paginatedStudents],
  );

  const detailRows = [
    { label: "Class:", value: className },
    { label: "Number of Students:", value: `${numberOfStudents} Students` },
    { label: "Grading Scale:", value: gradingScale },
    { label: "Passing Threshold:", value: String(passingThreshold) },
    { label: "Created On:", value: formatDate(milestone?.createdAt) },
  ];

  return (
    <Box
      className={`h-full space-y-6 relative ${isMobile ? "px-1 -mx-1 md:mx-0 md:px-0 pb-8" : ""}`}
    >
      {/* Header */}
      <Box
        className={`pb-4 border-b border-border-light ${
          isMobile ? "flex flex-col gap-3 relative pr-10" : "flex items-start justify-between gap-4"
        }`}
      >
        <Box className="flex items-center md:items-start gap-3 min-w-0 flex-1">
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !p-1.5 flex items-center justify-center mt-0.5 shrink-0 bg-dashboard-bg"
            onClick={() => router.back()}
          >
            <Image src={LeftIcon} alt="" />
          </ButtonIcon>
          <Box className="flex md:flex-col justify-between md:justify-start gap-0.5 min-w-0 flex-1">
            <Typography
              className={`!font-semibold !text-blue-main md:!text-primary-dark ${
                isMobile ? "!text-lg leading-snug" : "!text-xl"
              }`}
            >
              {title}
            </Typography>
            {!isMobile && (
              <Typography className="!text-sm !text-input-gray">
                Overview of this milestone grading information.
              </Typography>
            )}
            {isMobile && (
              <Box className="flex justify-end md:w-full md:mt-2">
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${statusBadgeClass(status)}`}
                >
                  {status ? status.charAt(0).toUpperCase() + status.slice(1) : "—"}
                </span>
              </Box>
            )}
          </Box>
        </Box>
        {!isMobile && (
          <Box className="hidden md:flex items-center gap-3 shrink-0">
            <span
              className={`px-3 py-0.5 text-xs font-medium rounded-full capitalize ${statusBadgeClass(status)}`}
            >
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : "—"}
            </span>
            <Button
              className="!rounded-lg !px-6 !bg-brandColor-active !text-white"
              onClick={() => router.push(DashboardRoutes.learningViewGrade.replace(":id", id))}
            >
              Edit
            </Button>
          </Box>
        )}
        {isMobile && (
          <button
            type="button"
            className="absolute top-0 right-0 p-2 hidden"
            onClick={() => setMobileActionsOpen(true)}
            aria-label="Open actions"
          >
            <EllipsesIcon />
          </button>
        )}
      </Box>

      {/* Grading Details Card */}
      <Box
        className={`bg-white md:border border-border-input rounded-xl flex flex-col ${
          isMobile ? "p-" : "p-6 gap-4"
        }`}
      >
        <Typography className="!text-sm md:!text-base !font-semibold md:!font-medium !text-input-gray md:!text-primary-dark !pb-3 md:border-b border-border-input">
          Grading Details
        </Typography>
        {isMobile ? (
          <Box className="flex flex-col md:pt-1 max-md:border border-border-input px-3 rounded-xl">
            {detailRows.map((row) => (
              <Box
                key={row.label}
                className="flex flex-row items-baseline justify-between gap-3 py-1.5 border-b border-gray-100 last:border-b-0"
              >
                <Typography className="!text-sm !text-input-gray shrink-0">{row.label}</Typography>
                <Typography className="!text-sm !font-medium !text-slate-800 text-left">
                  {row.value}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Box className="grid grid-cols-3 gap-y-6">
            <Box>
              <Typography className="!text-xs !text-input-gray !mb-1">Class:</Typography>
              <Typography className="!text-sm !font-semibold !text-primary-dark">
                {className}
              </Typography>
            </Box>
            <Box>
              <Typography className="!text-xs !text-input-gray !mb-1">Number of Students:</Typography>
              <Typography className="!text-sm !font-semibold !text-primary-dark">
                {numberOfStudents} Students
              </Typography>
            </Box>
            <Box>
              <Typography className="!text-xs !text-input-gray !mb-1">Grading Scale:</Typography>
              <Typography className="!text-sm !font-semibold !text-primary-dark">
                {gradingScale}
              </Typography>
            </Box>
            <Box>
              <Typography className="!text-xs !text-input-gray !mb-1">Assigned Teacher:</Typography>
              <Typography className="!text-sm !font-semibold !text-primary-dark">
                {teacherName}
              </Typography>
            </Box>
            <Box>
              <Typography className="!text-xs !text-input-gray !mb-1">Passing Threshold:</Typography>
              <Typography className="!text-sm !font-semibold !text-primary-dark">
                {passingThreshold}
              </Typography>
            </Box>
            <Box>
              <Typography className="!text-xs !text-input-gray !mb-1">Created On:</Typography>
              <Typography className="!text-sm !font-semibold !text-primary-dark">
                {formatDate(milestone?.createdAt)}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {isMobile && (
        <Box className="flex flex-col gap-2">
          <Box className="flex items-center gap-2 text-blue-main">
            <PersonIcon className="w-5 h-5 shrink-0 [&_path]:fill-current" />
            <Typography className="!text-sm !font-medium">Assigned Teacher</Typography>
          </Box>
          <Box className="rounded-xl bg-[#f4f6f8] px-4 py-4 flex flex-row items-center gap-3">
            <InitialsAvatar
              src={teacherPhoto}
              name={teacherName}
              className="!w-12 !h-12 !rounded-full"
              initialsClassName="!text-sm"
            />
            <Box className="min-w-0">
              <Typography className="!text-sm !font-semibold !text-blue-main">{teacherName}</Typography>
              <Typography className="!text-xs !text-input-gray">{teacherRole}</Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Students Table */}
      <Box className="bg-white rounded-xl border !border-border-table hidden md:block">
        <Table
          headers={["Name", "Grade", "Status"]}
          tableData={GradingStudentList}
          isCollapse
          centeredHeaderIndex={[1, 2]}
          isLoading={isLoading}
        />
      </Box>

      {/* Pagination */}
      <Box className=" justify-center pt-2 hidden md:flex">
        <PaginationControls
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          totalItems={totalItems}
          onPageChange={onPageChange}
          isCondense
          bottomTableClasses="!text-xs"
        />
      </Box>
      {mobileActionsOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileActionsOpen(false)}
        />
      )}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 transition-transform duration-300 ${
          mobileActionsOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />
        <div className="flex flex-col pb-8">
          <button
            type="button"
            className="w-full text-left px-6 py-4 text-sm font-medium text-[#101828]"
            onClick={() => {
              setMobileActionsOpen(false);
              router.push(DashboardRoutes.learningViewGrade.replace(":id", id));
            }}
          >
            Edit
          </button>
        </div>
      </div>
    </Box>
  );
}
