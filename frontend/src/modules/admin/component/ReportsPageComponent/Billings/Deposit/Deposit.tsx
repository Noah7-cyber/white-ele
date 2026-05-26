/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Box, Typography } from "@mui/material";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import { useDeposit } from "./useDeposit";

// Mock Data matching the screenshot for Deposits

interface DepositProps {
  classroomId?: number | null;
  startDate?: string;
  endDate?: string;
  status?: string;
}

const Deposit = ({ status, classroomId, startDate, endDate }: DepositProps) => {
  const headers = ["Child Name", "Date", "Description", "Status", "Total Fees", "Amount Deposited"];

  const { isLoading, tableData, currentPage, pagination, filters, applyFilters } = useDeposit(
    classroomId,
    startDate,
    endDate,
    status,
  );

  return (
    <Box className="flex flex-col gap-3 md:gap-6 bg-transparent md:bg-white md:rounded-2xl border-none md:border md:border-[#EAECF0] p-0 md:p-6">
      <Typography className="text-md! font-semibold! text-primary-gray! border-b! border-[#EAECF0] pb-3">
        Deposits
      </Typography>
      <Box className="md:bg-white md:rounded-2xl md:border md:border-[#EAECF0] md:overflow-hidden">
        <Table
          headers={headers}
          isLoading={isLoading}
          tableData={tableData}
          isCollapse={false}
          centeredHeaderIndex={[3]}
          rightAlignedIndex={[4, 5]}
          renderMobileCard={(row: any, i: number) => {
            const cells = Object.values(row || {}) as React.ReactNode[];
            return (
              <Box key={i} className="bg-white rounded-[16px] p-4 flex flex-col gap-4 mb-3 border border-[#EAECF0]">
                <Box className="flex items-center justify-between">
                  <Typography className="font-medium text-[#101828] text-[14px]">{cells[0]}</Typography>
                  {cells[3]}
                </Box>
                <Box className="flex items-center justify-between mt-2">
                  <Typography className="text-[#344054] text-[14px]">Amount Deposited</Typography>
                  <Typography className="font-bold text-[#101828] text-[14px]">{cells[5]}</Typography>
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

export default Deposit;
