"use client";

import { Box, Button, Typography, Link } from "@mui/material";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { useResetPassword } from "./hook/useResetPassword";
import NextLink from "next/link";

const ResetPasswordForm = () => {
  const { control, handleSubmit, isPending, hasEmailAndTokenFromUrl } = useResetPassword();

  return (
    <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 p-10 rounded-lg shadow-md w-[500px] bg-white"
      >
        {/* Header */}
        <Box className="text-center space-y-1">
          <Typography variant="h5" className="!font-semibold text-primary-outlined">
            Reset Password
          </Typography>
          <Typography variant="body2" className="text-primary-outlined !font-medium">
            Enter your new password
          </Typography>
        </Box>

        {!hasEmailAndTokenFromUrl && (
          <>
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

            {/* Token */}
            <CWTextField
              control={control}
              name="token"
              label="Reset Token"
              placeholder="Enter the token"
              labelOnTop
              required
              fullWidth
              labelClassName="!text-sm !font-medium !text-input-gray"
              inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
              className="flex-1"
            />
          </>
        )}

        {/* New Password */}
        <CWTextField
          control={control}
          name="newPassword"
          label="New Password"
          type="password"
          placeholder="Enter your new password"
          labelOnTop
          required
          fullWidth
          labelClassName="!text-sm !font-medium !text-input-gray"
          inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
          className="flex-1"
        />

        {/* Confirm Password */}
        <CWTextField
          control={control}
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Confirm your new password"
          labelOnTop
          required
          fullWidth
          labelClassName="!text-sm !font-medium !text-input-gray"
          inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
          className="flex-1"
        />

        {/* Submit Button */}
        <Button
          variant="contained"
          fullWidth
          type="submit"
          disabled={isPending}
          sx={{
            textTransform: "none",
            backgroundColor: isPending ? "#78909C" : "#003049",
            borderRadius: "9999px",
            height: "48px",
            py: 1.2,
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Resetting..." : "Reset Password"}
        </Button>

        {/* Back to Login */}
        <Box className="text-center">
          <Link component={NextLink} href="/auth/staff/login" className="!text-sm !text-primary-outlined">
            Back to Login
          </Link>
        </Box>
      </form>
    </Box>
  );
};

export default ResetPasswordForm;

