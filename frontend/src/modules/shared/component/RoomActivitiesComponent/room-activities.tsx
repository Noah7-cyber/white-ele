"use client"

import { InsightCard } from "@/components/InsightCard"
import { Box, Typography } from "@mui/material"
// import ClockIcon from "@/modules/shared/assets/svgs/clock-Icon.svg"
// import useRoomActivities from "@/modules/shared/component/ActivitiesPageComponent/hooks/useRoomActivities"
// import MealIcon from "@/modules/shared/assets/svgs/mealIcon.svg"
// import { LogNapModal } from "@/modules/admin/component/LogNapModal"
// import { LogMealModal } from "@/modules/admin/component/LogMealModal"
// import { LogWaterModal } from "@/modules/admin/component/LogWaterModal"
// import { LogPhotoModal } from "@/modules/admin/component/LogPhotoModal"
// import { LogMedicationModal } from "@/modules/admin/component/LogMedicationModal"
// import { LogBathroomModal } from "@/modules/admin/component/LogBathroomModal"

interface RoomActivitiesComponentProps {
  role: "admin" | "staff"
}

export const RoomActivitiesComponent = ({ role }: RoomActivitiesComponentProps) => {
  // const {
  //   activityActions,
  //   isNapLogModalOpen,
  //   isMealLogModalOpen,
  //   isWaterLogModalOpen,
  //   isPhotoLogModalOpen,
  //   isMedsLogModalOpen,
  //   isBathLogModalOpen,
  //   closeNapModal,
  //   closeMealModal,
  //   closeWaterModal,
  //   closePhotoModal,
  //   closeMedsModal,
  //   closeBathModal,
  // } = useRoomActivities()

  return (
    <>
      <Box className="flex flex-col gap-4 h-full">
        <Box className="flex gap-4">
          <InsightCard name="Meals Today" value={4} />
          <InsightCard name="Currently Napping" value={2} />
          <InsightCard name="Logged Meals" value={0} />
          <InsightCard name="Media Shared" value={7} />
        </Box>
        {/* <Box className="grid lg:grid-cols-6 sm:grid-cols-3 xs:grid-cols-1 gap-5">
          {activityActions.map((actionItem, index: number) => (
            <button
              key={index}
              className="bg-white border border-solid border-primary-text/20 text-primary-dark/80 rounded-xl px-6 py-4 flex flex-row items-center justify-center gap-3 text-xs font-medium cursor-pointer"
              onClick={actionItem.onClick}
            >
              {actionItem.icon} {actionItem.name}
            </button>
          ))}
        </Box> */}

        {/* <Box className="bg-white px-4 py-3 flex gap-4 flex-1">
          <Box className="flex-1">
            <Typography className="!text-lg !font-medium">Recent Activities</Typography>
            <Box className="mt-2 p-2 flex flex-col gap-4">
              {[1, 2, 3].map((item, index) => (
                <Box key={index} className="px-4 gap-3 py-2 flex flex-row rounded-md !bg-[#F8F9FA]">
                  <Box className="bg-white p-3 rounded-lg">
                    <MealIcon />
                  </Box>
                  <Box className="flex flex-row items-center justify-between w-full">
                    <Box className="flex flex-col gap-2">
                      <Typography className="text-primary-dark font-medium text-sm!">Lunch Time</Typography>
                      <Typography className="!text-xs !text-[#001F1F]/70">
                        Ava enjoyed a healthy of rice, vegetables, and fruit juice today.
                      </Typography>
                    </Box>
                    <Box className="flex flex-row gap-x-2 !text-xs !text-[#001F1F]/70">
                      <ClockIcon />
                      <span>12:30pm - 1:00pm</span>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box> */}
      </Box>
      {/* <LogNapModal isOpen={isNapLogModalOpen} onClose={closeNapModal} />
      <LogMealModal isOpen={isMealLogModalOpen} onClose={closeMealModal} />
      <LogWaterModal isOpen={isWaterLogModalOpen} onClose={closeWaterModal} />
      <LogPhotoModal isOpen={isPhotoLogModalOpen} onClose={closePhotoModal} />
      <LogMedicationModal isOpen={isMedsLogModalOpen} onClose={closeMedsModal} />
      <LogBathroomModal isOpen={isBathLogModalOpen} onClose={closeBathModal} /> */}
    </>
  )
}
