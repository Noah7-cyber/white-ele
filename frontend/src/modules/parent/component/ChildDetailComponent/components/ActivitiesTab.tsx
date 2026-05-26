"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import ClockIcon from "@/modules/shared/assets/svgs/clock-Icon.svg";
import useActivities from "@/modules/parent/page/Activities/hook/useActivities";
import { useChildDateFilter } from "@/modules/parent/component/ChildDetailComponent/ChildDetailComponent";
import { ActivityDetailsModal } from "@/modules/shared/component/ActivitiesPageComponent/components/ActivityDetailsModal";

export default function ChildActivitiesPage() {
  const { id } = useParams() as { id: string };
  const { startDate, endDate } = useChildDateFilter();

  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const {
    activities,
    isActivitiesLoading,
    children,
    handleChildrenFilterChange,
    renderActivityIcon,
    getActivityTitle,
    getActivityDescription,
    getActivityDateAndTime,
  } = useActivities({ startDate, endDate });

  // Force this page to always be filtered to the current child.
  useEffect(() => {
    const childId = Number(id);
    if (!Number.isNaN(childId)) handleChildrenFilterChange(childId);
  }, [id, handleChildrenFilterChange]);

  const handleActivityClick = (activityId: number) => {
    setSelectedActivityId(activityId);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedActivityId(null);
  };

  const parentChildrenIds = children.map((c) => c.id);

  return (
    <>
      <Box className="flex flex-col gap-4 h-full">
        <Box className="bg-white rounded-lg p-4 flex gap-4 flex-1 border border-brandColor-active/20">
          <Box className="flex-1 h-full">
            <Box className="mt-2 sm:max-h-[560px] overflow-y-scroll [scrollbar-width:1px] [&::-webkit-scrollbar]:hidden p-2 flex flex-col gap-4 ">
              {isActivitiesLoading ? (
                <CircularProgress />
              ) : activities.length === 0 ? (
                <Typography className="text-sm! text-text-tertiary/70! px-4 py-6 text-center">
                  No activities logged yet.
                </Typography>
              ) : (
                activities.map((activity) => (
                  <Box
                    key={activity.id}
                    onClick={() => handleActivityClick(activity.id)}
                    className="px-6 gap-3 py-4 flex flex-row rounded-md bg-[#F8F9FA]! cursor-pointer hover:bg-[#F0F1F3]! transition-colors"
                  >
                    <Box className="bg-white p-3 rounded-lg flex items-center justify-center">
                      {renderActivityIcon(activity.activityType)}
                    </Box>
                    <Box className="flex flex-row items-center justify-between w-full">
                      <Box className="flex flex-col gap-2 pr-4">
                        <Typography className="text-primary-dark text-base! !font-medium">
                          {getActivityTitle(activity)}
                        </Typography>
                        <Typography className="text-sm! text-text-tertiary/70!">
                          {getActivityDescription(activity)}
                        </Typography>
                      </Box>
                      <Box className="flex flex-row items-center  gap-x-2 text-sm! font-medium! text-text-tertiary/70! whitespace-nowrap">
                        <ClockIcon />
                        <span>{getActivityDateAndTime(activity)}</span>
                      </Box>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <ActivityDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        activityId={selectedActivityId}
        parentChildrenIds={parentChildrenIds}
      />
    </>
  );
}
