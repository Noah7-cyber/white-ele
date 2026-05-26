"use client";

import { Box, Typography } from "@mui/material";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { useResetPassword } from "./hook/useResetPassword";
import Link from "next/link";
import { Button } from "@/modules/shared/component/Button";
import { AuthRoutes } from "@/routes/auth.routes";
import { useSearchParams } from "next/navigation";

const ResetPasswordForm = () => {
  const { control, handleSubmit, isPending, hasEmailAndTokenFromUrl } = useResetPassword();
  const searchParams = useSearchParams();

  const roleFromParams = searchParams.get("role");
  const normalizedRole =
    roleFromParams === "admin" || roleFromParams === "staff" || roleFromParams === "parent"
      ? roleFromParams
      : null;

  const loginHref = normalizedRole
    ? `${AuthRoutes.login}?role=${normalizedRole}`
    : AuthRoutes.selectRole;

  return (
    <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-[500px] flex-col gap-5 rounded-2xl bg-white p-5 shadow-md sm:gap-6 sm:p-10"
      >
        <Box className="text-center flex flex-col gap-1">
          <Typography  className="!font-bold !text-secondary-text-gray leading-[1.2] !text-2xl">
            Create New Password
          </Typography>
          <Typography className="!text-secondary-text-gray !font-normal !text-sm">
            Choose a strong password to secure your account.
          </Typography>
        </Box>

        {!hasEmailAndTokenFromUrl && (
          <>
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

        <CWTextField
          control={control}
          name="newPassword"
          label="Password"
          type="password"
          placeholder="Enter your new password"
          labelOnTop
          required
          fullWidth
          labelClassName="!text-sm !font-medium !text-input-gray"
          inputClasses="mt-1 !text-sm !h-10 !text-input-gray placeholder:!text-input-gray"
          className="flex-1"
        />

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

        <Button
          fullWidth
          type="submit"
          disabled={isPending}
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            height: "48px",
            py: 1.2,
            cursor: isPending ? "not-allowed" : "pointer",
          }}
          className="!rounded-lg"
        >
          {isPending ? "Resetting..." : "Reset Password"}
        </Button>

        <Box className="flex justify-center">
          <Link href={loginHref} className="!text-xs">
            Back to Login
          </Link>
        </Box>
      </form>
    </Box>
  );
};

export default ResetPasswordForm;
