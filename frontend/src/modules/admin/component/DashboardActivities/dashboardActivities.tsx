import { Box, ButtonBase, Typography } from '@mui/material';

export const DashboardActivities = () => {
  return (
    <Box className="bg-white py-3 px-4">
      <Box className="flex items-center justify-between">
        <Typography className="!text-base !font-semibold">Today’s Activities</Typography>
        <ButtonBase>View all</ButtonBase>
      </Box>
      <Box className="mt-4 flex flex-col gap-4">
        {[1, 2, 3].map((_, index) => (
          <Box key={index} className="bg-[#e5e9e9] px-4 py-2.5 rounded-sm flex gap-5">
            <Box className="flex items-center">08:00 am</Box>
            <Box className="border-r-2 border-white" />
            <Box>
              <Typography className="!text-sm">All Grade</Typography>
              <Typography className="!text-sm">Homeroom & Announcement</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
