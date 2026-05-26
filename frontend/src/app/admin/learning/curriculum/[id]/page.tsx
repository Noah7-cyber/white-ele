"use client";

import React from "react";
import CurriculumDetailView from "@/modules/admin/page/Learnings/CurriculumPage/CurriculumDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CurriculumViewPage({ params }: PageProps) {
  return <CurriculumViewPageClient params={params} />;
}

function CurriculumViewPageClient({ params }: { params: Promise<{ id: string }> }) {
  const [curriculumId, setCurriculumId] = React.useState<string | null>(null);

  React.useEffect(() => {
    params.then((p) => setCurriculumId(p.id));
  }, [params]);

  if (!curriculumId) {
    return <div>Loading...</div>;
  }

  return <CurriculumDetailView curriculumId={curriculumId} />;
}
