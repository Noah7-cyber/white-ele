"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { useRouter } from "next/navigation";
import Image from "next/image";

import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import { Table } from "@/modules/shared/component/Table";
import useCurriculumDetail from "@/modules/shared/component/Learning/hooks/useCurriculumDetail";
import { InsightCard } from "@/components/InsightCard";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";

interface CurriculumDetailProps {
  curriculum: {
    curriculumId: number;
    title: string;
    classes: string;
    academicYear: string;
    term: string;
    assignedStaff: string;
    startDate: string;
    endDate: string;
    description: string;
    subjects: unknown[];
    status: string;
  };
  role?: "admin" | "staff";
}

export function CurriculumDetail({ curriculum, role = "admin" }: CurriculumDetailProps) {
  const router = useRouter();
  const { rowsPerPage, paginatedData, currentPage, totalItems, applyFilters, isLoading } =
    useCurriculumDetail({ curriculumId: curriculum.curriculumId, role });

  const headers = [
    "Subject",
    "Assigned Staff",
    "No. of Milestones",
    "No. of Assessments",
    "Last Updated",
    "Action",
  ];

  const getStatusBadge = (classes: string) => {
    const base = "px-4 py-[3px] text-xs font-medium rounded-full";
    switch (classes) {
      case "Grade 1":
        return <span className={`${base} bg-badge-blue/15 text-badge-blue`}>Grade 1</span>;
      case "Grade 4":
        return <span className={`${base} bg-badge-blue/15 text-badge-blue`}>Grade 1</span>;
      case "Grade 5":
        return <span className={`${base} bg-badge-blue/15 text-badge-blue`}>Grade 1</span>;
      case "Grade 2":
        return <span className={`${base} bg-success-green/15 text-success-green`}>Grade 2</span>;
      case "Grade 3":
        return <span className={`${base} bg-badge-red/15 text-badge-red`}>Grade 3</span>;
      default:
        return <span className={`${base} bg-badge-blue/15 text-badge-blue`}>{classes}</span>;
    }
  };

  return (
    <Box className="h-full p-5 pb-8 space-y-6">
      <DataRenderer
        isLoading={isLoading}
        // isEmpty={paginatedData.length === 0 && !isLoading}
        emptyTitle="No Subjects"
        emptySubTitle="This curriculum doesn't have any subjects yet."
      >
        {() => (
          <>
            <Box className="flex items-center justify-between">
              <Box className="flex items-center gap-2.5">
                <ButtonIcon
                  className="rounded-full !border !border-brandColor-active/20 !p-0 flex items-center justify-center"
                  onClick={() => router.back()}
                >
                  <Image src={LeftIcon || "/placeholder.svg"} alt="Back" />
                </ButtonIcon>
                <Box className="flex flex-col gap-0.5" >
                  <Box className="flex flex-row gap-1.5 items-center">
                    <Typography className="!text-xl !font-semibold !text-text-primary">
                      {curriculum.title}
                    </Typography>
                    <Box className="flex items-center gap-2 ">
                      {getStatusBadge(curriculum.classes)}
                    </Box>
                  </Box>
                  <Typography className="!text-sm !text-brandColor-inactive">
                    {curriculum.description}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box className="flex flex-col gap-6 rounded-xl">
              <Box className="flex gap-4">
                <InsightCard name="Total Subjects" value={totalItems || 0} />
                <InsightCard name="Milestones" value={0} />
                <InsightCard name="Assessments" value={0} />
              </Box>
              <Box className="flex flex-col gap-4">
                <Box className="flex-1">
                  <Table
                    headers={headers}
                    tableData={paginatedData}
                    isCollapse
                    centeredHeaderIndex={[1, 2, 3, 4]}
                    rightAlignedIndex={[5]}
                    isLoading={isLoading}
                  />

                  <Box className="flex justify-center pt-4">
                    <PaginationControls
                      currentPage={currentPage}
                      rowsPerPage={rowsPerPage}
                      totalItems={totalItems}
                      onPageChange={(event) => {
                        applyFilters({
                          pos: (event?.page - 1) * event?.rowsPerPage,
                          delta: event?.rowsPerPage,
                        });
                      }}
                      isCondense
                      bottomTableClasses="!text-xs"
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </DataRenderer>
    </Box>
  );
}
