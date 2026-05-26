/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Box, Typography } from "@mui/material";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import { useAttendanceClassrooms } from "./useAttendanceClassrooms";

interface AttendanceClassroomsProps {
  startDate?: string;
  endDate?: string;
}

const AttendanceClassrooms = ({ startDate, endDate }: AttendanceClassroomsProps) => {
  const {
    isLoading,
    tableData,
    currentPage,
    totalCount,
    filters,
    applyFilters
  } = useAttendanceClassrooms(startDate, endDate);

  const headers = ["Class(es)", "Students In", "Staff In", "Ratio"];

  return (
    <Box className="flex flex-col gap-3 md:gap-6 bg-transparent md:bg-white md:rounded-2xl border-none md:border md:border-[#EAECF0] p-0 md:p-6">
      <Typography className="text-md! font-semibold! text-primary-gray! border-b! border-[#EAECF0] pb-3">Classrooms</Typography>
      <Box className="md:bg-white md:rounded-2xl md:border md:border-[#EAECF0] md:overflow-hidden">
        <Table
          isLoading={isLoading}
          headers={headers}
          tableData={tableData}
          isCollapse={false}
          centeredHeaderIndex={[1, 2, 3]}
          renderMobileCard={(row: any, i: number) => {
            const cells = Object.values(row || {}) as React.ReactNode[];
            return (
              <Box key={i} className="bg-white rounded-[16px] p-4 flex flex-col gap-4 mb-3 border border-[#EAECF0]">
                <Box className="flex items-center justify-between">
                  <Typography className="text-[#004D40] font-medium text-[14px]">Class</Typography>
                  <Typography className="font-medium text-[#101828] text-[14px]">{cells[0]}</Typography>
                </Box>
                <Box>
                  <Typography className="font-medium text-[#101828] text-[14px]">{cells[3]}</Typography>
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
          totalItems={totalCount}
          onPageChange={(event) => {
            applyFilters({ pos: (event?.page - 1) * event?.rowsPerPage, delta: event?.rowsPerPage });
          }}
        />
      </div>
    </Box>
  );
};

export default AttendanceClassrooms;
