/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { Box, Typography } from "@mui/material";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  YAxis,
  XAxis,
  Tooltip,
  ReferenceArea,
} from "recharts";
import { roundUpToNiceAxisMax } from "@/utils/helpers";
import { NAIRA } from "@/constants";
import dayjs from "dayjs";

interface DataPoint {
  month: string;
  value: number;
}

type ChartPeriodType = "daily" | "weekly" | "monthly" | "yearly";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box className="!bg-brandColor-active !text-white rounded-xl shadow-md px-4 py-2">
        <Typography variant="body2" color="">
          {label}
        </Typography>
        <Typography variant="subtitle2" fontWeight={600}>
          {NAIRA.symbol}
          {Number(payload[0].value ?? 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Typography>
      </Box>
    );
  }
  return null;
};

export default function EarningsChart({
  data,
  isLoading,
  periodType,
  startDate,
}: {
  data: DataPoint[];
  isLoading: boolean;
  periodType?: ChartPeriodType;
  startDate?: string;
}) {
  const getDailyXAxisLabel = (rawLabel: string, index: number) => {
    const trimmed = String(rawLabel || "").trim();
    if (trimmed) {
      const firstToken = trimmed.split(/\s+/)[0];
      if (/^(mon|tue|wed|thu|fri|sat|sun)$/i.test(firstToken)) {
        return `${firstToken.charAt(0).toUpperCase()}${firstToken.slice(1, 3).toLowerCase()}`;
      }
      const parsed = dayjs(trimmed);
      if (parsed.isValid()) return parsed.format("ddd");
    }
    if (startDate) return dayjs(startDate).add(index, "day").format("ddd");
    return trimmed;
  };

  const totalForPeriod = useMemo(
    () => (data ?? []).reduce((sum, point) => sum + Number(point?.value ?? 0), 0),
    [data],
  );

  const yAxisMax = useMemo(() => {
    const maxVal = data?.length ? Math.max(...data.map((d) => d.value ?? 0)) : 0;
    return roundUpToNiceAxisMax(maxVal * 1.1);
  }, [data]);

  const xAxisData = useMemo(() => {
    if (periodType === "weekly") {
      const weekLabels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
      return data.map((item, index) => ({
        ...item,
        month: weekLabels[index] ?? `Week ${index + 1}`,
      }));
    }
    if (periodType === "daily") {
      return data.map((item, index) => ({
        ...item,
        month: getDailyXAxisLabel(item.month, index),
      }));
    }
    return data.map((item, index) => ({
      ...item,
      month: item.month || String(index + 1),
    }));
  }, [data, periodType, startDate]);

  const formatYTick = (val: number) => {
    if (val >= 1_000_000) return `${val / 1_000_000}M`;
    if (val >= 1_000) return `${val / 1_000}K`;
    return String(val);
  };

  return (
    <Box className="bg-white rounded-2xl py-4 px-2 basis-[65%] shadow-sm">
      <Box className="px-5 !mb-4 flex items-center justify-between">
        <Typography className="!text-base !text-text-primary !font-semibold">Earnings</Typography>
        <Typography className="!text-sm !text-text-primary !font-semibold">
          Total: {NAIRA.symbol}
          {totalForPeriod.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Typography>
      </Box>
      <DataRenderer isLoading={isLoading}>
        {() => (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={xAxisData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />

                {/* X Axis with months */}
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  padding={{ left: 30, right: 30 }}
                  className="!text-xs"
                  fontSize={14}
                  minTickGap={-10}
                />

                {/* Y Axis: 0 to highest rounded value */}
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  domain={[0, yAxisMax]}
                  tickCount={5}
                  allowDecimals={false}
                  tickFormatter={formatYTick}
                  className="!text-xs"
                  fontSize={12}
                  width={42}
                />

                {/* Highlighted background band */}
                <ReferenceArea
                  // x1="Aug"
                  // x2="Sep"
                  strokeOpacity={0}
                  fill="#e5e7eb"
                  fillOpacity={0.4}
                />

                <Tooltip content={<CustomTooltip />} />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#008080"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </DataRenderer>
    </Box>
  );
}
