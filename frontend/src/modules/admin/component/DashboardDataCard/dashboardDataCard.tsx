"use client";

import { Box, Typography } from "@mui/material";
import { FC } from "react";
import ArrowUp from "@/modules/shared/assets/svgs/arrow-up-right.svg";
import Trend from "@/modules/shared/assets/svgs/trend.svg";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";

interface Trend {
  value: string;
  up: boolean;
}

interface DashboardDataCardProps {
  title?: string;
  status?: string;
  value: number | string;
  trend?: Trend;
  percentage?: string;
  isLoading?: boolean;
  isDashboard?: boolean;
  figure?: number;
  activityText?: string;
}

export const DashboardDataCard: FC<DashboardDataCardProps> = ({
  title,
  value,
  percentage,
  isLoading,
  isDashboard = false,
  figure,
  activityText,
}) => {
  return (
    <Box className="bg-white px-4 py-3 rounded-md border border-brandColor-active/20 flex-1 min-w-52 md:min-w-40 shrink-0 md:shrink min-h-24 md:min-h-30 flex flex-col justify-between">
      <>
        <Box className="flex items-start justify-between mb-4">
          <Typography className="text-text-primary text-sm! font-semibold!">{title}</Typography>
        </Box>
        <DataRenderer isLoading={isLoading}>
          {() =>
            isDashboard ? (
              <Box className="flex flex-col gap-2">
                <Box className="flex gap-2 items-end">
                  <Typography className="text-[#0A0A0B] text-2xl! font-bold! w">
                    {typeof value === "number" ? value.toLocaleString() : value}
                  </Typography>
                  {percentage != null && String(percentage).trim() !== "" && (
                    <Box className="flex items-center gap-0.5 mb-0.5 bg-badge-bg! text-success-green text-[10px] font-medium rounded-full px-1 py-0.5 ">
                      <span>{percentage}%</span>
                      <ArrowUp className="w-2.5 h-2.5" />
                    </Box>
                  )}
                </Box>
                <Box className="!text-[11px]">{figure}{" "}{activityText}</Box>
              </Box>
            ) : (
              <Box className="flex items-end gap-1 md:gap-2">
                <Typography className="text-[#0A0A0B] text-xl! font-bold! w">
                  {typeof value === "number" ? value.toLocaleString() : value}
                </Typography>
                {percentage != null && String(percentage).trim() !== "" && (
                  <Box className="flex items-center gap-0.5 mb-0.5 bg-badge-bg! text-success-green text-[10px] font-medium rounded-full px-1 py-0.5 ">
                    <span>{percentage}%</span>
                    <ArrowUp className="w-2.5 h-2.5" />
                  </Box>
                )}
              </Box>
            )
          }
        </DataRenderer>
      </>
    </Box>
  );
};
