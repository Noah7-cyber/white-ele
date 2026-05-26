"use client";

import { Box, Typography } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import classNames from "classnames";
import React, { type FC, useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import ExpandMoreIcon from "@/modules/shared/assets/svgs/downIcon.svg";
import { CWPopover } from "@/modules/shared/component/Popover";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { useQueryService } from "@/utils/hooks/useQueryService";
import {
  DashboardAnalyticsResponse,
  analyticsDynamicEndpoints,
  AdminDashboardAnalyticsParams,
} from "@/services/analytics.service";
import { mapAttendanceTrendToChartData, roundUpToNiceAxisMax } from "@/utils/helpers";
import dayjs from "dayjs";

export interface ClassroomOption {
  id: number;
  classroomName: string;
}

export type AttendancePeriodType = "daily" | "weekly" | "monthly" | "yearly";

export interface ClassAttendanceChartProps {
  className?: string;
  startDate?: string;
  endDate?: string;
  attendancePeriodType?: AttendancePeriodType;
  classrooms?: ClassroomOption[];
}

interface DayData {
  present: number | null;
  absent: number | null;
  late?: number | null;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number | null; dataKey: string; color: string; payload?: DayData }>;
}
interface payload {
  value: number | null;
  dataKey: string;
  color: string;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload?.length) {
    const dayData = payload[0].payload as DayData;
    const total = (dayData?.present ?? 0) + (dayData?.absent ?? 0);

    return (
      <div className="bg-white rounded-md shadow-md px-3 py-2 text-sm font-medium space-y-1">
        {payload.map((entry: payload) => {
          const entryValue = entry.value ?? 0;
          const percentage = total > 0 ? ((entryValue / total) * 100).toFixed(0) : "0";
          return (
            <div key={entry.dataKey} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              {entry.dataKey === "present"
                ? "Present"
                : entry.dataKey === "absent"
                  ? "Absent"
                  : "Late"}{" "}
              {percentage}%
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const ATTENDANCE_TREND_OPTIONS: ("student" | "staff")[] = ["student", "staff"];
export const ClassAttendanceChart: FC<ClassAttendanceChartProps> = ({
  className,
  startDate,
  endDate,
  attendancePeriodType,
  classrooms = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | number | null>(null);
  const [attendanceTrendType, setAttendanceTrendType] = useState<"student" | "staff">("student");

  useEffect(() => {
    setSelectedClassroomId(null);
  }, [startDate, endDate]);

  const chartParams = useMemo(
    () => ({
      startDate,
      endDate,
      attendancePeriodType,
      attendanceTrendType,
      ...(selectedClassroomId != null &&
        selectedClassroomId !== "" &&
        attendanceTrendType === "student" && { classroomId: selectedClassroomId }),
    }),
    [startDate, endDate, attendancePeriodType, attendanceTrendType, selectedClassroomId],
  );

  const { data: analyticsData, isLoading } = useQueryService<
    Record<string, unknown>,
    DashboardAnalyticsResponse
  >({
    service: analyticsDynamicEndpoints.getAdminDashboardAnalytics(
      chartParams as AdminDashboardAnalyticsParams,
    ),
    options: {
      keys: [
        "classAttendanceChart",
        startDate as string,
        endDate as string,
        attendancePeriodType as AttendancePeriodType,
        attendanceTrendType,
        String(selectedClassroomId ?? "all"),
      ],
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });

  const chartData = useMemo(() => {
    const raw = analyticsData?.data?.attendanceTrend as
      | {
          present?: number[];
          absent?: number[];
          late?: number[];
          student?: unknown;
          staff?: unknown;
        }
      | null
      | undefined;
    const trend =
      raw && typeof raw === "object"
        ? ((("student" in raw && "staff" in raw
            ? raw[attendanceTrendType]
            : "children" in raw && "staff" in raw
              ? raw[attendanceTrendType === "student" ? "children" : "staff"]
              : raw) as { present?: number[]; absent?: number[]; late?: number[] } | undefined) ??
          null)
        : raw;
    const mappedData = mapAttendanceTrendToChartData(
      trend,
      attendancePeriodType as AttendancePeriodType,
      false,
    );
    const normalizedMappedData =
      attendancePeriodType === "daily" && startDate
        ? mappedData.map((item, idx) => ({
            ...item,
            name: dayjs(startDate).add(idx, "day").format("ddd"),
          }))
        : mappedData;

    const now = new Date();
    const today = dayjs(now).startOf("day").valueOf();
    const rangeStart = startDate ? dayjs(startDate).startOf("day").valueOf() : null;
    const rangeEnd = endDate ? dayjs(endDate).endOf("day").valueOf() : null;
    const isCurrentRange =
      rangeStart != null && rangeEnd != null && today >= rangeStart && today <= rangeEnd;
    const currentMonth = now.getMonth();
    const currentDayOfWeek = now.getDay();
    const currentWeekOfMonth = Math.min(Math.ceil(now.getDate() / 7), 5);

    return normalizedMappedData.map((item, idx) => {
      let isFuture = false;
      if (!isCurrentRange) {
        isFuture = false;
      } else if (attendancePeriodType === "monthly" || attendancePeriodType === "yearly") {
        isFuture = idx > currentMonth;
      } else if (attendancePeriodType === "weekly") {
        isFuture = idx + 1 > currentWeekOfMonth;
      } else if (attendancePeriodType === "daily") {
        if (startDate) {
          const slotDate = dayjs(startDate).add(idx, "day").startOf("day");
          isFuture = slotDate.isAfter(dayjs(now).startOf("day"));
        } else {
          const dayOrder = [1, 2, 3, 4, 5, 6, 0];
          const todaySlot = dayOrder[currentDayOfWeek] ?? 0;
          isFuture = idx > todaySlot;
        }
      }

      if (!isFuture) {
        return {
          ...item,
          // Late means attended; merge into present (teal) for chart display.
          present: (item.present ?? 0) + (item.late ?? 0),
        };
      }

      return {
        ...item,
        present: null,
        absent: null,
        late: null,
      };
    });
  }, [
    analyticsData?.data?.attendanceTrend,
    attendancePeriodType,
    attendanceTrendType,
    startDate,
    endDate,
  ]);

  const yAxisMax = useMemo(() => {
    const maxCount = chartData.reduce((acc, d) => {
      const total = (d.present ?? 0) + (d.absent ?? 0);
      return Math.max(acc, total);
    }, 0);
    return roundUpToNiceAxisMax(maxCount * 1.1);
  }, [chartData]);

  const classDisplayLabel =
    selectedClassroomId == null || selectedClassroomId === ""
      ? "All Classes"
      : (classrooms.find((c) => String(c.id) === String(selectedClassroomId))?.classroomName ??
        "All Classes");

  const trendDisplayLabel = attendanceTrendType === "staff" ? "Staff" : "Children";
  const isStudent = attendanceTrendType === "student";

  return (
    <Box
      className={classNames(
        "bg-white py-3 px-4 h-full rounded-xl border border-brandColor-active/20 space-y-3",
        className,
      )}
    >
      <Box className="flex items-center justify-between">
        <Box className="flex flex-col gap-0">
          <Typography className="!text-base !text-text-primary !font-bold">
            Attendance Summary
          </Typography>
        </Box>
        <Box className="flex gap-3">
          {isStudent && (
            <CWPopover
              actionComponent={
                <div className="!text-primary-text-dark flex flex-row items-center justify-between gap-2">
                  {classDisplayLabel} <ExpandMoreIcon className="" />
                </div>
              }
              buttonProps={{
                className:
                  "!font-medium py-3 !px-2.5 !rounded-xl !text-xs !flex !justify-b !font-medium !border !max-w-sm !border-[#F0F0F0] flex flex-row items-center gap-x-1 2xl:!text-base !text-sm !bg-transparent !text-primary-text-dark !border-outline-color !h-[35px] !max-h-[35px]",
                variant: "outlined",
              }}
            >
              <Box
                paddingY={1}
                className="flex flex-col gap-y-2 2xl:gap-y-3 !p-4 min-w-[150px] max-h-[280px] overflow-y-auto"
              >
                <button
                  className="!text-sm 2xl:!text-base p-1 flex flex-row gap-2 items-center cursor-pointer w-full text-left"
                  onClick={() => setSelectedClassroomId(null)}
                >
                  All Classes
                </button>
                {classrooms.map((c) => (
                  <button
                    className="!text-sm 2xl:!text-base p-1 flex flex-row gap-2 items-center cursor-pointer w-full text-left"
                    key={c.id}
                    onClick={() => setSelectedClassroomId(c.id)}
                  >
                    {c.classroomName}
                  </button>
                ))}
              </Box>
            </CWPopover>
          )}
          <CWPopover
            actionComponent={
              <div className="!text-primary-text-dark flex flex-row items-center justify-between gap-2">
                {trendDisplayLabel} <ExpandMoreIcon />
              </div>
            }
            buttonProps={{
              className:
                "!font-medium py-3 !px-2.5 !rounded-xl !text-xs !flex !justify-b !font-medium !border !max-w-sm !border-[#F0F0F0] flex flex-row items-center gap-x-1 2xl:!text-base !text-sm !bg-transparent !text-primary-text-dark !border-outline-color !h-[35px] !max-h-[35px]",
              variant: "outlined",
            }}
          >
            <Box paddingY={1} className="flex flex-col gap-y-2 2xl:gap-y-3 !p-4 w-[100px]">
              {ATTENDANCE_TREND_OPTIONS.map((type) => (
                <button
                  className="!text-sm 2xl:!text-base p-1 flex flex-row gap-2 items-center cursor-pointer capitalize"
                  key={type}
                  onClick={() => setAttendanceTrendType(type)}
                >
                  {type === "student" ? "Children" : "Staff"}
                </button>
              ))}
            </Box>
          </CWPopover>
        </Box>
      </Box>

      <DataRenderer isLoading={isLoading} loadingClassName="min-h-[300px]">
        {() => (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              barSize={15}
              barGap={-10}
              barCategoryGap={"20%"}
              margin={{ top: 20, right: 8, left: isMobile ? -10 : 0, bottom: isMobile ? 24 : 10 }}
            >
              <CartesianGrid
                stroke="#ccc"
                strokeDasharray="2 2"
                vertical={false}
                horizontal={true}
              />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                interval={0}
                minTickGap={0}
                tick={({ x, y, payload }) => (
                  <text
                    x={x}
                    y={+y + 10}
                    textAnchor="middle"
                    className={isMobile ? "!text-[10px] font-normal" : "!text-xs font-normal"}
                  >
                    {payload.value}
                  </text>
                )}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                domain={[0, yAxisMax]}
                tickCount={5}
                allowDecimals={false}
                width={isMobile ? 30 : 38}
                tick={({ x, y, payload }) => (
                  <text
                    x={+x - (isMobile ? -4 : 10)}
                    y={+y + 4}
                    textAnchor="end"
                    className={isMobile ? "!text-[10px] font-normal" : "!text-xs font-normal"}
                  >
                    {payload.value}
                  </text>
                )}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
              <Legend
                iconType="circle"
                iconSize={10}
                align="left"
                verticalAlign="top"
                wrapperStyle={{ top: 0 }}
                formatter={(value) => (
                  <span
                    style={{
                      color: "#000000",
                      fontSize: "0.75rem",
                      fontWeight: 400,
                    }}
                  >
                    {value === "present" ? "Total Present" : "Total Absent"}
                  </span>
                )}
              />
              {chartData?.[0]?.absent !== undefined && (
                <Bar dataKey="absent" fill="var(--color-barchart-yellow)" barSize={isMobile ? 10 : 15} radius={[7, 7, 7, 7]} />
              )}
              {/* <Bar dataKey="late" fill="#FF6B6B" radius={[7, 7, 7, 7]} /> */}
              <Bar dataKey="present" fill="var(--color-barchart-teal)" barSize={isMobile ? 9 : 15} radius={[7, 7, 7, 7]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </DataRenderer>
    </Box>
  );
};
