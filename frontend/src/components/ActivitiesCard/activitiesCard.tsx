import { Box, Typography } from "@mui/material"
import { FC, ReactNode } from "react"


interface ActivitiesCardProps{
    name: string;
    icon: ReactNode;
}

export const ActivitiesCard: FC<ActivitiesCardProps> = ({name, icon}) => {

  return(
    <Box className="bg-[#F7F8FA] h-[100px] rounded-md flex flex-col justify-center items-center gap-4">
      <Box>{icon}</Box>
      <Typography className="!text-sm !font-normal">{name}</Typography>
    </Box>
  )
}