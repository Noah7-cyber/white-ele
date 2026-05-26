"use client";

import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { useRouter } from "next/navigation";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useQuery } from "@tanstack/react-query";
import {
  curriculumServices,
  curriculumDynamicEndpoints,
  type GetAllCurriculumsResponse,
  type GetCurriculumByIdResponse,
} from "@/services/curriculum.service";
import {
  milestoneServices,
  type GetAllMilestonesResponse,
} from "@/services/milestone.service";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { SKILL_LABEL_MAP, SKILL_COLOR_MAP } from "@/constants/learning.enums";
import CheckCircleIcon from "@/modules/shared/assets/svgs/gg_check-o.svg";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import client from "@/utils/client";
/* eslint-disable @typescript-eslint/no-explicit-any */

const SUBJECT_NUMBER_COLORS = [
  "bg-teal-600 text-white",
  "bg-green-600 text-white",
  "bg-blue-600 text-white",
  "bg-purple-600 text-white",
  "bg-amber-600 text-white",
  "bg-red-600 text-white",
  "bg-indigo-600 text-white",
  "bg-pink-600 text-white",
];

interface CurriculumDetailViewProps {
  curriculumId: string;
}

export default function CurriculumDetailView({ curriculumId }: CurriculumDetailViewProps) {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:768px)");
  const { data: myLibraryData, isLoading: isMyLibraryLoading } = useQueryService<
    Record<string, never>,
    GetAllCurriculumsResponse
  >({
    service: curriculumServices.getAllCurriculums,
  });

  const { data: curriculumDetailData, isLoading } = useQueryService<
    Record<string, never>,
    GetCurriculumByIdResponse
  >({
    service: curriculumDynamicEndpoints.getCurriculumById(curriculumId),
  });

  const curriculum = useMemo(() => {
    if (!curriculumDetailData) return null;

    const c = curriculumDetailData.curriculum;
    const subjects = c.subjects ?? curriculumDetailData.subjects ?? [];

    const classroomNames = new Set<string>();
    subjects.forEach((s: any) => {
      (s?.teacher?.classrooms ?? []).forEach((classroom: { name?: string }) => {
        if (classroom?.name) classroomNames.add(classroom.name);
      });
      (s?.classrooms ?? []).forEach((classroom: { name?: string; classroomName?: string }) => {
        const name = classroom?.name ?? classroom?.classroomName;
        if (name) classroomNames.add(name);
      });
    });
    const classNames =
      Array.from(classroomNames).join(", ") ||
      (Array.isArray(c.classIds) && c.classIds.length > 0
        ? c.classIds.map((id) => `Class ${id}`).join(", ")
        : "N/A");

    // Collect all skills from subjects (deduplicated via Set)
    const allSkills = new Set<string>();
    subjects.forEach((s: any) => {
      const skills = s.skills ?? [];
      skills.forEach((sk: string) => allSkills.add(sk));
    });

    // Age range — derive from subjects' minimumAge / maximumAge
    const ages = subjects
      .map((s: any) => ({
        min: s.minimumAge as number | undefined,
        max: s.maximumAge as number | undefined,
      }))
      .filter((a) => a.min != null || a.max != null);
    let ageRange = "—";
    if (ages.length > 0) {
      const minAge = Math.min(...ages.map((a) => a.min ?? Infinity));
      const maxAge = Math.max(...ages.map((a) => a.max ?? -Infinity));
      if (isFinite(minAge) && isFinite(maxAge)) {
        ageRange = `${minAge} - ${maxAge} years`;
      } else if (isFinite(minAge)) {
        ageRange = `${minAge}+ years`;
      } else if (isFinite(maxAge)) {
        ageRange = `0 - ${maxAge} years`;
      }
    }

    return {
      id: c.id,
      title: c.title ?? c.name ?? "Untitled",
      description: c.description?.trim() || "None",
      className: classNames,
      subjectCount: c.subjectCount ?? subjects.length,
      coreModules: c.subjectCount ?? subjects.length,
      subjectsCount: subjects.length,
      ageRange,
      subjects: subjects.map((s: any) => ({
        id: s.id,
        name: s.name ?? s.title ?? "",
        description: s.description?.trim() || "None",
        milestoneCount:
          typeof s.milestoneCount === "number"
            ? s.milestoneCount
            : Array.isArray(s.milestones)
              ? s.milestones.length
              : 0,
      })),
      skills: Array.from(allSkills),
      status: c.status ?? "active",
    };
  }, [curriculumDetailData]);

  const myLibraryIdSet = useMemo(() => {
    const raw = myLibraryData?.curriculums ?? myLibraryData?.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    return new Set(list.map((item) => String(item.id)));
  }, [myLibraryData]);

  const canViewCurriculum = useMemo(() => {
    if (!curriculum?.id) return false;
    return myLibraryIdSet.has(String(curriculum.id));
  }, [curriculum?.id, myLibraryIdSet]);

  const subjectIds = useMemo(
    () =>
      (curriculum?.subjects ?? [])
        .map((subject) => Number(subject.id))
        .filter((id) => Number.isFinite(id) && id > 0),
    [curriculum?.subjects],
  );

  const { data: milestonesBySubject = {}, isLoading: isMilestonesLoading } = useQuery<
    Record<number, { id?: number; title?: string; name?: string }[]>
  >({
    queryKey: ["curriculum-subject-milestones", curriculumId, subjectIds.join(",")],
    enabled: canViewCurriculum && subjectIds.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        subjectIds.map(async (subjectId) => {
          const response = await client.request<{ subjectId: number }, GetAllMilestonesResponse>({
            ...milestoneServices.getAllMilestones,
            data: { subjectId },
          });
          const milestones = Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.milestones)
              ? response.milestones
              : [];
          return [subjectId, milestones] as const;
        }),
      );
      return Object.fromEntries(entries);
    },
  });

  return (
    <DataRenderer isLoading={isLoading || isMyLibraryLoading}>
      {() => (
        <Box
          className={`h-full space-y-4 md:space-y-6 !pb-8 ${
            isMobile ? "!p-4 bg-[#eef2f6] min-h-screen" : "!p-5"
          }`}
        >
          {!canViewCurriculum ? (
            <Box className="bg-white border border-border-light rounded-xl px-6 py- space-y-4">
              <Typography className="!text-xl !font-semibold !text-primary-dark">
                Curriculum not available
              </Typography>
              <Typography className="!text-sm !text-input-gray">
                Only curriculums from your My Library can be viewed on this page.
              </Typography>
              <Box>
                <button
                  className="px-4 py-2 text-sm rounded-lg border border-brandColor-active/30 text-primary-dark cursor-pointer"
                  onClick={() => router.back()}
                >
                  Go back
                </button>
              </Box>
            </Box>
          ) : (
            <>
              {/* Header */}
              <Box
                className={`rounded-xl ${
                  isMobile ? "bg-transparent" : "bg-[#F0F8F7]"
                }`}
              >
                <Box
                  className={`flex items-start gap-3 ${
                    isMobile ? "!pb-2" : "!border-b border-border-lightGray !pb-4"
                  }`}
                >
                  <ButtonIcon
                    className="rounded-full !border !border-brandColor-active/20 !p-1.5 flex items-center justify-center mt-0.5 shrink-0"
                    onClick={() => router.back()}
                  >
                    <Image src={LeftIcon} alt="Back" />
                  </ButtonIcon>
                  <Box className="min-w-0">
                    <Typography className="!text-lg md:!text-xl !font-bold !text-[#1a2b3c] md:!text-primary-dark">
                      {curriculum?.title ?? "Loading..."}
                    </Typography>
                    {!isMobile && (
                      <Typography className="!text-sm !text-input-gray !mt-1 !leading-relaxed">
                        {curriculum?.description ?? "None"}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Overview Section */}
              <Box className="bg-white border border-border-light rounded-2xl px-4 py-5 sm:px-6 shadow-sm md:shadow-none">
                <Typography className="!text-base !font-bold !text-[#1a2b3c] md:!text-primary-dark !mb-4 border-b border-border-lightGray !pb-4">
                  Overview
                </Typography>
                <Box
                  className={
                    isMobile
                      ? "grid grid-cols-2 gap-x-0 gap-y-4"
                      : "grid grid-cols-2 lg:grid-cols-4 gap-5"
                  }
                >
                  <Box className={isMobile ? "border-r border-gray-200 pr-4" : ""}>
                    <Typography className="!text-xs md:!text-sm !text-input-gray !mb-1">
                      Age Range
                    </Typography>
                    <Typography className="!text-sm md:!text-base !font-semibold !text-[#1a2b3c] md:!text-primary-dark">
                      {curriculum?.ageRange ?? "—"}
                    </Typography>
                  </Box>
                  <Box className={isMobile ? "pl-4" : ""}>
                    <Typography className="!text-xs md:!text-sm !text-input-gray !mb-1">Class</Typography>
                    <Typography className="!text-sm md:!text-base !font-semibold !text-[#1a2b3c] md:!text-primary-dark">
                      {curriculum?.className ?? "N/A"}
                    </Typography>
                  </Box>
                  <Box className={isMobile ? "border-r border-t border-gray-200 pr-4 pt-4" : ""}>
                    <Typography className="!text-xs md:!text-sm !text-input-gray !mb-1">
                      Core Modules
                    </Typography>
                    <Typography className="!text-sm md:!text-base !font-semibold !text-[#1a2b3c] md:!text-primary-dark">
                      {curriculum?.coreModules ?? 0}
                    </Typography>
                  </Box>
                  <Box className={isMobile ? "pl-4 pt-4 border-t border-gray-200" : ""}>
                    <Typography className="!text-xs md:!text-sm !text-input-gray !mb-1">Subjects</Typography>
                    <Typography className="!text-sm md:!text-base !font-semibold !text-[#1a2b3c] md:!text-primary-dark">
                      {curriculum?.subjectsCount ?? curriculum?.subjects?.length ?? 0}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Subjects Section */}
              <Box className="bg-white border border-border-light rounded-2xl px-4 py-5 sm:px-6 shadow-sm md:shadow-none">
                <Box className="">
                  <Typography className="!text-base !font-bold !text-[#1a2b3c] md:!text-primary-dark !mb-4 border-b border-border-lightGray !pb-4">
                    Subjects
                  </Typography>
                </Box>
                <Box
                  className={`flex ${
                    isMobile ? "flex-col gap-4 items-stretch" : "flex-wrap gap-6 items-center"
                  }`}
                >
                  {(curriculum?.subjects ?? []).map((subject, index) => (
                    <Box key={subject.id} className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-md text-xs font-bold ${
                          SUBJECT_NUMBER_COLORS[index % SUBJECT_NUMBER_COLORS.length]
                        }`}
                      >
                        {index + 1}
                      </span>
                      <Typography className="!text-sm !text-[#1a2b3c] md:!text-primary-dark">
                        {subject.name}
                      </Typography>
                    </Box>
                  ))}
                  {(curriculum?.subjects ?? []).length === 0 && (
                    <Typography className="!text-sm !text-input-gray">
                      No subjects added yet. Please add subjects to the curriculum.
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Skills Section */}
              <Box className="bg-white border border-border-light rounded-2xl px-4 py-5 sm:px-6 shadow-sm md:shadow-none">
                <Typography className="!text-base !font-bold !text-[#1a2b3c] md:!text-primary-dark !mb-4 border-b border-border-lightGray !pb-4">
                  Skills
                </Typography>
                <Box className="flex flex-wrap gap-2">
                  {(curriculum?.skills ?? []).map((skill) => {
                    const label =
                      SKILL_LABEL_MAP[skill] ??
                      skill.charAt(0).toUpperCase() + skill.slice(1).replace(/_/g, " ");
                    const colorClasses = SKILL_COLOR_MAP[skill] ?? {
                      bg: "!bg-gray-100",
                      text: "!text-gray-700",
                    };
                    return (
                      <span
                        key={skill}
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${colorClasses.bg} ${colorClasses.text}`}
                      >
                        {label}
                      </span>
                    );
                  })}
                  {(curriculum?.skills ?? []).length === 0 && (
                    <Typography className="!text-sm !text-input-gray">
                      No skills assigned.
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Learning Objectives Section */}
              <Box className="bg-white border border-border-light rounded-2xl px-4 py-5 !mb-4 sm:px-6 shadow-sm md:shadow-none">
                <Typography className="!text-base !font-bold !text-[#1a2b3c] md:!text-primary-dark !mb-4 border-b border-border-lightGray !pb-4">
                  Learning Objectives
                </Typography>
                <Box className="space-y-5">
                  {(curriculum?.subjects ?? []).map((subject) => (
                    <Box key={subject.id} className="space-y-2">
                      <Typography className="!text-sm !font-semibold !text-primary-dark">
                        {subject.name || "Untitled Subject"} 
                      </Typography>
                      <Box className="space-y-2">
                        {(milestonesBySubject[Number(subject.id)] ?? []).map((milestone) => (
                          <Box
                            key={milestone.id ?? `${subject.id}-${milestone.title ?? milestone.name}`}
                            className="flex items-center gap-3"
                          >
                            <CheckCircleIcon className="" />
                            <Typography className="!text-xs !font-normal !text-input-gray">
                              {milestone.title ?? milestone.name ?? "Untitled milestone"}
                            </Typography>
                          </Box>
                        ))}
                        {!isMilestonesLoading &&
                          (milestonesBySubject[Number(subject.id)] ?? []).length === 0 && (
                            <Typography className="!text-xs !font-normal !text-input-gray">
                              No milestones available.
                            </Typography>
                          )}
                      </Box>
                    </Box>
                  ))}
                  {isMilestonesLoading && (
                    <Typography className="!text-sm !text-input-gray">Loading milestones...</Typography>
                  )}
                  {(curriculum?.subjects ?? []).length === 0 && (
                    <Typography className="!text-sm !text-input-gray">
                      No subjects available in this curriculum.
                    </Typography>
                  )}
                </Box>
              </Box>
            </>
          )}
        </Box>
      )}
    </DataRenderer>
  );
}
