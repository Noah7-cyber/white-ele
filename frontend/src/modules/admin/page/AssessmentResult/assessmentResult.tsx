"use client";

import { Box } from "@mui/material";
import useAssessmentResult from "./hooks/useAssessmentResult";
import { Table } from "@/modules/shared/component/Table";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import { useState } from "react";
import { ManageAssessmentScoreModal } from "@/modules/shared/component/Learning/ManageAssessmentScoreModal";

const AssessmentResult = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(2);
  const { assessmentResultHeader, assessmentResultTableData, isEdit, setIsEdit } =
    useAssessmentResult();
  const handlePageChange = ({
    page,
    rowsPerPage: newRowsPerPage,
  }: {
    page: number;
    rowsPerPage: number;
  }) => {
    setCurrentPage(page);
    if (newRowsPerPage !== rowsPerPage) {
      setRowsPerPage(newRowsPerPage);
      setCurrentPage(1); // Reset to page 1 on rows change
    }
  };
  const totalItems = assessmentResultTableData.length;
  return (
    <Box className="h-full space-y-6 my-6">
      <Table
        headers={assessmentResultHeader}
        tableData={assessmentResultTableData}
        headerRowClassName="!bg-[#F9FAFB] !border-b !border-[#E4E7EC] !text-sm"
        headerCellClassName="!text-dark !font-medium !text-center first:!text-left third:!text-left"
        bodyCellClassName="!text-dark !text-base w-[200px] !font-medium !text-center first:!text-left align-middle !py-4"
        bodyRowClassName="border-b border-[#E4E7EC] !text-center last:border-0"
        tableContainerClassName="!border !border-[#E4E7EC] !rounded-lg !overflow-hidden !bg-white"
        isCollapse={true}
        isCondense={true}
        centeredHeaderIndex={[1,2]}
        rightAlignedIndex={[ 3]}
      />

      <Box className="flex justify-center">
        <PaginationControls
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          isCondense
          bottomTableClasses="!text-xs"
        />
      </Box>
      <ManageAssessmentScoreModal
        isOpen={isEdit}
        onClose={() => {
          setIsEdit(false);
        }}
        onSave={() => {}}
      />
    </Box>
  );
};

export default AssessmentResult;
