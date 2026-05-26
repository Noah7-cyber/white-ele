"use client";

import { useUser } from "@/utils/hooks/useUser";
import SubjectsPage from "@/modules/admin/page/Learnings/SubjectsPage/SubjectsPage";

export default function Page() {
  const { staffId } = useUser();
  return <SubjectsPage teacherId={staffId ?? undefined} />;
}
