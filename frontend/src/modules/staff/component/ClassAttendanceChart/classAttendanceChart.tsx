"use client";

import { Box, Typography } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import classNames from "classnames";
import React, { type FC, useMemo } from "react";
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

import { roundUpToNiceAxisMax } from "@/utils/helpers";

export interface StaffAttendanceChartDataItem {
  name: string;
  present: number;
  absent: number;
}

export interface StaffClassAttendanceChartProps {
  className?: string;
  data: StaffAttendanceChartDataItem[];
}

interface DayData {
  present: number;
  absent: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string; payload?: DayData }>;
}

interface PayloadItem {
  value: number;
  dataKey: string;
  color: string;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload?.length) {
    const dayData = payload[0].payload as DayData;
    const total = (dayData?.present ?? 0) + (dayData?.absent ?? 0);

    return (
      <div className="bg-white rounded-md shadow-md px-3 py-2 text-sm font-medium space-y-1">
        {payload.map((entry: PayloadItem) => {
          const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : "0";
          return (
            <div key={entry.dataKey} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              {entry.dataKey === "present" ? "Present" : "Absent"} {percentage}%
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export const StaffClassAttendanceChart: FC<StaffClassAttendanceChartProps> = ({
  className,
  data,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const yAxisMax = useMemo(() => {
    const maxCount = data.reduce((acc, d) => {
      const total = (d.present ?? 0) + (d.absent ?? 0);
      return Math.max(acc, total);
    }, 0);
    return roundUpToNiceAxisMax(maxCount);
  }, [data]);

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
      </Box>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          barSize={15}
          barGap={-10}
          barCategoryGap={"20%"}
          margin={{ top: 20, right: 8, left: isMobile ? -8 : 0, bottom: isMobile ? 24 : 10 }}
        >
          <CartesianGrid stroke="#ccc" strokeDasharray="2 2" vertical={false} horizontal={true} />

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
            width={isMobile ? 30 : 36}
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

          {data?.[0]?.absent !== undefined && (
            <Bar dataKey="absent" fill="var(--color-barchart-yellow)" barSize={isMobile ? 10 : 15} radius={[7, 7, 7, 7]} />
          )}
          <Bar dataKey="present" fill="var(--color-barchart-teal)" barSize={isMobile ? 9 : 15} radius={[7, 7, 7, 7]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};
