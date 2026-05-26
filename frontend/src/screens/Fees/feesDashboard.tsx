"use client";

import { Box, Typography } from "@mui/material";
import { PaymentHistoryTable } from "@/components/PaymentHistoryTable";
import { DashboardDataCard } from "@/modules/admin/component/DashboardDataCard";
import { dashboardCards, feesData } from "@/constants";
import { HighlightedLine } from "@/components/HighlightedLine/highLighted";

export function FeesDashboard() {
  return (
    <Box className="p-6 space-y-6">
      {/* Top Section */}
      <Box className="flex gap-4">
        {/* Fees Collection Chart */}
        <Box className="bg-white rounded-2xl py-4 basis-[65%] shadow-sm">
          <Typography className="!font-semibold !mb-4 px-5">Fees Collection</Typography>
          <HighlightedLine data={feesData} />
        </Box>

        {/* Metric Cards */}
        <Box className="basis-[35%] grid grid-cols-2 gap-4">
          {dashboardCards?.map(({ status, value, trend }, index) => (
            <DashboardDataCard key={index} status={status} value={value} trend={trend} />
          ))}
        </Box>
      </Box>

      {/* Payment History */}
      <PaymentHistoryTable />
    </Box>
  );
}
