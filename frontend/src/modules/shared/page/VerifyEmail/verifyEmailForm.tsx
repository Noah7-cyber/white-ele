"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Link } from "@mui/material";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { VerificationCodeInput } from "@/modules/shared/component/FormFields/VerificationCodeInput";
import { useVerifyEmail } from "./hook/useVerifyEmail";
import { Button } from "@/modules/shared/component/Button";
import NextLink from "next/link";
import { AuthRoutes } from "@/routes/auth.routes";
import ChevronLeftIcon from "@/modules/shared/assets/svgs/leftIconWhite.svg";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { authServices } from "@/services/auth.service";

const VerifyEmailForm = () => {
  const { control, handleSubmit, isPending, email, hasEmailFromUrl, router, getValues } =
    useVerifyEmail();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resentOnce, setResentOnce] = useState(false);

  const { mutateAsync: resendVerificationAsync, isPending: isResending } = useMutationService({
    service: authServices.resendEmailVerification,
    options: {
      successTitle: "Verification email sent!",
      successMessage: "Please check your inbox for the new verification token.",
      errorTitle: "Failed to resend verification email",
      isFormData: false,
    },
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (isResending || resendCooldown > 0) return;
    const currentEmail = getValues("email") || email;
    if (!currentEmail) return;
    await resendVerificationAsync({ email: currentEmail });
    setResentOnce(true);
    setResendCooldown(60);
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-[540px] flex-col gap-5 rounded-2xl bg-white p-5 shadow-md sm:gap-6 sm:p-10"
      >
        {/* Header */}
        <Box className="flex w-full items-start gap-3 sm:items-center sm:gap-6">
          <Box
            onClick={() => router.back()}
            className="cursor-pointer bg-brandColor-active flex items-center justify-center rounded-full !text-white p-2.5"
          >
            <ChevronLeftIcon />
          </Box>
          <Box className="flex w-full flex-col gap-1.5 px-1 text-center sm:px-3">
            <Typography className="!font-bold !text-secondary-text-gray leading-[1.2] !text-2xl">
              Verify Email Address
            </Typography>
            <Typography className="!text-secondary-text-gray text-center !font-normal !text-xs">
              We&apos;ve sent a 6-digit code to{" "}
              <Typography
                component="span"
                className="!font-semibold !text-brandColor-active text-center !text-xs inline- mt-0.5"
              >
                {hasEmailFromUrl || email ? email : "your email address"}
              </Typography>
            </Typography>
          </Box>
        </Box>

        {/* Email - Only show if not from URL params */}
        {!hasEmailFromUrl && (
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
        )}

        {/* 6-digit code */}
        <Box className="flex flex-col gap-4">
          <VerificationCodeInput
            name="token"
            control={control}
            onComplete={() => handleSubmit()}
            disabled={isPending}
          />
        </Box>

        {/* Submit Button */}
        <Button
          className="text-primary-white !bg-brandColor-active"
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
        >
          {isPending ? "Verifying..." : "Confirm"}
        </Button>

        {/* Resend Action */}
        <Box className="text-center">
          <Typography className="!text-sm !text-secondary-text-gray">
            Didn&apos;t receive the token?{" "}
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isResending || resendCooldown > 0}
              className="!font-semibold !text-brandColor-active hover:underline disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isResending
                ? "Resending..."
                : resendCooldown > 0 && resentOnce
                  ? `Resent! You can resend in ${resendCooldown}s`
                  : "Resend"}
            </button>
          </Typography>
        </Box>

        {/* Back to Login */}
        <Box className="text-center">
          <Link
            component={NextLink}
            href={AuthRoutes.selectRole}
            className="!text-sm !text-secondary-text-gray !no-underline hover:underline"
          >
            Back to Login
          </Link>
        </Box>
      </form>
    </Box>
  );
};

export default VerifyEmailForm;
