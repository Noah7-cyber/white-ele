"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { useRouter, useParams } from "next/navigation";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { subjectDynamicEndpoints, type GetSubjectByIdResponse } from "@/services/subject.service";
import { curriculumDynamicEndpoints, type GetCurriculumByIdResponse } from "@/services/curriculum.service";
import { Button } from "@/modules/shared/component/Button";
// import EditIcon from "@/modules/shared/assets/svgs/edit-icon.svg";
import TrashIcon from "@/modules/shared/assets/svgs/trash.svg";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { SKILL_LABEL_MAP, SKILL_COLOR_MAP } from "@/constants/learning.enums";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function ViewSubjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isMobile = useMediaQuery("(max-width:768px)");

  const { data, isLoading } = useQueryService<object, GetSubjectByIdResponse>({
    service: subjectDynamicEndpoints.getSubjectById(Number(id)),
    options: {
      enabled: !!id,
    },
  });

  const subject = data?.data;
  const curriculumId = Number(subject?.curriculum?.id ?? 0);

  const { data: curriculumData } = useQueryService<object, GetCurriculumByIdResponse>({
    service: curriculumDynamicEndpoints.getCurriculumById(curriculumId),
    options: {
      enabled: curriculumId > 0,
    },
  });

  if (isLoading) {
    return (
      <Box className="h-full p-5 space-y-6">
        <Box className="bg-[#F0F8F7] rounded-xl px-5 py-6">
          <Box className="animate-pulse space-y-3">
            <Box className="h-6 bg-gray-200 rounded w-2/3" />
            <Box className="h-4 bg-gray-200 rounded w-full" />
          </Box>
        </Box>
      </Box>
    );
  }

  if (!subject) return null;

  const subjectName = subject.name ?? "Subject";
  const curriculumName =
    curriculumData?.curriculum?.title ??
    curriculumData?.curriculum?.name ??
    subject.curriculum?.title ??
    subject.curriculum?.name ??
    "—";
  const description = subject.description ?? "";
  const firstTeacher = Array.isArray(subject.teacherAssignments)
    ? subject.teacherAssignments[0]
    : undefined;
  const teacherName = firstTeacher?.name ?? "—";
  const className = firstTeacher?.classrooms?.[0]?.name ?? "—";
  const ageRange = subject.ageRange as { minimumAge?: number; maximumAge?: number } | undefined;
  const ageRangeDisplay =
    ageRange?.minimumAge != null && ageRange?.maximumAge != null
      ? `${ageRange.minimumAge} - ${ageRange.maximumAge} years`
      : "—";
  const duration = subject.duration ? `${subject.duration} minutes` : "—";
  const skills: string[] = (subject as { skills?: string[] }).skills ?? [];
  const milestones = Array.isArray(subject.milestones) ? subject.milestones : [];
  const schedule = Array.isArray((subject as { schedule?: unknown[] }).schedule)
    ? ((subject as { schedule?: { day: string; startTime: string; endTime: string }[] }).schedule ??
      [])
    : [];
  const createdAt = formatDate(subject.createdAt);
  const updatedAt = formatDate(subject.updatedAt);

  return (
    <Box className="h-full space-y-6">
      <Box className={`pb-2 ${isMobile ? "" : "border-b border-border-light"}`}>
        <Box className="flex items-start justify-between">
          <Box className="flex items-center sm:items-start gap-3">
            <ButtonIcon
              className="rounded-full !border !border-brandColor-active/20 !p-1.5 flex items-center justify-center mt-0.5"
              onClick={() => router.back()}
            >
              <Image src={LeftIcon} alt="" />
            </ButtonIcon>
            <Box className="flex flex-col gap-1">
              <Typography className="!text-xl !font-semibold !text-primary-dark">
                {subjectName}
              </Typography>
              {!isMobile && description && (
                <Typography className="!text-sm !text-input-gray max-w-2xl">
                  {description}
                </Typography>
              )}
            </Box>
          </Box>
          {!isMobile && (
            <Box className="hidden sm:flex items-center gap-2">
              <Button
                className="!rounded-lg !px-6 !bg-red-50 !text-red-600 !border !border-red-200"
                startIcon={<TrashIcon />}
              >
                Delete
              </Button>
              <Button
                className="!rounded-lg !px-6 !bg-brandColor-active !text-white"
                onClick={() => router.push(DashboardRoutes.learningEditSubject.replace(":id", id))}
              >
                Edit
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Details Cards */}
      <Box className="flex flex-col sm:grid grid-cols-2 gap-6">
        {/* Basic Details */}
        <Box className="bg-white sm:border border-border-light rounded-xl p-4 sm:p-6">
          <Typography className="!text-base !font-semibold !text-primary-dark !mb-4 !pb-3 border-b border-border-light/40 sm:border-border-light">
            Basic Details
          </Typography>
          <Box className="space-y-4 sm:space-y-6">
            <Box className="flex justify-between sm:justify-start ">
              <Typography className="!text-sm !text-input-gray w-[140px]">
                Curriculum Name:
              </Typography>
              <Typography className="!text-sm !font-semibold !text-primary-dark">
                {curriculumName}
              </Typography>
            </Box>
            <Box className="flex justify-between sm:justify-start ">
              <Typography className="!text-sm !text-input-gray w-[140px]">Class:</Typography>
              <Typography className="!text-sm !font-semibold !text-primary-dark">
                {className}
              </Typography>
            </Box>
            <Box className="flex justify-between sm:justify-start ">
              <Typography className="!text-sm !text-input-gray w-[140px]">Age Range:</Typography>
              <Typography className="!text-sm !font-semibold !text-primary-dark">
                {ageRangeDisplay}
              </Typography>
            </Box>
            <Box className="flex items-center sm:justify-start justify-between">
              <Typography className="!text-sm !text-input-gray w-[140px]">Skills:</Typography>
              <Box className="flex flex-wrap gap-1.5">
                {skills.length > 0 ? (
                  skills.map((skill) => {
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
                        className={`inline-flex px-3 py-0.5 rounded-full text-xs font-medium ${colorClasses.bg} ${colorClasses.text}`}
                      >
                        {label}
                      </span>
                    );
                  })
                ) : (
                  <Typography className="!text-sm !text-primary-dark">—</Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Information */}
        <Box className="bg-white sm:border border-border-light rounded-xl p-4 sm:p-6">
          <Typography className="!text-base !font-semibold !text-primary-dark !mb-4 !pb-3 border-b border-border-light/40 sm:border-border-light">
            Information
          </Typography>
          <Box className="space-y-4 sm:space-y-6">
            <Box className="flex justify-between sm:justify-start ">
              <Typography className="!text-sm !text-input-gray w-[140px]">
                Assigned Teacher:
              </Typography>
              <Typography className="!text-sm !font-semibold !text-primary-dark">
                {teacherName}
              </Typography>
            </Box>
            <Box className="flex justify-between sm:justify-start ">
              <Typography className="!text-sm !text-input-gray w-[140px]">Duration:</Typography>
              <Typography className="!text-sm !font-semibold !text-primary-dark">
                {duration}
              </Typography>
            </Box>
            <Box className="flex justify-between sm:justify-start ">
              <Typography className="!text-sm !text-input-gray w-[140px]">Created On:</Typography>
              <Typography className="!text-sm !font-semibold !text-primary-dark">
                {createdAt}
              </Typography>
            </Box>
            <Box className="flex justify-between sm:justify-start ">
              <Typography className="!text-sm !text-input-gray w-[140px]">Last Updated:</Typography>
              <Typography className="!text-sm !font-semibold !text-primary-dark">
                {updatedAt}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Milestones */}
        <Box className="bg-white sm:border border-border-light rounded-xl p-4 sm:p-6">
          <Typography className="!text-base !font-semibold !text-primary-dark !mb-4 !pb-3 border-b border-border-light/40 sm:border-border-light">
            Milestones
          </Typography>
          <Box className="space-y-4 sm:space-y-6">
            {milestones.length > 0 ? (
              milestones.map((m: { id?: number; title?: string; name?: string }) => (
                <Box key={m.id} className="flex items-center gap-2">
                  <CheckCircleIcon className="!text-brandColor-active !text-lg" />
                  <Typography className="!text-sm !text-primary-dark">
                    {m.title ?? m.name ?? "—"}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography className="!text-sm !text-input-gray">No milestones linked</Typography>
            )}
          </Box>
        </Box>

        {/* Schedule */}
        <Box className="bg-white sm:border border-border-light rounded-xl p-4 sm:p-6">
          <Typography className="!text-base !font-semibold !text-primary-dark !mb-4 !pb-3 border-b border-border-light/40 sm:border-border-light">
            Schedule
          </Typography>
          <Box className="space-y-4 sm:space-y-6">
            {schedule.length > 0 ? (
              schedule.map((s: { day: string; startTime: string; endTime: string }, i: number) => (
                <Box key={i} className="flex justify-between sm:justify-start ">
                  <Typography className="!text-sm !text-input-gray w-[140px]">{s.day}:</Typography>
                  <Typography className="!text-sm !font-semibold !text-primary-dark">
                    {s.startTime} - {s.endTime}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography className="!text-sm !text-input-gray">No schedule set</Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
