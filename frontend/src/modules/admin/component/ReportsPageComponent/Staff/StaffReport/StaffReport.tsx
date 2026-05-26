/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from "react";
import { Box, Typography } from "@mui/material";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import { useStaffReport } from "./useStaffReport";


interface StaffReportProps {
  classroomId?: number | null;
  startDate?: string;
  endDate?: string;
}

const StaffReport: FC<StaffReportProps> = ({ classroomId, startDate, endDate }) => {
  const headers = ["Staff Name", "Role", "Room Assignment", "Timecard Hours", "Total Children in Class"];

  const {
    isLoading,
    tableData,
    currentPage,
    pagination,
    filters,
    applyFilters,
  } = useStaffReport(classroomId, startDate, endDate);


  return (
    <Box className="flex flex-col gap-3 md:gap-6 bg-transparent md:bg-white md:rounded-2xl border-none md:border md:border-[#EAECF0] p-0 md:p-6">
      <Typography className="text-md! font-semibold! text-primary-gray! border-b! border-[#EAECF0] pb-3">
        Staff
      </Typography>
      <div className="md:hidden flex flex-col gap-3 w-full">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="rounded-[16px] border border-[#EAECF0] bg-white p-4 h-32 animate-pulse" />
          ))
        ) : tableData?.length === 0 ? (
          <div className="bg-white rounded-[16px] p-6 flex flex-col items-center justify-center border border-[#EAECF0] text-center gap-2">
            <Typography className="text-sm font-medium text-[#101828]">No data to show</Typography>
            <Typography className="text-xs text-[#475467]">You haven&apos;t received any new data.</Typography>
          </div>
        ) : (
          tableData?.map((row: any, i: number) => {
            const cells = Object.values(row || {}) as React.ReactNode[];
            return (
              <Box key={i} className="bg-white rounded-[16px] p-4 flex flex-col gap-4 border border-[#EAECF0]">
                <Typography className="font-semibold text-[#101828] text-[16px]">{cells[0]}</Typography>
                <Box className="flex flex-col gap-2">
                  {headers.slice(1, 5).map((header, idx) => (
                    <Box key={idx} className="flex items-center justify-between gap-4">
                      <Typography className="text-sm text-[#475467]">{header}</Typography>
                      <Typography className="font-medium text-[#101828] text-sm text-right break-words">{cells[idx + 1]}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            );
          })
        )}
      </div>

      <Box className="hidden md:block md:bg-white md:rounded-2xl md:border md:border-[#EAECF0] md:overflow-hidden">
        <Table
          headerCellClassName="whitespace-nowrap"
          headers={headers}
          tableData={tableData}
          isCollapse={false}
          isLoading={isLoading}
        />
      </Box>
      <div className="flex justify-center pt-4">
        <PaginationControls
          currentPage={currentPage}
          rowsPerPage={filters?.delta}
          totalItems={pagination?.total}
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

export default StaffReport;
