/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Box, Typography } from "@mui/material";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";

export function AttendanceStatusChart({
  pieData = [],
  isLoading,
}: {
  isLoading?: boolean;
  pieData: any[];
}) {
  return (
    <Box className="bg-white rounded-md shadow-md px-3 py-2">
      <Box className="flex items-center justify-between mb-2">
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: "#02273A",
          }}
        >
          Attendance Status Distribution
        </Typography>
      </Box>

      <DataRenderer isLoading={isLoading} loadingClassName="min-h-[300px]">
        {() => (
          <Box sx={{ width: "100%", height: 300, position: "relative" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={
                    pieData.length ? pieData : [{ name: "No data", value: 1, color: "#e5e7eb" }]
                  }
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                  cornerRadius={5}
                >
                  {(pieData.length
                    ? pieData
                    : [{ name: "No data", value: 1, color: "#e5e7eb" }]
                  ).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "#ccc",
                    fontSize: 13,
                  }}
                  formatter={(value, name) => {
                    const label = typeof name === "string" ? name : String(name ?? "");
                    const pct = pieData.find((d) => d.name === label)?.pct ?? 0;
                    const displayValue =
                      typeof value === "number" || typeof value === "string"
                        ? value
                        : Array.isArray(value)
                          ? value.join(", ")
                          : "";
                    return [`${displayValue} (${pct}%)`, label];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {pieData.length > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: "none",
                }}
              >
                {pieData.map((entry) => (
                  <Typography
                    key={entry.name}
                    sx={{
                      position: "absolute",
                      fontSize: 13,
                      color: "#02273A",
                      fontWeight: 600,
                      ...(entry.name === "Present" && {
                        top: "10%",
                        right: "30%",
                        textAlign: "right",
                      }),
                      ...(entry.name === "Excused" && { top: "10%", left: "30%" }),
                      ...(entry.name === "Absent" && {
                        bottom: "10%",
                        right: "30%",
                        textAlign: "right",
                      }),
                      ...(entry.name === "Late" && { bottom: "10%", left: "30%" }),
                    }}
                  >
                    {entry.pct}%
                    <br />
                    <Typography component="span" sx={{ fontSize: 12, fontWeight: 400 }}>
                      {entry.name}
                    </Typography>
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        )}
      </DataRenderer>
    </Box>
  );
}
