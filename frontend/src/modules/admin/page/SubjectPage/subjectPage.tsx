"use client";

import { FC } from "react";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { InsightCard } from "@/components/InsightCard";
import { Table } from "@/modules/shared/component/Table";
import useSubjectPage from "@/modules/shared/component/Learning/hooks/useSubjectPage";
import type { SubjectDetail } from "../Curriculum/curriculum.mock";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import ScrollableTabBar from "@/layout/Shared/ScrollableTabBar";

interface SubjectPageProps {
  curriculumId: string;
  subject: SubjectDetail;
  role?: "admin" | "staff";
}

export const SubjectPage: FC<SubjectPageProps> = ({ curriculumId, subject, role = "admin" }) => {
  const {
    activeTab,
    setActiveTab,
    handleBack,
    milestoneHeaders,
    assessmentHeaders,
    metrics,
    paginatedAssessments,
    paginatedMilestones,
    rowsPerPage,
    currentPage,
    totalItems,
    handlePageChange,
    formatDate,
    formatStatus,
  } = useSubjectPage({ curriculumId, subject, role });

  const isMilestoneTab = activeTab === "milestones";
  const currentHeaders = isMilestoneTab ? milestoneHeaders : assessmentHeaders;

  const currentTableData = isMilestoneTab ? paginatedMilestones : paginatedAssessments;

  return (
    <Box className="h-full p-5 pb-8 space-y-6">
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-3">
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !p-0 flex items-center justify-center"
            onClick={handleBack}
          >
            <Image src={LeftIcon || "/placeholder.svg"} alt="Back" />
          </ButtonIcon>
          <Box className="flex flex-col gap-1">
            <Box className="flex flex-row gap-1.5 items-center">
              <Typography className="!text-xl !font-semibold !text-text-primary">
                {subject.name}
              </Typography>
              <Typography className="!text-sm !text-brandColor-inactive">
                {formatStatus(subject.status)}
              </Typography>
            </Box>
            <Typography className="!text-sm !text-brandColor-inactive">
              {subject.description}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard name=" Milestones" value={metrics.totalMilestones} />

        <InsightCard name="Assessments" value={metrics.totalAssessments} />
        <InsightCard name="Last Updated" value={formatDate(metrics.lastUpdated)} />
      </Box>

      <Box className="flex flex-col gap-4 rounded-2xl ">
        <ScrollableTabBar
          className="border-b border-border-lightGray"
          innerClassName="flex flex-nowrap items-center gap-4 min-w-min"
        >
          {["milestones", "assessments"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`shrink-0 whitespace-nowrap pb-2 px-2 text-sm capitalize ${activeTab === tab
                  ? "!text-brandColor-active border-b border-brandColor-active font-medium"
                  : "!text-brandColor-inactive"
                }`}
              onClick={() => setActiveTab(tab as "milestones" | "assessments")}
            >
              {tab}
            </button>
          ))}
        </ScrollableTabBar>

        <Table
          headers={currentHeaders}
          tableData={currentTableData}
          isCollapse
          centeredHeaderIndex={[2, 3]}
          rightAlignedIndex={[4]}
        />
        <Box className="flex justify-center pt-4">
          <PaginationControls
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            isCondense
            bottomTableClasses="!text-xs"
          />
        </Box>
      </Box>
    </Box>
  );
};
