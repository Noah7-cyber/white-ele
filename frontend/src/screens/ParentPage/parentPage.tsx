"use client";

import React from "react";
import { Typography, Box } from "@mui/material";
import { Parent } from "@/services/child.service";
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";

interface ParentPageProps {
  parents: Parent[];
}

export default function ParentPage({ parents }: ParentPageProps) {
  const list = parents ?? [];

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 px-3 sm:px-5 md:px-0 bg-dashboard-bg md:bg-transparent">
      {list.map((parent) => (
        <Box
          key={parent.id}
          className="rounded-3xl shadow-none border w-full border-brandColor-active/20 bg-white p-4 sm:p-5 sm:max-h-none max-h-none"
        >
          <Box className="flex gap-3 sm:gap-4 items-start sm:items-center w-full min-w-0">
            <InitialsAvatar
              src={parent.photoUrl}
              name={`${parent.user.firstName} ${parent.user.lastName}`}
              alt={parent.email ?? "parent image"}
              className="w-14 h-14 sm:w-[70px] sm:h-[70px] shrink-0"
              initialsClassName="text-lg sm:text-xl"
            />
            <Box className="flex flex-col gap-3 w-full min-w-0">
              <Box className="flex flex-col gap-0.5">
                <Typography className="!text-base !font-medium !text-textColor truncate">
                  {`${parent.user.firstName} ${parent.user.lastName}`}
                </Typography>
                <Typography className="!text-sm !text-textColor/80 !font-normal !capitalize">
                  {parent.relationship ?? "N/A"}
                </Typography>
              </Box>
              <Box className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between sm:gap-0">
                <Box className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <Typography className="!text-sm !text-textColor/80 !font-normal">
                    Email Address
                  </Typography>
                  <Typography className="!text-sm sm:!text-base !font-normal !text-textColor break-words">
                    {parent.user.email ?? "N/A"}
                  </Typography>
                </Box>
                <Box className="hidden sm:block w-px bg-border-lightGray shrink-0 self-stretch min-h-[50px]" />
                <Box className="flex flex-col gap-0.5 min-w-0 flex-1 sm:border-0 border-t border-border-lightGray pt-4 sm:pt-0">
                  <Typography className="!text-sm !text-textColor/80 !font-normal">
                    Phone Number
                  </Typography>
                  <Typography className="!text-sm sm:!text-base !font-normal !text-textColor break-words">
                    {parent.user.phone ?? "N/A"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      ))}
    </div>
  );
}
