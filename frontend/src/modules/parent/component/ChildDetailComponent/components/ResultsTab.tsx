/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Box, CircularProgress } from "@mui/material";
import { Table } from "@/modules/shared/component/Table/table";
import { useParams } from "next/navigation";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { unwrapQueryDataBody } from "@/utils/unwrapQueryResponse";
import { portfolioServices, type GetAllPortfoliosResponse } from "@/services/portfolio.service";
import { dateFormatter } from "@/utils/helpers";

export default function ChildResultsPage() {
  const { id } = useParams() as { id: string };

  const gradesQuery = useQueryService<Record<string, never>, GetAllPortfoliosResponse>({
    service: {
      ...portfolioServices.getStudentGrades,
      data: {
        studentId: Number(id),
      },
    },
    options: {
      keys: ["child-results", String(id)],
      enabled: !!id,
    },
  });
  const { isLoading } = gradesQuery;
  const gradesPayload = unwrapQueryDataBody<any>(gradesQuery.data);
  const studentGrades = Array.isArray(gradesPayload)
    ? gradesPayload
    : gradesPayload?.data ?? gradesPayload?.portfolios ?? [];

  if (isLoading) {
    return (
      <Box className="flex items-center justify-center p-20">
        <CircularProgress />
      </Box>
    );
  }

  const headers = ["Milestone Name", "Subject Name", "Date", "Grade"];
  const tableData = studentGrades?.map((result: any) => ({
    "Milestone Name": result?.milestoneName,
    "Subject Name": result?.subjectName,
    Date: dateFormatter(result?.date),
    Grade: result?.gradeValue,
  }));

  return (
    <Box className="flex flex-col gap-0">
      <Box className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <Table
          headers={headers}
          tableData={tableData}
          centeredHeaderIndex={[2, 3]}
          tableClassName="!border-none"
          headerRowClassName="!bg-[#F9FAFB] border-b border-gray-100"
          bodyRowClassName="!h-16 border-b border-gray-50 last:border-none"
          bodyCellClassName="!text-sm !text-gray-600"
        />
        {studentGrades?.length === 0 && (
          <Box className="p-10 text-center text-gray-400">No results found for this period.</Box>
        )}
      </Box>
    </Box>
  );
}
