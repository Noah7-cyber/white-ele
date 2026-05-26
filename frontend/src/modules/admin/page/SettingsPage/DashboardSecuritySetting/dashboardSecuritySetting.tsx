"use client";
import { Button } from "@/modules/shared/component/Button";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { Box, Typography } from "@mui/material";
import React from "react";
import useChangePassword from "../hooks/useChangePassword";

export const DashboardSecuritySetting = () => {
  const { control, handleSubmit, isChangingPassword } = useChangePassword();

  return (
    <Box className="rounded-lg bg-white flex flex-col gap-5 p-4 sm:p-5">
      <Box className="border border-solid border-[#D98808] bg-[#FF9C0012] py-4 px-3 rounded-xl flex flex-col gap-3 sm:px-4">
        <Typography className="text-[#D98808] font-medium! text-sm!">
          Password requirements
        </Typography>
        <Box className="flex flex-col gap-1">
          <Box className="flex flex-row gap-2 items-start">
            <span className="rounded-full md:w-1.5 md:h-1.5 w-1 h-1 bg-[#D98808]" />
            <Typography className="text-[#D98808] md:text-sm! text-xs! font-light!">Minimum 8 characters</Typography>
          </Box>
          <Box className="flex flex-row gap-2 items-start">
            <span className="rounded-full md:w-1.5 md:h-1.5 w-1 h-1 bg-[#D98808]" />
            <Typography className="text-[#D98808] md:text-sm! text-xs! font-light!">
              Mix of uppercase and lowercase letters
            </Typography>
          </Box>
          <Box className="flex flex-row gap-2 items-start">
            <span className="rounded-full md:w-1.5 md:h-1.5 w-1 h-1 bg-[#D98808]" />
            <Typography className="text-[#D98808] md:text-sm! text-xs! font-light!">
              Include numbers and special characters (@!#$%^&*)
            </Typography>
          </Box>
        </Box>
      </Box>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Box className="flex flex-col gap-3">
          <CWTextField
            control={control}
            name="currentPassword"
            label="Current password"
            placeholder="Enter current password"
            labelOnTop
            labelClassName="!text-sm !font-medium !text-input-gray"
            inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
            type="password"
            className="w-full"
          />
          <Box className="flex flex-col gap-3 md:flex-row">
            <CWTextField
              control={control}
              name="newPassword"
              label="New password"
              placeholder="Enter new password"
              labelOnTop
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
              type="password"
              className="w-full"
            />
            <CWTextField
              control={control}
              name="confirmPassword"
              label="Confirm password"
              placeholder="Enter new password"
              labelOnTop
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
              type="password"
              className="w-full"
            />
          </Box>
        </Box>
        <Box className="flex justify-end md:mt-0 mt-6">
          <Button
            className="rounded-lg! w-full sm:!w-fit"
            type="submit"
            disabled={isChangingPassword}
          >
            {isChangingPassword ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </form>
    </Box>
  );
};
