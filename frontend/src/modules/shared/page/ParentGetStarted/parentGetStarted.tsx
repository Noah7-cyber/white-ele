"use client";

import { Box, Typography } from "@mui/material";
import { Button } from "@/modules/shared/component/Button";
import { useRouter } from "next/navigation";
import { AuthRoutes } from "@/routes/auth.routes";

const ParentGetStarted = () => {
  const router = useRouter();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Box className="flex w-full max-w-[600px] flex-col gap-5 rounded-2xl bg-white p-5 shadow-md sm:gap-6 sm:p-10">
        <Box className="flex flex-col gap-3 text-center">
          <Typography className="!font-bold !text-secondary-text-gray leading-[1.2] !text-2xl">
            Welcome to WhitePenguin ! 🎉
          </Typography>
          <Typography className="!text-secondary-text-gray !font-normal !text-sm">
            Your parent account has been created and your email is verified. You&apos;ll be able to
            connect to a school once they invite you. In the meantime, you can safely close this
            window or return to the login page.
          </Typography>
        </Box>

        <Box className="flex flex-col gap-4">
          <Typography className="!text-secondary-text-gray !font-semibold !text-sm text-left">
            What&apos;s next?
          </Typography>
          <ul className="list-disc pl-5 text-left text-xs text-secondary-text-gray space-y-2">
            <li>Schools using WhitePenguin can invite you using the email you registered with.</li>
            <li>You&apos;ll receive an email when a school links your account.</li>
            <li>After that, you&apos;ll be able to log in to view your child&apos;s activity.</li>
          </ul>
        </Box>

        <Button
          fullWidth
          className="!bg-brandColor-active !text-white"
          onClick={() => router.push(`${AuthRoutes.login}?role=parent`)}
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            height: "48px",
            py: 1.2,
          }}
        >
          Back to Login
        </Button>
      </Box>
    </Box>
  );
};

export default ParentGetStarted;
