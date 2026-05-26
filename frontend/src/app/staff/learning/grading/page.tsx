"use client";

import { useUser } from "@/utils/hooks/useUser";
import GradingPage from "@/modules/admin/page/Learnings/GradingPage/GradingPage";

export default function Page() {
  const { staffId } = useUser();
  return <GradingPage teacherId={staffId ?? undefined} />;
}
