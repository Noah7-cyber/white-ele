"use client";

import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { DashboardRoutes } from "@/routes/dashboard.routes";

export interface ActionCentreItem {
  id: string | number;
  message: string;
  context: string;
  priority: "high" | "medium" | "low";
}

interface ActionCentreTableProps {
  items?: ActionCentreItem[];
  isLoading?: boolean;
}

const PRIORITY_COLOR: Record<string, string> = {
  high: "#E53935",
  medium: "#F9A825",
  low: "#43A047",
};

const ActionRow: FC<{ item: ActionCentreItem }> = ({ item }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);
  const handleViewDetails = () => {
    handleClose();
    if (item.id === "booked-tours-total") {
      router.push(DashboardRoutes.tours);
    }
  };

  return (
    <Box className="grid grid-cols-[1fr_1fr_auto] items-center py-3.5 border-b border-[#F0F0F0] last:border-0 gap-4">
      {/* Title */}
      <Box className="flex items-center gap-3">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: PRIORITY_COLOR[item.priority] }}
        />
        <Typography className="!text-sm !text-[#1A1A1A]">{item?.context}</Typography>
      </Box>

      {/* Context */}
      <Typography className="!text-sm !text-[#667085]">{item?.message}</Typography>

      {/* Action menu */}
      <Box>
        <IconButton size="small" onClick={handleOpen} className="!text-[#667085]">
          <span className="!text-sm !underline">View</span>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{ paper: { className: "!rounded-lg !shadow-md !min-w-[140px]" } }}
        >
          <MenuItem onClick={handleViewDetails} className="!text-sm">
            View details
          </MenuItem>
          {/* <MenuItem onClick={handleClose} className="!text-sm">
            Dismiss
          </MenuItem> */}
          {/* <MenuItem onClick={handleClose} className="!text-sm !text-red-500">
            Mark resolved
          </MenuItem> */}
        </Menu>
      </Box>
    </Box>
  );
};

export const ActionCentreTable: FC<ActionCentreTableProps> = ({ items, isLoading }) => {
  const rows = items || [];

  return (
    <Box className="bg-white py-4 px-5 rounded-xl border border-brandColor-active/20">
      {/* Header */}
      <Box className="pb-3 border-b border-border-gray">
        <Typography className="!text-lg !font-semibold !text-primary-dark">
          Action Centre
        </Typography>
        <Typography className="!text-sm !text-text-tertiary/70">
          Item that need your attention today
        </Typography>
      </Box>

      {/* Column headers */}
      <Box className="grid grid-cols-[1fr_1fr_auto] gap-4 my-2 py-3 border-b border-border-gray">
        <Typography className="!text-sm !font-semibold !text-primary-dark uppercase tracking-wide">
          Title
        </Typography>
        <Typography className="!text-sm !font-semibold !text-primary-dark uppercase tracking-wide">
          Context
        </Typography>
        <Typography className="!text-sm !font-semibold !text-primary-dark uppercase tracking-wide pr-2">
          Action
        </Typography>
      </Box>

      <DataRenderer isLoading={isLoading} loadingClassName="min-h-[120px]">
        {() => (
          <Box>
            {rows.map((item) => (
              <ActionRow key={item?.id} item={item} />
            ))}
          </Box>
        )}
      </DataRenderer>
    </Box>
  );
};
