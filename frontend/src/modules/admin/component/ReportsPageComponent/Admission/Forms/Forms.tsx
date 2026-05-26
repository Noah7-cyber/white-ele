/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from "react";
import { Box, Typography } from "@mui/material";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import { useForms } from "./useForms";

interface FormsProps {
  classroomId?: number | null;
  startDate?: string;
  endDate?: string;
}

const Forms: FC<FormsProps> = ({ classroomId, startDate, endDate }) => {
  const headers = ["Form Name", "Total Submission", "Total Admission"];

  const { isLoading, tableData, currentPage, pagination, filters, applyFilters } = useForms(
    classroomId,
    startDate,
    endDate,
  );

  return (
    <Box className="flex flex-col gap-3 md:gap-6 bg-transparent md:bg-white md:rounded-2xl border-none md:border md:border-[#EAECF0] p-0 md:p-6">
      <Typography className="text-md! font-semibold! text-primary-gray! border-b! border-[#EAECF0] pb-3">
        Forms
      </Typography>
      <Box className="md:bg-white md:rounded-2xl md:border md:border-[#EAECF0] md:overflow-hidden">
        <Table
          headers={headers}
          tableData={tableData}
          isCollapse={false}
          centeredHeaderIndex={[1, 2]}
          isLoading={isLoading}
          renderMobileCard={(row: any, i: number) => {
            const cells = Object.values(row || {}) as React.ReactNode[];
            return (
              <Box key={i} className="bg-white rounded-[16px] p-4 flex flex-col gap-4 mb-3 border border-[#EAECF0]">
                <Typography className="font-semibold text-[#101828] text-[16px]">{cells[0]}</Typography>
                <Box className="flex items-center justify-between">
                  <Typography className="text-sm text-[#475467]">Submission <span className="font-medium text-[#101828] ml-1">{cells[1]}</span></Typography>
                  <Typography className="text-sm text-[#475467]">Admission <span className="font-medium text-[#101828] ml-1">{cells[2]}</span></Typography>
                </Box>
              </Box>
            );
          }}
        />
      </Box>
      <div className="flex justify-center pt-4">
        <PaginationControls
          currentPage={currentPage}
          rowsPerPage={filters?.delta}
          totalItems={pagination?.count}
          onPageChange={(event: any) => {
            applyFilters({
              pos: (event?.page - 1) * event?.rowsPerPage,
              delta: event?.rowsPerPage,
            });
          }}
        />
      </div>
    </Box>
  );
};

export default Forms;
