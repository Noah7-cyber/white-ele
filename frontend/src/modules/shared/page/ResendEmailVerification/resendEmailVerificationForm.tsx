"use client";

import { Box, Typography, Link } from "@mui/material";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { useResendEmailVerification } from "./hook/useResendEmailVerification";
import { Button } from "@/modules/shared/component/Button";
import NextLink from "next/link";
import { AuthRoutes } from "@/routes/auth.routes";

const ResendEmailVerificationForm = () => {
  const { control, handleSubmit, isPending } = useResendEmailVerification();

  return (
    <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-[500px] flex-col gap-5 rounded-2xl bg-white p-5 shadow-md sm:gap-6 sm:p-10"
      >
        {/* Header */}
        <Box className="text-center space-y-1">
          <Typography variant="h5" className="!font-semibold text-primary-outlined">
            Resend Verification Email
          </Typography>
          <Typography variant="body2" className="text-primary-outlined !font-medium">
            Enter your email to receive a new verification token
          </Typography>
        </Box>

        {/* Email */}
        <CWTextField
          control={control}
          name="email"
          label="Email Address"
          placeholder="Enter your email"
          labelOnTop
          required
          fullWidth
          labelClassName="!text-sm !font-medium !text-input-gray"
          inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
          className="flex-1"
        />

        {/* Submit Button */}
        <Button
          className="text-primary-white"
          fullWidth
          type="submit"
          disabled={isPending}
          sx={{
            textTransform: "none",
            borderRadius: "9999px",
            height: "48px",
            py: 1.2,
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Sending..." : "Resend Verification Email"}
        </Button>

        {/* Back to Login */}
        <Box className="text-center">
          <Link component={NextLink} href={AuthRoutes.login} className="!text-sm !text-primary-outlined">
            Back to Login
          </Link>
        </Box>
      </form>
    </Box>
  );
};

export default ResendEmailVerificationForm;

