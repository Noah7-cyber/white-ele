"use client";

import { useUser } from "@/utils/hooks/useUser";
import CurriculumPage from "@/modules/admin/page/Learnings/CurriculumPage/CurriculumPage";

export default function Page() {
  const { staffId } = useUser();
  return <CurriculumPage teacherId={staffId ?? undefined} />;
}
