"use client";

import { useUser } from "@/utils/hooks/useUser";
import MilestonesPage from "@/modules/admin/page/Learnings/MilestonesPage/MilestonesPage";

export default function Page() {
  const { staffId } = useUser();
  return <MilestonesPage teacherId={staffId ?? undefined} />;
}
