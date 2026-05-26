"use client";

import React, { useMemo, useEffect } from "react";
import { Typography, Box } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PlusIcon from "@/modules/shared/assets/svgs/plus-icon.svg";
import { LearningActionsProvider, useLearningActions } from "./LearningActionsContext";
import { Button } from "@/modules/shared/component/Button";
import ScrollableTabBar from "./ScrollableTabBar";
import { shouldHideMobileDashboardHeader } from "@/utils/dashboardMobileHeader";
import { getDateRangeByPeriodType } from "@/utils/helpers";

const TAB_ITEMS: {
  key: "milestones" | "subjects" | "curriculum" | "grading" | "report";
  label: string;
}[] = [
  { key: "milestones", label: "Milestones" },
  { key: "subjects", label: "Subjects" },
  { key: "curriculum", label: "Curriculum" },
  { key: "grading", label: "Grading" },
  { key: "report", label: "Report" },
];

interface LearningsLayoutProps {
  children?: React.ReactNode;
  basePath?: string;
  title?: string;
  role?: "admin" | "staff";
}

function LearningsLayoutContent(props: LearningsLayoutProps) {
  const { children, title = "Learning", basePath = "/admin/learning" } = props;
  const pathname = usePathname();

  const { setFilterState, curriculumActions } = useLearningActions();

  useEffect(() => {
    const { startDate, endDate } = getDateRangeByPeriodType("This year");
    setFilterState({
      classroom: "All Classroom",
      classroomId: "",
      status: "all",
      period: "This year",
      startDate,
      endDate,
    });
  }, [pathname, setFilterState]);

  const tabs = useMemo(
    () =>
      TAB_ITEMS.map((item) => ({
        ...item,
        href: `${basePath}/${item.key}`,
      })),
    [basePath],
  );

  const baseSegmentsCount = basePath.split("/").filter(Boolean).length;
  const pathParts = pathname?.split("/").filter(Boolean) || [];
  const isSubPage = pathParts.length > baseSegmentsCount + 1;

  if (isSubPage) {
    const edgeToEdgeMobile = shouldHideMobileDashboardHeader(pathname);
    return (
      <Box
        className={
          edgeToEdgeMobile
            ? "flex flex-col min-h-0 h-[100dvh] max-h-[100dvh] md:h-auto md:max-h-none px-4 py-3 md:p-5 !bg-[#F5F7F9] md:!bg-transparent"
            : ""
        }
      >
        {children}
      </Box>
    );
  }

  const activeTab = tabs.find(
    (tab) => pathname === tab.href || pathname?.startsWith(tab.href + "/"),
  )?.key;
  const isStaffLearningPath = pathname?.startsWith("/staff/learning");
  const showAddCurriculum = activeTab === "curriculum" && !isStaffLearningPath;

  return (
    <Box className="h-full p-5 space-y-6">
      <Box className="hidden md:flex items-center justify-between">
        <Typography className="!text-xl !font-semibold hidden md:block">{title}</Typography>

        <Box className="flex items-center gap-2">
          {showAddCurriculum && (
            <Button
              className="!rounded-lg !bg-brandColor-active"
              startIcon={<PlusIcon />}
              onClick={() => curriculumActions?.openAdd()}
            >
              Add Curriculum
            </Button>
          )}
        </Box>
      </Box>

      <ScrollableTabBar className="!border-b !border-border-lighten">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname?.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`shrink-0 whitespace-nowrap !text-sm !font-normal pb-2 px-3 ${
                active
                  ? " !font-medium !border-b !border-brandColor-active !text-brandColor-active"
                  : "text-[#475467]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </ScrollableTabBar>

      {children}
    </Box>
  );
}

export default function LearningsLayout(props: LearningsLayoutProps) {
  return (
    <LearningActionsProvider>
      <LearningsLayoutContent {...props} />
    </LearningActionsProvider>
  );
}
