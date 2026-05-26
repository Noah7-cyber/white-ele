"use client";

import { Box, Typography } from "@mui/material";
import { FC } from "react";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import ArrowUp from "@/modules/shared/assets/svgs/arrow-up-right.svg";

export interface AttendanceInsightsProps {
  bestDay?: string;
  bestDayPercent?: number;
  worstDay?: string;
  worstDayPercent?: number;
  weeklyTrendPercent?: number;
  weeklyTrendDirection?: "up" | "down" | "stable";
  isLoading?: boolean;
}

interface InsightRowProps {
  dotColor: string;
  label: string;
  sublabel: string;
  valueDisplay: React.ReactNode;
}

const InsightRow: FC<InsightRowProps> = ({ dotColor, label, sublabel, valueDisplay }) => (
  <Box className="flex items-center justify-between py-4 border-b border-[#F0F0F0] last:border-0">
    <Box className="flex items-start gap-3">
      <span className="w-2 h-2 mt-1 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
      <Box>
        <Typography className="!text-xs !text-[#667085]">{label}</Typography>
        <Typography className="!text-sm !font-semibold !text-text-primary">{sublabel}</Typography>
      </Box>
    </Box>
    <Box>{valueDisplay}</Box>
  </Box>
);

export const AttendanceInsights: FC<AttendanceInsightsProps> = ({
  bestDay = "",
  bestDayPercent = 0,
  worstDay = "",
  worstDayPercent = 0,
  weeklyTrendPercent = 0,
  weeklyTrendDirection = "up",
  isLoading,
}) => {
  const trendColor =
    weeklyTrendDirection === "up"
      ? "#16A34A"
      : weeklyTrendDirection === "down"
        ? "#E53935"
        : "#FFF";
  const trendBackgroundColor =
    weeklyTrendDirection === "up"
      ? "#E7F6EC"
      : weeklyTrendDirection === "down"
        ? "#E53935"
        : "#667085";
  return (
    <Box className="bg-white py-4 px-5 rounded-xl border border-brandColor-active/20 h-full flex flex-col">
      <Typography className="!text-base !font-semibold !text-text-primary !pb-3 border-b border-border-light">
        Attendance Insights
      </Typography>

      <DataRenderer isLoading={isLoading} loadingClassName="flex-1 min-h-[120px]">
        {() => (
          <Box className="flex flex-col flex-1">
            <InsightRow
              dotColor="#0D9488"
              label="Best day"
              sublabel={bestDay}
              valueDisplay={
                <Typography className="!text-sm !font-semibold !text-text-primary">
                  {bestDayPercent}%
                </Typography>
              }
            />
            <InsightRow
              dotColor="#E53935"
              label="Worst day"
              sublabel={worstDay}
              valueDisplay={
                <Typography className="!text-sm !font-semibold !text-text-primary">
                  {worstDayPercent}%
                </Typography>
              }
            />
            <InsightRow
              dotColor="#0D9488"
              label="Weekly Trend"
              sublabel="Improving"
              valueDisplay={
                <Box
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-2xl bg-[${trendColor}]/70`}
                  style={{ color: trendColor, backgroundColor: trendBackgroundColor }}
                >
                  <Typography
                    className="!text-xs !font-semibold"
                    style={{ color: trendColor, backgroundColor: trendBackgroundColor }}
                  >
                    {weeklyTrendPercent}%
                  </Typography>
                  {weeklyTrendDirection === "up" && <ArrowUp className="w-3 h-3" />}
                </Box>
              }
            />
          </Box>
        )}
      </DataRenderer>
    </Box>
  );
};
