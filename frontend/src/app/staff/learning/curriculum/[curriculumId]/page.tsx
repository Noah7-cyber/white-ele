"use client";

import React from "react";
import { CurriculumDetail } from "@/modules/admin/page/Curriculum/curriculum-detail";
import { useQueryService } from "@/utils/hooks/useQueryService";
import {
  curriculumDynamicEndpoints,
  GetCurriculumByIdResponse,
} from "@/services/curriculum.service";
import { classroomServices } from "@/services/classroom.service";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { useMemo } from "react";

interface PageProps {
  params: Promise<{ curriculumId: number }>;
}

export default function CurriculumViewPage({ params }: PageProps) {
  // Note: In Next.js 15, params is a Promise, but for client components we'll handle it differently
  // For now, we'll use a wrapper component
  return <CurriculumViewPageClient params={params} />;
}

function CurriculumViewPageClient({ params }: { params: Promise<{ curriculumId: number }> }) {
  const [curriculumId, setCurriculumId] = React.useState<number | null>(null);

  React.useEffect(() => {
    params.then((p) => setCurriculumId(p.curriculumId));
  }, [params]);

  if (!curriculumId) {
    return <div>Loading...</div>;
  }

  return <CurriculumDetailClient curriculumId={curriculumId} />;
}

function CurriculumDetailClient({ curriculumId }: { curriculumId: number }) {
  const { data: curriculumDetailData } = useQueryService<
    Record<string, never>,
    GetCurriculumByIdResponse
  >({
    service: curriculumDynamicEndpoints.getCurriculumById(curriculumId),
  });

  const { data: classroomData } = useInfiniteQueryService<
    Record<string, never>,
    { classrooms?: Array<{ id: number; classroomName: string }>; pagination: PaginationData }
  >({
    service: {
      ...classroomServices.getAllClassrooms,
      data: {
        delta: 100,
        status: "active",
      },
    },
  });

  const curriculum = useMemo(() => {
    if (!curriculumDetailData) {
      return {
        curriculumId,
        title: "Loading...",
        classes: "Loading...",
        academicYear: "",
        term: "",
        assignedStaff: "",
        startDate: "",
        endDate: "",
        description: "",
        subjects: [],
        status: "active",
      };
    }

    const curriculumData = curriculumDetailData.curriculum;
    const classrooms =
      classroomData?.pages?.reduce<Array<{ id: number; classroomName: string }>>(
        (acc, page) => acc.concat(page.classrooms || []),
        [],
      ) || [];

    const classroomMap = new Map(classrooms.map((c) => [c.id, c.classroomName]));
    const classNames =
      curriculumData.classIds?.map((id) => classroomMap.get(id) || `Class ${id}`).join(", ") ||
      "N/A";

    const creatorName = curriculumData.creator
      ? `${curriculumData.creator.firstName} ${curriculumData.creator.lastName}`.trim()
      : "N/A";

    // Format dates
    const startDate = curriculumData.startDate
      ? new Date(curriculumData.startDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
      : "N/A";

    const endDate = curriculumData.endDate
      ? new Date(curriculumData.endDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
      : "N/A";

    // Format term
    const termMap: Record<string, string> = {
      first_term: "First Term",
      second_term: "Second Term",
      third_term: "Third Term",
    };
    const term = termMap[curriculumData.term || ""] || curriculumData.term || "N/A";

    return {
      curriculumId: curriculumData.id,
      title: curriculumData.title || "Untitled",
      classes: classNames,
      academicYear: curriculumData.academicYear || "",
      term,
      assignedStaff: creatorName,
      startDate,
      endDate,
      description: curriculumData.description || "",
      subjects: curriculumDetailData.subjects || [],
      status: curriculumData.status || "active",
    };
  }, [curriculumDetailData, classroomData, curriculumId]);

  return <CurriculumDetail curriculum={curriculum} role="staff" />;
}
