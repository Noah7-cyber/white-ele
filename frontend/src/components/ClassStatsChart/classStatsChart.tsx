/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Box, Typography } from "@mui/material";
import classNames from "classnames";
import { FC } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import ManWoman from "@/modules/shared/assets/svgs/man-woman.svg";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
interface ClassStatsChartProps {
  className?: string;
  data?: any[];
  role?: string;
  isLoading?: boolean;
}

export const ClassStatsChart: FC<ClassStatsChartProps> = ({ className, data, role, isLoading }) => {
  const isStaff = role === "staff";
  // Data for boys (outer)
  const boys = Number(data?.find((d) => d.label === "Boys")?.value ?? 0);
  const girls = Number(data?.find((d) => d.label === "Girls")?.value ?? 0);
  const total = data?.find((d) => d.label === "Total")?.value ?? boys + girls;
  const totalNum = Number(total);

  const boysPercentage = totalNum ? (boys / totalNum) * 100 : 0;
  const girlsPercentage = totalNum ? (girls / totalNum) * 100 : 0;

  // Use value-based pie segments so arc lengths match actual counts (accurate readings)
  const outerRingData = [
    { name: "Boys", value: boys, color: "var(--color-barchart-teal)" },
    { name: "Girls", value: girls, color: "var(--color-barchart-yellow)" },
  ].filter((d) => d.value > 0);

  return (
    <Box
      className={classNames(
        "bg-white py-3 px-4 h-full rounded-xl border border-brandColor-active/20 flex flex-col justify-between",
        className,
      )}
    >
      <Typography className="!text-base !text-text-primary !font-semibold">
        {isStaff ? "Class Stats" : "Students"}
      </Typography>
      <DataRenderer isLoading={isLoading}>
        {() => (
          <>
            <Box className="flex justify-center items-center relative h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* Outer ring: Boys colored + remainder gray */}
                  <Pie
                    data={[
                      { name: "Boys", value: boysPercentage, color: "var(--color-barchart-teal)" },
                      { name: "Remainder", value: 100 - boysPercentage, color: "#F7F8FA" },
                    ]}
                    dataKey="value"
                    innerRadius="78%"
                    outerRadius="95%"
                    startAngle={90}
                    endAngle={450}
                    stroke="none"
                    cornerRadius={50}
                  >
                    <Cell fill="var(--color-barchart-teal)" />
                    <Cell fill="#F7F8FA" />
                  </Pie>

                  {/* Inner ring: Girls colored + remainder gray */}
                  <Pie
                    data={[
                      { name: "Girls", value: girlsPercentage, color: "var(--color-barchart-yellow)" },
                      { name: "Remainder", value: 100 - girlsPercentage, color: "#F7F8FA" },
                    ]}
                    dataKey="value"
                    innerRadius="54%"
                    outerRadius="70%"
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    cornerRadius={50}
                  >
                    <Cell fill="var(--color-barchart-yellow)" />
                    <Cell fill="#F7F8FA" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center icons */}
              <Box className="absolute flex flex-row items-center justify-center space-x-3">
                <ManWoman />
              </Box>
            </Box>

            {/* Legend */}
            <Box className="flex justify-between mt-2 px-4">
              <Box className="flex flex-col items-start space-y-2">
                <div className="h-4 w-4 rounded-full bg-[var(--color-barchart-teal)]" />
                <Typography className="!text-primary-dark !font-semibold !text-xl">
                  {boys.toLocaleString()}
                </Typography>
                <Typography className="!text-base ">Boys ({boysPercentage.toFixed(0)}%)</Typography>
              </Box>
              <Box className="flex flex-col items-start space-y-2">
                <div className="h-4 w-4 rounded-full bg-[var(--color-barchart-yellow)]" />
                <Typography className="!text-primary-dark !font-semibold !text-xl">
                  {girls.toLocaleString()}
                </Typography>
                <Typography className="!text-base ">
                  Girls ({girlsPercentage.toFixed(0)}%)
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </DataRenderer>{" "}
    </Box>
  );
};
