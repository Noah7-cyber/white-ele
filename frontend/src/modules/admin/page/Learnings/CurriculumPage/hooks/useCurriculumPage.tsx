"use client";

import { useState, useMemo } from "react";
import type { Curriculum } from "@/services/curriculum.service";
import type { CurriculumCard, SkillTag } from "../../learning.constants";
import {
  curriculumServices,
  type GetAllCurriculumsResponse,
  type DeleteCurriculumResponse,
  curriculumDynamicEndpoints,
} from "@/services/curriculum.service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { SKILL_LABEL_MAP, SKILL_COLOR_MAP } from "@/constants/learning.enums";
import { useMutationService } from "@/utils/hooks/useMutationService";

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

/** Aggregate skills tag string (first + count) for backward compat */
function getTagFromSkills(curriculum: Curriculum): string | undefined {
  const tags = getSkillTags(curriculum);
  if (tags.length === 0) return undefined;
  return tags.length === 1 ? tags[0].name : `${tags[0].name} +${tags.length - 1}`;
}

function mapCurriculumToCard(c: Curriculum): CurriculumCard {
  const tag = getTagFromSkills(c);
  const skillTags = getSkillTags(c);

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

/** Dummy template curriculum data — these would normally come from a separate API endpoint */
const DUMMY_TEMPLATE_CURRICULA: CurriculumCard[] = [
  {
    id: "tpl-1",
    title: "Early Years Foundation",
    description:
      "A comprehensive early years curriculum focusing on foundational skills through play-based learning and structured activities.",
    tag: "Literacy +2",
    tagColor: "green",
    skillTags: [
      { name: "Literacy", color: { bg: "!bg-green-100", text: "!text-green-700" } },
      { name: "Communication", color: { bg: "!bg-teal-100", text: "!text-teal-700" } },
      { name: "Social & Emotional", color: { bg: "!bg-pink-100", text: "!text-pink-700" } },
    ],
    ageRange: "3 - 5",
    subjectCount: 6,
  },
  {
    id: "tpl-2",
    title: "Montessori Primary",
    description:
      "Child-centred Montessori approach for primary learners with hands-on materials and self-directed activities.",
    tag: "Fine Motor +3",
    tagColor: "yellow",
    skillTags: [
      { name: "Fine Motor", color: { bg: "!bg-amber-100", text: "!text-amber-700" } },
      { name: "Cognitive", color: { bg: "!bg-blue-100", text: "!text-blue-700" } },
      { name: "STEM", color: { bg: "!bg-indigo-100", text: "!text-indigo-700" } },
      { name: "Arts", color: { bg: "!bg-purple-100", text: "!text-purple-700" } },
    ],
    ageRange: "3 - 6",
    subjectCount: 8,
  },
  {
    id: "tpl-3",
    title: "STEM Discovery",
    description:
      "Science, Technology, Engineering and Mathematics focused curriculum with project-based learning modules.",
    tag: "STEM +1",
    tagColor: "blue",
    skillTags: [
      { name: "STEM", color: { bg: "!bg-indigo-100", text: "!text-indigo-700" } },
      { name: "Cognitive", color: { bg: "!bg-blue-100", text: "!text-blue-700" } },
    ],
    ageRange: "5 - 8",
    subjectCount: 5,
  },
  {
    id: "tpl-4",
    title: "Creative Arts Programme",
    description:
      "Nurture creativity and artistic expression through visual arts, music, drama and movement activities.",
    tag: "Arts +1",
    tagColor: "pink",
    skillTags: [
      { name: "Arts", color: { bg: "!bg-purple-100", text: "!text-purple-700" } },
      { name: "Gross Motor", color: { bg: "!bg-orange-100", text: "!text-orange-700" } },
    ],
    ageRange: "4 - 7",
    subjectCount: 4,
  },
  {
    id: "tpl-5",
    title: "Language & Literacy",
    description:
      "Build strong reading, writing and oral language skills through phonics, storytelling and structured literacy programmes.",
    tag: "Literacy +1",
    tagColor: "green",
    skillTags: [
      { name: "Literacy", color: { bg: "!bg-green-100", text: "!text-green-700" } },
      { name: "Communication", color: { bg: "!bg-teal-100", text: "!text-teal-700" } },
    ],
    ageRange: "3 - 6",
    subjectCount: 3,
  },
  {
    id: "tpl-6",
    title: "Holistic Development",
    description:
      "An all-round curriculum that integrates cognitive, physical and social-emotional development for balanced growth.",
    tag: "Cognitive +4",
    tagColor: "blue",
    skillTags: [
      { name: "Cognitive", color: { bg: "!bg-blue-100", text: "!text-blue-700" } },
      { name: "Gross Motor", color: { bg: "!bg-orange-100", text: "!text-orange-700" } },
      { name: "Fine Motor", color: { bg: "!bg-amber-100", text: "!text-amber-700" } },
      { name: "Social & Emotional", color: { bg: "!bg-pink-100", text: "!text-pink-700" } },
      { name: "Communication", color: { bg: "!bg-teal-100", text: "!text-teal-700" } },
    ],
    ageRange: "2 - 6",
    subjectCount: 10,
  },
];

export default function useCurriculumPage(teacherId?: number | null, classroomId?: string) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CurriculumCard | null>(null);
 
  const { data, isLoading, refetch } = useQueryService<
    Record<string, unknown>,
    GetAllCurriculumsResponse
  >({
    service: {
      ...curriculumServices.getAllCurriculums,
      data: {
        ...(teacherId != null ? { teacherId } : {}),
        ...(classroomId ? { classroomId: Number(classroomId) } : {}),
      },
    },
  });

  const { mutateAsync: deleteCurriculum, isPending: isDeleting } = useMutationService<
    { curriculumId: string },
    DeleteCurriculumResponse
  >({
    service: (variables) => curriculumDynamicEndpoints.deleteCurriculum(variables.curriculumId),
  });

  const apiList = useMemo(() => {
    const raw = data?.curriculums ?? data?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const myLibraryCards: CurriculumCard[] = useMemo(
    () => apiList.slice(0, 8).map(mapCurriculumToCard),
    [apiList],
  );

  const handleDeleteCurriculum = async (card: CurriculumCard | null) => {
    if (!card) return;
    try {
      await deleteCurriculum({ curriculumId: card.id });
      refetch();
    } catch (error) {
      console.error("Error deleting curriculum:", error);
    }
  };

  const templateLibraryCards: CurriculumCard[] = DUMMY_TEMPLATE_CURRICULA;

  const totalCurriculums = apiList.length + DUMMY_TEMPLATE_CURRICULA.length;
  const templatesCount = DUMMY_TEMPLATE_CURRICULA.length;
  const customCount = apiList.length;

  const onCurriculumAdded = () => {
    setAddModalOpen(false);
    refetch();
  };

  return {
    totalCurriculums,
    templatesCount,
    customCount,
    myLibraryCards,
    templateLibraryCards,
    addModalOpen,
    setAddModalOpen,
    onCurriculumAdded,
    isLoading,
    isDeleting,
    refetch,
    handleDeleteCurriculum,
    deleteModalOpen,
    setDeleteModalOpen,
    selectedCard,
    setSelectedCard,
  };
}
