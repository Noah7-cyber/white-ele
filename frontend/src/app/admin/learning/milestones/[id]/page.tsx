"use client";

import { Box, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { milestoneDynamicEndpoints, type GetMilestoneByIdResponse } from "@/services/milestone.service";
import { Button } from "@/modules/shared/component/Button";

export default function MilestoneDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id ?? "");

  const { data, isLoading } = useQueryService<Record<string, never>, GetMilestoneByIdResponse>({
    service: milestoneDynamicEndpoints.getMilestoneById(id),
  });

  const milestone = data?.data;

  return (
    <Box className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Typography className="!text-xl !font-semibold">Milestone Details</Typography>
        <Button className="!rounded-lg" onClick={() => router.push("/admin/learning/milestones")}>
          Back
        </Button>
      </div>

      <Box className="rounded-xl border border-[#E4E7EC] bg-white p-4 space-y-3">
        {isLoading ? (
          <Typography className="!text-sm">Loading milestone...</Typography>
        ) : (
          <>
            <Typography className="!text-sm !text-gray-500">Title</Typography>
            <Typography className="!text-base !font-semibold">{milestone?.title || "N/A"}</Typography>
            <Typography className="!text-sm !text-gray-500">Status</Typography>
            <Typography className="!text-sm capitalize">{milestone?.status || "N/A"}</Typography>
            <Typography className="!text-sm !text-gray-500">Start Date</Typography>
            <Typography className="!text-sm">{milestone?.startDate || "N/A"}</Typography>
            <Typography className="!text-sm !text-gray-500">End Date</Typography>
            <Typography className="!text-sm">{milestone?.endDate || "N/A"}</Typography>
          </>
        )}
      </Box>
    </Box>
  );
}
