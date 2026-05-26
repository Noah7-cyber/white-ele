"use client";

import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { useRouter } from "next/navigation";
import type { CurriculumCard, SkillTag } from "../learning.constants";
import CurriculumCardItem from "../CurriculumPage/CurriculumCardItem";
import {
  curriculumServices,
  type Curriculum,
  type GetAllCurriculumsResponse,
} from "@/services/curriculum.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { SKILL_LABEL_MAP, SKILL_COLOR_MAP } from "@/constants/learning.enums";

function getSkillTags(curriculum: Curriculum): SkillTag[] {
  const subjects = curriculum.subjects ?? [];
  const allSkills = new Set<string>();
  subjects.forEach((s: { skills?: string[] | undefined }) => {
    (s.skills ?? []).forEach((sk) => allSkills.add(sk));
  });
  return Array.from(allSkills).map((skill) => ({
    name:
      SKILL_LABEL_MAP[skill] ?? skill.charAt(0).toUpperCase() + skill.slice(1).replace(/_/g, " "),
    color: SKILL_COLOR_MAP[skill] ?? { bg: "!bg-gray-100", text: "!text-gray-700" },
  }));
}

function mapCurriculumToCard(c: Curriculum): CurriculumCard {
  const skillTags = getSkillTags(c);
  const tag =
    skillTags.length > 0
      ? skillTags.length === 1
        ? skillTags[0].name
        : `${skillTags[0].name} +${skillTags.length - 1}`
      : undefined;

  // Compute age range from subjects' minimumAge / maximumAge
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subjects = (c.subjects ?? []) as any[];
  const ages = subjects
    .map((s: { minimumAge?: number; maximumAge?: number }) => ({
      min: s.minimumAge,
      max: s.maximumAge,
    }))
    .filter((a) => a.min != null || a.max != null);
  let ageRange = "—";
  if (ages.length > 0) {
    const minAge = Math.min(...ages.map((a) => a.min ?? Infinity));
    const maxAge = Math.max(...ages.map((a) => a.max ?? -Infinity));
    if (isFinite(minAge) && isFinite(maxAge)) {
      ageRange = `${minAge} - ${maxAge}`;
    } else if (isFinite(minAge)) {
      ageRange = `${minAge}+`;
    } else if (isFinite(maxAge)) {
      ageRange = `0 - ${maxAge}`;
    }
  }

  return {
    id: String(c.id),
    title: c.title ?? c.name ?? "",
    description: c.description ?? "",
    tag,
    tagColor: tag ? "blue" : undefined,
    skillTags,
    ageRange,
    subjectCount: c.subjects?.length ?? c.subjectCount ?? 0,
  };
}

export default function MyLibraryPage() {
  const router = useRouter();

  const { data, isLoading } = useQueryService<Record<string, unknown>, GetAllCurriculumsResponse>({
    service: curriculumServices.getAllCurriculums,
  });

  const curriculumCards: CurriculumCard[] = useMemo(() => {
    const raw = data?.curriculums ?? data?.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    return list.map(mapCurriculumToCard);
  }, [data]);

  const handleCardClick = (card: CurriculumCard) => {
    router.push(`${DashboardRoutes.viewCurriculum.replace(":id", card.id)}?source=my-library`);
  };

  return (
    <Box className="h-full p-5 space-y-6">
      <Box className="flex items-center gap-2">
        <ButtonIcon
          className="rounded-full !border !border-brandColor-active/20 !p-2 flex items-center justify-center"
          onClick={() => router.back()}
        >
          <Image src={LeftIcon} alt="" />
        </ButtonIcon>
        <Typography className="!text-xl !font-semibold !text-text-primary">My Library</Typography>
      </Box>

      <DataRenderer<CurriculumCard[]> isLoading={isLoading} data={curriculumCards}>
        {({ data }) => {
          const cards = data ?? [];
          return (
            <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.length === 0 ? (
                <Typography className="!text-sm !text-input-gray col-span-full">
                  No curriculums in your library yet.
                </Typography>
              ) : (
                cards.map((card) => (
                  <CurriculumCardItem key={card.id} card={card} onClick={handleCardClick} />
                ))
              )}
            </Box>
          );
        }}
      </DataRenderer>
    </Box>
  );
}
