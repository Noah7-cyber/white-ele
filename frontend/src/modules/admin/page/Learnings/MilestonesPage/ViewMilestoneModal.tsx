"use client";

import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { useSearchParams } from "next/navigation";
import { useModalRoute } from "@/utils/hooks/useModalRoute";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { milestoneDynamicEndpoints } from "@/services/milestone.service";
import type { Milestone } from "@/services/curriculum.service";

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatPeriod(startDate?: string | null, endDate?: string | null): string {
  if (!startDate && !endDate) return "—";
  const startFormatted = formatDate(startDate);
  const endFormatted = formatDate(endDate);
  if (!startDate) return endFormatted;
  if (!endDate) return startFormatted;
  return `${startFormatted} - ${endFormatted}`;
}

function statusBadgeClass(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed") return "bg-[#EDFFF7] text-success-green";
  if (normalized === "active") return "bg-success-green/15 text-success-green";
  if (normalized === "draft") return "bg-primary-dark/10 text-primary-dark";
  return "bg-gray-100 text-gray-700";
}

export default function ViewMilestoneModal() {
  const searchParams = useSearchParams();
  const { closeModal } = useModalRoute();
  const milestoneId = searchParams.get("milestoneId");

  const { data, isLoading } = useQueryService<Record<string, never>, { data: Milestone }>({
    service: milestoneDynamicEndpoints.getMilestoneById(Number(milestoneId)),
    options: {
      enabled: !!milestoneId,
    },
  });

  const milestone = data?.data;

  if (isLoading) {
    return (
      <Box className="p-6 min-w-[400px]">
        <Box className="animate-pulse space-y-4">
          <Box className="h-6 bg-gray-200 rounded w-2/3" />
          <Box className="h-4 bg-gray-200 rounded w-full" />
          <Box className="h-32 bg-gray-200 rounded" />
        </Box>
      </Box>
    );
  }

  if (!milestone) return null;

  const classroomNames =
    Array.isArray(milestone.classrooms) && milestone.classrooms.length > 0
      ? milestone.classrooms.map((c: { name: string }) => c.name).join(", ")
      : "—";

  const periodDisplay = formatPeriod(milestone.startDate, milestone.endDate);

  return (
    <Box className="flex flex-col gap-5 p-6 md:min-w-[600px]">
      {/* Header */}
      <Box className="flex flex-col gap-2">
        <Box className="flex items-start justify-between">
          <Box className="flex items-center gap-3">
            <Typography className="!text-xl !font-bold !text-text-primary">
              {milestone.title}
            </Typography>
            <span
              className={`px-3 py-0.5 text-xs font-medium rounded-full capitalize ${statusBadgeClass(
                milestone.status,
              )}`}
            >
              {milestone.status
                ? milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)
                : "—"}
            </span>
          </Box>
          <IconButton onClick={() => closeModal()} size="small" className="!p-0">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography className="!text-sm !text-input-gray -mt-4">
          Overview of this milestone information.
        </Typography>
      </Box>

      <Box className="border-t border-border-light" />

      <Box>
        <Typography className="!text-base !font-semibold !text-text-primary !mb-3">
          Milestone Details
        </Typography>
        <Box className="border border-border-light/60 rounded-lg overflow-hidden">
          <Box className="flex items-center px-4 py-2">
            <Typography className="!text-sm !text-input-gray w-[180px]">Class:</Typography>
            <Typography className="!text-sm !font-medium !text-text-primary">
              {classroomNames}
            </Typography>
          </Box>
          <Box className="flex items-center px-4 py-2">
            <Typography className="!text-sm !text-input-gray w-[180px]">
              Milestone Period:
            </Typography>
            <Typography className="!text-sm !font-medium !text-text-primary">
              {periodDisplay}
            </Typography>
          </Box>
          <Box className="flex items-center px-4 py-2">
            <Typography className="!text-sm !text-input-gray w-[180px]">Created On:</Typography>
            <Typography className="!text-sm !font-medium !text-text-primary">
              {formatDate(milestone.createdAt)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
