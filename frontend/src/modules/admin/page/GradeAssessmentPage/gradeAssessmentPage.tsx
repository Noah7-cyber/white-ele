/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Button } from "@/modules/shared/component/Button";
import { Table } from "@/modules/shared/component/Table/table";
import useGradeAssessmentPage from "./hooks/useGradeAssessmentPage";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import Image from "next/image";
import { PaginationControls } from "@/modules/shared/component/Pagination";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { Controller } from "react-hook-form";

export default function GradeAssessmentPage() {
  const {
    control,
    studentsData,
    handleBack,
    handleSave,
    isSubmitting,
    getValues,
    handleScoreChange,
  } = useGradeAssessmentPage();

  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = studentsData?.length || 0;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedStudents = studentsData?.slice(startIndex, endIndex) || [];

  // Get assessment details from form
  const formData = getValues();

  const tableHeaders = ["Name", "Score", "Grade (Auto generate)"];

  const tableData = paginatedStudents.map((student, index) => {
    return {
      Name: (
        <Typography className="!text-sm !text-table-text !font-medium">
          {student.studentName}
        </Typography>
      ),
      Score: (
        <CWTextField
          control={control}
          name={`students.${startIndex + index}.score`}
          placeholder="Input score"
          inputClasses="!text-sm !border-0 !bg-background-offwhite/50 text-center"
          className="!border-0 placeholder:!text-primary-dark mx-auto flex justify-center items-center"
          onChange={(e: any) => {
            let value = e.target.value;

            if (value === "") {
              handleScoreChange(startIndex + index, "");
              return;
            }

            value = Math.min(100, Math.max(0, Number(value)));

            handleScoreChange(startIndex + index, value);
          }}
        />
      ),

      ["Grade (Auto generate)"]: (
        <Controller
          control={control}
          name={`students.${startIndex + index}.grade`}
          render={({ field }) => (
            <Typography className="!text-sm !text-table-text !font-medium text-center">
              {field.value || "-"}
            </Typography>
          )}
        />
      ),
    };
  });

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
      setCurrentPage(1); // Reset to page 1 when rows per page changes
    }
  };

  return (
    <Box className="flex flex-col gap-6 p-6">
      {/* Header Section */}
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-4">
          <ButtonIcon
            onClick={handleBack}
            className="rounded-full !border !border-brandColor-active/20 !p-2 flex items-center justify-center"
            aria-label="Go back"
          >
            <Image src={LeftIcon || "/placeholder.svg"} alt="Back" width={24} height={24} />
          </ButtonIcon>

          <Box className="flex flex-col gap-1">
            <Typography className="!text-xl !font-semibold !text-primary-dark">
              {formData.assessmentTitle}: {formData.subject} | Total: {formData.totalMarks} Marks
            </Typography>
          </Box>
        </Box>

        <Button
          onClick={handleSave}
          loading={isSubmitting}
          className="!text-white !px-8 !rounded-lg"
        >
          Save
        </Button>
      </Box>

      {/* Table Section */}
      <Box className="bg-white rounded-xl">
        <Table
          headers={tableHeaders}
          tableData={tableData}
          centeredHeaderIndex={[1, 2]}
          isCollapse
          tableContainerClassName="!rounded-xl"
        />
      </Box>

      {/* Pagination Section */}
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
    </Box>
  );
}
