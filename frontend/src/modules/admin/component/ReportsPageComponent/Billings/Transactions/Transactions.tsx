/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Box, Typography } from "@mui/material";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import { useTransactions } from "./useTransactions";

interface TransactionsProps {
  classroomId?: number | null;
  startDate?: string;
  endDate?: string;
}

const Transactions = ({ classroomId, startDate, endDate }: TransactionsProps) => {
  const headers = ["Child Name", "Date", "Description", "Amount"];

  const { isLoading, tableData, currentPage, pagination, filters, applyFilters } = useTransactions(
    classroomId,
    startDate,
    endDate,
  );

  return (
    <Box className="flex flex-col gap-3 md:gap-6 bg-transparent md:bg-white md:rounded-2xl border-none md:border md:border-[#EAECF0] p-0 md:p-6">
      <Typography className="text-md! font-semibold! text-primary-gray! border-b! border-[#EAECF0] pb-3">
        Transactions
      </Typography>
      <Box className="md:bg-white md:rounded-2xl md:border md:border-[#EAECF0] md:overflow-hidden">
        <Table
          headers={headers}
          tableData={tableData}
          isCollapse={false}
          isLoading={isLoading}
          renderMobileCard={(row: any, i: number) => {
            const cells = Object.values(row || {}) as React.ReactNode[];
            return (
              <Box key={i} className="bg-white rounded-[16px] p-4 flex flex-col gap-4 mb-3 border border-[#EAECF0]">
                <Typography className="font-medium text-[#101828] text-[14px]">{cells[0]}</Typography>
                <Box className="flex items-center justify-between mt-2">
                  <Typography className="text-[#344054] text-[14px]">Amount Invoice</Typography>
                  <Typography className="font-bold text-[#101828] text-[14px]">{cells[3]}</Typography>
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

export default Transactions;
