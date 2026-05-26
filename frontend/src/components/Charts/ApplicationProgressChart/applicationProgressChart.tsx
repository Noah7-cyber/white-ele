/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { dataApplicationProgressChart } from "@/constants";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const generateTicks = (data: any[], step = 25, padding = step) => {
  const maxValue = Math.max(...data.flatMap((d) => [d.Applications, d.Interviews, d.Enrolled]));
  const upperBound = Math.ceil((maxValue + padding) / step) * step;
  const ticks = [];
  for (let i = 0; i <= upperBound; i += step) {
    ticks.push(i);
  }
  return ticks;
};

export function ApplicationProgressChart() {
  const ticks = generateTicks(dataApplicationProgressChart, 25, 25);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={dataApplicationProgressChart}
        barSize={10}
        barGap={0}
        barCategoryGap="40%"
        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="2 2" vertical={false} horizontal={true} />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={({ x, y, payload }) => (
            <text
              x={x}
              y={+y + 10}
              textAnchor="middle"
              className="!text-xs font-semibold"
              fill="var(--color-brandColor-active)"
            >
              {payload.value}
            </text>
          )}
        />

        <YAxis
          axisLine={false}
          tickLine={false}
          domain={[0, Math.max(...ticks)]}
          ticks={ticks}
          tick={({ x, y, payload }) => (
            <text
              x={+x - 10}
              y={+y + 4}
              textAnchor="end"
              className="!text-xs font-semibold"
              fill="var(--color-brandColor-active)"
            >
              {payload.value}
            </text>
          )}
        />

        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.05)" }}
          contentStyle={{ borderRadius: "10px", border: "none" }}
        />
        <Bar dataKey="Applications" fill="#D1D5DB" />
        <Bar dataKey="Interviews" fill="#FEB92B" />
        <Bar dataKey="Enrolled" fill="#008080" />
      </BarChart>
    </ResponsiveContainer>
  );
}
