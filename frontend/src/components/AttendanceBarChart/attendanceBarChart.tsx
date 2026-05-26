/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Box, Typography } from "@mui/material";
import classNames from "classnames";
import React, { FC } from "react";
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
import { capitalizeFirstLetter } from "@/utils/helpers";

interface AttendanceBarChartProps {
  className?: string;
  data?: any[];
  /** Reserved for skeleton / loading UI */
  isLoading?: boolean;
}

interface DayData {
  present: number;
  absent: number;
  late: number;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string; payload?: DayData }>;
}
interface payload {
  value: number;
  dataKey: string;
  color: string;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload?.length) {
    const dayData = payload[0].payload as DayData;
    const total = dayData?.present + dayData?.absent + dayData?.late;

    return (
      <div className="bg-white rounded-md shadow-md px-3 py-2 text-sm font-medium space-y-1">
        {payload.map((entry: payload) => {
          const percentage = ((entry.value / total) * 100).toFixed(0);
          // const label = entry.dataKey === "present" ? "Present" : "Absent";

          return (
            <div
              key={entry.dataKey}
              className="flex items-center gap-2"
              // style={{ color: entry.color }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              {percentage}%
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export const AttendanceBarChart: FC<AttendanceBarChartProps> = ({ data = [], className }) => {
  return (
    <Box
      className={classNames(
        "bg-white py-3 px-4 h-full rounded-xl border border-brandColor-active/20 space-y-3",
        className,
      )}
    >
      <Box className="flex items-center  justify-between">
        <Typography className="!text-base !text-text-primary !font-bold">Attendance</Typography>
      </Box>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          barSize={40}
          barGap={8}
          barCategoryGap={"40%"}
          margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
        >
          <CartesianGrid stroke="#ccc" strokeDasharray="2 2" vertical={false} horizontal={true} />

          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={({ x, y, payload }) => (
              <text
                x={Number(x)}
                y={Number(y) + 10}
                textAnchor="middle"
                className="!text-xs font-normal "
                // fill="var(--color-brandColor-active)"
              >
                {payload.value}
              </text>
            )}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            domain={[0, "dataMax"]}
            tick={({ x, y, payload }) => (
              <text
                x={Number(x) - 10}
                y={Number(y) + 4}
                textAnchor="end"
                className="!text-xs font-normal"
                // fill="var(--color-brandColor-active)"
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
                  // value === '#000000'
                  //   ? '#000000'
                  //   : 'var(--color-barchart-teal)'
                  fontSize: "0.75rem",
                  fontWeight: 400,
                }}
              >
                {capitalizeFirstLetter(value)}
              </span>
            )}
          />
          <Bar
            dataKey="present"
            fill="var(--color-barchart-yellow)"
            radius={[0, 0, 5, 5]}
            stackId="a"
          />
          <Bar
            dataKey="absent"
            fill="var(--color-barchart-teal)"
            //  radius={[7, 7, 7, 7]}
            stackId="a"
          />
          <Bar
            dataKey="late"
            fill="#FF7C80"
            //  radius={[7, 7, 7, 7]}
            stackId="a"
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};
