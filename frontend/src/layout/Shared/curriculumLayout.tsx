"use client";
import React from "react";
import { Typography, Box } from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/modules/shared/component/Button";
import PlusIcon from "@/modules/shared/assets/svgs/plus-icon.svg";
import FilterPopover from "@/modules/shared/component/FilterPopover/filterPopover";
import ExpandMoreIcon from "@/modules/shared/assets/svgs/downIcon.svg";
import useCurriculum from "@/modules/shared/component/Learning/hooks/useCurriculum";
import ScrollableTabBar from "./ScrollableTabBar";

interface CurriculumLayoutProps {
  children?: React.ReactNode;
  basePath: string; // e.g. "/admin/learning" or "/staff/learning"
  title?: string;
  role?: "admin" | "staff";
}

export default function CurriculumLayout({
  children,
  basePath = "/admin/learning",
  title = "Learning",
  role = "admin",
}: CurriculumLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    gradeAnchorEl,
    gradeFilters,
    statusFilters,
    statusAnchorEl,
    setStatusAnchorEl,
    selectedGradeFilter,
    setSelectedStatusFilter,
    selectedStatusFilter,
    setGradeAnchorEl,
    handleOpenGradeFilter,
    handleOpenStatusFilter,
    setSelectedGradeFilter,
  } = useCurriculum(role);

  const isCreateCurriculum = pathname?.includes(`${basePath}/curriculum/create`);
  const isCreateAssessment = pathname?.includes(`${basePath}/assessments/add`);
  const isEditAssessment =
    pathname?.includes(`${basePath}/assessments/`) && pathname?.includes("/edit");
  const isViewAssessment = pathname?.includes(`${basePath}/assessments/`) && !isEditAssessment;
  const isGradeAssessment =
    pathname?.includes(`${basePath}/assessments/`) && pathname?.includes("/grade");
  const isEditCurriculum =
    pathname?.includes(`${basePath}/curriculum/`) && pathname?.includes("/edit");
  const isViewCurriculum = pathname?.includes(`${basePath}/curriculum/`) && !isEditCurriculum;

  const isCurriculum = pathname?.includes(`${basePath}/curriculum`);
  const isAssessments = pathname?.includes(`${basePath}/assessments`);
  const isResults = pathname?.includes(`${basePath}/results`);

  const isEditResults = pathname?.includes(`${basePath}/results/`) && pathname?.includes("/edit");
  const isViewResults = pathname?.includes(`${basePath}/results/`) && !isEditResults;

  if (
    isCreateCurriculum ||
    isCreateAssessment ||
    isEditCurriculum ||
    isViewCurriculum ||
    isEditAssessment ||
    isViewAssessment ||
    isGradeAssessment ||
    isEditResults ||
    isViewResults
  ) {
    // Render create pages without the Learning layout (no header/tabs)
    return <>{children}</>;
  }

  const tabs = [
    { href: `${basePath}/curriculum`, label: "Curriculum" },
    { href: `${basePath}/assessments`, label: "Assessments" },
    { href: `${basePath}/results`, label: "Results" },
  ];

  return (
    <Box className="h-full p-5 space-y-6">
      {/* Header with dynamic right-side controls */}
      <Box className="flex items-center justify-between">
        <Typography className="!text-xl !font-semibold">{title}</Typography>

        <Box className="flex items-center gap-2">
          {(isCurriculum || isAssessments || isResults) && (
            <>
              <button
                onClick={handleOpenGradeFilter}
                className="flex items-center justify-around px-2 h-10 w-36 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
              >
                <span className="text-sm font-medium">{selectedGradeFilter}</span>
                <ExpandMoreIcon className="" />
              </button>
              <FilterPopover
                open={Boolean(gradeAnchorEl)}
                anchorEl={gradeAnchorEl}
                onClose={() => setGradeAnchorEl(null)}
                options={gradeFilters}
                onSelect={(value) => {
                  setSelectedGradeFilter(value);
                }}
                width={150}
              />
            </>
          )}
          {isCurriculum && (
            <Button
              className="!rounded-lg"
              startIcon={<PlusIcon />}
              onClick={() => router.push(`${basePath}/curriculum/create`)}
            >
              Create Curriculum
            </Button>
          )}
          {isAssessments && (
            <Button
              className="!rounded-lg"
              startIcon={<PlusIcon />}
              onClick={() => router.push(`${basePath}/assessments/add`)}
            >
              Create Assessment
            </Button>
          )}
          {isResults && (
            <>
              <button
                onClick={handleOpenStatusFilter}
                className="flex items-center justify-around px-2 h-10 w-36 text-gray-700 rounded-lg cursor-pointer border border-gray-200"
              >
                <span className="text-sm font-medium">{selectedStatusFilter}</span>
                <ExpandMoreIcon className="" />
              </button>
              <FilterPopover
                open={Boolean(statusAnchorEl)}
                anchorEl={statusAnchorEl}
                onClose={() => setStatusAnchorEl(null)}
                options={statusFilters}
                onSelect={(value) => {
                  setSelectedStatusFilter(value);
                }}
                width={150}
              />
            </>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <ScrollableTabBar className="!border-b !border-border-lighten">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
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
