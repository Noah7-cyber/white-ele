/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { InsightCard } from "@/components/InsightCard/insightCard";
import { Table } from "@/modules/shared/component/Table/table";
import { PaginationControls } from "@/modules/shared/component/Pagination/Pagination";
import { useChildAttendance, type AttendancePeriodType } from "./hooks/useChildAttendance";
import { capitalizeFirstLetter, timeFormatter } from "@/utils/helpers";

const statusStyles: Record<string, string> = {
  present: "bg-[#E6FFF3] text-[#0A8A4C]",
  absent: "bg-[#FFE6E6] text-[#C74444]",
  late: "bg-[#FFF6DD] text-[#A88400]",
};

export function AttendanceTab({
  selectedTime,
  startDate,
  endDate,
}: {
  selectedTime: string;
  startDate?: string;
  endDate?: string;
}) {


  const periodType: AttendancePeriodType =
    selectedTime === "Today" ? "daily" : selectedTime === "This Week" ? "weekly" : "monthly";
  const { summaryStats, logs, isLoading, formattedLogs, currentPage,
            isLoadingAttendance,
    pagination,
    filters,
    applyFilters, } = useChildAttendance(periodType, { startDate, endDate });

  if (isLoading) {
    return (
      <Box className="flex items-center justify-center p-20">
        <CircularProgress />
      </Box>
    );
  }

  const headers = ["Date", "Time In", "Time Out", "Reason/Note", "Status"];

  const tableData = formattedLogs.map((log: any) => ({
    Date: log.date,
    "Time In": timeFormatter(log.timeIn) || "--",
    "Time Out": timeFormatter(log.timeOut) || "--",
    "Reason/Note": log.reason,
    Status: (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[log.status] || ""}`}
      >
        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
      </span>
    ),
  }));


  return (
    <Box className="flex flex-col gap-6">
      {/* Summary Cards — horizontal scroll on small screens (aligned with parent invoicing insight row) */}
      <Box className="flex md:grid md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto md:overflow-x-visible hide-scrollbar sm:min-h-35 *:shrink-0 md:*:shrink">
        {summaryStats.map((item: any, index: number) => (
          <InsightCard
            key={index}
            name={item.name}
            value={item.value}
            className="!min-h-[100px] !min-w-52 md:min-w-0 !bg-white border! border-[#00808033]! rounded-lg!"
          />
        ))}
      </Box>

      {/* Attendance Log */}
      <Box className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6">
        <Typography className="!text-base !font-semibold !mb-4 md:!mb-6">Attendance Log</Typography>

        {/* Mobile: card list (aligned with admin AttendanceChildrenComponent) */}
        <div className="md:hidden flex flex-col gap-3">
          {formattedLogs.map((log: any, idx: number) => {
            const statusLabel = capitalizeFirstLetter(log.status ?? "—");
            const pill =
              log.status === "present"
                ? "bg-[#E6FFF3] text-[#0A8A4C]"
                : log.status === "late"
                  ? "bg-[#FFF6DD] text-[#A88400]"
                  : log.status === "absent"
                    ? "bg-[#FFE6E6] text-[#C74444]"
                    : "bg-gray-100 text-gray-600";
            return (
              <div
                key={`${log.date}-${idx}`}
                className="bg-white rounded-xl border border-[#E4E7EC] shadow-sm px-4 py-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-semibold text-[#022F2F] text-sm truncate">{log.date}</span>
                  <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${pill}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>In {timeFormatter(log.timeIn) || "—"}</span>
                  <span>Out {timeFormatter(log.timeOut) || "—"}</span>
                </div>
                {log.reason && log.reason !== "--" && (
                  <div className="mt-1 text-[11px] text-gray-400 line-clamp-2">{log.reason}</div>
                )}
              </div>
            );
          })}
        </div>

        <Box className="hidden md:block">
          <Table
            headers={headers}
            tableData={tableData}
            centeredHeaderIndex={[1, 2, 3, 4]}
            tableClassName="!border-none"
            headerRowClassName="!bg-[#F9FAFB] !rounded-t-xl"
            bodyRowClassName="!h-16 border-b border-gray-50 last:border-none"
            bodyCellClassName="!text-sm !text-gray-600"
            isLoading={isLoadingAttendance}
          />
        </Box>

        {logs.length > 0 && (
          <>
            <Box className="mt-4 md:mt-6 flex justify-between items-center md:hidden">
              <PaginationControls
                  currentPage={currentPage}
            rowsPerPage={filters?.delta}
            totalItems={pagination?.count}
            onPageChange={(event) => {
              applyFilters({
                pos: (event?.page - 1) * event?.rowsPerPage,
                delta: event?.rowsPerPage,
              });
            }}
                isCondense
                bottomTableClasses="!text-xs"
              />
            </Box>
            <Box className="mt-6 hidden md:flex justify-between items-center">
              <PaginationControls
                  currentPage={currentPage}
            rowsPerPage={filters?.delta}
            totalItems={pagination?.count}
            onPageChange={(event) => {
              applyFilters({
                pos: (event?.page - 1) * event?.rowsPerPage,
                delta: event?.rowsPerPage,
              });
            }}
              />
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
