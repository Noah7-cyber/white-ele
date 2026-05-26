"use client";

import { useUser } from "@/utils/hooks/useUser";
import PortfolioPage from "@/modules/admin/page/Learnings/PortfolioPage/portfolioPage";

export default function Page() {
  const { staffId } = useUser();
  return <PortfolioPage teacherId={staffId ?? undefined} />;
}
