"use client";

import { Box, Typography } from "@mui/material";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { VerificationCodeInput } from "@/modules/shared/component/FormFields/VerificationCodeInput";
import { useVerifyToken } from "./hook/useVerifyToken";
import Link from "next/link";
import { Button } from "@/modules/shared/component/Button";
import { AuthRoutes } from "@/routes/auth.routes";
import { useSearchParams } from "next/navigation";
import { decryptUrlParam } from "@/utils/urlEncryption";
import ChevronLeftIcon from "@/modules/shared/assets/svgs/leftIconWhite.svg";

const VerifyTokenForm = () => {
  const searchParams = useSearchParams();
  const { control, handleSubmit, isPending, hasEmailFromUrl, router } = useVerifyToken();

  const encryptedEmailFromUrl = searchParams.get("email");
  const roleFromParams = searchParams.get("role");
  const normalizedRole =
    roleFromParams === "admin" || roleFromParams === "staff" || roleFromParams === "parent"
      ? roleFromParams
      : null;

  const loginHref = normalizedRole
    ? `${AuthRoutes.login}?role=${normalizedRole}`
    : AuthRoutes.selectRole;

  const resendLink = encryptedEmailFromUrl
    ? `${AuthRoutes.resendResetPassword}?email=${encodeURIComponent(
        encryptedEmailFromUrl,
      )}${normalizedRole ? `&role=${encodeURIComponent(normalizedRole)}` : ""}`
    : normalizedRole
      ? `${AuthRoutes.resendResetPassword}?role=${encodeURIComponent(normalizedRole)}`
      : AuthRoutes.resendResetPassword;

  const decryptedEmailFromUrl = encryptedEmailFromUrl
    ? decryptUrlParam(encryptedEmailFromUrl)
    : null;

  return (
    <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-[540px] flex-col gap-5 rounded-2xl bg-white p-5 shadow-md sm:gap-6 sm:p-10"
      >
        <Box className="flex w-full items-start gap-2 sm:items-center">
          <Box
            onClick={() => router.back()}
            className="cursor-pointer bg-brandColor-active flex items-center justify-center rounded-full !text-white p-2.5"
          >
            <ChevronLeftIcon />
          </Box>
          <Box className="text-centr flex w-full flex-col gap-1.5 px-1 sm:px-3">
            <Typography className="!font-bold text-center !text-secondary-text-gray leading-[1.2] !text-2xl">
              Reset Password
            </Typography>
            <Typography className="!text-secondary-text-gray text-center !font-normal !text-xs">
              We&apos;ve sent a 6-digit code to{" "}
              <Typography
                component="span"
                className="!font-semibold !text-brandColor-active text-center !text-xs inline- mt-0.5"
              >
                {hasEmailFromUrl ? decryptedEmailFromUrl : "your email address"}
              </Typography>
            </Typography>
          </Box>
        </Box>

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

        <Box className="flex flex-col gap-4">
          <VerificationCodeInput
            name="token"
            control={control}
            onComplete={() => handleSubmit()}
            disabled={isPending}
          />
        </Box>

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
          className="!rounded-lg !bg-brandColor-active"
        >
          {isPending ? "Verifying..." : "Confirm"}
        </Button>

        <Box className="text-center space-y-2">
          <Box>
            <Link href={loginHref} className="!text-xs hover:underline">
              Back to Login
            </Link>
          </Box>
          <Box>
            <Link href={resendLink} className="!text-xs">
              Didn&apos;t receive the token?{" "}
              <span className="!font-semibold !text-brandColor-active hover:underline">Resend</span>
            </Link>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default VerifyTokenForm;
