"use client";

import { Box, Typography } from "@mui/material";
import { FC } from "react";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";

export interface FinancialSummaryItem {
  label: string;
  value: string;
  /** 0–100 */
  progressPercent?: number;
}

interface FinancialOverviewCardsProps {
  items?: FinancialSummaryItem[];
  isLoading?: boolean;
}

// Default stub items – replace values from API when wired
const DEFAULT_ITEMS: FinancialSummaryItem[] = [
  { label: "Revenue (This Month)", value: "₦12,500,000.00", progressPercent: 70 },
  { label: "Outstanding Fees", value: "₦1,500,000.00", progressPercent: 20 },
  { label: "Paid vs Unpaid", value: "85% Paid", progressPercent: 85 },
  { label: "Overdue Invoices (30+ Days)", value: "₦500,000.00", progressPercent: 10 },
];

const FinancialCard: FC<{ item: FinancialSummaryItem; isLoading?: boolean }> = ({
  item,
  isLoading,
}) => (
  <Box className="bg-white py-4 px-4 rounded-xl border border-brandColor-active/20 flex-1 min-w-[160px] flex flex-col gap-3">
    <Typography className="!text-sm !text-[#667085] !leading-tight">{item.label}</Typography>
    <DataRenderer isLoading={isLoading} loadingClassName="h-8">
      {() => (
        <>
          <Typography className="!text-2xl !font-bold !text-[#0A0A0B] !leading-tight">
            {item.value}
          </Typography>
          {/* Progress bar */}
          <Box className="mt-auto">
            <Box className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <Box
                className="h-full rounded-full bg-[#0D9488]"
                style={{ width: `${item.progressPercent ?? 0}%` }}
              />
            </Box>
          </Box>
        </>
      )}
    </DataRenderer>
  </Box>
);

export const FinancialOverviewCards: FC<FinancialOverviewCardsProps> = ({
  items,
  isLoading,
}) => {
  const cards = items;

  return (
    <Box className="flex flex-col gap-6">
      <Typography className="!text-lg !font-semibold !text-text-primary mb-3">
        Financial Overview
      </Typography>
      <Box className="flex gap-4 overflow-x-auto hide-scrollbar *:shrink-0 md:*:shrink">
        {cards?.map((item, idx) => (
          <FinancialCard key={idx} item={item} isLoading={isLoading} />
        ))}
      </Box>
    </Box>
  );
};
