import { Box, ButtonBase, Typography } from "@mui/material";
import ClockIcon from "@/modules/shared/assets/svgs/clock-Icon.svg";
import { FC } from "react";

interface ChildrenAttendanceCardProps {
  name: string;
  status: string;
  clockIn?: string;
}
export const ChildrenAttendanceCard: FC<ChildrenAttendanceCardProps> = ({
  name,
  status,
  clockIn,
}) => {
  const initials = name
    ?.split(" ")
    ?.map((word: string) => word?.[0])
    ?.join("");

  return (
    <Box className="bg-[#F7F8FA] rounded-md py-3 px-4 h-[100px] flex flex-col justify-between">
      <Box className="flex items-center gap-1">
        <Box className="h-8 w-8 text-sm rounded-full flex items-center justify-center bg-[#dee2e4]">
          {initials}
        </Box>
        <Typography>{name}</Typography>
      </Box>
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-1">
          <ClockIcon />
          <Typography className="!text-xs !font-light">{`Clocked In: ${clockIn || "Not yet"}`}</Typography>
        </Box>
        <ButtonBase className="!rounded-full !bg-[#E6B4B4] !text-[#484e4e] !px-3 !text-xs !font-light">
          {status}
        </ButtonBase>
      </Box>
    </Box>
  );
};
