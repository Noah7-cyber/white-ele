"use client";

import { Box, Typography } from "@mui/material";
import { FC } from "react";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import WarningIcon from "@/modules/shared/assets/svgs/ep_warning.svg";
import UserAdd from "@/modules/shared/assets/svgs/userAdd.svg";
import DoubleCheck from "@/modules/shared/assets/svgs/doublecheckIcon.svg";

export interface ActivityItem {
  id: string | number;
  title: string;
  subtitle: string;
  timeAgo: string;
  /** "admission" | "payment" | "attendance" */
  type: "admission" | "payment" | "attendance";
}

interface ImportantActivityProps {
  activities?: ActivityItem[];
  isLoading?: boolean;
}

const TYPE_ICONS: Record<ActivityItem["type"], React.ReactNode> = {
  admission: <UserAdd />,
  payment: <DoubleCheck />,
  attendance: <WarningIcon />,
};

const ActivityRow: FC<{ item: ActivityItem }> = ({ item }) => (
  <Box className="flex items-center gap-3 py-4 border-b border-[#F0F0F0] last:border-0">
    {/* Icon */}
    <Box className="w-10 h-10 rounded-full bg-[#F0F9F8] flex items-center justify-center shrink-0">
      {TYPE_ICONS[item.type]}
    </Box>

    {/* Text */}
    <Box className="flex-1 space-y-2 gap-2 min-w-0">
      <Typography className="!text-sm !font-semibold !text-text-primary !leading-tight !mb-1">
        {item.title}
      </Typography>
      <Typography className="!text-xs !text-[#667085] !leading-tight mt-0.5">
        {item.subtitle}
      </Typography>
    </Box>

    {/* Time */}
    <Typography className="!text-xs !text-[#667085] shrink-0">{item.timeAgo}</Typography>
  </Box>
);

export const ImportantActivity: FC<ImportantActivityProps> = ({ activities, isLoading }) => {
  const rows = activities ?? [];

  return (
    <Box className="bg-white py-4 px-5 rounded-xl border border-brandColor-active/20 h-full flex flex-col">
      <Typography className="!text-base !font-semibold !text-text-primary !pb-3 border-b border-border-light">
        Important Activity
      </Typography>

      <DataRenderer isLoading={isLoading} loadingClassName="flex-1 min-h-[120px]">
        {() => (
          <Box className="flex flex-col flex-1">
            {rows.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </Box>
        )}
      </DataRenderer>
    </Box>
  );
};
