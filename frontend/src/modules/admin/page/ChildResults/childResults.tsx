/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FC } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Table } from "@/modules/shared/component/Table/table";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { portfolioServices, type GetAllPortfoliosResponse } from "@/services/portfolio.service";
import { simpleDateFormatter } from "@/utils/helpers";

type ChildResultsProps = {
  childId: string;
};

export const ChildResults: FC<ChildResultsProps> = ({ childId }) => {

  const {data: {data: studentGrades = []} = {} as any, isLoading } = useQueryService<Record<string, never>, GetAllPortfoliosResponse>({
    service: {
      ...portfolioServices.getStudentGrades,
      data: {
        studentId: Number(childId),
      },
    },
    options: {
      keys: ["admin-child-results", String(childId)],
      enabled: !!childId,
    },
  });


  const headers = ["Subject Name", "Milestone Name", "Date", "Grade"];
  const tableData = studentGrades?.map((result) => ({
    "Subject Name": result?.subjectName || "--",
    "Milestone Name": result?.milestoneName || "--",
    Date: simpleDateFormatter(result?.date),
    Grade: result?.score ?? "--",
  }));

    if (isLoading) {
    return (
      <Box className="flex items-center justify-center p-20 w-full">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="w-full px-3 sm:px-5 bg-dashboard-bg md:bg-transparent min-w-0">
      <Box className="">
        <Table
          headers={headers}
          tableData={tableData}
          centeredHeaderIndex={[2, 3]}
          tableClassName="!border-none"
          headerRowClassName="!bg-[#F7F8FA] !h-[48px] border-b border-[#E8EEF0]"
          renderMobileCard={(row, index) => {
            const cells = Object.values(row as Record<string, string | number>);

            return (
              <Box
                key={`${cells?.[0]}-${index}`}
                className="mx-4 mb-4 rounded-md bg-white px-4 py-4 first:mt-4"
              >
                <Typography className="!text-[14px] !font-medium">
                  {String(cells?.[0] ?? "--")}
                </Typography>

                <Typography className="!mt-2 !text-[13px] !text-[#7B8B90]">
                  {String(cells?.[1] ?? "--")} • {String(cells[2] ?? "--")}
                </Typography>

                <Box className="mt-4 flex items-end justify-between gap-4">
                  <Typography className="!text-[14px] !font-normal !text-[#4F6368]">
                    Grade
                  </Typography>

                  <Typography className="!text-[14px] !font-medium">
                    {String(cells?.[3] ?? "--")}
                  </Typography>
                </Box>
              </Box>
            );
          }}
        />
      </Box>
    </Box>
  );
};
