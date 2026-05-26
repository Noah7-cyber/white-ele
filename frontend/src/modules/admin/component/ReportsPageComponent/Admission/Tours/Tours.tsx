/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from "react";
import { Box, Typography } from "@mui/material";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import { useTours } from "./useTours";

interface ToursProps {
  classroomId?: number | null;
  startDate?: string;
  endDate?: string;
}
const Tours: FC<ToursProps> = ({ classroomId, startDate, endDate }) => {
  const { isLoading, tableData, currentPage, totalItems, filters, applyFilters } = useTours(
    classroomId,
    startDate,
    endDate,
  );

  const headers = ["Tour Name", "Total Tour Booked"];

  return (
    <Box className="flex flex-col gap-3 md:gap-6 bg-transparent md:bg-white md:rounded-2xl border-none md:border md:border-[#EAECF0] p-0 md:p-6">
      <Typography className="text-md! font-semibold! text-primary-gray! border-b! border-[#EAECF0] pb-3">
        Tours
      </Typography>
      <Box className="md:bg-white md:rounded-2xl md:border md:border-[#EAECF0] md:overflow-hidden">
        <Table
          isLoading={isLoading}
          headers={headers}
          tableData={tableData}
          isCollapse={false}
          centeredHeaderIndex={[1]}
          renderMobileCard={(row: any, i: number) => {
            const cells = Object.values(row || {}) as React.ReactNode[];
            return (
              <Box key={i} className="bg-white rounded-[16px] p-4 flex flex-col gap-4 mb-3 border border-[#EAECF0]">
                <Typography className="font-semibold text-[#101828] text-[16px]">{cells[0]}</Typography>
                <Box className="flex items-center justify-between">
                  <Typography className="text-sm text-[#475467]">Booked <span className="font-medium text-[#101828] ml-1">{cells[1]}</span></Typography>
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
          totalItems={totalItems}
          onPageChange={(event) => {
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

export default Tours;
